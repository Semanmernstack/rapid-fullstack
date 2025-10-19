// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Image,
//   ActivityIndicator,
//   RefreshControl,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Search, Bell, ScanLine, X } from "lucide-react-native";
// import { subscribeToProfileUpdates } from "../../utils/userProfileUtils";
// import { registerForPushNotificationsAsync } from "../../utils/notificationUtils";
// import * as Notifications from "expo-notifications";
// import { auth } from "../../firebase";
// import { useFocusEffect } from "@react-navigation/native";
// import { fetchRecentShipments } from "../../utils/deliveryFirestore";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export default function HomeScreen({ navigation }) {
//   const [userProfile, setUserProfile] = useState({
//     firstName: "",
//     photoURL: null,
//   });
//   console.log(userProfile);

//   const [recentShipments, setRecentShipments] = useState([]);
//   const [allShipments, setAllShipments] = useState([]);
//   const [isLoadingShipments, setIsLoadingShipments] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [showAllShipments, setShowAllShipments] = useState(false);
//   const [shownDeliveries, setShownDeliveries] = useState(new Set());
//   const [hasLoadedShownDeliveries, setHasLoadedShownDeliveries] =
//     useState(false);

//   //////////////////////////onesignal/////////////////////////////////////////////////////
//   useEffect(() => {
//   // Initialize OneSignal
//   initializeOneSignal();

//   // Setup notification handlers
//   setupNotificationHandlers(navigation);
// }, []);

// useEffect(() => {
//   const setupUser = async () => {
//     const user = auth.currentUser;
//     if (user && userProfile.firstName) {
//       await registerUserForNotifications(user.uid, {
//         firstName: userProfile.firstName,
//         email: user.email
//       });
//     }
//   };

//   setupUser();
// }, [userProfile]);

//   // Load shown deliveries from AsyncStorage on mount
//   useEffect(() => {
//     const loadShownDeliveries = async () => {
//       try {
//         const shown = await AsyncStorage.getItem("shownDeliveries");
//         if (shown) {
//           const parsedShown = JSON.parse(shown);
//           setShownDeliveries(new Set(parsedShown));
//           console.log("Loaded shown deliveries:", parsedShown);
//         }
//         setHasLoadedShownDeliveries(true);
//       } catch (error) {
//         console.log("Error loading shown deliveries:", error);
//         setHasLoadedShownDeliveries(true);
//       }
//     };

//     loadShownDeliveries();
//   }, []);

//   useEffect(() => {
//     const loadBadgeCount = async () => {
//       const count = await Notifications.getBadgeCountAsync();
//       setUnreadCount(count);
//     };
//     loadBadgeCount();
//   }, []);

//   useEffect(() => {
//     const notificationListener = Notifications.addNotificationReceivedListener(
//       async (notification) => {
//         console.log("New notification received:", notification);
//         const currentCount = await Notifications.getBadgeCountAsync();
//         await Notifications.setBadgeCountAsync(currentCount + 1);
//         setUnreadCount(currentCount + 1);
//       }
//     );

//     return () => notificationListener.remove();
//   }, []);

//   useEffect(() => {
//     const unsubscribe = navigation.addListener("focus", async () => {
//       await Notifications.setBadgeCountAsync(0);
//       setUnreadCount(0);
//     });
//     return unsubscribe;
//   }, [navigation]);

//   useEffect(() => {
//     registerForPushNotificationsAsync();
//   }, []);

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

//   useFocusEffect(
//     React.useCallback(() => {
//       loadShipments();
//     }, [])
//   );

//   const loadShipments = async () => {
//     try {
//       setIsLoadingShipments(true);
//       const shipments = await fetchRecentShipments(100);

//       const sorted = shipments.sort((a, b) => {
//         const dateA = new Date(a.createdAt || 0);
//         const dateB = new Date(b.createdAt || 0);
//         return dateB - dateA; // Most recent first
//       });

//       setAllShipments(sorted);
//       setRecentShipments(sorted.slice(0, 5));
//     } catch (error) {
//       console.error("Error loading shipments:", error);
//     } finally {
//       setIsLoadingShipments(false);
//     }
//   };

//   useEffect(() => {
//     if (
//       !hasLoadedShownDeliveries ||
//       !recentShipments ||
//       recentShipments.length === 0
//     ) {
//       return;
//     }

//     const updateShownDeliveries = async () => {
//       let needsUpdate = false;
//       const newShownDeliveries = new Set(shownDeliveries);

//       for (const shipment of recentShipments) {
//         const statusLower = (shipment.status || "").toLowerCase();
//         const statusKeyLower = (shipment.statusKey || "").toLowerCase();

//         const isDelivered =
//           statusLower === "delivered" ||
//           statusLower === "completed" ||
//           statusKeyLower === "completed" ||
//           statusKeyLower === "delivered";

//         // Mark as shown without alert
//         if (isDelivered && !shownDeliveries.has(shipment.id)) {
//           console.log("✅ Delivery completed (silent update):", shipment.id);
//           newShownDeliveries.add(shipment.id);
//           needsUpdate = true;
//         }
//       }

//       if (needsUpdate) {
//         setShownDeliveries(newShownDeliveries);
//         try {
//           await AsyncStorage.setItem(
//             "shownDeliveries",
//             JSON.stringify([...newShownDeliveries])
//           );
//         } catch (error) {
//           console.log("Error saving shown deliveries:", error);
//         }
//       }
//     };

//     updateShownDeliveries();
//   }, [recentShipments, shownDeliveries, hasLoadedShownDeliveries]);

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
//     const statusLower = (status || "").toLowerCase();

//     switch (statusLower) {
//       case "delivered":
//       case "completed":
//         return {
//           bg: "bg-green-100",
//           text: "text-green-600",
//           label: "Delivered",
//         };
//       case "in_transit":
//       case "started":
//         return {
//           bg: "bg-blue-100",
//           text: "text-blue-600",
//           label: "In Transit",
//         };
//       case "pending":
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

//   const ShipmentList = ({ shipments }) => (
//     <>
//       {shipments.length === 0 ? (
//         <View className="py-12 items-center border border-gray-100 rounded-xl">
//           <Text className="text-gray-500 text-center mb-2">
//             No shipments yet
//           </Text>
//           <Text className="text-gray-400 text-sm text-center px-6">
//             Your deliveries will appear here
//           </Text>
//         </View>
//       ) : (
//         shipments.map((shipment) => {
//           const statusStyle = getStatusStyle(shipment.status);
//           return (
//             <TouchableOpacity
//               key={shipment.id}
//               className="flex-row gap-2 items-center border border-gray-100 rounded-xl p-4 mb-3"
//             >
//               <View className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-50">
//                 <Image
//                   source={require("../../assets/images/package.png")}
//                   className="w-14 h-14"
//                 />
//               </View>
//               <View className="flex-1">
//                 <Text className="font-medium text-gray-900 mb-1">
//                   {formatDescription(shipment)}
//                 </Text>
//                 <Text className="text-gray-500 text-sm">
//                   {formatShipmentId(shipment.id)}
//                 </Text>
//               </View>
//               <View
//                 className={`px-3 py-1 rounded-full items-center justify-center ${statusStyle.bg}`}
//               >
//                 <Text className={`text-sm font-medium ${statusStyle.text}`}>
//                   {statusStyle.label}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           );
//         })
//       )}
//     </>
//   );

//   return (
//     <View className="flex-1 bg-[#8328FA]">
//       {/* All Shipments Modal */}
//       {showAllShipments && (
//         <View className="flex-1 bg-black/50 absolute inset-0 z-50">
//           <SafeAreaView className="flex-1">
//             <View className="flex-1 bg-white m-2 rounded-2xl overflow-hidden flex flex-col">
//               <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
//                 <Text className="text-xl font-semibold text-gray-900">
//                   All Shipments
//                 </Text>
//                 <TouchableOpacity onPress={() => setShowAllShipments(false)}>
//                   <X size={24} color="black" />
//                 </TouchableOpacity>
//               </View>
//               <ScrollView className="flex-1 px-6 py-4">
//                 {isLoadingShipments ? (
//                   <View className="py-12 items-center">
//                     <ActivityIndicator size="large" color="#8328FA" />
//                     <Text className="text-gray-500 mt-4">
//                       Loading shipments...
//                     </Text>
//                   </View>
//                 ) : (
//                   <ShipmentList shipments={allShipments} />
//                 )}
//               </ScrollView>
//             </View>
//           </SafeAreaView>
//         </View>
//       )}

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
//              <TouchableOpacity
//   onPress={async () => {
//     try {
//       const user = auth.currentUser;
//       if (!user) {
//         alert("Please login first");
//         return;
//       }

//       const response = await fetch(
//         "https://rapid-fullstack.vercel.app/api/test-notification",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ userId: user.uid }),
//         }
//       );

//       const result = await response.json();

//       if (result.success) {
//         alert("✅ Test notification sent!");
//       } else {
//         alert("❌ Failed: " + (result.error || "Unknown error"));
//       }
//     } catch (error) {
//       alert("❌ Error: " + error.message);
//     }
//   }}
//   className="bg-green-600 rounded-2xl w-40 py-4 mb-8"
// >
//   <Text className="text-white text-center text-lg font-semibold">
//     🧪 Test Notification
//   </Text>
// </TouchableOpacity>

//           {/* Recent Shipments */}
//           <View className="mb-8">
//             <View className="flex-row items-center justify-between mb-4">
//               <Text className="text-xl font-semibold text-gray-900">
//                 Your Recent Shipments
//               </Text>
//               <TouchableOpacity onPress={() => setShowAllShipments(true)}>
//                 <Text className="text-purple-600 font-medium">View all</Text>
//               </TouchableOpacity>
//             </View>

//             {isLoadingShipments ? (
//               <View className="py-12 items-center">
//                 <ActivityIndicator size="large" color="#8328FA" />
//                 <Text className="text-gray-500 mt-4">Loading shipments...</Text>
//               </View>
//             ) : (
//               <ShipmentList shipments={recentShipments} />
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Bell, ScanLine, X, Trash2 } from "lucide-react-native";
import { subscribeToProfileUpdates } from "../../utils/userProfileUtils";
import {
  initializeOneSignal,
  registerUserForNotifications,
} from "../../utils/notificationUtils";
import { auth } from "../../firebase";
import { useFocusEffect } from "@react-navigation/native";
import { fetchRecentShipments } from "../../utils/deliveryFirestore";
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../utils/notificationFirestore";

export default function HomeScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    photoURL: null,
  });

  const [recentShipments, setRecentShipments] = useState([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize OneSignal
  useEffect(() => {
    initializeOneSignal();
  }, []);

  // Subscribe to profile updates
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

  // Register user for notifications
  useEffect(() => {
    const setupUser = async () => {
      const user = auth.currentUser;
      if (user && userProfile.firstName) {
        await registerUserForNotifications(user.uid, {
          firstName: userProfile.firstName,
          email: user.email,
        });
      }
    };
    setupUser();
  }, [userProfile]);

  // Subscribe to notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = subscribeToUserNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      const unread = notifs.filter((n) => !n.read).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, []);

  // Load shipments on focus
  useFocusEffect(
    React.useCallback(() => {
      loadShipments();
    }, [])
  );

  const loadShipments = async () => {
    try {
      setIsLoadingShipments(true);
      const shipments = await fetchRecentShipments(100);

      const sorted = shipments.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setRecentShipments(sorted.slice(0, 5));
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShipments();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Close dropdown
    setShowNotifications(false);

    // Navigate based on notification type
    if (notification.data?.shipmentId) {
      navigation.navigate("TrackShipment", {
        id: notification.data.shipmentId,
      });
    }
  };

  const handleMarkAllRead = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification(notificationId);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (notification) => {
    switch (notification.type) {
      case "shipment_update":
        return "🚚";
      case "delivery_completed":
        return "✅";
      case "payment_success":
        return "💳";
      case "promotion":
        return "🎉";
      default:
        return notification.icon || "📦";
    }
  };

  const formatShipmentId = (id) => {
    return id ? `#${id.slice(-8).toUpperCase()}` : "#N/A";
  };

  const getStatusStyle = (status) => {
    const statusLower = (status || "").toLowerCase();

    switch (statusLower) {
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
          label: "In Transit",
        };
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          label: "Pending",
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

  return (
    <View className="flex-1 bg-[#8328FA]">
      {/* Notification Dropdown Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
          className="flex-1 bg-black/50"
        >
          <SafeAreaView className="flex-1">
            <View className="absolute right-4 top-20 w-80 max-h-96 bg-white rounded-2xl shadow-2xl">
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-900">
                  Notifications ({unreadCount})
                </Text>
                <View className="flex-row gap-2">
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead}>
                      <Text className="text-purple-600 text-sm font-medium">
                        Mark all read
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setShowNotifications(false)}>
                    <X size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Notifications List */}
              <ScrollView className="max-h-80">
                {notifications.length === 0 ? (
                  <View className="py-12 px-6 items-center">
                    <Text className="text-4xl mb-2">🔔</Text>
                    <Text className="text-gray-500 text-center text-sm">
                      No notifications yet
                    </Text>
                  </View>
                ) : (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      onPress={() => handleNotificationPress(notification)}
                      className={`px-4 py-3 border-b border-gray-100 ${
                        !notification.read ? "bg-purple-50" : "bg-white"
                      }`}
                    >
                      <View className="flex-row items-start gap-3">
                        {/* Icon */}
                        <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                          <Text className="text-xl">
                            {getNotificationIcon(notification)}
                          </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text
                              className={`font-semibold text-sm ${
                                notification.read
                                  ? "text-gray-700"
                                  : "text-gray-900"
                              }`}
                              numberOfLines={1}
                            >
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <View className="w-2 h-2 rounded-full bg-purple-600 ml-2" />
                            )}
                          </View>

                          <Text
                            className={`text-xs mb-2 ${
                              notification.read
                                ? "text-gray-500"
                                : "text-gray-700"
                            }`}
                            numberOfLines={2}
                          >
                            {notification.message}
                          </Text>

                          <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-400">
                              {formatTimestamp(notification.createdAt)}
                            </Text>

                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="p-1"
                            >
                              <Trash2 size={14} color="#9CA3AF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

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

          {/* Bell Icon with Badge */}
          <TouchableOpacity
            onPress={() => setShowNotifications(!showNotifications)}
            className="relative p-3 rounded-full bg-white"
          >
            <Bell size={24} color="black" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 flex justify-center items-center rounded-full">
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Track Package Section */}
        <View className="px-6 my-6">
          <Text className="text-white text-xl font-semibold mb-4 text-center">
            Track Your Package
          </Text>

          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center bg-white rounded-full px-3 py-2 flex-1">
              <Search size={24} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your tracking number"
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
                <TouchableOpacity className="bg-red-700 px-4 py-2 rounded-full self-start">
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
            className="bg-[#8328FA] rounded-2xl py-4 mb-8"
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

                console.log("🧪 Sending test notification for user:", user.uid);

                const response = await fetch(
                  "https://rapid-fullstack.vercel.app/api/test-notification",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.uid,
                    }),
                  }
                );

                const result = await response.json();
                console.log("Test notification result:", result);

                if (result.success) {
                  alert(
                    "✅ Test notification sent! Check your notification tray and bell icon."
                  );
                } else {
                  alert("❌ Failed: " + (result.error || "Unknown error"));
                }
              } catch (error) {
                console.error("Test notification error:", error);
                alert("❌ Error: " + error.message);
              }
            }}
            className="bg-green-600 rounded-2xl py-4 mb-8"
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
              <TouchableOpacity>
                <Text className="text-purple-600 font-medium">View all</Text>
              </TouchableOpacity>
            </View>

            {isLoadingShipments ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#8328FA" />
                <Text className="text-gray-500 mt-4">Loading shipments...</Text>
              </View>
            ) : recentShipments.length === 0 ? (
              <View className="py-12 items-center border border-gray-100 rounded-xl">
                <Text className="text-gray-500 text-center mb-2">
                  No shipments yet
                </Text>
                <Text className="text-gray-400 text-sm text-center px-6">
                  Your deliveries will appear here
                </Text>
              </View>
            ) : (
              recentShipments.map((shipment) => {
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
                      <Text
                        className={`text-sm font-medium ${statusStyle.text}`}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// {
//   "expo": {
//     "name": "Rapid Delivery",
//     "slug": "rapid-delivery-app",
//     "version": "1.0.0",
//     "orientation": "portrait",
//     "icon": "./assets/images/icon.png",
//     "userInterfaceStyle": "light",
//     "scheme": "rapiddelivery",
//     "splash": {
//       "image": "./assets/images/Splash1.png",
//       "resizeMode": "contain",
//       "backgroundColor": "#fff"
//     },
//     "assetBundlePatterns": [
//       "**/*"
//     ],
//     "ios": {
//       "supportsTablet": true,
//       "bundleIdentifier": "com.yourcompany.rapiddelivery",
//       "associatedDomains": [
//         "applinks:rapid-fullstack.vercel.app"
//       ],
//       "config": {
//         "googleMapsApiKey": "AIzaSyC_V4seFQ1G-ibCyWfmHCBkJoF0ZmNkPVc"
//       },
//       "infoPlist": {
//         "CFBundleURLTypes": [
//           {
//             "CFBundleURLName": "rapiddelivery.deeplink",
//             "CFBundleURLSchemes": [
//               "rapiddelivery",
//               "com.yourcompany.rapiddelivery"
//             ]
//           }
//         ]
//       }
//     },
//     "android": {
//       "adaptiveIcon": {
//         "foregroundImage": "./assets/images/adaptive-icon.png",
//         "backgroundColor": "#fff"
//       },
//       "package": "com.yourcompany.rapiddelivery",
//       "googleServicesFile": "./google-services.json",
//       "useNextNotificationsApi": true,
//       "config": {
//         "googleMaps": {
//           "apiKey": "AIzaSyC_V4seFQ1G-ibCyWfmHCBkJoF0ZmNkPVc"
//         }
//       },
//       "intentFilters": [
//         {
//           "action": "VIEW",
//           "autoVerify": true,
//           "category": [
//             "DEFAULT",
//             "BROWSABLE"
//           ],
//           "data": [
//             {
//               "scheme": "rapiddelivery"
//             },
//             {
//               "scheme": "com.yourcompany.rapiddelivery"
//             }
//           ]
//         },
//         {
//           "action": "VIEW",
//           "autoVerify": true,
//           "category": [
//             "DEFAULT",
//             "BROWSABLE"
//           ],
//           "data": [
//             {
//               "scheme": "https",
//               "host": "rapid-fullstack.vercel.app",
//               "pathPrefix": "/payment-success"
//             },
//             {
//               "scheme": "https",
//               "host": "rapid-fullstack.vercel.app",
//               "pathPrefix": "/payment-cancel"
//             }
//           ]
//         }
//       ]
//     },
//     "web": {
//       "favicon": "./assets/images/favicon.png"
//     },
//     "plugins": [
//       "expo-router",
//       "expo-web-browser",
//       [
//         "expo-build-properties",
//         {
//           "android": {
//             "googleServicesFile": "./google-services.json"
//           }
//         }
//       ],
//       [
//         "@stripe/stripe-react-native",
//         {
//           "merchantIdentifier": "merchant.com.rapiddelivery",
//           "enableGooglePay": true
//         }
//       ],
//       [
//         "expo-notifications",
//         {
//           "color": "#8328FA",
//           "defaultChannel": "default",
//           "sounds": [],
//           "mode": "production"
//         }
//       ],
//       "onesignal-expo-plugin"
//     ],
//     "notification": {
//       "color": "#8328FA",
//       "androidMode": "default",
//       "androidCollapsedTitle": "#{unread_notifications} new notifications"
//     },
//     "linking": {
//       "scheme": "rapiddelivery",
//       "prefixes": [
//         "rapiddelivery://",
//         "com.yourcompany.rapiddelivery://",
//         "https://rapid-fullstack.vercel.app"
//       ]
//     },
//     "extra": {
//       "router": {},
//       "eas": {
//         "projectId": "233858dc-d585-4926-ba6a-6d7e3b97937f"
//       }
//     }
//   }
// }
