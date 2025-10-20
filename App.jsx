// import WelcomeScreen from "./components/onboarding/WelcomeScreen";
// import OnboardingSlides from "./components/onboarding/OnboardingSlides";
// import LoginScreen from "./components/onboarding/auth/LoginScreen";
// import RegistrationScreen from "./components/onboarding/auth/RegistrationScreen";
// import { enableScreens } from "react-native-screens";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import React, { useState, useRef, useEffect } from "react";
// import { AppState, Linking, Alert } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { NavigationContainer } from "@react-navigation/native";
// import { StatusBar } from "expo-status-bar";
// import { Home, MapPin, User, Bus, Settings } from "lucide-react-native";
// import Toast from "react-native-toast-message";
// import { auth } from "./firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";
// import "./global.css";

// import HomeScreen from "./components/screens/HomeScreen";
// import LocationScreen from "./components/screens/LocationScreen";
// import ProfileScreen from "./components/screens/ProfileScreen";
// import PackageDetailsScreen from "./components/screens/PackageDetailsScreen";

// // Toast Configuration & Loading Configuration
// import toastConfig from "./config/toastConfig";
// import { LoadingProvider } from "./context/LoadingContext";
// import LoadingOverlay from "./components/LoadingOverlay";

// // Rapid Delivery's Onboarding Screens
// import Splash from "./components/onboarding/Splash";
// import { StripeProvider } from "@stripe/stripe-react-native";
// import {
//   registerForPushNotificationsAsync,
//   setupNotificationListeners,
// } from "./utils/notificationUtils";

// enableScreens();

// const Tab = createBottomTabNavigator();
// const Stack = createNativeStackNavigator();

// // Stack Options Constant
// const stackScreenOptions = {
//   headerShown: false,
//   gestureEnabled: true,
//   animation: "slide_from_right",
// };

// // Home Stack
// function HomeStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="HomeScreen" component={HomeScreen} />
//       <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
//     </Stack.Navigator>
//   );
// }

// // Location Screen Stack
// function LocationStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="LocationScreen" component={LocationScreen} />
//     </Stack.Navigator>
//   );
// }

// // Send Screen Stack
// function SendStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
//       <Stack.Screen name="LocationScreen" component={LocationScreen} />
//     </Stack.Navigator>
//   );
// }

// // Profile Screen Stack
// function ProfileStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
//     </Stack.Navigator>
//   );
// }

// function TabNavigator({ pendingPayment, onPaymentHandled }) {
//   const tabNavigatorRef = useRef();

//   // Handle pending payment navigation when TabNavigator mounts
//   useEffect(() => {
//     if (pendingPayment && tabNavigatorRef.current) {
//       console.log("TabNavigator mounted, handling pending payment navigation");

//       const handlePendingPaymentNavigation = () => {
//         try {
//           Toast.show({
//             type: "success",
//             text1: "Payment Successful!",
//             text2: "Your delivery has been confirmed.",
//             visibilityTime: 4000,
//           });

//           // Navigate to Location tab with payment details
//           tabNavigatorRef.current?.navigate("Location", {
//             screen: "LocationScreen",
//             params: {
//               sessionId: pendingPayment.sessionId,
//               paymentStatus: "completed",
//               fromPayment: true,
//               shipmentDetails: pendingPayment.shipmentDetails,
//               verifiedPayment: pendingPayment.verifiedPayment,
//             },
//           });

//           console.log("Successfully navigated to LocationScreen");

//           // Call the handler to clear the pending payment
//           onPaymentHandled();
//         } catch (navigationError) {
//           console.log("TabNavigator navigation error:", navigationError);
//           Alert.alert(
//             "Payment Successful",
//             "Your delivery has been confirmed. Please check the Location tab to track your delivery.",
//             [{ text: "OK" }]
//           );
//           onPaymentHandled();
//         }
//       };

//       // Small delay to ensure tab navigator is fully ready
//       setTimeout(handlePendingPaymentNavigation, 500);
//     }
//   }, [pendingPayment, onPaymentHandled]);

//   return (
//     <Tab.Navigator
//       ref={tabNavigatorRef}
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: "white",
//           borderTopWidth: 0,
//           elevation: 10,
//           shadowOpacity: 0.1,
//           height: 80,
//           paddingBottom: 20,
//           paddingTop: 10,
//         },
//         tabBarActiveTintColor: "#8328FA",
//         tabBarInactiveTintColor: "#9CA3AF",
//         tabBarIcon: ({ focused, color, size }) => {
//           let IconComponent;

//           if (route.name === "Home") {
//             IconComponent = Home;
//           } else if (route.name === "Send") {
//             IconComponent = Bus;
//           } else if (route.name === "Location") {
//             IconComponent = MapPin;
//           } else if (route.name === "Profile") {
//             IconComponent = User;
//           } else if (route.name === "Test") {
//             IconComponent = Settings;
//           }

//           return (
//             <IconComponent
//               size={size}
//               color={color}
//               fill={focused ? color : "none"}
//             />
//           );
//         },
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeStack} />
//       <Tab.Screen name="Send" component={SendStack} />
//       <Tab.Screen name="Location" component={LocationStack} />
//       <Tab.Screen name="Profile" component={ProfileStack} />
//     </Tab.Navigator>
//   );
// }

// export default function App() {
//   const [initializing, setInitializing] = useState(true);
//   const [user, setUser] = useState(null);
//   const [pendingPayment, setPendingPayment] = useState(null);
//   const [isCheckingPayment, setIsCheckingPayment] = useState(false);
//   const [isNavigationReady, setIsNavigationReady] = useState(false);
//   const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
//   const [isMainAppMounted, setIsMainAppMounted] = useState(false);
//   const [deepLinkHandled, setDeepLinkHandled] = useState(false);
//   const navigationRef = useRef();

//   const backendUrl = "http://192.168.43.176:3000";

//   // Setup notification listeners
//   useEffect(() => {
//     const cleanup = setupNotificationListeners(
//       // When notification is received
//       (notification) => {
//         console.log("📩 Notification received in App.js:", notification);
//       },
//       // When notification is opened
//       (response) => {
//         console.log("👆 Notification tapped in App.js:", response);
//       }
//     );

//     return cleanup;
//   }, []);

//   // Handle deep linking for payment success
//   useEffect(() => {
//     const handleDeepLink = (event) => {
//       const incomingUrl =
//         typeof event === "string"
//           ? event
//           : event && typeof event.url === "string"
//           ? event.url
//           : null;

//       if (!incomingUrl) {
//         console.warn("Deep link event missing URL:", event);
//         return;
//       }

//       console.log("Deep link received:", incomingUrl);

//       if (incomingUrl.includes("payment-success")) {
//         try {
//           const urlObj = new URL(incomingUrl);
//           const sessionId = urlObj.searchParams.get("session_id");

//           if (sessionId && !deepLinkHandled) {
//             console.log("Processing payment success deep link:", sessionId);
//             setDeepLinkHandled(true);
//             handlePaymentSuccessDeepLink(sessionId);
//           }
//         } catch (err) {
//           console.error(
//             "Invalid URL passed to deep link handler:",
//             incomingUrl,
//             err
//           );
//         }
//       }
//     };

//     const linkingSubscription = Linking.addEventListener("url", handleDeepLink);

//     Linking.getInitialURL().then((initialUrl) => {
//       if (initialUrl) {
//         console.log("App opened with initial URL:", initialUrl);
//         handleDeepLink(initialUrl);
//       }
//     });

//     return () => {
//       linkingSubscription?.remove();
//     };
//   }, [deepLinkHandled, isNavigationReady]);

//   // Handle payment success from deep link
//   const handlePaymentSuccessDeepLink = async (sessionId) => {
//     if (!sessionId) return;

//     try {
//       console.log("Verifying payment for session:", sessionId);

//       const response = await fetch(
//         `${backendUrl}/api/payment-status/${sessionId}`,
//         { timeout: 10000 }
//       );

//       if (!response.ok) {
//         console.log("Failed to verify payment status:", response.status);
//         return;
//       }

//       const statusData = await response.json();
//       console.log("Payment verification data:", statusData);

//       if (statusData.paymentStatus === "paid") {
//         const paymentData = {
//           sessionId: sessionId,
//           timestamp: Date.now(),
//           shipmentDetails: statusData.shipmentDetails,
//           totalAmount: statusData.totalAmount,
//           verifiedPayment: statusData,
//         };

//         await AsyncStorage.setItem(
//           "pendingPayment",
//           JSON.stringify(paymentData)
//         );

//         setPendingPayment(paymentData);
//         setHasProcessedPayment(true);

//         console.log("Payment success processed, pending navigation");
//       } else {
//         console.log("Payment not completed, status:", statusData.paymentStatus);
//         Alert.alert(
//           "Payment Status",
//           `Payment status: ${statusData.paymentStatus}. Please try again if needed.`
//         );
//       }
//     } catch (error) {
//       console.error("Error verifying payment from deep link:", error);
//       Alert.alert(
//         "Payment Verification Error",
//         "Unable to verify payment. Please check your connection and try again."
//       );
//     }
//   };

//   // Check for pending payment
//   const checkPendingPayment = async () => {
//     if (isCheckingPayment || hasProcessedPayment) return;

//     setIsCheckingPayment(true);
//     try {
//       const pendingPaymentData = await AsyncStorage.getItem("pendingPayment");
//       if (pendingPaymentData) {
//         const paymentData = JSON.parse(pendingPaymentData);
//         console.log("Found pending payment:", paymentData);

//         const paymentAge = Date.now() - paymentData.timestamp;
//         const maxAge = 2 * 60 * 60 * 1000; // 2 hours

//         if (paymentAge > maxAge) {
//           console.log("Payment data too old, removing...");
//           await AsyncStorage.removeItem("pendingPayment");
//           return;
//         }

//         console.log(
//           "Checking payment status for session:",
//           paymentData.sessionId
//         );

//         try {
//           const response = await fetch(
//             `${backendUrl}/api/payment-status/${paymentData.sessionId}`,
//             {
//               timeout: 10000,
//             }
//           );

//           if (!response.ok) {
//             console.log("Failed to check payment status:", response.status);
//             return;
//           }

//           const statusData = await response.json();
//           console.log("Payment status data:", statusData);

//           if (statusData.paymentStatus === "paid") {
//             console.log("Payment confirmed as paid, setting pending payment");
//             setPendingPayment({
//               ...paymentData,
//               verifiedPayment: statusData,
//             });
//             setHasProcessedPayment(true);
//             await AsyncStorage.removeItem("pendingPayment");
//           } else {
//             console.log(
//               "Payment not completed, status:",
//               statusData.paymentStatus
//             );
//           }
//         } catch (fetchError) {
//           console.log("Network error checking payment status:", fetchError);
//         }
//       }
//     } catch (error) {
//       console.log("Error checking pending payment:", error);
//     } finally {
//       setIsCheckingPayment(false);
//     }
//   };

//   // Check on app start and when app becomes active
//   useEffect(() => {
//     if (!deepLinkHandled) {
//       checkPendingPayment();
//     }

//     const handleAppStateChange = (nextAppState) => {
//       if (
//         nextAppState === "active" &&
//         !hasProcessedPayment &&
//         !deepLinkHandled
//       ) {
//         console.log("App became active, checking for pending payments...");
//         setTimeout(() => {
//           checkPendingPayment();
//         }, 1000);
//       }
//     };

//     const subscription = AppState.addEventListener(
//       "change",
//       handleAppStateChange
//     );
//     return () => subscription?.remove();
//   }, [hasProcessedPayment, deepLinkHandled]);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       setUser(firebaseUser);

//       // Register for push notifications when user logs in
//       if (firebaseUser) {
//         console.log("🔐 User logged in:", firebaseUser.uid);

//         // Add a small delay to ensure backend is ready
//         setTimeout(async () => {
//           console.log("📱 Registering for notifications...");
//           const token = await registerForPushNotificationsAsync(
//             firebaseUser.uid
//           );
//           if (token) {
//             console.log("✅ Push notifications registered successfully");
//           } else {
//             console.log("❌ Failed to register push notifications");
//           }
//         }, 1000);
//       }

//       setInitializing(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Clean up old payment data on app start
//   useEffect(() => {
//     const cleanupOldPaymentData = async () => {
//       try {
//         const keys = await AsyncStorage.getAllKeys();
//         const paymentKeys = keys.filter(
//           (key) => key.includes("Payment") || key.startsWith("recentDelivery_")
//         );

//         for (const key of paymentKeys) {
//           const data = await AsyncStorage.getItem(key);
//           if (data) {
//             try {
//               const paymentData = JSON.parse(data);
//               if (paymentData.timestamp) {
//                 const age = Date.now() - paymentData.timestamp;
//                 const maxAge = key.includes("pendingPayment")
//                   ? 2 * 60 * 60 * 1000
//                   : 24 * 60 * 60 * 1000;

//                 if (age > maxAge) {
//                   console.log("Removing old payment/delivery data:", key);
//                   await AsyncStorage.removeItem(key);
//                 }
//               }
//             } catch (parseError) {
//               console.log("Removing invalid data:", key);
//               await AsyncStorage.removeItem(key);
//             }
//           }
//         }
//       } catch (error) {
//         console.log("Error cleaning up old payment data:", error);
//       }
//     };

//     cleanupOldPaymentData();
//   }, []);

//   const handleNavigationReady = () => {
//     console.log("Navigation is ready");
//     setIsNavigationReady(true);
//   };

//   const handleNavigationStateChange = (state) => {
//     if (state?.routes?.[state.index]?.name === "MainApp") {
//       setIsMainAppMounted(true);
//       console.log("MainApp is now mounted");
//     }
//   };

//   const handlePaymentProcessed = () => {
//     console.log("Payment processed, clearing pending payment");
//     setPendingPayment(null);
//     setDeepLinkHandled(false);
//   };

//   if (initializing) return null;

//   return (
//     <StripeProvider
//       publishableKey={
//         process.env.STRIPE_PUBLISHABLE_KEY || "your_stripe_publishable_key"
//       }
//       merchantIdentifier="merchant.com.rapiddelivery"
//     >
//       <LoadingProvider>
//         <NavigationContainer
//           ref={navigationRef}
//           onReady={handleNavigationReady}
//           onStateChange={handleNavigationStateChange}
//           fallback={null}
//           linking={{
//             prefixes: [
//               "rapiddelivery://",
//               "https://192.168.43.176:3000",
//               "http://192.168.43.176:3000",
//             ],
//             config: {
//               screens: {
//                 MainApp: {
//                   screens: {
//                     Location: {
//                       screens: {
//                         LocationScreen: "payment-success",
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           }}
//         >
//           <StatusBar style="light" />
//           <Stack.Navigator
//             screenOptions={{ headerShown: false }}
//             initialRouteName="Splash"
//           >
//             <Stack.Screen name="Splash" component={Splash} />
//             <Stack.Screen name="Welcome" component={WelcomeScreen} />
//             <Stack.Screen name="Onboarding" component={OnboardingSlides} />
//             <Stack.Screen name="Register" component={RegistrationScreen} />
//             <Stack.Screen name="Login" component={LoginScreen} />
//             <Stack.Screen name="MainApp">
//               {(props) => (
//                 <TabNavigator
//                   {...props}
//                   pendingPayment={pendingPayment}
//                   onPaymentHandled={handlePaymentProcessed}
//                 />
//               )}
//             </Stack.Screen>
//           </Stack.Navigator>
//         </NavigationContainer>
//         <LoadingOverlay />
//         <Toast
//           config={toastConfig}
//           position="top"
//           autoHide
//           visibilityTime={4000}
//           topOffset={60}
//           bottomOffset={60}
//           swipeable={true}
//         />
//       </LoadingProvider>
//     </StripeProvider>
//   );
// }

///////////////////expo notification////////////////

// import WelcomeScreen from "./components/onboarding/WelcomeScreen";
// import OnboardingSlides from "./components/onboarding/OnboardingSlides";
// import LoginScreen from "./components/onboarding/auth/LoginScreen";
// import RegistrationScreen from "./components/onboarding/auth/RegistrationScreen";
// import { enableScreens } from "react-native-screens";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import React, { useState, useRef, useEffect } from "react";
// import { AppState, Linking, Alert } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { NavigationContainer } from "@react-navigation/native";
// import { StatusBar } from "expo-status-bar";
// import { Home, MapPin, User, Bus, Settings } from "lucide-react-native";
// import Toast from "react-native-toast-message";
// import { auth } from "./firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import { Platform } from "react-native";
// import "./global.css";

// import HomeScreen from "./components/screens/HomeScreen";
// import LocationScreen from "./components/screens/LocationScreen";
// import ProfileScreen from "./components/screens/ProfileScreen";
// import PackageDetailsScreen from "./components/screens/PackageDetailsScreen";

// // Toast Configuration & Loading Configuration
// import toastConfig from "./config/toastConfig";
// import { LoadingProvider } from "./context/LoadingContext";
// import LoadingOverlay from "./components/LoadingOverlay";

// // Rapid Delivery's Onboarding Screens
// import Splash from "./components/onboarding/Splash";
// import { StripeProvider } from "@stripe/stripe-react-native";
// import {
//   initializeOneSignal,
//   registerForPushNotificationsAsync,
//   setupNotificationListeners,
// } from "./utils/notificationUtils";

// enableScreens();

// const Tab = createBottomTabNavigator();
// const Stack = createNativeStackNavigator();

// // Stack Options Constant
// const stackScreenOptions = {
//   headerShown: false,
//   gestureEnabled: true,
//   animation: "slide_from_right",
// };

// // Home Stack
// function HomeStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="HomeScreen" component={HomeScreen} />
//       <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
//     </Stack.Navigator>
//   );
// }

// // Location Screen Stack
// function LocationStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="LocationScreen" component={LocationScreen} />
//     </Stack.Navigator>
//   );
// }

// // Send Screen Stack
// function SendStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
//       <Stack.Screen name="LocationScreen" component={LocationScreen} />
//     </Stack.Navigator>
//   );
// }

// // Profile Screen Stack
// function ProfileStack() {
//   return (
//     <Stack.Navigator screenOptions={stackScreenOptions}>
//       <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
//     </Stack.Navigator>
//   );
// }

// function TabNavigator({ pendingPayment, onPaymentHandled }) {
//   const tabNavigatorRef = useRef();

//   // Handle pending payment navigation when TabNavigator mounts
//   useEffect(() => {
//     if (pendingPayment && tabNavigatorRef.current) {
//       console.log("TabNavigator mounted, handling pending payment navigation");

//       const handlePendingPaymentNavigation = () => {
//         try {
//           Toast.show({
//             type: "success",
//             text1: "Payment Successful!",
//             text2: "Your delivery has been confirmed.",
//             visibilityTime: 4000,
//           });

//           // Navigate to Location tab with payment details
//           tabNavigatorRef.current?.navigate("Location", {
//             screen: "LocationScreen",
//             params: {
//               sessionId: pendingPayment.sessionId,
//               paymentStatus: "completed",
//               fromPayment: true,
//               shipmentDetails: pendingPayment.shipmentDetails,
//               verifiedPayment: pendingPayment.verifiedPayment,
//             },
//           });

//           console.log("Successfully navigated to LocationScreen");

//           // Call the handler to clear the pending payment
//           onPaymentHandled();
//         } catch (navigationError) {
//           console.log("TabNavigator navigation error:", navigationError);
//           Alert.alert(
//             "Payment Successful",
//             "Your delivery has been confirmed. Please check the Location tab to track your delivery.",
//             [{ text: "OK" }]
//           );
//           onPaymentHandled();
//         }
//       };

//       // Small delay to ensure tab navigator is fully ready
//       setTimeout(handlePendingPaymentNavigation, 500);
//     }
//   }, [pendingPayment, onPaymentHandled]);

//   return (
//     <Tab.Navigator
//       ref={tabNavigatorRef}
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: "white",
//           borderTopWidth: 0,
//           elevation: 10,
//           shadowOpacity: 0.1,
//           height: 80,
//           paddingBottom: 20,
//           paddingTop: 10,
//         },
//         tabBarActiveTintColor: "#8328FA",
//         tabBarInactiveTintColor: "#9CA3AF",
//         tabBarIcon: ({ focused, color, size }) => {
//           let IconComponent;

//           if (route.name === "Home") {
//             IconComponent = Home;
//           } else if (route.name === "Send") {
//             IconComponent = Bus;
//           } else if (route.name === "Location") {
//             IconComponent = MapPin;
//           } else if (route.name === "Profile") {
//             IconComponent = User;
//           } else if (route.name === "Test") {
//             IconComponent = Settings;
//           }

//           return (
//             <IconComponent
//               size={size}
//               color={color}
//               fill={focused ? color : "none"}
//             />
//           );
//         },
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeStack} />
//       <Tab.Screen name="Send" component={SendStack} />
//       <Tab.Screen name="Location" component={LocationStack} />
//       <Tab.Screen name="Profile" component={ProfileStack} />
//     </Tab.Navigator>
//   );
// }

// export default function App() {
//   const [initializing, setInitializing] = useState(true);
//   const [user, setUser] = useState(null);
//   const [pendingPayment, setPendingPayment] = useState(null);
//   const [isCheckingPayment, setIsCheckingPayment] = useState(false);
//   const [isNavigationReady, setIsNavigationReady] = useState(false);
//   const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
//   const [isMainAppMounted, setIsMainAppMounted] = useState(false);
//   const [deepLinkHandled, setDeepLinkHandled] = useState(false);
//   const navigationRef = useRef();

//   // ✅ UPDATED: Change to your new Vercel URL
//   const backendUrl = "https://rapid-fullstack.vercel.app";

//   // Setup notification listeners
//   useEffect(() => {
//     const cleanup = setupNotificationListeners(
//       // When notification is received
//       (notification) => {
//         console.log("📩 Notification received in App.js:", notification);
//       },
//       // When notification is opened
//       (response) => {
//         console.log("👆 Notification tapped in App.js:", response);
//       }
//     );

//     return cleanup;
//   }, []);

//   // Handle deep linking for payment success
//   useEffect(() => {
//     const handleDeepLink = (event) => {
//       const incomingUrl =
//         typeof event === "string"
//           ? event
//           : event && typeof event.url === "string"
//           ? event.url
//           : null;

//       if (!incomingUrl) {
//         console.warn("Deep link event missing URL:", event);
//         return;
//       }

//       console.log("Deep link received:", incomingUrl);

//       if (incomingUrl.includes("payment-success")) {
//         try {
//           const urlObj = new URL(incomingUrl);
//           const sessionId = urlObj.searchParams.get("session_id");

//           if (sessionId && !deepLinkHandled) {
//             console.log("Processing payment success deep link:", sessionId);
//             setDeepLinkHandled(true);
//             handlePaymentSuccessDeepLink(sessionId);
//           }
//         } catch (err) {
//           console.error(
//             "Invalid URL passed to deep link handler:",
//             incomingUrl,
//             err
//           );
//         }
//       }
//     };

//     const linkingSubscription = Linking.addEventListener("url", handleDeepLink);

//     Linking.getInitialURL().then((initialUrl) => {
//       if (initialUrl) {
//         console.log("App opened with initial URL:", initialUrl);
//         handleDeepLink(initialUrl);
//       }
//     });

//     return () => {
//       linkingSubscription?.remove();
//     };
//   }, [deepLinkHandled, isNavigationReady]);

//   // Handle payment success from deep link
//   const handlePaymentSuccessDeepLink = async (sessionId) => {
//     if (!sessionId) return;

//     try {
//       console.log("Verifying payment for session:", sessionId);

//       const response = await fetch(
//         `${backendUrl}/api/payment-status/${sessionId}`,
//         { timeout: 10000 }
//       );

//       if (!response.ok) {
//         console.log("Failed to verify payment status:", response.status);
//         return;
//       }

//       const statusData = await response.json();
//       console.log("Payment verification data:", statusData);

//       if (statusData.paymentStatus === "paid") {
//         const paymentData = {
//           sessionId: sessionId,
//           timestamp: Date.now(),
//           shipmentDetails: statusData.shipmentDetails,
//           totalAmount: statusData.totalAmount,
//           verifiedPayment: statusData,
//         };

//         await AsyncStorage.setItem(
//           "pendingPayment",
//           JSON.stringify(paymentData)
//         );

//         setPendingPayment(paymentData);
//         setHasProcessedPayment(true);

//         console.log("Payment success processed, pending navigation");
//       } else {
//         console.log("Payment not completed, status:", statusData.paymentStatus);
//         Alert.alert(
//           "Payment Status",
//           `Payment status: ${statusData.paymentStatus}. Please try again if needed.`
//         );
//       }
//     } catch (error) {
//       console.error("Error verifying payment from deep link:", error);
//       Alert.alert(
//         "Payment Verification Error",
//         "Unable to verify payment. Please check your connection and try again."
//       );
//     }
//   };

//   // Check for pending payment
//   const checkPendingPayment = async () => {
//     if (isCheckingPayment || hasProcessedPayment) return;

//     setIsCheckingPayment(true);
//     try {
//       const pendingPaymentData = await AsyncStorage.getItem("pendingPayment");
//       if (pendingPaymentData) {
//         const paymentData = JSON.parse(pendingPaymentData);
//         console.log("Found pending payment:", paymentData);

//         const paymentAge = Date.now() - paymentData.timestamp;
//         const maxAge = 2 * 60 * 60 * 1000; // 2 hours

//         if (paymentAge > maxAge) {
//           console.log("Payment data too old, removing...");
//           await AsyncStorage.removeItem("pendingPayment");
//           return;
//         }

//         console.log(
//           "Checking payment status for session:",
//           paymentData.sessionId
//         );

//         try {
//           const response = await fetch(
//             `${backendUrl}/api/payment-status/${paymentData.sessionId}`,
//             {
//               timeout: 10000,
//             }
//           );

//           if (!response.ok) {
//             console.log("Failed to check payment status:", response.status);
//             return;
//           }

//           const statusData = await response.json();
//           console.log("Payment status data:", statusData);

//           if (statusData.paymentStatus === "paid") {
//             console.log("Payment confirmed as paid, setting pending payment");
//             setPendingPayment({
//               ...paymentData,
//               verifiedPayment: statusData,
//             });
//             setHasProcessedPayment(true);
//             await AsyncStorage.removeItem("pendingPayment");
//           } else {
//             console.log(
//               "Payment not completed, status:",
//               statusData.paymentStatus
//             );
//           }
//         } catch (fetchError) {
//           console.log("Network error checking payment status:", fetchError);
//         }
//       }
//     } catch (error) {
//       console.log("Error checking pending payment:", error);
//     } finally {
//       setIsCheckingPayment(false);
//     }
//   };

//   // Check on app start and when app becomes active
//   useEffect(() => {
//     if (!deepLinkHandled) {
//       checkPendingPayment();
//     }

//     const handleAppStateChange = (nextAppState) => {
//       if (
//         nextAppState === "active" &&
//         !hasProcessedPayment &&
//         !deepLinkHandled
//       ) {
//         console.log("App became active, checking for pending payments...");
//         setTimeout(() => {
//           checkPendingPayment();
//         }, 1000);
//       }
//     };

//     const subscription = AppState.addEventListener(
//       "change",
//       handleAppStateChange
//     );
//     return () => subscription?.remove();
//   }, [hasProcessedPayment, deepLinkHandled]);
//   useEffect(() => {
//     // Initialize OneSignal FIRST
//     initializeOneSignal();

//     // Then setup listeners
//     const cleanup = setupNotificationListeners(
//       (notification) => {
//         console.log("📩 Notification received:", notification);
//       },
//       (response) => {
//         console.log("👆 Notification tapped:", response);
//       }
//     );

//     return cleanup;
//   }, []);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//       setUser(firebaseUser);

//       // Register for push notifications when user logs in
//       if (firebaseUser) {
//         console.log("🔐 User logged in:", firebaseUser.uid);

//         // Add a small delay to ensure backend is ready
//         setTimeout(async () => {
//           console.log("📱 Registering for notifications...");
//           const token = await registerForPushNotificationsAsync(
//             firebaseUser.uid
//           );
//           if (token) {
//             console.log("✅ Push notifications registered successfully");
//           } else {
//             console.log("❌ Failed to register push notifications");
//           }
//         }, 1000);
//       }

//       setInitializing(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Clean up old payment data on app start
//   useEffect(() => {
//     const cleanupOldPaymentData = async () => {
//       try {
//         const keys = await AsyncStorage.getAllKeys();
//         const paymentKeys = keys.filter(
//           (key) => key.includes("Payment") || key.startsWith("recentDelivery_")
//         );

//         for (const key of paymentKeys) {
//           const data = await AsyncStorage.getItem(key);
//           if (data) {
//             try {
//               const paymentData = JSON.parse(data);
//               if (paymentData.timestamp) {
//                 const age = Date.now() - paymentData.timestamp;
//                 const maxAge = key.includes("pendingPayment")
//                   ? 2 * 60 * 60 * 1000
//                   : 24 * 60 * 60 * 1000;

//                 if (age > maxAge) {
//                   console.log("Removing old payment/delivery data:", key);
//                   await AsyncStorage.removeItem(key);
//                 }
//               }
//             } catch (parseError) {
//               console.log("Removing invalid data:", key);
//               await AsyncStorage.removeItem(key);
//             }
//           }
//         }
//       } catch (error) {
//         console.log("Error cleaning up old payment data:", error);
//       }
//     };

//     cleanupOldPaymentData();
//   }, []);

//   const handleNavigationReady = () => {
//     console.log("Navigation is ready");
//     setIsNavigationReady(true);
//   };

//   const handleNavigationStateChange = (state) => {
//     if (state?.routes?.[state.index]?.name === "MainApp") {
//       setIsMainAppMounted(true);
//       console.log("MainApp is now mounted");
//     }
//   };

//   const handlePaymentProcessed = () => {
//     console.log("Payment processed, clearing pending payment");
//     setPendingPayment(null);
//     setDeepLinkHandled(false);
//   };

//   if (initializing) return null;

//   return (
//     <StripeProvider
//       publishableKey={
//         process.env.STRIPE_PUBLISHABLE_KEY || "your_stripe_publishable_key"
//       }
//       merchantIdentifier="merchant.com.rapiddelivery"
//     >
//       <LoadingProvider>
//         <NavigationContainer
//           ref={navigationRef}
//           onReady={handleNavigationReady}
//           onStateChange={handleNavigationStateChange}
//           fallback={null}
//           linking={{
//             prefixes: [
//               "rapiddelivery://",
//               "https://rapid-fullstack.vercel.app",
//             ],
//             config: {
//               screens: {
//                 MainApp: {
//                   screens: {
//                     Location: {
//                       screens: {
//                         LocationScreen: "payment-success",
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           }}
//         >
//           <StatusBar style="light" />
//           <Stack.Navigator
//             screenOptions={{ headerShown: false }}
//             initialRouteName="Splash"
//           >
//             <Stack.Screen name="Splash" component={Splash} />
//             <Stack.Screen name="Welcome" component={WelcomeScreen} />
//             <Stack.Screen name="Onboarding" component={OnboardingSlides} />
//             <Stack.Screen name="Register" component={RegistrationScreen} />
//             <Stack.Screen name="Login" component={LoginScreen} />
//             <Stack.Screen name="MainApp">
//               {(props) => (
//                 <TabNavigator
//                   {...props}
//                   pendingPayment={pendingPayment}
//                   onPaymentHandled={handlePaymentProcessed}
//                 />
//               )}
//             </Stack.Screen>
//           </Stack.Navigator>
//         </NavigationContainer>
//         <LoadingOverlay />
//         <Toast
//           config={toastConfig}
//           position="top"
//           autoHide
//           visibilityTime={4000}
//           topOffset={60}
//           bottomOffset={60}
//           swipeable={true}
//         />
//       </LoadingProvider>
//     </StripeProvider>
//   );
// }

import WelcomeScreen from "./components/onboarding/WelcomeScreen";
import OnboardingSlides from "./components/onboarding/OnboardingSlides";
import LoginScreen from "./components/onboarding/auth/LoginScreen";
import RegistrationScreen from "./components/onboarding/auth/RegistrationScreen";
import { enableScreens } from "react-native-screens";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState, useRef, useEffect } from "react";
import { AppState, Linking, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Home, MapPin, User, Bus } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import "./global.css";

import HomeScreen from "./components/screens/HomeScreen";
import LocationScreen from "./components/screens/LocationScreen";
import ProfileScreen from "./components/screens/ProfileScreen";
import PackageDetailsScreen from "./components/screens/PackageDetailsScreen";

// Toast Configuration & Loading Configuration
import toastConfig from "./config/toastConfig";
import { LoadingProvider } from "./context/LoadingContext";
import LoadingOverlay from "./components/LoadingOverlay";

// Onboarding Screens
import Splash from "./components/onboarding/Splash";
import { StripeProvider } from "@stripe/stripe-react-native";

// ✅ CORRECTED: OneSignal imports with correct syntax
import {
  initializeOneSignal,
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "./utils/notificationUtils";

enableScreens();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack Options Constant
const stackScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  animation: "slide_from_right",
};

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
    </Stack.Navigator>
  );
}

// Location Screen Stack
function LocationStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="LocationScreen" component={LocationScreen} />
    </Stack.Navigator>
  );
}

// Send Screen Stack
function SendStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
      <Stack.Screen name="LocationScreen" component={LocationScreen} />
    </Stack.Navigator>
  );
}

// Profile Screen Stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator({ pendingPayment, onPaymentHandled }) {
  const tabNavigatorRef = useRef();

  // Handle pending payment navigation when TabNavigator mounts
  useEffect(() => {
    if (pendingPayment && tabNavigatorRef.current) {
      console.log("TabNavigator mounted, handling pending payment navigation");

      const handlePendingPaymentNavigation = () => {
        try {
          Toast.show({
            type: "success",
            text1: "Payment Successful!",
            text2: "Your delivery has been confirmed.",
            visibilityTime: 4000,
          });

          // Navigate to Location tab with payment details
          tabNavigatorRef.current?.navigate("Location", {
            screen: "LocationScreen",
            params: {
              sessionId: pendingPayment.sessionId,
              paymentStatus: "completed",
              fromPayment: true,
              shipmentDetails: pendingPayment.shipmentDetails,
              verifiedPayment: pendingPayment.verifiedPayment,
            },
          });

          console.log("Successfully navigated to LocationScreen");

          // Call the handler to clear the pending payment
          onPaymentHandled();
        } catch (navigationError) {
          console.log("TabNavigator navigation error:", navigationError);
          Alert.alert(
            "Payment Successful",
            "Your delivery has been confirmed. Please check the Location tab to track your delivery.",
            [{ text: "OK" }]
          );
          onPaymentHandled();
        }
      };

      // Small delay to ensure tab navigator is fully ready
      setTimeout(handlePendingPaymentNavigation, 500);
    }
  }, [pendingPayment, onPaymentHandled]);

  return (
    <Tab.Navigator
      ref={tabNavigatorRef}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#8328FA",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === "Home") {
            IconComponent = Home;
          } else if (route.name === "Send") {
            IconComponent = Bus;
          } else if (route.name === "Location") {
            IconComponent = MapPin;
          } else if (route.name === "Profile") {
            IconComponent = User;
          }

          return (
            <IconComponent
              size={size}
              color={color}
              fill={focused ? color : "none"}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Send" component={SendStack} />
      <Tab.Screen name="Location" component={LocationStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
  const [isMainAppMounted, setIsMainAppMounted] = useState(false);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const navigationRef = useRef();

  const backendUrl = "https://rapid-fullstack.onrender.com";

  // ✅ STEP 1: Initialize OneSignal ONCE when app starts (BEFORE Firebase)
  useEffect(() => {
    console.log("🚀 App starting, initializing OneSignal...");

    try {
      const initialized = initializeOneSignal();

      if (initialized) {
        console.log("✅ OneSignal initialized successfully");
      } else {
        console.log(
          "⚠️ OneSignal initialization returned false - check app.json configuration"
        );
      }

      // Setup notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log("📩 Notification received in foreground:", notification);
        },
        (response) => {
          console.log("👆 Notification tapped by user:", response);
        }
      );

      return cleanup;
    } catch (error) {
      console.error("❌ Error during OneSignal setup:", error);
      return () => {};
    }
  }, []);

  // Handle deep linking for payment success
  useEffect(() => {
    const handleDeepLink = (event) => {
      const incomingUrl =
        typeof event === "string"
          ? event
          : event && typeof event.url === "string"
          ? event.url
          : null;

      if (!incomingUrl) {
        console.warn("Deep link event missing URL:", event);
        return;
      }

      console.log("Deep link received:", incomingUrl);

      if (incomingUrl.includes("payment-success")) {
        try {
          const urlObj = new URL(incomingUrl);
          const sessionId = urlObj.searchParams.get("session_id");

          if (sessionId && !deepLinkHandled) {
            console.log("Processing payment success deep link:", sessionId);
            setDeepLinkHandled(true);
            handlePaymentSuccessDeepLink(sessionId);
          }
        } catch (err) {
          console.error(
            "Invalid URL passed to deep link handler:",
            incomingUrl,
            err
          );
        }
      }
    };

    const linkingSubscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        console.log("App opened with initial URL:", initialUrl);
        handleDeepLink(initialUrl);
      }
    });

    return () => {
      linkingSubscription?.remove();
    };
  }, [deepLinkHandled, isNavigationReady]);

  // Handle payment success from deep link
  const handlePaymentSuccessDeepLink = async (sessionId) => {
    if (!sessionId) return;

    try {
      console.log("Verifying payment for session:", sessionId);

      const response = await fetch(
        `${backendUrl}/api/payment-status/${sessionId}`,
        { timeout: 10000 }
      );

      if (!response.ok) {
        console.log("Failed to verify payment status:", response.status);
        return;
      }

      const statusData = await response.json();
      console.log("Payment verification data:", statusData);

      if (statusData.paymentStatus === "paid") {
        const paymentData = {
          sessionId: sessionId,
          timestamp: Date.now(),
          shipmentDetails: statusData.shipmentDetails,
          totalAmount: statusData.totalAmount,
          verifiedPayment: statusData,
        };

        await AsyncStorage.setItem(
          "pendingPayment",
          JSON.stringify(paymentData)
        );

        setPendingPayment(paymentData);
        setHasProcessedPayment(true);

        console.log("Payment success processed, pending navigation");
      } else {
        console.log("Payment not completed, status:", statusData.paymentStatus);
        Alert.alert(
          "Payment Status",
          `Payment status: ${statusData.paymentStatus}. Please try again if needed.`
        );
      }
    } catch (error) {
      console.error("Error verifying payment from deep link:", error);
      Alert.alert(
        "Payment Verification Error",
        "Unable to verify payment. Please check your connection and try again."
      );
    }
  };

  // Check for pending payment
  const checkPendingPayment = async () => {
    if (isCheckingPayment || hasProcessedPayment) return;

    setIsCheckingPayment(true);
    try {
      const pendingPaymentData = await AsyncStorage.getItem("pendingPayment");
      if (pendingPaymentData) {
        const paymentData = JSON.parse(pendingPaymentData);
        console.log("Found pending payment:", paymentData);

        const paymentAge = Date.now() - paymentData.timestamp;
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours

        if (paymentAge > maxAge) {
          console.log("Payment data too old, removing...");
          await AsyncStorage.removeItem("pendingPayment");
          return;
        }

        console.log(
          "Checking payment status for session:",
          paymentData.sessionId
        );

        try {
          const response = await fetch(
            `${backendUrl}/api/payment-status/${paymentData.sessionId}`,
            {
              timeout: 10000,
            }
          );

          if (!response.ok) {
            console.log("Failed to check payment status:", response.status);
            return;
          }

          const statusData = await response.json();
          console.log("Payment status data:", statusData);

          if (statusData.paymentStatus === "paid") {
            console.log("Payment confirmed as paid, setting pending payment");
            setPendingPayment({
              ...paymentData,
              verifiedPayment: statusData,
            });
            setHasProcessedPayment(true);
            await AsyncStorage.removeItem("pendingPayment");
          } else {
            console.log(
              "Payment not completed, status:",
              statusData.paymentStatus
            );
          }
        } catch (fetchError) {
          console.log("Network error checking payment status:", fetchError);
        }
      }
    } catch (error) {
      console.log("Error checking pending payment:", error);
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Check on app start and when app becomes active
  useEffect(() => {
    if (!deepLinkHandled) {
      checkPendingPayment();
    }

    const handleAppStateChange = (nextAppState) => {
      if (
        nextAppState === "active" &&
        !hasProcessedPayment &&
        !deepLinkHandled
      ) {
        console.log("App became active, checking for pending payments...");
        setTimeout(() => {
          checkPendingPayment();
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [hasProcessedPayment, deepLinkHandled]);

  // ✅ STEP 2: Handle user authentication and register for notifications
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Register for push notifications when user logs in
      if (firebaseUser) {
        console.log("🔐 User logged in:", firebaseUser.uid);

        // Add delay to ensure OneSignal is fully ready
        setTimeout(async () => {
          console.log("📱 Registering user for push notifications...");

          try {
            const userId = await registerForPushNotificationsAsync(
              firebaseUser.uid,
              {
                email: firebaseUser.email,
              }
            );

            if (userId) {
              console.log("✅ Push notifications registered successfully");
              console.log("✅ OneSignal User ID:", userId);
            } else {
              console.log("❌ Failed to register push notifications");
            }
          } catch (error) {
            console.error(
              "Error during push notification registration:",
              error
            );
          }
        }, 2000); // Delay for OneSignal to be ready
      }

      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // Clean up old payment data on app start
  useEffect(() => {
    const cleanupOldPaymentData = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const paymentKeys = keys.filter(
          (key) => key.includes("Payment") || key.startsWith("recentDelivery_")
        );

        for (const key of paymentKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            try {
              const paymentData = JSON.parse(data);
              if (paymentData.timestamp) {
                const age = Date.now() - paymentData.timestamp;
                const maxAge = key.includes("pendingPayment")
                  ? 2 * 60 * 60 * 1000
                  : 24 * 60 * 60 * 1000;

                if (age > maxAge) {
                  console.log("Removing old payment/delivery data:", key);
                  await AsyncStorage.removeItem(key);
                }
              }
            } catch (parseError) {
              console.log("Removing invalid data:", key);
              await AsyncStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.log("Error cleaning up old payment data:", error);
      }
    };

    cleanupOldPaymentData();
  }, []);

  const handleNavigationReady = () => {
    console.log("Navigation is ready");
    setIsNavigationReady(true);
  };

  const handleNavigationStateChange = (state) => {
    if (state?.routes?.[state.index]?.name === "MainApp") {
      setIsMainAppMounted(true);
      console.log("MainApp is now mounted");
    }
  };

  const handlePaymentProcessed = () => {
    console.log("Payment processed, clearing pending payment");
    setPendingPayment(null);
    setDeepLinkHandled(false);
  };

  if (initializing) return null;

  return (
    <StripeProvider
      publishableKey={
        process.env.STRIPE_PUBLISHABLE_KEY || "your_stripe_publishable_key"
      }
      merchantIdentifier="merchant.com.rapiddelivery"
    >
      <LoadingProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={handleNavigationReady}
          onStateChange={handleNavigationStateChange}
          fallback={null}
          linking={{
            prefixes: [
              "rapiddelivery://",
              "https://rapid-fullstack.onrender.com",
            ],
            config: {
              screens: {
                MainApp: {
                  screens: {
                    Location: {
                      screens: {
                        LocationScreen: "payment-success",
                      },
                    },
                  },
                },
              },
            },
          }}
        >
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Splash"
          >
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingSlides} />
            <Stack.Screen name="Register" component={RegistrationScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainApp">
              {(props) => (
                <TabNavigator
                  {...props}
                  pendingPayment={pendingPayment}
                  onPaymentHandled={handlePaymentProcessed}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
        <LoadingOverlay />
        <Toast
          config={toastConfig}
          position="top"
          autoHide
          visibilityTime={4000}
          topOffset={60}
          bottomOffset={60}
          swipeable={true}
        />
      </LoadingProvider>
    </StripeProvider>
  );
}
