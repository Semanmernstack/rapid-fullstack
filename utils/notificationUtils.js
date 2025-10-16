// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";
// import axios from "axios";
// import { auth } from "../firebase";

// const BACKEND_URL = "http://192.168.43.176:3000"; // Your backend URL

// // Configure how notifications are handled
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// // Register for push notifications and send token to backend
// export async function registerForPushNotificationsAsync(userId) {
//   try {
//     if (!Device.isDevice) {
//       console.log("⚠️ Must use physical device for Push Notifications");
//       return null;
//     }

//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       console.log("❌ Failed to get push token permissions!");
//       return null;
//     }

//     // Get Expo push token
//     const tokenData = await Notifications.getExpoPushTokenAsync();
//     const token = tokenData.data;
//     console.log("✅ Expo Push Token obtained:", token);

//     // Send token to backend
//     if (userId) {
//       try {
//         console.log(`📤 Registering token for user: ${userId}`);
//         console.log(`   Backend URL: ${BACKEND_URL}/api/register-token`);

//         const response = await axios.post(
//           `${BACKEND_URL}/api/register-token`,
//           {
//             userId: userId,
//             expoPushToken: token,
//             platform: Platform.OS,
//           },
//           {
//             timeout: 10000, // 10 second timeout
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         console.log("✅ Backend registration response:", response.data);

//         if (response.data.success) {
//           console.log("🎉 Token successfully registered on backend!");
//         }
//       } catch (error) {
//         console.error("❌ Error registering token with backend:");
//         console.error("   Error:", error.message);
//         console.error("   Response:", error.response?.data);
//         console.error("   Status:", error.response?.status);

//         // Still return the token even if backend registration failed
//         // so the app can continue working
//       }
//     }

//     // Configure Android notification channel
//     if (Platform.OS === "android") {
//       await Notifications.setNotificationChannelAsync("default", {
//         name: "default",
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: "#FF231F7C",
//       });
//     }

//     return token;
//   } catch (error) {
//     console.error("❌ Error in registerForPushNotificationsAsync:", error);
//     return null;
//   }
// }

// // Setup notification listeners
// export function setupNotificationListeners(
//   onNotificationReceived,
//   onNotificationOpened
// ) {
//   // Listen for notifications received while app is foregrounded
//   const notificationListener = Notifications.addNotificationReceivedListener(
//     (notification) => {
//       console.log("Notification received:", notification);
//       if (onNotificationReceived) {
//         onNotificationReceived(notification);
//       }
//     }
//   );

//   // Listen for notification interactions (user taps notification)
//   const responseListener =
//     Notifications.addNotificationResponseReceivedListener((response) => {
//       console.log("Notification tapped:", response);
//       if (onNotificationOpened) {
//         onNotificationOpened(response);
//       }
//     });

//   return () => {
//     notificationListener.remove();
//     responseListener.remove();
//   };
// }

// // Get current badge count
// export async function getBadgeCount() {
//   return await Notifications.getBadgeCountAsync();
// }

// // Set badge count
// export async function setBadgeCount(count) {
//   await Notifications.setBadgeCountAsync(count);
// }

// // Clear all notifications
// export async function clearAllNotifications() {
//   await Notifications.dismissAllNotificationsAsync();
//   await setBadgeCount(0);
// }

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import axios from "axios";

const BACKEND_URL = "http://192.168.43.176:3000";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(userId) {
  try {
    if (!Device.isDevice) {
      console.log("⚠️ Must use physical device");
      return null;
    }

    // Request permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    // Get Expo push token with projectId
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log("📱 Getting push token with projectId:", projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    console.log("✅ Expo Push Token:", token);

    // Register with backend
    if (userId && token) {
      try {
        console.log(`📤 Registering token for user: ${userId}`);

        const response = await axios.post(
          `${BACKEND_URL}/api/register-token`,
          {
            userId: userId,
            expoPushToken: token,
            platform: Platform.OS,
          },
          { timeout: 10000 }
        );

        console.log("✅ Token registered with backend:", response.data);
      } catch (error) {
        console.error("❌ Backend registration error:", error.message);
      }
    }

    // Configure Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#8328FA",
      });
    }

    return token;
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    return null;
  }
}

export function setupNotificationListeners(
  onNotificationReceived,
  onNotificationTapped
) {
  // Listener for notifications received while app is foregrounded
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Listener for when notification is tapped
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}
