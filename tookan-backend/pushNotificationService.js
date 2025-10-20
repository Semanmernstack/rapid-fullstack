import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Track initialization status
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK (only once)
 */
function initializeFirebase() {
  if (!firebaseInitialized && !admin.apps.length) {
    try {
      // ✅ Correct path to your service account file (backend directory)
      const serviceAccountPath = join(
        __dirname,
        "./rapid-delivery-app-1d838-firebase-adminsdk-fbsvc-eb14176c94.json"
      );

      const serviceAccount = JSON.parse(
        readFileSync(serviceAccountPath, "utf8")
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      console.log("✅ Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error(
        "❌ Failed to initialize Firebase Admin SDK:",
        error.message
      );
      throw error;
    }
  }
}

// Call initialization
initializeFirebase();

// In-memory token store (replace with DB in production)
const userTokens = new Map();

/**
 * Register user FCM token
 */
export function registerUserToken(userId, fcmToken) {
  userTokens.set(userId, fcmToken);
  console.log(`✅ Registered FCM token for user ${userId}`);
  console.log(`   Total registered users: ${userTokens.size}`);
}

/**
 * Get a single user’s FCM token
 */
export function getUserToken(userId) {
  return userTokens.get(userId);
}

/**
 * Get all registered users
 */
export function getAllRegisteredUsers() {
  return Array.from(userTokens.keys());
}

/**
 * Remove token (on logout or invalidation)
 */
export function removeUserToken(userId) {
  const removed = userTokens.delete(userId);
  if (removed) console.log(`🗑️ Removed token for user ${userId}`);
  return removed;
}

/**
 * Send push notification to one user
 */
export async function sendPushNotification(userId, title, message, data = {}) {
  const fcmToken = getUserToken(userId);

  if (!fcmToken) {
    console.log(`❌ No FCM token found for user ${userId}`);
    return { success: false, error: "No token found" };
  }

  try {
    const payload = {
      notification: {
        title,
        body: message,
      },
      data: {
        ...data,
        sentAt: new Date().toISOString(),
        userId,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      token: fcmToken,
    };

    console.log(`📤 Sending notification to user ${userId}...`);
    const response = await admin.messaging().send(payload);

    console.log(`✅ Notification sent successfully to ${userId}`);
    console.log(`   Message ID: ${response}`);

    return { success: true, messageId: response, userId };
  } catch (error) {
    console.error(`❌ Error sending notification to ${userId}:`, error.message);

    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      console.log(`🗑️ Removing invalid token for user ${userId}`);
      removeUserToken(userId);
    }

    return { success: false, error: error.message, errorCode: error.code };
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkPushNotifications(
  userIds,
  title,
  message,
  data = {}
) {
  const results = { successful: [], failed: [] };

  console.log(`📤 Sending bulk notification to ${userIds.length} users...`);

  const promises = userIds.map(async (userId) => {
    const result = await sendPushNotification(userId, title, message, data);
    if (result.success) {
      results.successful.push({ userId, messageId: result.messageId });
    } else {
      results.failed.push({ userId, error: result.error });
    }
  });

  await Promise.allSettled(promises);

  console.log(`✅ Successfully sent: ${results.successful.length}`);
  if (results.failed.length > 0)
    console.log(`❌ Failed to send: ${results.failed.length}`);

  return {
    success: true,
    results,
    summary: {
      total: userIds.length,
      successful: results.successful.length,
      failed: results.failed.length,
    },
  };
}

/**
 * Send multicast notification (more efficient)
 */
export async function sendMulticastNotification(
  tokens,
  title,
  message,
  data = {}
) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return { success: false, error: "No tokens provided" };
  }

  try {
    const payload = {
      notification: { title, body: message },
      data: { ...data, sentAt: new Date().toISOString() },
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
        },
      },
      tokens,
    };

    console.log(
      `📤 Sending multicast notification to ${tokens.length} devices...`
    );
    const response = await admin.messaging().sendEachForMulticast(payload);

    console.log(
      `✅ Multicast sent: ${response.successCount} successful, ${response.failureCount} failed`
    );

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success)
          console.log(`❌ Failed token ${idx}: ${resp.error?.message}`);
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error("❌ Error sending multicast notification:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send announcement to all registered users
 */
export async function sendGlobalAnnouncement(title, message, data = {}) {
  const allUserIds = Array.from(userTokens.keys());

  if (allUserIds.length === 0) {
    console.log("❌ No registered users found");
    return { success: false, error: "No registered users" };
  }

  console.log(`📢 Sending announcement to ${allUserIds.length} users`);
  console.log(`   Title: "${title}"`);
  console.log(`   Message: "${message}"`);

  return await sendBulkPushNotifications(allUserIds, title, message, {
    ...data,
    type: "announcement",
  });
}

/**
 * Validate FCM token
 */
export async function validatePushToken(fcmToken) {
  try {
    await admin.messaging().send(
      {
        token: fcmToken,
        notification: {
          title: "Test",
          body: "Token validation",
        },
      },
      true // dry-run mode
    );
    return true;
  } catch (error) {
    console.error("Token validation failed:", error.message);
    return false;
  }
}

/**
 * Send custom notification with full control
 */
export async function sendCustomNotification(userId, options) {
  const fcmToken = getUserToken(userId);
  if (!fcmToken) return { success: false, error: "No token found" };

  try {
    const message = { ...options, token: fcmToken };
    const response = await admin.messaging().send(message);
    console.log(`✅ Custom notification sent to ${userId}: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`❌ Error sending custom notification:`, error.message);
    return { success: false, error: error.message };
  }
}

// Default export
export default {
  registerUserToken,
  getUserToken,
  getAllRegisteredUsers,
  removeUserToken,
  sendPushNotification,
  sendBulkPushNotifications,
  sendMulticastNotification,
  sendGlobalAnnouncement,
  validatePushToken,
  sendCustomNotification,
};
