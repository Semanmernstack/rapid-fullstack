import fetch from "node-fetch";

// Store user tokens (use database in production)
const userTokens = new Map();

/**
 * Register user's Expo Push Token
 */
export function registerUserToken(userId, expoPushToken) {
  userTokens.set(userId, expoPushToken);
  console.log(`✅ Registered Expo Push Token for user ${userId}`);
  console.log(`   Total registered users: ${userTokens.size}`);
}

/**
 * Get user's token
 */
export function getUserToken(userId) {
  return userTokens.get(userId);
}

/**
 * Remove user's token
 */
export function removeUserToken(userId) {
  const removed = userTokens.delete(userId);
  if (removed) console.log(`🗑️ Removed token for user ${userId}`);
  return removed;
}

/**
 * Send push notification via Expo Push API
 */
export async function sendPushNotification(userId, title, message, data = {}) {
  const token = getUserToken(userId);

  if (!token) {
    console.log(`❌ No push token found for user ${userId}`);
    return { success: false, error: "No token found" };
  }

  try {
    const notification = {
      to: token,
      sound: "default",
      title: title,
      body: message,
      data: {
        ...data,
        userId,
        sentAt: new Date().toISOString(),
      },
      priority: "high",
      channelId: "default",
    };

    console.log(`📤 Sending notification to user ${userId}...`);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });

    const result = await response.json();

    if (result.data?.status === "ok") {
      console.log(`✅ Notification sent successfully to ${userId}`);
      return { success: true, receipt: result.data };
    } else {
      console.error(`❌ Expo push error:`, result);
      return { success: false, error: result.data?.message || "Unknown error" };
    }
  } catch (error) {
    console.error(`❌ Error sending notification to ${userId}:`, error.message);
    return { success: false, error: error.message };
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
      results.successful.push({ userId });
    } else {
      results.failed.push({ userId, error: result.error });
    }
  });

  await Promise.allSettled(promises);

  console.log(`✅ Successfully sent: ${results.successful.length}`);
  if (results.failed.length > 0) {
    console.log(`❌ Failed to send: ${results.failed.length}`);
  }

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

export default {
  registerUserToken,
  getUserToken,
  removeUserToken,
  sendPushNotification,
  sendBulkPushNotifications,
};
