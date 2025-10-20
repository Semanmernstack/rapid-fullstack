// import fetch from "node-fetch";

// // ✅ FIX: Don't read env vars immediately - use getter functions instead
// function getOneSignalConfig() {
//   const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
//   const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
//   const isV2Key = ONESIGNAL_REST_API_KEY?.startsWith("os_v2_");

//   // ✅ FIXED: Use correct endpoint format for v2
//   const API_ENDPOINT = isV2Key
//     ? "https://api.onesignal.com/notifications" // ✅ No query params in URL
//     : "https://onesignal.com/api/v1/notifications";

//   return {
//     ONESIGNAL_APP_ID,
//     ONESIGNAL_REST_API_KEY,
//     isV2Key,
//     API_ENDPOINT,
//   };
// }

// // Run validation and logging only when called (after dotenv loads)
// let configLogged = false;
// function logConfigOnce() {
//   if (configLogged) return;
//   configLogged = true;

//   const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, isV2Key, API_ENDPOINT } =
//     getOneSignalConfig();

//   if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
//     console.error("❌ CRITICAL: OneSignal credentials missing!");
//     console.error(
//       "   ONESIGNAL_APP_ID:",
//       ONESIGNAL_APP_ID ? "✅ Set" : "❌ Missing"
//     );
//     console.error(
//       "   ONESIGNAL_REST_API_KEY:",
//       ONESIGNAL_REST_API_KEY ? "✅ Set" : "❌ Missing"
//     );
//     console.error("\n   Please set these in your .env file:");
//     console.error("   ONESIGNAL_APP_ID=your_app_id");
//     console.error("   ONESIGNAL_REST_API_KEY=your_api_key\n");
//   } else {
//     console.log("\n=== OneSignal Configuration ===");
//     console.log(`API Version: ${isV2Key ? "v2 (new)" : "v1 (legacy)"}`);
//     console.log(`API Endpoint: ${API_ENDPOINT}`);
//     console.log(`App ID: ${ONESIGNAL_APP_ID.substring(0, 15)}...`);
//     console.log(`API Key: ${ONESIGNAL_REST_API_KEY.substring(0, 15)}...`);
//     console.log("===============================\n");
//   }
// }

// // ✅ FIXED: Proper headers for both v1 and v2 APIs
// function getHeaders() {
//   const { ONESIGNAL_REST_API_KEY, isV2Key } = getOneSignalConfig();

//   if (!ONESIGNAL_REST_API_KEY) {
//     console.error("❌ Cannot create headers: API key is missing");
//     return {
//       "Content-Type": "application/json",
//     };
//   }

//   if (isV2Key) {
//     // ✅ v2 API uses Bearer token
//     return {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${ONESIGNAL_REST_API_KEY}`,
//     };
//   } else {
//     // v1 API uses Basic auth
//     return {
//       "Content-Type": "application/json; charset=utf-8",
//       Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
//     };
//   }
// }

// // Store user mappings (use database in production)
// const userPlayerIds = new Map();

// /**
//  * Register user's OneSignal Player ID
//  */
// export function registerUserPlayerId(userId, playerId) {
//   logConfigOnce();
//   userPlayerIds.set(userId, playerId);
//   console.log(`✅ Registered OneSignal Player ID for user ${userId}`);
//   console.log(`   Total registered users: ${userPlayerIds.size}`);
// }

// /**
//  * Get user's Player ID
//  */
// export function getUserPlayerId(userId) {
//   return userPlayerIds.get(userId);
// }

// /**
//  * Remove user's Player ID
//  */
// export function removeUserPlayerId(userId) {
//   const removed = userPlayerIds.delete(userId);
//   if (removed) console.log(`🗑️ Removed Player ID for user ${userId}`);
//   return removed;
// }

// /**
//  * Send push notification to one user via OneSignal REST API
//  */
// export async function sendPushNotification(userId, title, message, data = {}) {
//   logConfigOnce();
//   const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, API_ENDPOINT } =
//     getOneSignalConfig();

//   if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
//     console.error(
//       "❌ Cannot send notification: OneSignal credentials not configured"
//     );
//     return {
//       success: false,
//       error: "OneSignal credentials not configured. Check your .env file.",
//     };
//   }

//   const playerId = getUserPlayerId(userId);

//   if (!playerId) {
//     console.log(`❌ No Player ID found for user ${userId}`);
//     return { success: false, error: "No Player ID found" };
//   }

//   try {
//     const notification = {
//       app_id: ONESIGNAL_APP_ID,
//       include_player_ids: [playerId],
//       headings: { en: title },
//       contents: { en: message },
//       data: {
//         ...data,
//         userId,
//         sentAt: new Date().toISOString(),
//       },
//       priority: 10,
//       android_channel_id: "default",
//       small_icon: "ic_notification",
//       large_icon: "ic_launcher",
//     };

//     console.log(`📤 Sending notification to user ${userId}...`);

//     const response = await fetch(API_ENDPOINT, {
//       method: "POST",
//       headers: getHeaders(),
//       body: JSON.stringify(notification),
//     });

//     const result = await response.json();

//     if (response.ok) {
//       console.log(`✅ Notification sent successfully to ${userId}`);
//       console.log(
//         `   Notification ID: ${result.id || result.body?.notification_id}`
//       );
//       return {
//         success: true,
//         notificationId: result.id || result.body?.notification_id,
//         userId,
//       };
//     } else {
//       console.error(`❌ OneSignal API error:`, result);
//       return {
//         success: false,
//         error: result.errors || result.error || "Unknown error",
//       };
//     }
//   } catch (error) {
//     console.error(`❌ Error sending notification to ${userId}:`, error.message);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Send notification to multiple users
//  */
// export async function sendBulkPushNotifications(
//   userIds,
//   title,
//   message,
//   data = {}
// ) {
//   logConfigOnce();
//   const results = { successful: [], failed: [] };

//   console.log(`📤 Sending bulk notification to ${userIds.length} users...`);

//   const promises = userIds.map(async (userId) => {
//     const result = await sendPushNotification(userId, title, message, data);
//     if (result.success) {
//       results.successful.push({
//         userId,
//         notificationId: result.notificationId,
//       });
//     } else {
//       results.failed.push({ userId, error: result.error });
//     }
//   });

//   await Promise.allSettled(promises);

//   console.log(`✅ Successfully sent: ${results.successful.length}`);
//   if (results.failed.length > 0) {
//     console.log(`❌ Failed to send: ${results.failed.length}`);
//   }

//   return {
//     success: true,
//     results,
//     summary: {
//       total: userIds.length,
//       successful: results.successful.length,
//       failed: results.failed.length,
//     },
//   };
// }

// /**
//  * ✅ FIXED: Send notification by external user ID
//  */
// export async function sendNotificationByExternalId(
//   userId,
//   title,
//   message,
//   data = {}
// ) {
//   logConfigOnce();
//   const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, isV2Key, API_ENDPOINT } =
//     getOneSignalConfig();

//   if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
//     console.error(
//       "❌ Cannot send notification: OneSignal credentials not configured"
//     );
//     return {
//       success: false,
//       error: "OneSignal credentials not configured. Check your .env file.",
//     };
//   }

//   try {
//     let notification;

//     if (isV2Key) {
//       // ✅ v2 API format - simplified and correct
//       notification = {
//         app_id: ONESIGNAL_APP_ID, // ✅ Include app_id in body for v2
//         target_channel: "push",
//         headings: { en: title },
//         contents: { en: message },
//         data: {
//           ...data,
//           userId,
//           sentAt: new Date().toISOString(),
//         },
//         include_aliases: {
//           external_id: [userId],
//         },
//       };
//     } else {
//       // v1 API format
//       notification = {
//         app_id: ONESIGNAL_APP_ID,
//         include_external_user_ids: [userId],
//         headings: { en: title },
//         contents: { en: message },
//         data: {
//           ...data,
//           userId,
//           sentAt: new Date().toISOString(),
//         },
//         priority: 10,
//         android_channel_id: "default",
//       };
//     }

//     const headers = getHeaders();

//     // 🔍 ENHANCED DEBUGGING
//     console.log("\n🔍 === NOTIFICATION REQUEST DEBUG ===");
//     console.log("Endpoint:", API_ENDPOINT);
//     console.log("API Version:", isV2Key ? "v2" : "v1");
//     console.log("User ID:", userId);
//     console.log("Headers:", JSON.stringify(headers, null, 2));
//     console.log("Payload:", JSON.stringify(notification, null, 2));
//     console.log("=====================================\n");

//     console.log(
//       `📤 Sending notification to external user ${userId} via ${
//         isV2Key ? "v2" : "v1"
//       } API...`
//     );

//     const response = await fetch(API_ENDPOINT, {
//       method: "POST",
//       headers: headers,
//       body: JSON.stringify(notification),
//     });

//     const result = await response.json();

//     // 🔍 ENHANCED RESPONSE LOGGING
//     console.log("\n📥 === ONESIGNAL RESPONSE ===");
//     console.log("Status:", response.status);
//     console.log("Response:", JSON.stringify(result, null, 2));
//     console.log("==============================\n");

//     if (response.ok) {
//       console.log(`✅ Notification sent to external user ${userId}`);
//       return {
//         success: true,
//         notificationId: result.id || result.body?.notification_id,
//       };
//     } else {
//       console.error(`❌ OneSignal API error:`, result);
//       return {
//         success: false,
//         error: result.errors || result.error || "Unknown error",
//         details: result,
//       };
//     }
//   } catch (error) {
//     console.error(`❌ Error sending notification:`, error.message);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * ✅ FIXED: Send announcement to all app users
//  */
// export async function sendGlobalAnnouncement(title, message, data = {}) {
//   logConfigOnce();
//   const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, isV2Key, API_ENDPOINT } =
//     getOneSignalConfig();

//   if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
//     console.error(
//       "❌ Cannot send announcement: OneSignal credentials not configured"
//     );
//     return {
//       success: false,
//       error: "OneSignal credentials not configured. Check your .env file.",
//     };
//   }

//   try {
//     let notification;

//     if (isV2Key) {
//       // ✅ v2 API format
//       notification = {
//         app_id: ONESIGNAL_APP_ID, // ✅ Include app_id
//         target_channel: "push",
//         headings: { en: title },
//         contents: { en: message },
//         data: {
//           ...data,
//           type: "announcement",
//           sentAt: new Date().toISOString(),
//         },
//         included_segments: ["All"],
//       };
//     } else {
//       // v1 API format
//       notification = {
//         app_id: ONESIGNAL_APP_ID,
//         included_segments: ["All"],
//         headings: { en: title },
//         contents: { en: message },
//         data: {
//           ...data,
//           type: "announcement",
//           sentAt: new Date().toISOString(),
//         },
//       };
//     }

//     console.log(
//       `📢 Sending global announcement via ${isV2Key ? "v2" : "v1"} API...`
//     );

//     const response = await fetch(API_ENDPOINT, {
//       method: "POST",
//       headers: getHeaders(),
//       body: JSON.stringify(notification),
//     });

//     const result = await response.json();

//     if (response.ok) {
//       console.log(`✅ Global announcement sent successfully`);
//       return {
//         success: true,
//         notificationId: result.id || result.body?.notification_id,
//       };
//     } else {
//       console.error(`❌ OneSignal API error:`, result);
//       return {
//         success: false,
//         error: result.errors || result.error || "Unknown error",
//       };
//     }
//   } catch (error) {
//     console.error(`❌ Error sending announcement:`, error.message);
//     return { success: false, error: error.message };
//   }
// }

// export default {
//   registerUserPlayerId,
//   getUserPlayerId,
//   removeUserPlayerId,
//   sendPushNotification,
//   sendBulkPushNotifications,
//   sendNotificationByExternalId,
//   sendGlobalAnnouncement,
// };

import fetch from "node-fetch";

// ✅ Get config with proper v2 detection
function getOneSignalConfig() {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

  // ✅ Check for BOTH v2 formats
  const isV2Key =
    ONESIGNAL_REST_API_KEY?.startsWith("os_v2_app_") ||
    ONESIGNAL_REST_API_KEY?.startsWith("os_v2_api_");

  // ✅ v2 API uses /notifications endpoint (no app_id in URL)
  const API_ENDPOINT = "https://api.onesignal.com/notifications";

  return {
    ONESIGNAL_APP_ID,
    ONESIGNAL_REST_API_KEY,
    isV2Key,
    API_ENDPOINT,
  };
}

// Logging
let configLogged = false;
function logConfigOnce() {
  if (configLogged) return;
  configLogged = true;

  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, isV2Key } =
    getOneSignalConfig();

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("❌ CRITICAL: OneSignal credentials missing!");
    console.error(
      "   ONESIGNAL_APP_ID:",
      ONESIGNAL_APP_ID ? "✅ Set" : "❌ Missing"
    );
    console.error(
      "   ONESIGNAL_REST_API_KEY:",
      ONESIGNAL_REST_API_KEY ? "✅ Set" : "❌ Missing"
    );
  } else {
    console.log("\n=== OneSignal Configuration ===");
    console.log(
      `API Version: ${isV2Key ? "v2 (User Auth Key)" : "v1 (legacy)"}`
    );
    console.log(`App ID: ${ONESIGNAL_APP_ID.substring(0, 15)}...`);
    console.log(`API Key Type: ${ONESIGNAL_REST_API_KEY.substring(0, 15)}...`);
    console.log("===============================\n");
  }
}

// ✅ Fixed headers for v2 API
function getHeaders() {
  const { ONESIGNAL_REST_API_KEY } = getOneSignalConfig();

  if (!ONESIGNAL_REST_API_KEY) {
    console.error("❌ Cannot create headers: API key is missing");
    return { "Content-Type": "application/json" };
  }

  // ✅ v2 API ALWAYS uses Bearer token (whether os_v2_app_ or os_v2_api_)
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ONESIGNAL_REST_API_KEY}`,
  };
}

/**
 * ✅ FIXED: Send notification by external user ID (v2 API)
 */
export async function sendNotificationByExternalId(
  userId,
  title,
  message,
  data = {}
) {
  logConfigOnce();
  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, API_ENDPOINT } =
    getOneSignalConfig();

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error(
      "❌ Cannot send notification: OneSignal credentials not configured"
    );
    return {
      success: false,
      error: "OneSignal credentials not configured. Check your .env file.",
    };
  }

  try {
    // ✅ v2 API format - simplified and correct
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        userId,
        sentAt: new Date().toISOString(),
      },
      include_aliases: {
        external_id: [userId], // ✅ This targets the external_id you set in the app
      },
    };

    const headers = getHeaders();

    // 🔍 Debug logging
    console.log("\n🔍 === NOTIFICATION REQUEST ===");
    console.log("Endpoint:", API_ENDPOINT);
    console.log("User ID:", userId);
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("Payload:", JSON.stringify(notification, null, 2));
    console.log("================================\n");

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(notification),
    });

    const result = await response.json();

    // 🔍 Response logging
    console.log("\n📥 === ONESIGNAL RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));
    console.log("==============================\n");

    if (response.ok) {
      console.log(`✅ Notification sent to external user ${userId}`);
      return {
        success: true,
        notificationId: result.id,
      };
    } else {
      console.error(`❌ OneSignal API error:`, result);
      return {
        success: false,
        error: result.errors || result.error || "Unknown error",
        details: result,
      };
    }
  } catch (error) {
    console.error(`❌ Error sending notification:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ✅ FIXED: Send global announcement (v2 API)
 */
export async function sendGlobalAnnouncement(title, message, data = {}) {
  logConfigOnce();
  const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, API_ENDPOINT } =
    getOneSignalConfig();

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error(
      "❌ Cannot send announcement: OneSignal credentials not configured"
    );
    return {
      success: false,
      error: "OneSignal credentials not configured. Check your .env file.",
    };
  }

  try {
    // ✅ v2 API format for global announcement
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      target_channel: "push",
      headings: { en: title },
      contents: { en: message },
      data: {
        ...data,
        type: "announcement",
        sentAt: new Date().toISOString(),
      },
      included_segments: ["All"], // ✅ Send to all subscribed users
    };

    console.log("📢 Sending global announcement via v2 API...");

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(notification),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Global announcement sent successfully`);
      return {
        success: true,
        notificationId: result.id,
      };
    } else {
      console.error(`❌ OneSignal API error:`, result);
      return {
        success: false,
        error: result.errors || result.error || "Unknown error",
        details: result,
      };
    }
  } catch (error) {
    console.error(`❌ Error sending announcement:`, error.message);
    return { success: false, error: error.message };
  }
}

// Legacy functions for backward compatibility (can be removed if not used)
const userPlayerIds = new Map();

export function registerUserPlayerId(userId, playerId) {
  userPlayerIds.set(userId, playerId);
  console.log(`✅ Registered OneSignal Player ID for user ${userId}`);
}

export function getUserPlayerId(userId) {
  return userPlayerIds.get(userId);
}

export function removeUserPlayerId(userId) {
  return userPlayerIds.delete(userId);
}

export async function sendPushNotification(userId, title, message, data = {}) {
  // Use the new external_id method
  return sendNotificationByExternalId(userId, title, message, data);
}

export async function sendBulkPushNotifications(
  userIds,
  title,
  message,
  data = {}
) {
  const results = { successful: [], failed: [] };

  const promises = userIds.map(async (userId) => {
    const result = await sendNotificationByExternalId(
      userId,
      title,
      message,
      data
    );
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
  sendNotificationByExternalId,
  sendGlobalAnnouncement,
  registerUserPlayerId,
  getUserPlayerId,
  removeUserPlayerId,
  sendPushNotification,
  sendBulkPushNotifications,
};
