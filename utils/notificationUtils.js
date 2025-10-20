// import { OneSignal } from "react-native-onesignal";
// import Constants from "expo-constants";

// let isInitialized = false;

// /**
//  * Initialize OneSignal
//  * Call this ONCE when app starts
//  */
// export function initializeOneSignal() {
//   try {
//     if (isInitialized) {
//       console.log("⚠️ OneSignal already initialized");
//       return true;
//     }

//     console.log("📱 Initializing OneSignal...");

//     // Get OneSignal App ID from app.json
//     const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;

//     if (!oneSignalAppId) {
//       console.error("❌ OneSignal App ID not found in app.json extra");
//       console.error(
//         'Make sure app.json has: "extra": { "oneSignalAppId": "YOUR_APP_ID" }'
//       );
//       return false;
//     }

//     console.log("✅ Found OneSignal App ID:", oneSignalAppId);

//     // Initialize OneSignal
//     OneSignal.initialize(oneSignalAppId);

//     // Request notification permission
//     OneSignal.Notifications.requestPermission(true);

//     isInitialized = true;
//     console.log("✅ OneSignal initialized successfully");
//     return true;
//   } catch (error) {
//     console.error("❌ OneSignal initialization error:", error);
//     console.error("Stack:", error.stack);
//     return false;
//   }
// }

// /**
//  * Register user for push notifications
//  * Call this after user logs in
//  */
// export async function registerForPushNotificationsAsync(userId, userInfo = {}) {
//   try {
//     console.log(`📱 Registering user ${userId} for push notifications...`);

//     if (!isInitialized) {
//       console.log("⚠️ OneSignal not initialized, initializing now...");
//       const initSuccess = initializeOneSignal();
//       if (!initSuccess) {
//         console.error("Failed to initialize OneSignal");
//         return null;
//       }
//     }

//     // Set external user ID (your backend user ID)
//     try {
//       OneSignal.login(userId);
//       console.log("✅ User logged in to OneSignal:", userId);
//     } catch (loginError) {
//       console.error("❌ Error logging in user:", loginError);
//     }

//     // Set user email if available
//     if (userInfo.email) {
//       try {
//         OneSignal.User.addEmail(userInfo.email);
//         console.log("✅ Email added:", userInfo.email);
//       } catch (emailError) {
//         console.error("❌ Error adding email:", emailError);
//       }
//     }

//     // Get OneSignal User ID
//     try {
//       const onesignalId = await OneSignal.User.getOnesignalId();
//       console.log("✅ OneSignal User ID:", onesignalId);
//       return onesignalId;
//     } catch (idError) {
//       console.error("❌ Error getting OneSignal ID:", idError);
//       return null;
//     }
//   } catch (error) {
//     console.error("❌ Error registering for push notifications:", error);
//     console.error("Stack:", error.stack);
//     return null;
//   }
// }

// /**
//  * Setup notification event listeners
//  */
// export function setupNotificationListeners(
//   onNotificationReceived,
//   onNotificationOpened
// ) {
//   try {
//     console.log("🎧 Setting up notification listeners...");

//     // Listen for notification click/open
//     const clickSubscription = OneSignal.Notifications.addEventListener(
//       "click",
//       (event) => {
//         console.log("👆 Notification opened:", event);
//         const notification = event.notification;

//         if (onNotificationOpened) {
//           onNotificationOpened({
//             notification,
//             actionId: event.actionId,
//           });
//         }
//       }
//     );

//     // Listen for foreground notifications
//     const foregroundSubscription = OneSignal.Notifications.addEventListener(
//       "foregroundWillDisplay",
//       (event) => {
//         console.log("📩 Notification received in foreground:", event);

//         if (onNotificationReceived) {
//           onNotificationReceived(event.notification);
//         }
//       }
//     );

//     console.log("✅ Notification listeners set up successfully");

//     // Return cleanup function
//     return () => {
//       console.log("🧹 Cleaning up notification listeners");
//       clickSubscription?.remove();
//       foregroundSubscription?.remove();
//     };
//   } catch (error) {
//     console.error("❌ Error setting up notification listeners:", error);
//     console.error("Stack:", error.stack);
//     return () => {};
//   }
// }

// /**
//  * Logout user from push notifications
//  */
// export async function logoutFromPushNotifications() {
//   try {
//     console.log("🗑️ Logging out from push notifications...");
//     OneSignal.logout();
//     console.log("✅ User logged out from OneSignal");
//   } catch (error) {
//     console.error("❌ Error logging out:", error);
//   }
// }

// /**
//  * Add tags to user for segmentation
//  */
// export function addUserTags(tags) {
//   try {
//     Object.entries(tags).forEach(([key, value]) => {
//       OneSignal.User.addTag(key, String(value));
//     });
//     console.log("✅ User tags added:", tags);
//   } catch (error) {
//     console.error("❌ Error adding user tags:", error);
//   }
// }

// /**
//  * Check if notifications are enabled
//  */
// export async function checkPushNotificationStatus() {
//   try {
//     const hasPermission = await OneSignal.Notifications.getPermissionAsync();
//     const userId = await OneSignal.User.getOnesignalId();

//     return {
//       hasPermission,
//       userId,
//       isInitialized,
//     };
//   } catch (error) {
//     console.error("❌ Error checking push status:", error);
//     return {
//       hasPermission: false,
//       userId: null,
//       isInitialized,
//     };
//   }
// }

// export default {
//   initializeOneSignal,
//   registerForPushNotificationsAsync,
//   setupNotificationListeners,
//   logoutFromPushNotifications,
//   addUserTags,
//   checkPushNotificationStatus,
// };
// import { OneSignal } from "react-native-onesignal";
// import Constants from "expo-constants";

// let isInitialized = false;

// /**
//  * Initialize OneSignal
//  * Call this ONCE when app starts
//  */
// export function initializeOneSignal() {
//   try {
//     if (isInitialized) {
//       console.log("⚠️ OneSignal already initialized");
//       return true;
//     }

//     console.log("📱 Initializing OneSignal...");

//     // Get OneSignal App ID from app.json
//     const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;

//     if (!oneSignalAppId) {
//       console.error("❌ OneSignal App ID not found in app.json extra");
//       console.error(
//         'Make sure app.json has: "extra": { "oneSignalAppId": "YOUR_APP_ID" }'
//       );
//       return false;
//     }

//     console.log("✅ Found OneSignal App ID:", oneSignalAppId);

//     // Initialize OneSignal
//     OneSignal.initialize(oneSignalAppId);

//     // Request notification permission
//     OneSignal.Notifications.requestPermission(true);

//     // Set up notification handlers
//     console.log("📡 Setting up notification listeners...");

//     // Handle notifications received while app is open
//     OneSignal.Notifications.addEventListener(
//       "foregroundWillDisplay",
//       (event) => {
//         console.log("📬 Notification received in foreground:", event);
//         // Display the notification
//         event.getNotification().display();
//       }
//     );

//     // Handle notification clicks
//     OneSignal.Notifications.addEventListener("click", (event) => {
//       console.log("📂 Notification clicked:", event);
//       const notification = event.notification;
//       console.log("Notification data:", notification.additionalData);
//       // Handle navigation based on notification data here
//     });

//     isInitialized = true;
//     console.log("✅ OneSignal initialized successfully");
//     console.log("✅ Notification listeners set up successfully");
//     return true;
//   } catch (error) {
//     console.error("❌ OneSignal initialization error:", error);
//     console.error("Stack:", error.stack);
//     return false;
//   }
// }

// /**
//  * Register user for push notifications with external user ID
//  * This is CRITICAL for backend to send targeted notifications
//  */
// export async function registerForPushNotificationsAsync(userId, userData = {}) {
//   try {
//     if (!isInitialized) {
//       console.warn("⚠️ OneSignal not initialized yet, initializing now...");
//       initializeOneSignal();
//     }

//     console.log(`📱 Registering user ${userId} for push notifications.`);

//     // STEP 1: Login user with external ID
//     OneSignal.login(userId);
//     console.log(`✅ User logged in to OneSignal: ${userId}`);

//     // STEP 2: Set email if available
//     if (userData.email) {
//       OneSignal.User.addEmail(userData.email);
//       console.log(`✅ Email added: ${userData.email}`);
//     }

//     // STEP 3: Add tags for user segmentation
//     const tags = {
//       userId: userId,
//       userType: "customer",
//       registeredAt: new Date().toISOString(),
//     };

//     if (userData.firstName) {
//       tags.firstName = userData.firstName;
//     }

//     OneSignal.User.addTags(tags);
//     console.log(`✅ Tags added:`, tags);

//     // STEP 4: ✅ CRITICAL - Set external_id as alias for v2 API compatibility
//     OneSignal.User.addAlias("external_id", userId);
//     console.log(`✅ External ID alias set: external_id = ${userId}`);

//     // Get OneSignal User ID for debugging
//     const oneSignalUserId = OneSignal.User.onesignalId;
//     console.log(`✅ OneSignal User ID: ${oneSignalUserId}`);

//     // Get push subscription info
//     const pushSubscription = OneSignal.User.pushSubscription;
//     console.log(`✅ Push Subscription ID: ${pushSubscription.id}`);
//     console.log(
//       `✅ Push Token: ${pushSubscription.token?.substring(0, 20)}...`
//     );

//     // Get all aliases for verification
//     const aliases = OneSignal.User.getAliases();
//     console.log(`✅ All aliases:`, aliases);

//     console.log("✅ Push notifications registered successfully");

//     return {
//       success: true,
//       oneSignalUserId,
//       externalId: userId,
//       pushSubscriptionId: pushSubscription.id,
//       aliases,
//     };
//   } catch (error) {
//     console.error("❌ Error registering for push notifications:", error);
//     console.error("Stack:", error.stack);
//     return {
//       success: false,
//       error: error.message,
//     };
//   }
// }

// /**
//  * Alias for backward compatibility
//  */
// export function registerUserForNotifications(userId, userData = {}) {
//   return registerForPushNotificationsAsync(userId, userData);
// }

// /**
//  * Logout user from OneSignal
//  */
// export function logoutOneSignal() {
//   try {
//     OneSignal.logout();
//     console.log("✅ User logged out from OneSignal");
//     return true;
//   } catch (error) {
//     console.error("❌ Error logging out from OneSignal:", error);
//     return false;
//   }
// }

// /**
//  * Get current OneSignal user info
//  */
// export function getOneSignalUserInfo() {
//   try {
//     const userId = OneSignal.User.onesignalId;
//     const aliases = OneSignal.User.getAliases();
//     const pushSubscription = OneSignal.User.pushSubscription;

//     return {
//       oneSignalUserId: userId,
//       aliases,
//       pushSubscriptionId: pushSubscription.id,
//       isSubscribed: pushSubscription.optedIn,
//     };
//   } catch (error) {
//     console.error("❌ Error getting OneSignal user info:", error);
//     return null;
//   }
// }

import { OneSignal } from "react-native-onesignal";
import Constants from "expo-constants";

let isInitialized = false;

/**
 * Initialize OneSignal
 * Call this ONCE when app starts
 */
export function initializeOneSignal() {
  try {
    if (isInitialized) {
      console.log("⚠️ OneSignal already initialized");
      return true;
    }

    console.log("📱 Initializing OneSignal...");

    // Get OneSignal App ID from app.json
    const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;

    if (!oneSignalAppId) {
      console.error("❌ OneSignal App ID not found in app.json extra");
      console.error(
        'Make sure app.json has: "extra": { "oneSignalAppId": "YOUR_APP_ID" }'
      );
      return false;
    }

    console.log("✅ Found OneSignal App ID:", oneSignalAppId);

    // Initialize OneSignal
    OneSignal.initialize(oneSignalAppId);

    // Request notification permission
    OneSignal.Notifications.requestPermission(true);

    // Set up notification handlers
    console.log("📡 Setting up notification listeners...");

    // Handle notifications received while app is open
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {
        console.log("📬 Notification received in foreground:", event);
        // Display the notification
        event.getNotification().display();
      }
    );

    // Handle notification clicks
    OneSignal.Notifications.addEventListener("click", (event) => {
      console.log("📂 Notification clicked:", event);
      const notification = event.notification;
      console.log("Notification data:", notification.additionalData);
      // Handle navigation based on notification data here
    });

    isInitialized = true;
    console.log("✅ OneSignal initialized successfully");
    console.log("✅ Notification listeners set up successfully");
    return true;
  } catch (error) {
    console.error("❌ OneSignal initialization error:", error);
    console.error("Stack:", error.stack);
    return false;
  }
}

/**
 * Setup notification listeners with callbacks
 * Returns cleanup function
 */
export function setupNotificationListeners(
  onForegroundNotification,
  onNotificationTapped
) {
  try {
    console.log("📡 Setting up notification event listeners...");

    // Handle notifications received while app is open
    const foregroundListener = OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {
        console.log("📬 Foreground notification received:", event);
        if (onForegroundNotification) {
          onForegroundNotification(event);
        }
        // Display the notification
        event.getNotification().display();
      }
    );

    // Handle notification clicks
    const clickListener = OneSignal.Notifications.addEventListener(
      "click",
      (event) => {
        console.log("👆 Notification clicked:", event);
        if (onNotificationTapped) {
          onNotificationTapped(event);
        }
      }
    );

    console.log("✅ Notification listeners attached");

    // Return cleanup function
    return () => {
      console.log("🧹 Cleaning up notification listeners");
      foregroundListener?.remove();
      clickListener?.remove();
    };
  } catch (error) {
    console.error("❌ Error setting up notification listeners:", error);
    return () => {};
  }
}

/**
 * Register user for push notifications with external user ID
 * This is CRITICAL for backend to send targeted notifications
 */
export async function registerForPushNotificationsAsync(userId, userData = {}) {
  try {
    if (!isInitialized) {
      console.warn("⚠️ OneSignal not initialized yet, initializing now...");
      initializeOneSignal();
    }

    console.log(`📱 Registering user ${userId} for push notifications.`);

    // STEP 1: Login user with external ID
    OneSignal.login(userId);
    console.log(`✅ User logged in to OneSignal: ${userId}`);

    // STEP 2: Set email if available
    if (userData.email) {
      OneSignal.User.addEmail(userData.email);
      console.log(`✅ Email added: ${userData.email}`);
    }

    // STEP 3: Add tags for user segmentation
    const tags = {
      userId: userId,
      userType: "customer",
      registeredAt: new Date().toISOString(),
    };

    if (userData.firstName) {
      tags.firstName = userData.firstName;
    }

    OneSignal.User.addTags(tags);
    console.log(`✅ Tags added:`, tags);

    // STEP 4: ✅ CRITICAL - Set external_id as alias for v2 API compatibility
    OneSignal.User.addAlias("external_id", userId);
    console.log(`✅ External ID alias set: external_id = ${userId}`);

    // Get OneSignal User ID for debugging (with error handling)
    let oneSignalUserId = null;
    let pushSubscriptionId = null;
    let pushToken = null;

    try {
      oneSignalUserId = OneSignal.User.onesignalId;
      console.log(
        `✅ OneSignal User ID: ${oneSignalUserId || "Not available yet"}`
      );
    } catch (e) {
      console.log(
        "⚠️ OneSignal User ID not available yet (normal on first setup)"
      );
    }

    try {
      const pushSubscription = OneSignal.User.pushSubscription;
      pushSubscriptionId = pushSubscription?.id;
      pushToken = pushSubscription?.token;
      console.log(
        `✅ Push Subscription ID: ${pushSubscriptionId || "Not available yet"}`
      );
      console.log(
        `✅ Push Token: ${
          pushToken?.substring(0, 20) || "Not available yet"
        }...`
      );
    } catch (e) {
      console.log(
        "⚠️ Push subscription not available yet (normal on first setup)"
      );
    }

    console.log("✅ Push notifications registered successfully");
    console.log("✅ External ID is set - backend can now send notifications!");

    return {
      success: true,
      oneSignalUserId,
      externalId: userId,
      pushSubscriptionId,
    };
  } catch (error) {
    console.error("❌ Error registering for push notifications:", error);
    console.error("Stack:", error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Alias for backward compatibility
 */
export function registerUserForNotifications(userId, userData = {}) {
  return registerForPushNotificationsAsync(userId, userData);
}

/**
 * Logout user from OneSignal
 */
export function logoutOneSignal() {
  try {
    OneSignal.logout();
    console.log("✅ User logged out from OneSignal");
    return true;
  } catch (error) {
    console.error("❌ Error logging out from OneSignal:", error);
    return false;
  }
}

/**
 * Get current OneSignal user info
 */
export function getOneSignalUserInfo() {
  try {
    let userId = null;
    let pushSubscriptionId = null;
    let isSubscribed = false;

    try {
      userId = OneSignal.User.onesignalId;
    } catch (e) {
      console.log("⚠️ Could not get OneSignal User ID");
    }

    try {
      const pushSubscription = OneSignal.User.pushSubscription;
      pushSubscriptionId = pushSubscription?.id;
      isSubscribed = pushSubscription?.optedIn || false;
    } catch (e) {
      console.log("⚠️ Could not get push subscription info");
    }

    return {
      oneSignalUserId: userId,
      pushSubscriptionId,
      isSubscribed,
    };
  } catch (error) {
    console.error("❌ Error getting OneSignal user info:", error);
    return null;
  }
}
