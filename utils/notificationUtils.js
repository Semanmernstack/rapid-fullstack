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

    isInitialized = true;
    console.log("✅ OneSignal initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ OneSignal initialization error:", error);
    console.error("Stack:", error.stack);
    return false;
  }
}

/**
 * Register user for push notifications
 * Call this after user logs in
 */
export async function registerForPushNotificationsAsync(userId, userInfo = {}) {
  try {
    console.log(`📱 Registering user ${userId} for push notifications...`);

    if (!isInitialized) {
      console.log("⚠️ OneSignal not initialized, initializing now...");
      const initSuccess = initializeOneSignal();
      if (!initSuccess) {
        console.error("Failed to initialize OneSignal");
        return null;
      }
    }

    // Set external user ID (your backend user ID)
    try {
      OneSignal.login(userId);
      console.log("✅ User logged in to OneSignal:", userId);
    } catch (loginError) {
      console.error("❌ Error logging in user:", loginError);
    }

    // Set user email if available
    if (userInfo.email) {
      try {
        OneSignal.User.addEmail(userInfo.email);
        console.log("✅ Email added:", userInfo.email);
      } catch (emailError) {
        console.error("❌ Error adding email:", emailError);
      }
    }

    // Get OneSignal User ID
    try {
      const onesignalId = await OneSignal.User.getOnesignalId();
      console.log("✅ OneSignal User ID:", onesignalId);
      return onesignalId;
    } catch (idError) {
      console.error("❌ Error getting OneSignal ID:", idError);
      return null;
    }
  } catch (error) {
    console.error("❌ Error registering for push notifications:", error);
    console.error("Stack:", error.stack);
    return null;
  }
}

/**
 * Setup notification event listeners
 */
export function setupNotificationListeners(
  onNotificationReceived,
  onNotificationOpened
) {
  try {
    console.log("🎧 Setting up notification listeners...");

    // Listen for notification click/open
    const clickSubscription = OneSignal.Notifications.addEventListener(
      "click",
      (event) => {
        console.log("👆 Notification opened:", event);
        const notification = event.notification;

        if (onNotificationOpened) {
          onNotificationOpened({
            notification,
            actionId: event.actionId,
          });
        }
      }
    );

    // Listen for foreground notifications
    const foregroundSubscription = OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {
        console.log("📩 Notification received in foreground:", event);

        if (onNotificationReceived) {
          onNotificationReceived(event.notification);
        }
      }
    );

    console.log("✅ Notification listeners set up successfully");

    // Return cleanup function
    return () => {
      console.log("🧹 Cleaning up notification listeners");
      clickSubscription?.remove();
      foregroundSubscription?.remove();
    };
  } catch (error) {
    console.error("❌ Error setting up notification listeners:", error);
    console.error("Stack:", error.stack);
    return () => {};
  }
}

/**
 * Logout user from push notifications
 */
export async function logoutFromPushNotifications() {
  try {
    console.log("🗑️ Logging out from push notifications...");
    OneSignal.logout();
    console.log("✅ User logged out from OneSignal");
  } catch (error) {
    console.error("❌ Error logging out:", error);
  }
}

/**
 * Add tags to user for segmentation
 */
export function addUserTags(tags) {
  try {
    Object.entries(tags).forEach(([key, value]) => {
      OneSignal.User.addTag(key, String(value));
    });
    console.log("✅ User tags added:", tags);
  } catch (error) {
    console.error("❌ Error adding user tags:", error);
  }
}

/**
 * Check if notifications are enabled
 */
export async function checkPushNotificationStatus() {
  try {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    const userId = await OneSignal.User.getOnesignalId();

    return {
      hasPermission,
      userId,
      isInitialized,
    };
  } catch (error) {
    console.error("❌ Error checking push status:", error);
    return {
      hasPermission: false,
      userId: null,
      isInitialized,
    };
  }
}

export default {
  initializeOneSignal,
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  logoutFromPushNotifications,
  addUserTags,
  checkPushNotificationStatus,
};
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";

// // Configure how notifications are handled when app is in foreground
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // Initialize OneSignal (just for reference, not actually using SDK)
// export function initializeOneSignal() {
//   console.log("📱 Using Expo Notifications + OneSignal REST API");
//   console.log("✅ Notification system initialized");
// }

// // Register for push notifications
// export async function registerForPushNotificationsAsync(userId) {
//   let token;

//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "default",
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: "#8328FA",
//     });
//   }

//   if (Device.isDevice) {
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       console.log("❌ Failed to get push token for push notification!");
//       return null;
//     }

//     try {
//       // Get Expo Push Token
//       token = (
//         await Notifications.getExpoPushTokenAsync({
//           projectId: "233858dc-d585-4926-ba6a-6d7e3b97937f",
//         })
//       ).data;

//       console.log("✅ Expo Push Token:", token);

//       // Register with your backend
//       if (userId && token) {
//         const response = await fetch(
//           "https://rapid-fullstack.vercel.app/api/register-expo-token",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               userId,
//               expoPushToken: token,
//             }),
//           }
//         );

//         const result = await response.json();
//         console.log("✅ Token registered with backend:", result);
//       }

//       return token;
//     } catch (error) {
//       console.error("❌ Error getting push token:", error);
//       return null;
//     }
//   } else {
//     console.log("❌ Must use physical device for Push Notifications");
//     return null;
//   }
// }

// // Setup notification listeners
// export function setupNotificationListeners(onReceived, onOpened) {
//   console.log("🔔 Setting up notification listeners...");

//   // Handle notification received while app is in foreground
//   const receivedSubscription = Notifications.addNotificationReceivedListener(
//     (notification) => {
//       console.log("🔔 Notification received:", notification);
//       if (onReceived) {
//         onReceived(notification);
//       }
//     }
//   );

//   // Handle notification tapped/opened
//   const responseSubscription =
//     Notifications.addNotificationResponseReceivedListener((response) => {
//       console.log("🔔 Notification opened:", response);
//       if (onOpened) {
//         onOpened(response);
//       }
//     });

//   // Return cleanup function
//   return () => {
//     receivedSubscription.remove();
//     responseSubscription.remove();
//     console.log("🔕 Notification listeners removed");
//   };
// }

// // Handle notification clicks with navigation (for HomeScreen)
// export function setupNotificationHandlers(navigation) {
//   console.log("🔔 Setting up notification handlers with navigation...");

//   // Handle notification opened
//   const subscription = Notifications.addNotificationResponseReceivedListener(
//     (response) => {
//       console.log("🔔 Notification tapped:", response);

//       const data = response.notification.request.content.data;

//       // Navigate based on notification data
//       if (data?.shipmentId) {
//         navigation.navigate("Location", {
//           screen: "LocationScreen",
//           params: { shipmentId: data.shipmentId },
//         });
//       } else if (data?.screen) {
//         navigation.navigate(data.screen);
//       }
//     }
//   );

//   return () => {
//     subscription.remove();
//   };
// }

// // Unregister user (on logout)
// export async function unregisterUser(userId) {
//   try {
//     await fetch("https://rapid-fullstack.vercel.app/api/unregister-token", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ userId }),
//     });
//     console.log("🔓 User unregistered from notifications");
//   } catch (error) {
//     console.error("❌ Error unregistering:", error);
//   }
// }
