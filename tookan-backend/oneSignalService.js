// import axios from "axios";

// // Send push notification to all users via OneSignal

// export async function sendGlobalAnnouncement(title, message) {
//   try {
//     const response = await axios.post(
//       "https://onesignal.com/api/v1/notifications",
//       {
//         app_id: process.env.ONESIGNAL_APP_ID, // from your OneSignal dashboard
//         included_segments: ["All"], // sends to everyone
//         headings: { en: title }, // notification title
//         contents: { en: message }, // notification message
//       },
//       {
//         headers: {
//           Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ Notification sent:", response.data.id);
//   } catch (err) {
//     console.error(
//       "❌ Error sending notification:",
//       err.response?.data || err.message
//     );
//   }
// }

import fetch from "node-fetch";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Store user mappings (use database in production)
const userPlayerIds = new Map();

/**
 * Register user's OneSignal Player ID
 */
export function registerUserPlayerId(userId, playerId) {
  userPlayerIds.set(userId, playerId);
  console.log(`✅ Registered OneSignal Player ID for user ${userId}`);
  console.log(`   Total registered users: ${userPlayerIds.size}`);
}

/**
 * Get user's Player ID
 */
export function getUserPlayerId(userId) {
  return userPlayerIds.get(userId);
}

/**
 * Remove user's Player ID
 */
export function removeUserPlayerId(userId) {
  const removed = userPlayerIds.delete(userId);
  if (removed) console.log(`🗑️ Removed Player ID for user ${userId}`);
  return removed;
}

/**
 * Send push notification to one user via OneSignal REST API
 */
export async function sendPushNotification(userId, title, message, data = {}) {
  const playerId = getUserPlayerId(userId);

  if (!playerId) {
    console.log(`❌ No Player ID found for user ${userId}`);
    return { success: false, error: "No Player ID found" };
  }

  try {
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        userId,
        sentAt: new Date().toISOString(),
      },
      // Priority settings for immediate delivery
      priority: 10,
      android_channel_id: "default",
      small_icon: "ic_notification",
      large_icon: "ic_launcher",
    };

    console.log(`📤 Sending notification to user ${userId}...`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notification),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Notification sent successfully to ${userId}`);
      console.log(`   Notification ID: ${result.id}`);
      return { success: true, notificationId: result.id, userId };
    } else {
      console.error(`❌ OneSignal API error:`, result);
      return { success: false, error: result.errors || "Unknown error" };
    }
  } catch (error) {
    console.error(`❌ Error sending notification to ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
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
      results.successful.push({
        userId,
        notificationId: result.notificationId,
      });
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

/**
 * Send notification by external user ID (more efficient)
 */
export async function sendNotificationByExternalId(
  userId,
  title,
  message,
  data = {}
) {
  try {
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [userId], // Use your backend user ID directly
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        userId,
        sentAt: new Date().toISOString(),
      },
      priority: 10,
    };

    console.log(`📤 Sending notification to external user ${userId}...`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notification),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Notification sent to external user ${userId}`);
      return { success: true, notificationId: result.id };
    } else {
      console.error(`❌ OneSignal API error:`, result);
      return { success: false, error: result.errors };
    }
  } catch (error) {
    console.error(`❌ Error sending notification:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send announcement to all app users
 */
export async function sendGlobalAnnouncement(title, message, data = {}) {
  try {
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["All"], // Send to all subscribed users
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        type: "announcement",
        sentAt: new Date().toISOString(),
      },
    };

    console.log(`📢 Sending global announcement...`);

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notification),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Global announcement sent successfully`);
      return { success: true, notificationId: result.id };
    } else {
      console.error(`❌ OneSignal API error:`, result);
      return { success: false, error: result.errors };
    }
  } catch (error) {
    console.error(`❌ Error sending announcement:`, error.message);
    return { success: false, error: error.message };
  }
}

export default {
  registerUserPlayerId,
  getUserPlayerId,
  removeUserPlayerId,
  sendPushNotification,
  sendBulkPushNotifications,
  sendNotificationByExternalId,
  sendGlobalAnnouncement,
};
