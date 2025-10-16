// pushNotificationService.js
import axios from "axios";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Store user tokens in memory (use database in production)
// In production, use MongoDB, PostgreSQL, or Firebase to persist tokens
const userTokens = new Map();

// Register user's Expo push token
export function registerUserToken(userId, expoPushToken) {
  userTokens.set(userId, expoPushToken);
  console.log(`✅ Registered token for user ${userId}`);
  console.log(`   Total registered users: ${userTokens.size}`);
}

// Get user's token
export function getUserToken(userId) {
  return userTokens.get(userId);
}

// Get all registered users
export function getAllRegisteredUsers() {
  return Array.from(userTokens.keys());
}

// Remove user token (for logout)
export function removeUserToken(userId) {
  const removed = userTokens.delete(userId);
  if (removed) {
    console.log(`🗑️ Removed token for user ${userId}`);
  }
  return removed;
}

// Send push notification to specific user via Expo
export async function sendPushNotification(userId, title, message, data = {}) {
  const expoPushToken = getUserToken(userId);

  if (!expoPushToken) {
    console.log(`❌ No token found for user ${userId}`);
    return { success: false, error: "No token found" };
  }

  try {
    const payload = {
      to: expoPushToken,
      sound: "default",
      title: title,
      body: message,
      data: {
        ...data,
        sentAt: new Date().toISOString(),
      },
      priority: "high",
      badge: 1,
      channelId: "default", // For Android
    };

    console.log(`📤 Sending notification to user ${userId}...`);
    const response = await axios.post(EXPO_PUSH_ENDPOINT, payload);

    if (response.data.data && response.data.data[0]) {
      const result = response.data.data[0];

      if (result.status === "ok") {
        console.log(`✅ Notification sent successfully to ${userId}`);
        console.log(`   Receipt ID: ${result.id}`);
        return { success: true, data: result };
      } else if (result.status === "error") {
        console.error(`❌ Notification error for ${userId}:`, result.message);

        // If token is invalid, remove it
        if (result.details?.error === "DeviceNotRegistered") {
          console.log(`🗑️ Removing invalid token for user ${userId}`);
          removeUserToken(userId);
        }

        return { success: false, error: result.message };
      }
    }

    return { success: true, data: response.data };
  } catch (err) {
    console.error(
      `❌ Error sending notification to ${userId}:`,
      err.response?.data || err.message
    );
    return { success: false, error: err.message };
  }
}

// Send push notification to multiple users
export async function sendBulkPushNotifications(
  userIds,
  title,
  message,
  data = {}
) {
  const messages = [];

  for (const userId of userIds) {
    const token = getUserToken(userId);
    if (token) {
      messages.push({
        to: token,
        sound: "default",
        title: title,
        body: message,
        data: {
          ...data,
          sentAt: new Date().toISOString(),
        },
        priority: "high",
        badge: 1,
        channelId: "default",
      });
    } else {
      console.log(`⚠️ Skipping user ${userId} - no token found`);
    }
  }

  if (messages.length === 0) {
    console.log("❌ No valid tokens found for bulk notification");
    return { success: false, error: "No valid tokens" };
  }

  try {
    console.log(`📤 Sending bulk notification to ${messages.length} users...`);
    const response = await axios.post(EXPO_PUSH_ENDPOINT, messages);

    // Check for any errors in the response
    if (response.data.data) {
      const errors = response.data.data.filter((r) => r.status === "error");
      const successes = response.data.data.filter((r) => r.status === "ok");

      console.log(`✅ Successfully sent: ${successes.length}`);
      if (errors.length > 0) {
        console.log(`❌ Failed to send: ${errors.length}`);
        errors.forEach((err) => {
          console.log(`   Error: ${err.message}`);
        });
      }
    }

    return { success: true, data: response.data.data };
  } catch (err) {
    console.error(
      "❌ Error sending bulk notifications:",
      err.response?.data || err.message
    );
    return { success: false, error: err.message };
  }
}

// Send global announcement to all registered users
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

// Check if a push token is valid (optional utility)
export async function validatePushToken(expoPushToken) {
  try {
    const response = await axios.post(EXPO_PUSH_ENDPOINT, {
      to: expoPushToken,
      title: "Test",
      body: "Token validation test",
    });

    return response.data.data[0]?.status === "ok";
  } catch (error) {
    return false;
  }
}
