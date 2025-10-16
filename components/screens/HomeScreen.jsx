// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   ActivityIndicator,
//   RefreshControl,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Search, Bell, ScanLine } from "lucide-react-native";
// import { fetchRecentShipments } from "../../utils/deliveryUtils";
// import { subscribeToProfileUpdates } from "../../utils/userProfileUtils";
// import { registerForPushNotificationsAsync } from "../../utils/notificationUtils";
// import * as Notifications from "expo-notifications";
// export default function HomeScreen({ navigation }) {
//   // Initializing User Data
//   const [userProfile, setUserProfile] = useState({
//     firstName: "",
//     photoURL: null,
//   });

//   // Shipments state
//   const [recentShipments, setRecentShipments] = useState([]);
//   const [isLoadingShipments, setIsLoadingShipments] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);

//   // When a notification comes in, increment it
//   Notifications.addNotificationReceivedListener(() => {
//     setUnreadCount((prev) => prev + 1);
//   });
//   useEffect(() => {
//     const unsubscribe = navigation.addListener("focus", async () => {
//       await Notifications.setBadgeCountAsync(0); // clear badge
//       setUnreadCount(0);
//     });
//     return unsubscribe;
//   }, [navigation]);

//   useEffect(() => {
//     registerForPushNotificationsAsync();

//     const subscription = Notifications.addNotificationReceivedListener(
//       (notification) => {
//         console.log("New notification:", notification);
//         // You can increase badge count here
//         Notifications.getBadgeCountAsync().then((count) => {
//           Notifications.setBadgeCountAsync(count + 1);
//         });
//       }
//     );

//     return () => subscription.remove();
//   }, []);

//   // Grabbing User information
//   useEffect(() => {
//     const unsubscribe = subscribeToProfileUpdates((profile) => {
//       if (profile) {
//         setUserProfile({
//           firstName: profile.firstName,
//           photoURL: profile.photoURL,
//         });
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   // Load recent shipments
//   const loadShipments = async () => {
//     try {
//       setIsLoadingShipments(true);
//       const shipments = await fetchRecentShipments(5); // Get last 5 shipments
//       setRecentShipments(shipments);
//     } catch (error) {
//       console.error("Error loading shipments:", error);
//     } finally {
//       setIsLoadingShipments(false);
//     }
//   };

//   // Initial load
//   useEffect(() => {
//     loadShipments();
//   }, []);

//   // Pull to refresh
//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadShipments();
//     setRefreshing(false);
//   };

//   // Format shipment ID for display
//   const formatShipmentId = (id) => {
//     return id ? `#${id.slice(-8).toUpperCase()}` : "#N/A";
//   };

//   // Get status color and background
//   const getStatusStyle = (status) => {
//     switch (status?.toLowerCase()) {
//       case "delivered":
//       case "completed":
//         return {
//           bg: "bg-green-100",
//           text: "text-green-600",
//           label: "Delivered",
//         };
//       case "pending":
//       case "in_transit":
//         return {
//           bg: "bg-yellow-100",
//           text: "text-yellow-600",
//           label: "Pending",
//         };
//       case "failed":
//       case "cancelled":
//         return {
//           bg: "bg-red-100",
//           text: "text-red-600",
//           label: "Failed",
//         };
//       default:
//         return {
//           bg: "bg-gray-100",
//           text: "text-gray-600",
//           label: "Unknown",
//         };
//     }
//   };

//   // Format item description
//   const formatDescription = (shipment) => {
//     if (shipment.itemType) {
//       return `${shipment.itemType} - ${shipment.weight || "N/A"}`;
//     }
//     return "Package delivery";
//   };

//   return (
//     <View className="flex-1 bg-[#8328FA]">
//       <SafeAreaView>
//         <View className="flex-row items-center justify-between px-6">
//           <View className="flex-row items-center">
//             <Image
//               source={
//                 userProfile.photoURL
//                   ? { uri: userProfile.photoURL }
//                   : require("../../assets/images/avatar.png")
//               }
//               className="w-14 h-14 rounded-full mr-3"
//             />
//             <Text className="text-white text-lg font-medium">
//               Welcome, {userProfile.firstName}!
//             </Text>
//           </View>
//           <TouchableOpacity className="relative p-3 rounded-full bg-white">
//             <Bell size={24} color="black" />
//             {unreadCount > 0 && (
//               <View className="absolute -top-1 right-1 w-4 h-4 bg-red-700 flex justify-center items-center rounded-full">
//                 <Text className="text-white text-xs">{unreadCount}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//           <TouchableOpacity className="relative p-3 rounded-full bg-white">
//             <Bell size={24} color="black" />
//             <View className="absolute -top-1 right-1 w-4 h-4 bg-red-700 flex justify-center items-center rounded-full">
//               <Text className="text-white text-xs">7</Text>
//             </View>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>

//       {/* Track Package Section */}
//       <ScrollView
//         className="flex-1"
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Header */}
//         <View className="px-6 my-6">
//           <Text className="text-white text-xl font-semibold mb-4 text-center">
//             Track Your Package
//           </Text>

//           <View className="flex-row items-center me-16 gap-2">
//             <View className="flex-row items-center bg-white rounded-full px-3 py-2 w-full">
//               <Search size={24} color="#9CA3AF" />
//               <TextInput
//                 placeholder="Enter your tracking number or Scan"
//                 className="flex-1 ml-3 text-gray-700"
//                 placeholderTextColor="#9CA3AF"
//               />
//             </View>
//             <TouchableOpacity className="flex justify-center items-center rounded-full bg-white h-14 w-14">
//               <ScanLine size={30} color="#8B5CF6" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Main Content */}
//         <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">
//           {/* Discount Banner */}
//           <View className="rounded-2xl p-6 mb-6 bg-gray-50">
//             <View className="flex-row items-center justify-between">
//               <View className="flex-1">
//                 <Text className="text-3xl font-bold text-[#8328FA] mb-1">
//                   45% <Text className="text-gray-700">Discount</Text>
//                 </Text>
//                 <Text className="text-gray-600 mb-2">
//                   off your next express delivery
//                 </Text>
//                 <Text className="text-sm text-gray-500 mb-4">
//                   Save tracking IDs to check status faster!
//                 </Text>
//                 <TouchableOpacity className="bg-red-700 px-2 py-1 rounded-full self-start">
//                   <Text className="text-white font-medium">Get 30% offer</Text>
//                 </TouchableOpacity>
//               </View>
//               <Image
//                 source={require("../../assets/images/rider.png")}
//                 className="w-32 h-32"
//               />
//             </View>
//           </View>

//           {/* Send Package Button */}
//           <TouchableOpacity
//             onPress={() => navigation.navigate("Send")}
//             className="bg-[#8328FA] rounded-2xl w-40 py-4 mb-8"
//           >
//             <Text className="text-white text-center text-lg font-semibold">
//               Send a Package
//             </Text>
//           </TouchableOpacity>

//           {/* Recent Shipments */}
//           <View className="mb-8">
//             <View className="flex-row items-center justify-between mb-4">
//               <Text className="text-xl font-semibold text-gray-900">
//                 Your Recent Shipments
//               </Text>
//               <TouchableOpacity>
//                 <Text className="text-purple-600 font-medium">View all</Text>
//               </TouchableOpacity>
//             </View>

//             {isLoadingShipments ? (
//               <View className="py-12 items-center">
//                 <ActivityIndicator size="large" color="#8328FA" />
//                 <Text className="text-gray-500 mt-4">Loading shipments...</Text>
//               </View>
//             ) : recentShipments.length === 0 ? (
//               <View className="py-12 items-center border border-gray-100 rounded-xl">
//                 <Text className="text-gray-500 text-center mb-2">
//                   No shipments yet
//                 </Text>
//                 <Text className="text-gray-400 text-sm text-center px-6">
//                   Your recent deliveries will appear here
//                 </Text>
//               </View>
//             ) : (
//               recentShipments.map((shipment) => {
//                 const statusStyle = getStatusStyle(shipment.status);
//                 return (
//                   <TouchableOpacity
//                     key={shipment.id}
//                     onPress={() => {
//                       // Navigate to tracking screen if needed
//                       // navigation.navigate("Location", { sessionId: shipment.sessionId })
//                     }}
//                     className="flex-row gap-2 items-center border border-gray-100 rounded-xl p-4 mb-3"
//                   >
//                     <View className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-50">
//                       <Image
//                         source={require("../../assets/images/package.png")}
//                         className="w-14 h-14"
//                       />
//                     </View>
//                     <View className="flex-1">
//                       <Text className="font-medium text-gray-900 mb-1">
//                         {formatDescription(shipment)}
//                       </Text>
//                       <Text className="text-gray-500 text-sm">
//                         {formatShipmentId(shipment.id)}
//                       </Text>
//                     </View>
//                     <View
//                       className={`px-3 py-1 rounded-full items-center justify-center ${statusStyle.bg}`}
//                     >
//                       <Text
//                         className={`text-sm font-medium ${statusStyle.text}`}
//                       >
//                         {statusStyle.label}
//                       </Text>
//                     </View>
//                   </TouchableOpacity>
//                 );
//               })
//             )}
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }

///////////////////////working with notification//////////////////////////
// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   ActivityIndicator,
//   RefreshControl,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Search, Bell, ScanLine } from "lucide-react-native";
// import { fetchRecentShipments } from "../../utils/deliveryUtils";
// import { subscribeToProfileUpdates } from "../../utils/userProfileUtils";
// import { registerForPushNotificationsAsync } from "../../utils/notificationUtils";
// import * as Notifications from "expo-notifications";
// import { auth } from "../../firebase";

// export default function HomeScreen({ navigation }) {
//   // Initializing User Data
//   const [userProfile, setUserProfile] = useState({
//     firstName: "",
//     photoURL: null,
//   });

//   // Shipments state
//   const [recentShipments, setRecentShipments] = useState([]);
//   const [isLoadingShipments, setIsLoadingShipments] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);

//   // Load current badge count on mount
//   useEffect(() => {
//     const loadBadgeCount = async () => {
//       const count = await Notifications.getBadgeCountAsync();
//       setUnreadCount(count);
//     };
//     loadBadgeCount();
//   }, []);

//   // Listen for incoming notifications and update badge
//   useEffect(() => {
//     const notificationListener = Notifications.addNotificationReceivedListener(
//       async (notification) => {
//         console.log("New notification received:", notification);
//         // Increment badge count
//         const currentCount = await Notifications.getBadgeCountAsync();
//         await Notifications.setBadgeCountAsync(currentCount + 1);
//         setUnreadCount(currentCount + 1);
//       }
//     );

//     return () => notificationListener.remove();
//   }, []);

//   // Clear badge when screen is focused
//   useEffect(() => {
//     const unsubscribe = navigation.addListener("focus", async () => {
//       await Notifications.setBadgeCountAsync(0);
//       setUnreadCount(0);
//     });
//     return unsubscribe;
//   }, [navigation]);

//   // Register for push notifications
//   useEffect(() => {
//     registerForPushNotificationsAsync();
//   }, []);

//   // Grabbing User information
//   useEffect(() => {
//     const unsubscribe = subscribeToProfileUpdates((profile) => {
//       if (profile) {
//         setUserProfile({
//           firstName: profile.firstName,
//           photoURL: profile.photoURL,
//         });
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   // Load recent shipments
//   const loadShipments = async () => {
//     try {
//       setIsLoadingShipments(true);
//       const shipments = await fetchRecentShipments(5);
//       setRecentShipments(shipments);
//     } catch (error) {
//       console.error("Error loading shipments:", error);
//     } finally {
//       setIsLoadingShipments(false);
//     }
//   };

//   useEffect(() => {
//     loadShipments();
//   }, []);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     await loadShipments();
//     setRefreshing(false);
//   };

//   const formatShipmentId = (id) => {
//     return id ? `#${id.slice(-8).toUpperCase()}` : "#N/A";
//   };

//   const getStatusStyle = (status) => {
//     switch (status?.toLowerCase()) {
//       case "delivered":
//       case "completed":
//         return {
//           bg: "bg-green-100",
//           text: "text-green-600",
//           label: "Delivered",
//         };
//       case "pending":
//       case "in_transit":
//         return {
//           bg: "bg-yellow-100",
//           text: "text-yellow-600",
//           label: "Pending",
//         };
//       case "failed":
//       case "cancelled":
//         return {
//           bg: "bg-red-100",
//           text: "text-red-600",
//           label: "Failed",
//         };
//       default:
//         return {
//           bg: "bg-gray-100",
//           text: "text-gray-600",
//           label: "Unknown",
//         };
//     }
//   };

//   const formatDescription = (shipment) => {
//     if (shipment.itemType) {
//       return `${shipment.itemType} - ${shipment.weight || "N/A"}`;
//     }
//     return "Package delivery";
//   };

//   return (
//     <View className="flex-1 bg-[#8328FA]">
//       <SafeAreaView>
//         <View className="flex-row items-center justify-between px-6">
//           <View className="flex-row items-center">
//             <Image
//               source={
//                 userProfile.photoURL
//                   ? { uri: userProfile.photoURL }
//                   : require("../../assets/images/avatar.png")
//               }
//               className="w-14 h-14 rounded-full mr-3"
//             />
//             <Text className="text-white text-lg font-medium">
//               Welcome, {userProfile.firstName}!
//             </Text>
//           </View>
//           <TouchableOpacity className="relative p-3 rounded-full bg-white">
//             <Bell size={24} color="black" />
//             {unreadCount > 0 && (
//               <View className="absolute -top-1 right-1 w-5 h-5 bg-red-700 flex justify-center items-center rounded-full">
//                 <Text className="text-white text-xs font-bold">
//                   {unreadCount > 9 ? "9+" : unreadCount}
//                 </Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>

//       {/* Track Package Section */}
//       <ScrollView
//         className="flex-1"
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         <View className="px-6 my-6">
//           <Text className="text-white text-xl font-semibold mb-4 text-center">
//             Track Your Package
//           </Text>

//           <View className="flex-row items-center me-16 gap-2">
//             <View className="flex-row items-center bg-white rounded-full px-3 py-2 w-full">
//               <Search size={24} color="#9CA3AF" />
//               <TextInput
//                 placeholder="Enter your tracking number or Scan"
//                 className="flex-1 ml-3 text-gray-700"
//                 placeholderTextColor="#9CA3AF"
//               />
//             </View>
//             <TouchableOpacity className="flex justify-center items-center rounded-full bg-white h-14 w-14">
//               <ScanLine size={30} color="#8B5CF6" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">
//           {/* Discount Banner */}
//           <View className="rounded-2xl p-6 mb-6 bg-gray-50">
//             <View className="flex-row items-center justify-between">
//               <View className="flex-1">
//                 <Text className="text-3xl font-bold text-[#8328FA] mb-1">
//                   45% <Text className="text-gray-700">Discount</Text>
//                 </Text>
//                 <Text className="text-gray-600 mb-2">
//                   off your next express delivery
//                 </Text>
//                 <Text className="text-sm text-gray-500 mb-4">
//                   Save tracking IDs to check status faster!
//                 </Text>
//                 <TouchableOpacity className="bg-red-700 px-2 py-1 rounded-full self-start">
//                   <Text className="text-white font-medium">Get 30% offer</Text>
//                 </TouchableOpacity>
//               </View>
//               <Image
//                 source={require("../../assets/images/rider.png")}
//                 className="w-32 h-32"
//               />
//             </View>
//           </View>

//           {/* Send Package Button */}
//           <TouchableOpacity
//             onPress={() => navigation.navigate("Send")}
//             className="bg-[#8328FA] rounded-2xl w-40 py-4 mb-8"
//           >
//             <Text className="text-white text-center text-lg font-semibold">
//               Send a Package
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={async () => {
//               try {
//                 const user = auth.currentUser;
//                 if (!user) {
//                   alert("Please login first");
//                   return;
//                 }

//                 console.log("🔄 Manually re-registering push token...");
//                 const token = await registerForPushNotificationsAsync(user.uid);

//                 if (token) {
//                   alert("✅ Token registered! Now try the test notification.");
//                 } else {
//                   alert("❌ Failed to register token");
//                 }
//               } catch (error) {
//                 console.error("Registration error:", error);
//                 alert("❌ Error: " + error.message);
//               }
//             }}
//             className="bg-blue-600 rounded-2xl w-40 py-4 mb-8"
//           >
//             <Text className="text-white text-center text-lg font-semibold">
//               🔄 Register Token
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={async () => {
//               try {
//                 const user = auth.currentUser;
//                 if (!user) {
//                   alert("Please login first");
//                   return;
//                 }

//                 console.log("🧪 Sending test notification for user:", user.uid);

//                 const response = await fetch(
//                   "http://192.168.43.176:3000/api/shipment-update",
//                   {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                       userId: user.uid,
//                       userName: userProfile.firstName || "User",
//                       itemName: "Test Package",
//                       quantity: 1,
//                       shipmentId: "TEST123",
//                     }),
//                   }
//                 );

//                 const result = await response.json();
//                 console.log("Test notification result:", result);

//                 if (result.success) {
//                   alert(
//                     "✅ Test notification sent! Check your notification center."
//                   );
//                 } else {
//                   alert("❌ Failed: " + (result.error || "Unknown error"));
//                 }
//               } catch (error) {
//                 console.error("Test notification error:", error);
//                 alert("❌ Error: " + error.message);
//               }
//             }}
//             className="bg-green-600 rounded-2xl w-40 py-4 mb-8"
//           >
//             <Text className="text-white text-center text-lg font-semibold">
//               🧪 Test Notification
//             </Text>
//           </TouchableOpacity>

//           {/* Recent Shipments */}
//           <View className="mb-8">
//             <View className="flex-row items-center justify-between mb-4">
//               <Text className="text-xl font-semibold text-gray-900">
//                 Your Recent Shipments
//               </Text>
//               <TouchableOpacity>
//                 <Text className="text-purple-600 font-medium">View all</Text>
//               </TouchableOpacity>
//             </View>

//             {isLoadingShipments ? (
//               <View className="py-12 items-center">
//                 <ActivityIndicator size="large" color="#8328FA" />
//                 <Text className="text-gray-500 mt-4">Loading shipments...</Text>
//               </View>
//             ) : recentShipments.length === 0 ? (
//               <View className="py-12 items-center border border-gray-100 rounded-xl">
//                 <Text className="text-gray-500 text-center mb-2">
//                   No shipments yet
//                 </Text>
//                 <Text className="text-gray-400 text-sm text-center px-6">
//                   Your recent deliveries will appear here
//                 </Text>
//               </View>
//             ) : (
//               recentShipments.map((shipment) => {
//                 const statusStyle = getStatusStyle(shipment.status);
//                 return (
//                   <TouchableOpacity
//                     key={shipment.id}
//                     className="flex-row gap-2 items-center border border-gray-100 rounded-xl p-4 mb-3"
//                   >
//                     <View className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-50">
//                       <Image
//                         source={require("../../assets/images/package.png")}
//                         className="w-14 h-14"
//                       />
//                     </View>
//                     <View className="flex-1">
//                       <Text className="font-medium text-gray-900 mb-1">
//                         {formatDescription(shipment)}
//                       </Text>
//                       <Text className="text-gray-500 text-sm">
//                         {formatShipmentId(shipment.id)}
//                       </Text>
//                     </View>
//                     <View
//                       className={`px-3 py-1 rounded-full items-center justify-center ${statusStyle.bg}`}
//                     >
//                       <Text
//                         className={`text-sm font-medium ${statusStyle.text}`}
//                       >
//                         {statusStyle.label}
//                       </Text>
//                     </View>
//                   </TouchableOpacity>
//                 );
//               })
//             )}
//           </View>
//         </View>
//       </ScrollView>
//     </View>
//   );
// }
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Bell, ScanLine, X } from "lucide-react-native";
//import { fetchRecentShipments } from "../../utils/deliveryUtils";
import { subscribeToProfileUpdates } from "../../utils/userProfileUtils";
import { registerForPushNotificationsAsync } from "../../utils/notificationUtils";
import * as Notifications from "expo-notifications";
import { auth } from "../../firebase";
import { useFocusEffect } from "@react-navigation/native";
import { fetchRecentShipments } from "../../utils/deliveryFirestore";

export default function HomeScreen({ navigation }) {
  // Initializing User Data
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    photoURL: null,
  });

  // Shipments state
  const [recentShipments, setRecentShipments] = useState([]);
  const [allShipments, setAllShipments] = useState([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllShipments, setShowAllShipments] = useState(false);

  // Load current badge count on mount
  useEffect(() => {
    const loadBadgeCount = async () => {
      const count = await Notifications.getBadgeCountAsync();
      setUnreadCount(count);
    };
    loadBadgeCount();
  }, []);

  // Listen for incoming notifications and update badge
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log("New notification received:", notification);
        // Increment badge count
        const currentCount = await Notifications.getBadgeCountAsync();
        await Notifications.setBadgeCountAsync(currentCount + 1);
        setUnreadCount(currentCount + 1);
      }
    );

    return () => notificationListener.remove();
  }, []);

  // Clear badge when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await Notifications.setBadgeCountAsync(0);
      setUnreadCount(0);
    });
    return unsubscribe;
  }, [navigation]);

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // Grabbing User information
  useEffect(() => {
    const unsubscribe = subscribeToProfileUpdates((profile) => {
      if (profile) {
        setUserProfile({
          firstName: profile.firstName,
          photoURL: profile.photoURL,
        });
      }
    });

    return () => unsubscribe();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      // Refresh shipments when screen comes into focus
      loadShipments();
    }, [])
  );

  // Load recent shipments
  const loadShipments = async () => {
    try {
      setIsLoadingShipments(true);
      const shipments = await fetchRecentShipments(100);

      // ✅ The shipments already have the updated status from Firestore
      const sorted = shipments.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });

      setAllShipments(sorted);
      setRecentShipments(sorted.slice(0, 5));
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setIsLoadingShipments(false);
    }
  };
  // const loadShipments = async () => {
  //   try {
  //     setIsLoadingShipments(true);
  //     const shipments = await fetchRecentShipments(100); // Fetch more shipments
  //     // Sort in ascending order (oldest first)
  //     const sorted = shipments.sort((a, b) => {
  //       const dateA = new Date(a.createdAt || 0);
  //       const dateB = new Date(b.createdAt || 0);
  //       return dateA - dateB;
  //     });
  //     setAllShipments(sorted);
  //     setRecentShipments(sorted.slice(0, 5)); // Show only 5 in home screen
  //   } catch (error) {
  //     console.error("Error loading shipments:", error);
  //   } finally {
  //     setIsLoadingShipments(false);
  //   }
  // };

  useEffect(() => {
    loadShipments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShipments();
    setRefreshing(false);
  };

  const formatShipmentId = (id) => {
    return id ? `#${id.slice(-8).toUpperCase()}` : "#N/A";
  };

  // const getStatusStyle = (status) => {
  //   switch (status?.toLowerCase()) {
  //     case "delivered":
  //     case "completed":
  //       return {
  //         bg: "bg-green-100",
  //         text: "text-green-600",
  //         label: "Delivered",
  //       };
  //     case "pending":
  //     case "in_transit":
  //       return {
  //         bg: "bg-yellow-100",
  //         text: "text-yellow-600",
  //         label: "Pending",
  //       };
  //     case "failed":
  //     case "cancelled":
  //       return {
  //         bg: "bg-red-100",
  //         text: "text-red-600",
  //         label: "Failed",
  //       };
  //     default:
  //       return {
  //         bg: "bg-gray-100",
  //         text: "text-gray-600",
  //         label: "Unknown",
  //       };
  //   }
  // };
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
          label: "Delivered",
        };
      case "in_transit":
      case "started":
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          label: "In Transit", // 🚗 Driver is moving
        };
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          label: "Pending", // ⏳ Waiting for driver
        };
      case "failed":
      case "cancelled":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          label: "Failed",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          label: "Unknown",
        };
    }
  };

  const formatDescription = (shipment) => {
    if (shipment.itemType) {
      return `${shipment.itemType} - ${shipment.weight || "N/A"}`;
    }
    return "Package delivery";
  };

  const ShipmentList = ({ shipments }) => (
    <>
      {shipments.length === 0 ? (
        <View className="py-12 items-center border border-gray-100 rounded-xl">
          <Text className="text-gray-500 text-center mb-2">
            No shipments yet
          </Text>
          <Text className="text-gray-400 text-sm text-center px-6">
            Your deliveries will appear here
          </Text>
        </View>
      ) : (
        shipments.map((shipment) => {
          const statusStyle = getStatusStyle(shipment.status);
          return (
            <TouchableOpacity
              key={shipment.id}
              className="flex-row gap-2 items-center border border-gray-100 rounded-xl p-4 mb-3"
            >
              <View className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-50">
                <Image
                  source={require("../../assets/images/package.png")}
                  className="w-14 h-14"
                />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900 mb-1">
                  {formatDescription(shipment)}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {formatShipmentId(shipment.id)}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full items-center justify-center ${statusStyle.bg}`}
              >
                <Text className={`text-sm font-medium ${statusStyle.text}`}>
                  {statusStyle.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );

  return (
    <View className="flex-1 bg-[#8328FA]">
      {/* All Shipments Modal */}
      {showAllShipments && (
        <View className="flex-1 bg-black/50 absolute inset-0 z-50">
          <SafeAreaView className="flex-1">
            <View className="flex-1 bg-white m-2 rounded-2xl overflow-hidden flex flex-col">
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <Text className="text-xl font-semibold text-gray-900">
                  All Shipments
                </Text>
                <TouchableOpacity onPress={() => setShowAllShipments(false)}>
                  <X size={24} color="black" />
                </TouchableOpacity>
              </View>
              <ScrollView className="flex-1 px-6 py-4">
                {isLoadingShipments ? (
                  <View className="py-12 items-center">
                    <ActivityIndicator size="large" color="#8328FA" />
                    <Text className="text-gray-500 mt-4">
                      Loading shipments...
                    </Text>
                  </View>
                ) : (
                  <ShipmentList shipments={allShipments} />
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      )}

      <SafeAreaView>
        <View className="flex-row items-center justify-between px-6">
          <View className="flex-row items-center">
            <Image
              source={
                userProfile.photoURL
                  ? { uri: userProfile.photoURL }
                  : require("../../assets/images/avatar.png")
              }
              className="w-14 h-14 rounded-full mr-3"
            />
            <Text className="text-white text-lg font-medium">
              Welcome, {userProfile.firstName}!
            </Text>
          </View>
          <TouchableOpacity className="relative p-3 rounded-full bg-white">
            <Bell size={24} color="black" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 right-1 w-5 h-5 bg-red-700 flex justify-center items-center rounded-full">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Track Package Section */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 my-6">
          <Text className="text-white text-xl font-semibold mb-4 text-center">
            Track Your Package
          </Text>

          <View className="flex-row items-center me-16 gap-2">
            <View className="flex-row items-center bg-white rounded-full px-3 py-2 w-full">
              <Search size={24} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your tracking number or Scan"
                className="flex-1 ml-3 text-gray-700"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity className="flex justify-center items-center rounded-full bg-white h-14 w-14">
              <ScanLine size={30} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">
          {/* Discount Banner */}
          <View className="rounded-2xl p-6 mb-6 bg-gray-50">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-[#8328FA] mb-1">
                  45% <Text className="text-gray-700">Discount</Text>
                </Text>
                <Text className="text-gray-600 mb-2">
                  off your next express delivery
                </Text>
                <Text className="text-sm text-gray-500 mb-4">
                  Save tracking IDs to check status faster!
                </Text>
                <TouchableOpacity className="bg-red-700 px-2 py-1 rounded-full self-start">
                  <Text className="text-white font-medium">Get 30% offer</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require("../../assets/images/rider.png")}
                className="w-32 h-32"
              />
            </View>
          </View>

          {/* Send Package Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Send")}
            className="bg-[#8328FA] rounded-2xl w-40 py-4 mb-8"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Send a Package
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                const user = auth.currentUser;
                if (!user) {
                  alert("Please login first");
                  return;
                }

                console.log("🔄 Manually re-registering push token...");
                const token = await registerForPushNotificationsAsync(user.uid);

                if (token) {
                  alert("✅ Token registered! Now try the test notification.");
                } else {
                  alert("❌ Failed to register token");
                }
              } catch (error) {
                console.error("Registration error:", error);
                alert("❌ Error: " + error.message);
              }
            }}
            className="bg-blue-600 rounded-2xl w-40 py-4 mb-8"
          >
            <Text className="text-white text-center text-lg font-semibold">
              🔄 Register Token
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                const user = auth.currentUser;
                if (!user) {
                  alert("Please login first");
                  return;
                }

                console.log("🧪 Sending test notification for user:", user.uid);

                const response = await fetch(
                  "http://192.168.43.176:3000/api/shipment-update",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.uid,
                      userName: userProfile.firstName || "User",
                      itemName: "Test Package",
                      quantity: 1,
                      shipmentId: "TEST123",
                    }),
                  }
                );

                const result = await response.json();
                console.log("Test notification result:", result);

                if (result.success) {
                  alert(
                    "✅ Test notification sent! Check your notification center."
                  );
                } else {
                  alert("❌ Failed: " + (result.error || "Unknown error"));
                }
              } catch (error) {
                console.error("Test notification error:", error);
                alert("❌ Error: " + error.message);
              }
            }}
            className="bg-green-600 rounded-2xl w-40 py-4 mb-8"
          >
            <Text className="text-white text-center text-lg font-semibold">
              🧪 Test Notification
            </Text>
          </TouchableOpacity>

          {/* Recent Shipments */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">
                Your Recent Shipments
              </Text>
              <TouchableOpacity onPress={() => setShowAllShipments(true)}>
                <Text className="text-purple-600 font-medium">View all</Text>
              </TouchableOpacity>
            </View>

            {isLoadingShipments ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#8328FA" />
                <Text className="text-gray-500 mt-4">Loading shipments...</Text>
              </View>
            ) : (
              <ShipmentList shipments={recentShipments} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
