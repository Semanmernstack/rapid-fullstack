// import fetch from "node-fetch";

// // ✅ Get config with proper v2 detection
// function getOneSignalConfig() {
//   const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
//   const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

//   // ✅ Check for BOTH v2 formats
//   const isV2Key =
//     ONESIGNAL_REST_API_KEY?.startsWith("os_v2_app_") ||
//     ONESIGNAL_REST_API_KEY?.startsWith("os_v2_api_");

//   // ✅ v2 API uses /notifications endpoint (no app_id in URL)
//   const API_ENDPOINT = "https://api.onesignal.com/notifications";

//   return {
//     ONESIGNAL_APP_ID,
//     ONESIGNAL_REST_API_KEY,
//     isV2Key,
//     API_ENDPOINT,
//   };
// }

// // Logging
// let configLogged = false;
// function logConfigOnce() {
//   if (configLogged) return;
//   configLogged = true;

//   const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, isV2Key } =
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
//   } else {
//     console.log("\n=== OneSignal Configuration ===");
//     console.log(
//       `API Version: ${isV2Key ? "v2 (User Auth Key)" : "v1 (legacy)"}`
//     );
//     console.log(`App ID: ${ONESIGNAL_APP_ID.substring(0, 15)}...`);
//     console.log(`API Key Type: ${ONESIGNAL_REST_API_KEY.substring(0, 15)}...`);
//     console.log("===============================\n");
//   }
// }

// // ✅ Fixed headers for v2 API
// function getHeaders() {
//   const { ONESIGNAL_REST_API_KEY } = getOneSignalConfig();

//   if (!ONESIGNAL_REST_API_KEY) {
//     console.error("❌ Cannot create headers: API key is missing");
//     return { "Content-Type": "application/json" };
//   }

//   // ✅ v2 API ALWAYS uses Bearer token (whether os_v2_app_ or os_v2_api_)
//   return {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${ONESIGNAL_REST_API_KEY}`,
//   };
// }

// /**
//  * ✅ FIXED: Send notification by external user ID (v2 API)
//  */
// export async function sendNotificationByExternalId(
//   userId,
//   title,
//   message,
//   data = {}
// ) {
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

//   try {
//     // ✅ v2 API format - simplified and correct
//     const notification = {
//       app_id: ONESIGNAL_APP_ID,
//       target_channel: "push",
//       headings: { en: title },
//       contents: { en: message },
//       data: {
//         ...data,
//         userId,
//         sentAt: new Date().toISOString(),
//       },
//       include_aliases: {
//         external_id: [userId], // ✅ This targets the external_id you set in the app
//       },
//     };

//     const headers = getHeaders();

//     // 🔍 Debug logging
//     console.log("\n🔍 === NOTIFICATION REQUEST ===");
//     console.log("Endpoint:", API_ENDPOINT);
//     console.log("User ID:", userId);
//     console.log("Headers:", JSON.stringify(headers, null, 2));
//     console.log("Payload:", JSON.stringify(notification, null, 2));
//     console.log("================================\n");

//     const response = await fetch(API_ENDPOINT, {
//       method: "POST",
//       headers: headers,
//       body: JSON.stringify(notification),
//     });

//     const result = await response.json();

//     // 🔍 Response logging
//     console.log("\n📥 === ONESIGNAL RESPONSE ===");
//     console.log("Status:", response.status);
//     console.log("Response:", JSON.stringify(result, null, 2));
//     console.log("==============================\n");

//     if (response.ok) {
//       console.log(`✅ Notification sent to external user ${userId}`);
//       return {
//         success: true,
//         notificationId: result.id,
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
//  * ✅ FIXED: Send global announcement (v2 API)
//  */
// export async function sendGlobalAnnouncement(title, message, data = {}) {
//   logConfigOnce();
//   const { ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY, API_ENDPOINT } =
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
//     // ✅ v2 API format for global announcement
//     const notification = {
//       app_id: ONESIGNAL_APP_ID,
//       target_channel: "push",
//       headings: { en: title },
//       contents: { en: message },
//       data: {
//         ...data,
//         type: "announcement",
//         sentAt: new Date().toISOString(),
//       },
//       included_segments: ["All"], // ✅ Send to all subscribed users
//     };

//     console.log("📢 Sending global announcement via v2 API...");

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
//         notificationId: result.id,
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
//     console.error(`❌ Error sending announcement:`, error.message);
//     return { success: false, error: error.message };
//   }
// }

// // Legacy functions for backward compatibility (can be removed if not used)
// const userPlayerIds = new Map();

// export function registerUserPlayerId(userId, playerId) {
//   userPlayerIds.set(userId, playerId);
//   console.log(`✅ Registered OneSignal Player ID for user ${userId}`);
// }

// export function getUserPlayerId(userId) {
//   return userPlayerIds.get(userId);
// }

// export function removeUserPlayerId(userId) {
//   return userPlayerIds.delete(userId);
// }

// export async function sendPushNotification(userId, title, message, data = {}) {
//   // Use the new external_id method
//   return sendNotificationByExternalId(userId, title, message, data);
// }

// export async function sendBulkPushNotifications(
//   userIds,
//   title,
//   message,
//   data = {}
// ) {
//   const results = { successful: [], failed: [] };

//   const promises = userIds.map(async (userId) => {
//     const result = await sendNotificationByExternalId(
//       userId,
//       title,
//       message,
//       data
//     );
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

// export default {
//   sendNotificationByExternalId,
//   sendGlobalAnnouncement,
//   registerUserPlayerId,
//   getUserPlayerId,
//   removeUserPlayerId,
//   sendPushNotification,
//   sendBulkPushNotifications,
// };
import fetch from "node-fetch";

// ✅ FIXED: Proper config loading with validation
function getOneSignalConfig() {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

  // ✅ Check for BOTH v2 formats
  const isV2Key =
    ONESIGNAL_REST_API_KEY?.startsWith("os_v2_app_") ||
    ONESIGNAL_REST_API_KEY?.startsWith("os_v2_api_");

  // ✅ v2 API uses /notifications endpoint (no app_id in URL)
  const API_ENDPOINT = "https://api.onesignal.com/notifications";

  // ✅ CRITICAL: Validate that we have the keys
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("❌ CRITICAL ERROR: OneSignal credentials missing!");
    console.error("ONESIGNAL_APP_ID:", ONESIGNAL_APP_ID ? "✅" : "❌ MISSING");
    console.error(
      "ONESIGNAL_REST_API_KEY:",
      ONESIGNAL_REST_API_KEY ? "✅" : "❌ MISSING"
    );
  }

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

// ✅ FIXED: Proper headers with actual API key
function getHeaders() {
  const { ONESIGNAL_REST_API_KEY } = getOneSignalConfig();

  if (!ONESIGNAL_REST_API_KEY) {
    console.error("❌ CRITICAL: Cannot create headers - API key is missing!");
    console.error(
      "❌ process.env.ONESIGNAL_REST_API_KEY =",
      process.env.ONESIGNAL_REST_API_KEY
    );
    throw new Error("OneSignal REST API Key is not configured");
  }

  // ✅ CRITICAL FIX: Actually use the API key
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ONESIGNAL_REST_API_KEY}`,
  };

  // Debug log (only first time)
  if (!configLogged) {
    console.log(
      "🔑 Authorization Header:",
      `Bearer ${ONESIGNAL_REST_API_KEY.substring(0, 20)}...`
    );
  }

  return headers;
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
    console.log("Headers:", {
      "Content-Type": headers["Content-Type"],
      Authorization: `Bearer ${ONESIGNAL_REST_API_KEY.substring(0, 20)}...`,
    });
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
