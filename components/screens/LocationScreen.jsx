// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   Linking,
//   ScrollView,
//   Platform,
//   Dimensions,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import {
//   ChevronLeft,
//   Search,
//   Phone,
//   MessageCircle,
//   MapPin,
//   Package,
//   Navigation,
//   RefreshCw,
//   ExternalLink,
// } from "lucide-react-native";
// import {
//   useRoute,
//   useNavigation,
//   useFocusEffect,
// } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
// import { Modal } from "react-native";
// import * as Print from "expo-print";
// import * as Sharing from "expo-sharing";
// import { X, Printer, Share2 } from "lucide-react-native";

// const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// export default function LocationScreen() {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const mapRef = useRef(null);
//   const trackingIntervalRef = useRef(null);

//   const [isLoading, setIsLoading] = useState(false);
//   const [deliveryData, setDeliveryData] = useState(null);
//   const [error, setError] = useState(null);
//   const [tookanTaskId, setTookanTaskId] = useState(null);
//   const [trackingUrl, setTrackingUrl] = useState(null);
//   const [isCreatingTask, setIsCreatingTask] = useState(false);
//   const [taskCreationStatus, setTaskCreationStatus] = useState(null);
//   const [hasCheckedForDelivery, setHasCheckedForDelivery] = useState(false);

//   // Live tracking states
//   const [mapRegion, setMapRegion] = useState({
//     latitude: 51.5074, // Default to London
//     longitude: -0.1278,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   });
//   const [trackingData, setTrackingData] = useState(null);
//   const [isTrackingActive, setIsTrackingActive] = useState(false);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [pickupCoordinates, setPickupCoordinates] = useState(null);
//   const [deliveryCoordinates, setDeliveryCoordinates] = useState(null);
//   const [trackingError, setTrackingError] = useState(null);
//   const [lastTrackingUpdate, setLastTrackingUpdate] = useState(null);

//   const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);

//   // Get parameters from route
//   const params = route.params || {};
//   const {
//     sessionId,
//     paymentStatus,
//     fromPayment,
//     shipmentDetails,
//     verifiedPayment,
//   } = params;

//   const backendUrl = "http://192.168.43.176:3000";

//   // // Function to get coordinates from postcode using Google Geocoding API

//   const getCoordinatesFromPostcode = async (postcode) => {
//     if (!postcode || postcode.trim().length === 0) {
//       console.error("Invalid postcode provided:", postcode);
//       return null;
//     }

//     try {
//       console.log("[Frontend] Geocoding postcode:", postcode);

//       const response = await fetch(
//         `${backendUrl}/api/geocode?postcode=${encodeURIComponent(
//           postcode.trim()
//         )}`
//       );

//       console.log("[Frontend] Geocoding response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(
//           "[Frontend] Geocoding HTTP error:",
//           response.status,
//           errorText
//         );

//         if (response.status === 404) {
//           console.warn(`[Frontend] Postcode not found: ${postcode}`);
//           return null;
//         }

//         throw new Error(`Geocoding failed: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("[Frontend] Geocoding response data:", data);

//       if (data.success && data.coordinates) {
//         console.log("[Frontend] Geocoding successful:", {
//           postcode: postcode,
//           coordinates: data.coordinates,
//           source: data.source,
//         });

//         return {
//           latitude: data.coordinates.lat,
//           longitude: data.coordinates.lng,
//         };
//       }

//       console.warn("[Frontend] Geocoding failed - no coordinates:", data);
//       return null;
//     } catch (error) {
//       console.error("[Frontend] Geocoding error:", error.message);

//       // Show user-friendly error for specific cases
//       if (error.message.includes("404")) {
//         console.warn(`[Frontend] Postcode not recognized: ${postcode}`);
//       } else {
//         console.error(`[Frontend] Geocoding service error: ${error.message}`);
//       }

//       return null;
//     }
//   };

//   // Function to get route between two points using Google Directions API
//   const getRouteCoordinates = async (origin, destination) => {
//     try {
//       const response = await fetch(
//         `${backendUrl}/api/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`
//       );

//       if (!response.ok) {
//         throw new Error(`Directions failed: ${response.status}`);
//       }

//       const data = await response.json();

//       if (data.success && data.route && data.route.length > 0) {
//         return data.route;
//       }

//       return [origin, destination]; // Fallback to straight line
//     } catch (error) {
//       console.error("Error getting route:", error);
//       return [origin, destination]; // Fallback to straight line
//     }
//   };

//   const initializeMap = async () => {
//     if (!deliveryData?.shipmentDetails) {
//       console.log("[Map] No shipment details available");
//       return;
//     }

//     const { pickupPostcode, receiverPostcode } = deliveryData.shipmentDetails;

//     if (!pickupPostcode || !receiverPostcode) {
//       console.warn("[Map] Missing postcode data:", {
//         pickupPostcode,
//         receiverPostcode,
//       });
//       return;
//     }

//     try {
//       console.log("[Map] Initializing with postcodes:", {
//         pickupPostcode,
//         receiverPostcode,
//       });

//       const [pickupCoords, deliveryCoords] = await Promise.all([
//         getCoordinatesFromPostcode(pickupPostcode),
//         getCoordinatesFromPostcode(receiverPostcode),
//       ]);

//       console.log("[Map] Geocoding results:", {
//         pickup: pickupCoords,
//         delivery: deliveryCoords,
//       });

//       // Handle partial failures
//       if (!pickupCoords && !deliveryCoords) {
//         console.error("[Map] Failed to geocode both postcodes");
//         Alert.alert(
//           "Location Error",
//           "Unable to locate pickup and delivery addresses. Please check the postcodes.",
//           [{ text: "OK" }]
//         );
//         return;
//       }

//       if (!pickupCoords) {
//         console.warn(
//           "[Map] Failed to geocode pickup postcode:",
//           pickupPostcode
//         );
//         Alert.alert(
//           "Location Warning",
//           `Unable to locate pickup address: ${pickupPostcode}`,
//           [{ text: "OK" }]
//         );
//       }

//       if (!deliveryCoords) {
//         console.warn(
//           "[Map] Failed to geocode delivery postcode:",
//           receiverPostcode
//         );
//         Alert.alert(
//           "Location Warning",
//           `Unable to locate delivery address: ${receiverPostcode}`,
//           [{ text: "OK" }]
//         );
//       }

//       // Use available coordinates
//       const availableCoords = [pickupCoords, deliveryCoords].filter(Boolean);

//       if (availableCoords.length > 0) {
//         if (pickupCoords) setPickupCoordinates(pickupCoords);
//         if (deliveryCoords) setDeliveryCoordinates(deliveryCoords);

//         // Get route between available coordinates
//         if (pickupCoords && deliveryCoords) {
//           console.log("[Map] Getting route between coordinates");
//           const route = await getRouteCoordinates(pickupCoords, deliveryCoords);
//           setRouteCoordinates(route);

//           // Center map on the route
//           const minLat = Math.min(
//             pickupCoords.latitude,
//             deliveryCoords.latitude
//           );
//           const maxLat = Math.max(
//             pickupCoords.latitude,
//             deliveryCoords.latitude
//           );
//           const minLng = Math.min(
//             pickupCoords.longitude,
//             deliveryCoords.longitude
//           );
//           const maxLng = Math.max(
//             pickupCoords.longitude,
//             deliveryCoords.longitude
//           );

//           const centerLat = (minLat + maxLat) / 2;
//           const centerLng = (minLng + maxLng) / 2;
//           const latDelta = (maxLat - minLat) * 1.5; // Add padding
//           const lngDelta = (maxLng - minLng) * 1.5;

//           const newRegion = {
//             latitude: centerLat,
//             longitude: centerLng,
//             latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
//             longitudeDelta: Math.max(lngDelta, 0.01),
//           };

//           setMapRegion(newRegion);

//           // Animate map to show the route
//           if (mapRef.current) {
//             setTimeout(() => {
//               mapRef.current?.animateToRegion(newRegion, 1000);
//             }, 100);
//           }
//         } else {
//           // Center on single available location
//           const singleCoord = availableCoords[0];
//           const newRegion = {
//             latitude: singleCoord.latitude,
//             longitude: singleCoord.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           };

//           setMapRegion(newRegion);

//           if (mapRef.current) {
//             setTimeout(() => {
//               mapRef.current?.animateToRegion(newRegion, 1000);
//             }, 100);
//           }
//         }

//         console.log("[Map] Map initialized successfully");
//       }
//     } catch (error) {
//       console.error("[Map] Error initializing map:", error);
//       Alert.alert(
//         "Map Error",
//         "Unable to load map locations. The tracking will still work when the driver is assigned.",
//         [{ text: "OK" }]
//       );
//     }
//   };

//   // Replace your fetchTrackingData function with this fixed version

//   const fetchTrackingData = async () => {
//     if (!tookanTaskId) {
//       console.log("No Tookan task ID available for tracking");
//       return;
//     }

//     try {
//       console.log("[Tracking] Fetching data for task:", tookanTaskId);

//       const response = await fetch(
//         `${backendUrl}/api/tookan/tracking/${tookanTaskId}`
//       );

//       console.log("[Tracking] Response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("[Tracking] HTTP Error:", response.status, errorText);
//         throw new Error(`Tracking fetch failed: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("[Tracking] Response data:", JSON.stringify(data, null, 2));

//       if (data.success && data.trackingData) {
//         setTrackingData(data.trackingData);
//         setTrackingError(null);
//         setLastTrackingUpdate(new Date().toISOString());

//         const { agent_location, job_status } = data.trackingData;

//         // Status mapping with complete Tookan status codes
//         const getStatusInfo = (status) => {
//           const statusCode = parseInt(status);
//           console.log("[Tracking] Mapping status code:", statusCode);

//           switch (statusCode) {
//             case 0:
//               return {
//                 key: "confirmed",
//                 text: "Task created",
//                 color: "#6B7280",
//               };
//             case 1:
//               return {
//                 key: "assigned",
//                 text: "Driver assigned",
//                 color: "#3B82F6",
//               };
//             case 2:
//               return {
//                 key: "started",
//                 text: "Driver en route",
//                 color: "#F59E0B",
//               };
//             case 3:
//               return {
//                 key: "completed",
//                 text: "Delivery completed ✓",
//                 color: "#10B981",
//               };
//             case 4:
//               return {
//                 key: "failed",
//                 text: "Delivery failed ✗",
//                 color: "#EF4444",
//               };
//             case 5:
//               return { key: "cancelled", text: "Cancelled", color: "#6B7280" };
//             case 6:
//               return {
//                 key: "cancelled",
//                 text: "Cancelled by dispatcher",
//                 color: "#6B7280",
//               };
//             case 7:
//               return {
//                 key: "accepted",
//                 text: "Driver accepted",
//                 color: "#3B82F6",
//               };
//             case 8:
//               return {
//                 key: "arrived",
//                 text: "Driver arrived at pickup",
//                 color: "#F59E0B",
//               };
//             case 9:
//               return {
//                 key: "started",
//                 text: "Started delivery",
//                 color: "#F59E0B",
//               };
//             case 10:
//               return {
//                 key: "unassigned",
//                 text: "Unassigned",
//                 color: "#6B7280",
//               };
//             default:
//               return { key: "confirmed", text: "Processing", color: "#6B7280" };
//           }
//         };

//         const statusInfo = getStatusInfo(job_status);
//         console.log("[Tracking] Status info:", statusInfo);

//         // Update agent location
//         if (
//           agent_location &&
//           agent_location.latitude &&
//           agent_location.longitude
//         ) {
//           const newDriverLocation = {
//             latitude: parseFloat(agent_location.latitude),
//             longitude: parseFloat(agent_location.longitude),
//           };

//           console.log("[Tracking] Driver location:", newDriverLocation);
//           setDriverLocation(newDriverLocation);

//           // Auto-center map on driver if tracking is active
//           if (isTrackingActive && mapRef.current) {
//             mapRef.current.animateToRegion(
//               {
//                 ...newDriverLocation,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               },
//               1000
//             );
//           }
//         }

//         // ✅ CRITICAL FIX: Use current deliveryData to check previous status
//         const previousStatus = deliveryData?.status;
//         const wasCompleted = previousStatus === "completed";
//         const wasFailed = previousStatus === "failed";

//         // Update delivery data with new status
//         setDeliveryData((prev) => {
//           const updated = {
//             ...prev,
//             status: statusInfo.key,
//             statusText: statusInfo.text,
//             statusColor: statusInfo.color,
//             driverName: data.trackingData.agent_name || "Not assigned",
//             driverId: data.trackingData.agent_id || null,
//             lastStatusUpdate: new Date().toISOString(),
//           };

//           console.log("[Tracking] Updated delivery data:", {
//             previousStatus,
//             newStatus: updated.status,
//             timestamp: new Date().toISOString(),
//           });

//           return updated;
//         });

//         // ✅ CRITICAL FIX: Check status changes AFTER state update using the actual status
//         // Show alert when delivery is completed (only once per session)
//         if (statusInfo.key === "completed" && !wasCompleted) {
//           console.log("[Tracking] Delivery completed!");
//           Alert.alert(
//             "Delivery Completed! 🎉",
//             "Your package has been successfully delivered.",
//             [{ text: "OK" }]
//           );

//           // Stop tracking when completed
//           if (isTrackingActive) {
//             stopLiveTracking();
//           }
//         }

//         // Show alert when delivery failed (only once per session)
//         if (statusInfo.key === "failed" && !wasFailed) {
//           console.log("[Tracking] Delivery failed!");
//           Alert.alert(
//             "Delivery Failed",
//             "There was an issue with the delivery. Please contact support.",
//             [{ text: "OK" }]
//           );
//         }

//         console.log("[Tracking] Updated status to:", {
//           status: statusInfo.key,
//           statusText: statusInfo.text,
//           timestamp: new Date().toISOString(),
//         });
//       } else {
//         setTrackingError(data.error || "No tracking data available");
//         console.error("[Tracking] API returned error:", data.error);
//       }
//     } catch (error) {
//       console.error("[Tracking] Error fetching data:", error);
//       setTrackingError(`Tracking error: ${error.message}`);
//     }
//   };

//   // Start live tracking
//   const startLiveTracking = () => {
//     if (!tookanTaskId) {
//       Alert.alert("Tracking Unavailable", "No active delivery task found.");
//       return;
//     }

//     setIsTrackingActive(true);
//     fetchTrackingData(); // Initial fetch

//     // Set up polling interval (every 30 seconds)
//     trackingIntervalRef.current = setInterval(() => {
//       fetchTrackingData();
//     }, 30000);

//     console.log("Live tracking started for task:", tookanTaskId);
//   };

//   // Stop live tracking
//   const stopLiveTracking = () => {
//     setIsTrackingActive(false);

//     if (trackingIntervalRef.current) {
//       clearInterval(trackingIntervalRef.current);
//       trackingIntervalRef.current = null;
//     }

//     console.log("Live tracking stopped");
//   };

//   // Toggle tracking state
//   const toggleLiveTracking = () => {
//     if (isTrackingActive) {
//       stopLiveTracking();
//     } else {
//       startLiveTracking();
//     }
//   };

//   // Center map on specific location
//   const centerMapOn = (location, title) => {
//     if (!location || !mapRef.current) return;

//     mapRef.current.animateToRegion(
//       {
//         ...location,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       1000
//     );

//     Alert.alert("Map Centered", `Centered on ${title}`);
//   };

//   // Fit map to show all markers
//   const fitMapToMarkers = () => {
//     if (!mapRef.current) return;

//     const markers = [
//       pickupCoordinates,
//       deliveryCoordinates,
//       driverLocation,
//     ].filter(Boolean);

//     if (markers.length === 0) return;

//     if (markers.length === 1) {
//       mapRef.current.animateToRegion(
//         {
//           ...markers[0],
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         },
//         1000
//       );
//       return;
//     }

//     const minLat = Math.min(...markers.map((m) => m.latitude));
//     const maxLat = Math.max(...markers.map((m) => m.latitude));
//     const minLng = Math.min(...markers.map((m) => m.longitude));
//     const maxLng = Math.max(...markers.map((m) => m.longitude));

//     const padding = 0.01; // Padding around markers

//     mapRef.current.animateToRegion(
//       {
//         latitude: (minLat + maxLat) / 2,
//         longitude: (minLng + maxLng) / 2,
//         latitudeDelta: maxLat - minLat + padding,
//         longitudeDelta: maxLng - minLng + padding,
//       },
//       1000
//     );
//   };

//   // Cleanup tracking on unmount
//   useEffect(() => {
//     return () => {
//       if (trackingIntervalRef.current) {
//         clearInterval(trackingIntervalRef.current);
//       }
//     };
//   }, []);

//   // Initialize map when delivery data is available
//   useEffect(() => {
//     if (deliveryData?.shipmentDetails) {
//       initializeMap();
//     }
//   }, [deliveryData]);

//   // Auto-start tracking when task ID becomes available
//   useEffect(() => {
//     if (tookanTaskId && deliveryData && !isTrackingActive) {
//       setTimeout(() => {
//         startLiveTracking();
//       }, 2000); // Delay to allow map to initialize
//     }
//   }, [tookanTaskId, deliveryData]);

//   // Function to check for recent delivery in AsyncStorage
//   const checkForRecentDelivery = async () => {
//     try {
//       const keys = await AsyncStorage.getAllKeys();
//       const deliveryKeys = keys.filter((key) =>
//         key.startsWith("recentDelivery_")
//       );

//       if (deliveryKeys.length > 0) {
//         const deliveryPromises = deliveryKeys.map(async (key) => {
//           const deliveryData = await AsyncStorage.getItem(key);
//           return deliveryData ? JSON.parse(deliveryData) : null;
//         });

//         const deliveries = await Promise.all(deliveryPromises);
//         const validDeliveries = deliveries.filter(
//           (delivery) => delivery && delivery.timestamp
//         );

//         if (validDeliveries.length > 0) {
//           const mostRecent = validDeliveries.sort(
//             (a, b) => b.timestamp - a.timestamp
//           )[0];

//           const ageInHours =
//             (Date.now() - mostRecent.timestamp) / (1000 * 60 * 60);
//           if (ageInHours < 24) {
//             return mostRecent;
//           }
//         }
//       }
//       return null;
//     } catch (error) {
//       console.log("Error checking for recent delivery:", error);
//       return null;
//     }
//   };

//   // Deep link handling
//   useEffect(() => {
//     const handleDeepLinkInLocationScreen = (event) => {
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

//       console.log("LocationScreen received deep link:", incomingUrl);

//       if (incomingUrl.includes("/payment-success")) {
//         try {
//           const urlObj = new URL(incomingUrl);
//           const sessionId = urlObj.searchParams.get("session_id");

//           if (sessionId) {
//             console.log(
//               "LocationScreen processing payment success for session:",
//               sessionId
//             );

//             if (!deliveryData || deliveryData.sessionId !== sessionId) {
//               fetchDeliveryDetailsForSession(sessionId);
//             }
//           }
//         } catch (urlError) {
//           console.error(
//             "Invalid URL in LocationScreen deep link:",
//             incomingUrl,
//             urlError
//           );
//         }
//       }
//     };

//     const linkingSubscription = Linking.addEventListener(
//       "url",
//       handleDeepLinkInLocationScreen
//     );

//     return () => {
//       linkingSubscription?.remove();
//     };
//   }, [deliveryData]);

//   const fetchDeliveryDetailsForSession = async (sessionId) => {
//     if (!sessionId) return;

//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log(
//         "Fetching delivery details for deep link session:",
//         sessionId
//       );

//       const statusResponse = await fetch(
//         `${backendUrl}/api/payment-status/${sessionId}`
//       );

//       if (!statusResponse.ok) {
//         throw new Error(
//           `Failed to get payment status: ${statusResponse.status}`
//         );
//       }

//       const statusData = await statusResponse.json();
//       console.log("Deep link payment status data:", statusData);

//       if (statusData.paymentStatus !== "paid") {
//         setError(`Payment not completed. Status: ${statusData.paymentStatus}`);
//         return;
//       }

//       const deliveryInfo = {
//         sessionId: sessionId,
//         status: "payment_completed",
//         paymentStatus: statusData.paymentStatus,
//         shipmentDetails: statusData.shipmentDetails,
//         totalAmount: statusData.totalAmount,
//         createdAt: statusData.createdAt,
//         completedAt: statusData.completedAt,
//         fromDeepLink: true,
//       };

//       setDeliveryData(deliveryInfo);
//       await storeDeliveryData(deliveryInfo);

//       await AsyncStorage.removeItem("pendingPayment");

//       if (statusData.shipmentDetails) {
//         createTookanTask(sessionId, statusData.shipmentDetails);
//       }

//       Alert.alert(
//         "Payment Confirmed",
//         "Your delivery has been confirmed and is being processed.",
//         [{ text: "OK" }]
//       );
//     } catch (error) {
//       console.error("Error fetching delivery details from deep link:", error);
//       setError(`Failed to load delivery details: ${error.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const storeDeliveryData = async (deliveryData) => {
//     try {
//       const storageKey = `recentDelivery_${deliveryData.sessionId}`;
//       const storageData = {
//         ...deliveryData,
//         timestamp: Date.now(),
//       };
//       await AsyncStorage.setItem(storageKey, JSON.stringify(storageData));
//     } catch (error) {
//       console.log("Error storing delivery data:", error);
//     }
//   };

//   useFocusEffect(
//     React.useCallback(() => {
//       const initializeScreen = async () => {
//         console.log("LocationScreen focused with params:", params);

//         const checkPendingPayment = async () => {
//           try {
//             const pendingPayment = await AsyncStorage.getItem("pendingPayment");
//             if (pendingPayment) {
//               const paymentData = JSON.parse(pendingPayment);
//               console.log("Found pending payment:", paymentData);

//               const statusResponse = await fetch(
//                 `${backendUrl}/api/payment-status/${paymentData.sessionId}`
//               );

//               if (statusResponse.ok) {
//                 const statusData = await statusResponse.json();
//                 console.log("Pending payment status:", statusData);

//                 if (statusData.paymentStatus === "paid") {
//                   await AsyncStorage.removeItem("pendingPayment");

//                   const deliveryInfo = {
//                     sessionId: paymentData.sessionId,
//                     status: "payment_completed",
//                     paymentStatus: statusData.paymentStatus,
//                     shipmentDetails:
//                       statusData.shipmentDetails || paymentData.shipmentDetails,
//                     totalAmount:
//                       statusData.totalAmount || paymentData.totalAmount,
//                     createdAt: statusData.createdAt,
//                     completedAt: statusData.completedAt,
//                   };

//                   setDeliveryData(deliveryInfo);
//                   await storeDeliveryData(deliveryInfo);

//                   if (deliveryInfo.shipmentDetails) {
//                     createTookanTask(
//                       paymentData.sessionId,
//                       deliveryInfo.shipmentDetails
//                     );
//                   }
//                   return true;
//                 }
//               }
//             }
//           } catch (error) {
//             console.log("Error checking pending payment:", error);
//           }
//           return false;
//         };

//         if (sessionId && paymentStatus === "completed") {
//           if (shipmentDetails && verifiedPayment) {
//             const deliveryInfo = {
//               sessionId: sessionId,
//               status: "payment_completed",
//               paymentStatus: verifiedPayment.paymentStatus,
//               shipmentDetails: shipmentDetails,
//               totalAmount: verifiedPayment.totalAmount,
//               createdAt: verifiedPayment.createdAt,
//               completedAt: verifiedPayment.completedAt,
//             };
//             setDeliveryData(deliveryInfo);
//             await storeDeliveryData(deliveryInfo);
//             createTookanTask(sessionId, shipmentDetails);
//             return;
//           } else {
//             fetchDeliveryDetails();
//             return;
//           }
//         }

//         const handledPending = await checkPendingPayment();

//         if (!handledPending && !hasCheckedForDelivery) {
//           setHasCheckedForDelivery(true);
//           const recentDelivery = await checkForRecentDelivery();

//           if (recentDelivery) {
//             console.log("Found recent delivery:", recentDelivery);
//             setDeliveryData(recentDelivery);

//             if (
//               recentDelivery.shipmentDetails &&
//               !recentDelivery.tookanTaskId
//             ) {
//               try {
//                 const statusResponse = await fetch(
//                   `${backendUrl}/api/payment-status/${recentDelivery.sessionId}`
//                 );

//                 if (statusResponse.ok) {
//                   const statusData = await statusResponse.json();
//                   if (statusData.paymentStatus === "paid") {
//                     createTookanTask(
//                       recentDelivery.sessionId,
//                       recentDelivery.shipmentDetails
//                     );
//                   } else {
//                     console.log("Session exists but payment not confirmed");
//                   }
//                 } else {
//                   console.log(
//                     "Session not found on backend, skipping Tookan task creation"
//                   );
//                   setError(
//                     "Previous session expired. Please create a new delivery."
//                   );
//                 }
//               } catch (error) {
//                 console.log("Error checking session status:", error);
//                 setError(
//                   "Unable to verify previous session. Please create a new delivery."
//                 );
//               }
//             } else if (recentDelivery.tookanTaskId) {
//               setTookanTaskId(recentDelivery.tookanTaskId);
//               setTrackingUrl(recentDelivery.trackingUrl);
//             }
//           } else {
//             setError(
//               "No recent delivery found. Create a new delivery to track."
//             );
//           }
//         }
//       };

//       initializeScreen();
//     }, [sessionId, paymentStatus, shipmentDetails, verifiedPayment])
//   );

//   const fetchDeliveryDetails = async () => {
//     if (!sessionId) {
//       setError("No session ID provided");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log("Fetching delivery details for session:", sessionId);

//       const statusResponse = await fetch(
//         `${backendUrl}/api/payment-status/${sessionId}`
//       );

//       if (!statusResponse.ok) {
//         throw new Error(
//           `Failed to get payment status: ${statusResponse.status}`
//         );
//       }

//       const statusData = await statusResponse.json();
//       console.log("Payment status data:", statusData);

//       if (statusData.paymentStatus !== "paid") {
//         setError(`Payment not completed. Status: ${statusData.paymentStatus}`);
//         return;
//       }

//       const deliveryInfo = {
//         sessionId: sessionId,
//         status: "payment_completed",
//         paymentStatus: statusData.paymentStatus,
//         shipmentDetails: statusData.shipmentDetails,
//         totalAmount: statusData.totalAmount,
//         createdAt: statusData.createdAt,
//         completedAt: statusData.completedAt,
//       };

//       setDeliveryData(deliveryInfo);
//       await storeDeliveryData(deliveryInfo);

//       if (statusData.shipmentDetails) {
//         createTookanTask(sessionId, statusData.shipmentDetails);
//       }
//     } catch (error) {
//       console.error("Error fetching delivery details:", error);
//       setError(`Failed to load delivery details: ${error.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const createTookanTask = async (sessionId, shipmentDetails) => {
//     if (!sessionId || !shipmentDetails) {
//       console.log(
//         "Cannot create Tookan task: missing sessionId or shipmentDetails"
//       );
//       return;
//     }

//     setIsCreatingTask(true);
//     setTaskCreationStatus("Creating delivery task...");

//     try {
//       console.log("Creating Tookan task for session:", sessionId);

//       const sessionTaskResponse = await fetch(
//         `${backendUrl}/api/session/${sessionId}/create-tookan-task`
//       );

//       if (sessionTaskResponse.ok) {
//         const sessionTaskData = await sessionTaskResponse.json();
//         console.log("Session-based task creation response:", sessionTaskData);

//         if (sessionTaskData.success) {
//           setTookanTaskId(sessionTaskData.tookanTaskId);
//           setTrackingUrl(sessionTaskData.trackingUrl);
//           setTaskCreationStatus(
//             sessionTaskData.message || "Task created successfully"
//           );

//           setDeliveryData((prev) => {
//             const updated = {
//               ...prev,
//               tookanTaskId: sessionTaskData.tookanTaskId,
//               trackingUrl: sessionTaskData.trackingUrl,
//               deliveryId: sessionTaskData.deliveryId,
//             };
//             storeDeliveryData(updated);
//             return updated;
//           });

//           return;
//         }
//       }

//       const directTaskResponse = await fetch(
//         `${backendUrl}/api/tookan/create-task`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             sessionId: sessionId,
//             shipmentDetails: shipmentDetails,
//           }),
//         }
//       );

//       const directTaskData = await directTaskResponse.json();
//       console.log("Direct task creation response:", directTaskData);

//       if (directTaskResponse.ok && directTaskData.success) {
//         setTookanTaskId(directTaskData.tookanTaskId);
//         setTrackingUrl(directTaskData.trackingUrl);
//         setTaskCreationStatus(
//           directTaskData.message || "Task created successfully"
//         );

//         setDeliveryData((prev) => {
//           const updated = {
//             ...prev,
//             tookanTaskId: directTaskData.tookanTaskId,
//             trackingUrl: directTaskData.trackingUrl,
//             deliveryId: directTaskData.deliveryId,
//           };
//           storeDeliveryData(updated);
//           return updated;
//         });
//       } else {
//         throw new Error(
//           directTaskData.error || "Failed to create delivery task"
//         );
//       }
//     } catch (error) {
//       console.error("Error creating Tookan task:", error);
//       setTaskCreationStatus(`Task creation failed: ${error.message}`);

//       if (deliveryData) {
//         console.log("Continuing without Tookan task - delivery data available");
//       }
//     } finally {
//       setIsCreatingTask(false);
//       setTimeout(() => setTaskCreationStatus(null), 5000);
//     }
//   };

//   const handleGoBack = () => {
//     if (navigation.canGoBack()) {
//       navigation.goBack();
//     } else {
//       navigation.navigate("Home");
//     }
//   };

//   const handleRetry = () => {
//     if (sessionId) {
//       fetchDeliveryDetails();
//     } else {
//       setError(null);
//       setHasCheckedForDelivery(false);
//       navigation.navigate("Send", { screen: "PackageDetails" });
//     }
//   };

//   const handleCreateNewDelivery = () => {
//     navigation.navigate("Send", { screen: "PackageDetails" });
//   };

//   const handleOpenExternalTracking = () => {
//     if (trackingUrl) {
//       Linking.openURL(trackingUrl);
//     } else {
//       Alert.alert(
//         "Tracking Unavailable",
//         "External tracking URL is not available yet."
//       );
//     }
//   };

//   const formatCurrency = (amount) => {
//     if (!amount) return "£0.00";
//     return new Intl.NumberFormat("en-GB", {
//       style: "currency",
//       currency: "GBP",
//     }).format(amount);
//   };

//   // //   // const getDeliveryStatusColor = () => {
//   // //   //   if (!deliveryData) return "#6B7280";

//   // //   //   switch (deliveryData.status) {
//   // //   //     case "completed":
//   // //   //       return "#10B981"; // Green
//   // //   //     case "started":
//   // //   //       return "#F59E0B"; // Yellow
//   // //   //     case "assigned":
//   // //   //       return "#3B82F6"; // Blue
//   // //   //     case "failed":
//   // //   //       return "#EF4444"; // Red
//   // //   //     default:
//   // //   //       return "#6B7280"; // Gray
//   // //   //   }
//   // //   // };

//   // //   // const getTrackingStatusText = () => {
//   // //   //   if (trackingError) return "Tracking unavailable";
//   // //   //   if (!isTrackingActive) return "Tap to start live tracking";
//   // //   //   if (!trackingData) return "Connecting...";

//   // //   //   const timeSinceUpdate = lastTrackingUpdate
//   // //   //     ? Math.floor((Date.now() - new Date(lastTrackingUpdate).getTime()) / 1000)
//   // //   //     : 0;

//   // //   //   return `Live tracking • Updated ${timeSinceUpdate}s ago`;
//   // //   // };
//   // //   // const getDeliveryStatusText = () => {
//   // //   //   if (isCreatingTask) return "Setting up delivery...";
//   // //   //   if (!deliveryData) return "Loading...";

//   // //   //   // Use the statusText if available
//   // //   //   if (deliveryData.statusText) return deliveryData.statusText;

//   // //   //   // Fallback to status key
//   // //   //   switch (deliveryData.status) {
//   // //   //     case "completed":
//   // //   //       return "Delivery completed ✓";
//   // //   //     case "started":
//   // //   //       return "Driver en route 🚗";
//   // //   //     case "assigned":
//   // //   //     case "accepted":
//   // //   //       return "Driver assigned";
//   // //   //     case "arrived":
//   // //   //       return "Driver arrived";
//   // //   //     case "failed":
//   // //   //       return "Delivery failed ✗";
//   // //   //     case "cancelled":
//   // //   //       return "Cancelled";
//   // //   //     default:
//   // //   //       return tookanTaskId
//   // //   //         ? "Awaiting driver assignment"
//   // //   //         : "Payment confirmed";
//   // //   //   }
//   // //   // };
//   const getDeliveryStatusColor = () => {
//     if (!deliveryData) return "#6B7280";

//     // Use statusColor if available from tracking data
//     if (deliveryData.statusColor) {
//       return deliveryData.statusColor;
//     }

//     // Fallback to status key
//     switch (deliveryData.status) {
//       case "completed":
//         return "#10B981"; // Green
//       case "started":
//       case "arrived":
//         return "#F59E0B"; // Orange/Yellow
//       case "assigned":
//       case "accepted":
//         return "#3B82F6"; // Blue
//       case "failed":
//         return "#EF4444"; // Red
//       case "cancelled":
//         return "#6B7280"; // Gray
//       default:
//         return "#6B7280"; // Gray
//     }
//   };
//   const getDeliveryStatusText = () => {
//     if (isCreatingTask) return "Setting up delivery...";
//     if (!deliveryData) return "Loading...";

//     // Use the statusText if available (from tracking data)
//     if (deliveryData.statusText) {
//       return deliveryData.statusText;
//     }

//     // Fallback to status key
//     switch (deliveryData.status) {
//       case "completed":
//         return "Delivery completed ✓";
//       case "started":
//         return "Driver en route 🚗";
//       case "assigned":
//         return "Driver assigned";
//       case "accepted":
//         return "Driver accepted";
//       case "arrived":
//         return "Driver arrived at pickup";
//       case "failed":
//         return "Delivery failed ✗";
//       case "cancelled":
//         return "Cancelled";
//       case "unassigned":
//         return "Unassigned";
//       default:
//         return tookanTaskId
//           ? "Awaiting driver assignment"
//           : "Payment confirmed";
//     }
//   };
//   const getTrackingStatusText = () => {
//     if (trackingError) return "Tracking unavailable";
//     if (!isTrackingActive) return "Tap to start live tracking";
//     if (!trackingData) return "Connecting...";

//     const timeSinceUpdate = lastTrackingUpdate
//       ? Math.floor((Date.now() - new Date(lastTrackingUpdate).getTime()) / 1000)
//       : 0;

//     return `Live tracking • Updated ${timeSinceUpdate}s ago`;
//   };

//   const generateHTMLContent = () => {
//     if (!deliveryData || !deliveryData.shipmentDetails) return "";

//     const statusColor = getDeliveryStatusColor();
//     const statusText = getDeliveryStatusText();

//     return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <style>
//           * {
//             margin: 0;
//             padding: 0;
//             box-sizing: border-box;
//           }
//           body {
//             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             padding: 40px 20px;
//             background: #ffffff;
//             color: #111827;
//           }
//           .container {
//             max-width: 800px;
//             margin: 0 auto;
//           }
//           .header {
//             text-align: center;
//             margin-bottom: 40px;
//             border-bottom: 3px solid #8328FA;
//             padding-bottom: 20px;
//           }
//           .header h1 {
//             color: #8328FA;
//             font-size: 32px;
//             margin-bottom: 10px;
//           }
//           .header p {
//             color: #6B7280;
//             font-size: 14px;
//           }
//           .status-badge {
//             display: inline-block;
//             background: ${statusColor};
//             color: white;
//             padding: 8px 16px;
//             border-radius: 20px;
//             font-weight: 600;
//             font-size: 14px;
//             margin: 20px 0;
//           }
//           .section {
//             margin-bottom: 30px;
//             background: #F9FAFB;
//             padding: 20px;
//             border-radius: 12px;
//           }
//           .section-title {
//             font-size: 18px;
//             font-weight: 600;
//             color: #111827;
//             margin-bottom: 15px;
//             display: flex;
//             align-items: center;
//           }
//           .section-title::before {
//             content: '';
//             width: 4px;
//             height: 20px;
//             background: #8328FA;
//             margin-right: 10px;
//             border-radius: 2px;
//           }
//           .info-row {
//             display: flex;
//             justify-content: space-between;
//             padding: 12px 0;
//             border-bottom: 1px solid #E5E7EB;
//           }
//           .info-row:last-child {
//             border-bottom: none;
//           }
//           .info-label {
//             color: #6B7280;
//             font-size: 14px;
//           }
//           .info-value {
//             font-weight: 600;
//             font-size: 14px;
//             color: #111827;
//             text-align: right;
//           }
//           .address-block {
//             background: white;
//             padding: 15px;
//             border-radius: 8px;
//             margin-bottom: 15px;
//           }
//           .address-label {
//             color: #6B7280;
//             font-size: 12px;
//             margin-bottom: 8px;
//             display: flex;
//             align-items: center;
//           }
//           .address-text {
//             color: #111827;
//             font-weight: 600;
//             font-size: 14px;
//             line-height: 1.5;
//           }
//           .footer {
//             margin-top: 40px;
//             padding-top: 20px;
//             border-top: 2px solid #E5E7EB;
//             text-align: center;
//             color: #6B7280;
//             font-size: 12px;
//           }
//           .tracking-ids {
//             background: #EBF8FF;
//             padding: 15px;
//             border-radius: 8px;
//             margin-bottom: 15px;
//           }
//           .tracking-id {
//             font-family: 'Courier New', monospace;
//             color: #1E40AF;
//             font-size: 13px;
//             margin: 5px 0;
//           }
//           @media print {
//             body {
//               padding: 20px;
//             }
//             .no-print {
//               display: none;
//             }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Delivery Receipt</h1>
//             <p>Generated on ${new Date().toLocaleString()}</p>
//             <div class="status-badge">${statusText}</div>
//           </div>

//           ${
//             deliveryData.deliveryId || tookanTaskId
//               ? `
//           <div class="section tracking-ids">
//             <div class="section-title">Tracking Information</div>
//             ${
//               deliveryData.deliveryId
//                 ? `<div class="tracking-id"><strong>Delivery ID:</strong> ${deliveryData.deliveryId}</div>`
//                 : ""
//             }
//             ${
//               tookanTaskId
//                 ? `<div class="tracking-id"><strong>Task ID:</strong> ${tookanTaskId}</div>`
//                 : ""
//             }
//             ${
//               deliveryData.sessionId
//                 ? `<div class="tracking-id"><strong>Session ID:</strong> ${deliveryData.sessionId}</div>`
//                 : ""
//             }
//           </div>
//           `
//               : ""
//           }

//           <div class="section">
//             <div class="section-title">Delivery Details</div>
//             <div class="info-row">
//               <span class="info-label">Delivery Type</span>
//               <span class="info-value">${
//                 deliveryData.shipmentDetails.deliveryType || "Standard"
//               }</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Item Type</span>
//               <span class="info-value">${
//                 deliveryData.shipmentDetails.itemType
//               }</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Weight</span>
//               <span class="info-value">${
//                 deliveryData.shipmentDetails.selectedWeight
//               }</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Fragile</span>
//               <span class="info-value">${
//                 deliveryData.shipmentDetails.isFragile ? "Yes" : "No"
//               }</span>
//             </div>
//             <div class="info-row">
//               <span class="info-label">Total Amount</span>
//               <span class="info-value">${formatCurrency(
//                 deliveryData.totalAmount
//               )}</span>
//             </div>
//           </div>

//           <div class="section">
//             <div class="section-title">Locations</div>
//             <div class="address-block">
//               <div class="address-label">📍 Pickup Location</div>
//               <div class="address-text">${
//                 deliveryData.shipmentDetails.pickupAddress
//               }</div>
//               <div class="info-value" style="margin-top: 8px; font-size: 12px;">
//                 ${deliveryData.shipmentDetails.pickupPostcode || ""}
//               </div>
//             </div>
//             <div class="address-block">
//               <div class="address-label">📍 Delivery Location</div>
//               <div class="address-text">${
//                 deliveryData.shipmentDetails.receiverAddress
//               }</div>
//               <div class="info-value" style="margin-top: 8px; font-size: 12px;">
//                 ${deliveryData.shipmentDetails.receiverPostcode || ""}
//               </div>
//             </div>
//           </div>

//           ${
//             deliveryData.shipmentDetails.receiverName ||
//             deliveryData.shipmentDetails.receiverPhone
//               ? `
//           <div class="section">
//             <div class="section-title">Receiver Information</div>
//             ${
//               deliveryData.shipmentDetails.receiverName
//                 ? `
//             <div class="info-row">
//               <span class="info-label">Name</span>
//               <span class="info-value">${deliveryData.shipmentDetails.receiverName}</span>
//             </div>
//             `
//                 : ""
//             }
//             ${
//               deliveryData.shipmentDetails.receiverPhone
//                 ? `
//             <div class="info-row">
//               <span class="info-label">Phone</span>
//               <span class="info-value">${deliveryData.shipmentDetails.receiverPhone}</span>
//             </div>
//             `
//                 : ""
//             }
//           </div>
//           `
//               : ""
//           }

//           <div class="footer">
//             <p>This is a computer-generated receipt and does not require a signature.</p>
//             <p style="margin-top: 8px;">For any inquiries, please contact support with your delivery ID.</p>
//           </div>
//         </div>
//       </body>
//     </html>
//   `;
//   };

//   const handlePrint = async () => {
//     try {
//       const html = generateHTMLContent();
//       await Print.printAsync({
//         html,
//         printerUrl: undefined,
//       });
//     } catch (error) {
//       console.error("Print error:", error);
//       Alert.alert("Print Error", "Unable to print at this time.");
//     }
//   };

//   const handleShare = async () => {
//     try {
//       const html = generateHTMLContent();
//       const { uri } = await Print.printToFileAsync({ html });

//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri);
//       } else {
//         Alert.alert(
//           "Sharing Unavailable",
//           "Sharing is not available on this device."
//         );
//       }
//     } catch (error) {
//       console.error("Share error:", error);
//       Alert.alert("Share Error", "Unable to share at this time.");
//     }
//   };

//   if (isLoading) {
//     return (
//       <SafeAreaView className="flex-1 bg-white">
//         <View className="flex-1 justify-center items-center">
//           <ActivityIndicator size="large" color="#8328FA" />
//           <Text className="mt-4 text-gray-600 text-center px-6">
//             Loading delivery details...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error) {
//     return (
//       <SafeAreaView className="flex-1 bg-white">
//         <View className="absolute top-14 left-6 z-10">
//           <TouchableOpacity
//             className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
//             onPress={handleGoBack}
//           >
//             <ChevronLeft size={24} color="#000" />
//           </TouchableOpacity>
//         </View>

//         <View className="flex-1 justify-center items-center p-6">
//           <Text className="text-xl font-semibold text-red-600 mb-4 text-center">
//             {error.includes("No recent delivery")
//               ? "No Active Delivery"
//               : "Error"}
//           </Text>
//           <Text className="text-gray-600 text-center mb-6">{error}</Text>
//           <TouchableOpacity
//             className="bg-[#8328FA] px-6 py-3 rounded-lg mb-3"
//             onPress={handleCreateNewDelivery}
//           >
//             <Text className="text-white font-semibold">
//               Create New Delivery
//             </Text>
//           </TouchableOpacity>
//           {sessionId && (
//             <TouchableOpacity
//               className="border border-[#8328FA] px-6 py-3 rounded-lg"
//               onPress={handleRetry}
//             >
//               <Text className="text-[#8328FA] font-semibold">Try Again</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
//       {/* Fixed Header */}
//       <View
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           zIndex: 20,
//           backgroundColor: "white",
//           flexDirection: "row",
//           alignItems: "center",
//           paddingHorizontal: 24,
//           paddingVertical: 16,
//           height: 60,
//         }}
//       >
//         <TouchableOpacity
//           style={{
//             width: 40,
//             height: 40,
//             backgroundColor: "white",
//             borderRadius: 20,
//             alignItems: "center",
//             justifyContent: "center",
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.1,
//             shadowRadius: 8,
//             elevation: 3,
//           }}
//           onPress={handleGoBack}
//         >
//           <ChevronLeft size={24} color="#000" />
//         </TouchableOpacity>

//         <View style={{ flex: 1, alignItems: "center" }}>
//           <Text style={{ fontSize: 18, fontWeight: "600", color: "#000" }}>
//             {deliveryData ? "Live Tracking" : "Delivery Status"}
//           </Text>
//         </View>

//         {/* Map Controls */}
//         <View style={{ flexDirection: "row", alignItems: "center" }}>
//           {deliveryData && (
//             <TouchableOpacity
//               style={{
//                 width: 40,
//                 height: 40,
//                 backgroundColor: isTrackingActive ? "#10B981" : "#6B7280",
//                 borderRadius: 20,
//                 alignItems: "center",
//                 justifyContent: "center",
//                 marginRight: 8,
//               }}
//               onPress={toggleLiveTracking}
//             >
//               <Navigation size={16} color="white" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Scrollable Content */}
//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{ paddingTop: 60 }}
//         showsVerticalScrollIndicator={false}
//         bounces={false}
//       >
//         {/* Live Map Container */}
//         <View style={{ height: 350, backgroundColor: "#f5f5f5" }}>
//           <MapView
//             ref={mapRef}
//             provider={PROVIDER_GOOGLE}
//             style={{ flex: 1 }}
//             region={mapRegion}
//             onRegionChangeComplete={setMapRegion}
//             showsUserLocation={false}
//             showsMyLocationButton={false}
//             showsCompass={true}
//             showsScale={true}
//             loadingEnabled={true}
//             loadingIndicatorColor="#8328FA"
//             mapType="standard"
//           >
//             {/* Pickup Marker */}
//             {pickupCoordinates && (
//               <Marker
//                 coordinate={pickupCoordinates}
//                 title="Pickup Location"
//                 description={
//                   deliveryData?.shipmentDetails?.pickupAddress || "Pickup"
//                 }
//                 pinColor="#3B82F6"
//                 identifier="pickup"
//               />
//             )}

//             {/* Delivery Marker */}
//             {deliveryCoordinates && (
//               <Marker
//                 coordinate={deliveryCoordinates}
//                 title="Delivery Location"
//                 description={
//                   deliveryData?.shipmentDetails?.receiverAddress || "Delivery"
//                 }
//                 pinColor="#10B981"
//                 identifier="delivery"
//               />
//             )}

//             {/* Driver Marker */}
//             {driverLocation && (
//               <Marker
//                 coordinate={driverLocation}
//                 title="Driver Location"
//                 description="Current driver position"
//                 pinColor="#F59E0B"
//                 identifier="driver"
//               >
//                 <View
//                   style={{
//                     width: 30,
//                     height: 30,
//                     borderRadius: 15,
//                     backgroundColor: "#F59E0B",
//                     borderWidth: 3,
//                     borderColor: "white",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <View
//                     style={{
//                       width: 12,
//                       height: 12,
//                       borderRadius: 6,
//                       backgroundColor: "white",
//                     }}
//                   />
//                 </View>
//               </Marker>
//             )}

//             {/* Route Polyline */}
//             {routeCoordinates.length > 1 && (
//               <Polyline
//                 coordinates={routeCoordinates}
//                 strokeColor="#8328FA"
//                 strokeWidth={3}
//                 strokePattern={[1]}
//               />
//             )}
//           </MapView>

//           {/* Map Overlay Controls */}
//           <View
//             style={{
//               position: "absolute",
//               top: 16,
//               left: 16,
//               right: 16,
//               zIndex: 10,
//             }}
//           >
//             {/* Tracking Status */}
//             <TouchableOpacity
//               style={{
//                 backgroundColor: "rgba(0,0,0,0.8)",
//                 paddingHorizontal: 12,
//                 paddingVertical: 8,
//                 borderRadius: 20,
//                 flexDirection: "row",
//                 alignItems: "center",
//                 alignSelf: "flex-start",
//                 marginBottom: 8,
//               }}
//               onPress={toggleLiveTracking}
//             >
//               <View
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: 4,
//                   backgroundColor: isTrackingActive ? "#10B981" : "#6B7280",
//                   marginRight: 8,
//                 }}
//               />
//               <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }}>
//                 {getTrackingStatusText()}
//               </Text>
//               {isTrackingActive && (
//                 <RefreshCw size={12} color="white" style={{ marginLeft: 4 }} />
//               )}
//             </TouchableOpacity>

//             {/* Delivery Status */}
//             <View
//               style={{
//                 backgroundColor: "rgba(0,0,0,0.7)",
//                 paddingHorizontal: 12,
//                 paddingVertical: 6,
//                 borderRadius: 16,
//                 alignSelf: "flex-start",
//               }}
//             >
//               <Text
//                 style={{
//                   color: "white",
//                   fontSize: 11,
//                   fontWeight: "500",
//                 }}
//               >
//                 {getDeliveryStatusText()}
//               </Text>
//             </View>
//           </View>

//           {/* Map Action Buttons */}
//           <View
//             style={{
//               position: "absolute",
//               bottom: 16,
//               right: 16,
//               zIndex: 10,
//             }}
//           >
//             <TouchableOpacity
//               style={{
//                 width: 44,
//                 height: 44,
//                 backgroundColor: "white",
//                 borderRadius: 22,
//                 alignItems: "center",
//                 justifyContent: "center",
//                 marginBottom: 8,
//                 shadowColor: "#000",
//                 shadowOffset: { width: 0, height: 2 },
//                 shadowOpacity: 0.2,
//                 shadowRadius: 4,
//                 elevation: 3,
//               }}
//               onPress={fitMapToMarkers}
//             >
//               <Search size={20} color="#6B7280" />
//             </TouchableOpacity>

//             {driverLocation && (
//               <TouchableOpacity
//                 style={{
//                   width: 44,
//                   height: 44,
//                   backgroundColor: "white",
//                   borderRadius: 22,
//                   alignItems: "center",
//                   justifyContent: "center",
//                   marginBottom: 8,
//                   shadowColor: "#000",
//                   shadowOffset: { width: 0, height: 2 },
//                   shadowOpacity: 0.2,
//                   shadowRadius: 4,
//                   elevation: 3,
//                 }}
//                 onPress={() => centerMapOn(driverLocation, "Driver")}
//               >
//                 <Navigation size={18} color="#F59E0B" />
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Quick Location Buttons */}
//           <View
//             style={{
//               position: "absolute",
//               bottom: 16,
//               left: 16,
//               zIndex: 10,
//               flexDirection: "row",
//             }}
//           >
//             {pickupCoordinates && (
//               <TouchableOpacity
//                 style={{
//                   backgroundColor: "rgba(59, 130, 246, 0.9)",
//                   paddingHorizontal: 8,
//                   paddingVertical: 4,
//                   borderRadius: 12,
//                   marginRight: 6,
//                 }}
//                 onPress={() => centerMapOn(pickupCoordinates, "Pickup")}
//               >
//                 <Text
//                   style={{ color: "white", fontSize: 10, fontWeight: "500" }}
//                 >
//                   Pickup
//                 </Text>
//               </TouchableOpacity>
//             )}

//             {deliveryCoordinates && (
//               <TouchableOpacity
//                 style={{
//                   backgroundColor: "rgba(16, 185, 129, 0.9)",
//                   paddingHorizontal: 8,
//                   paddingVertical: 4,
//                   borderRadius: 12,
//                 }}
//                 onPress={() => centerMapOn(deliveryCoordinates, "Delivery")}
//               >
//                 <Text
//                   style={{ color: "white", fontSize: 10, fontWeight: "500" }}
//                 >
//                   Delivery
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Content Section */}
//         <View
//           style={{
//             backgroundColor: "white",
//             borderTopLeftRadius: 24,
//             borderTopRightRadius: 24,
//             paddingHorizontal: 24,
//             paddingTop: 24,
//             paddingBottom: 50,
//             marginTop: -20,
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: -4 },
//             shadowOpacity: 0.1,
//             shadowRadius: 12,
//             elevation: 8,
//           }}
//         >
//           {/* Handle */}
//           <View
//             style={{
//               width: 48,
//               height: 4,
//               backgroundColor: "#D1D5DB",
//               borderRadius: 12,
//               alignSelf: "center",
//               marginBottom: 24,
//             }}
//           />

//           {/* Tracking Controls */}
//           {deliveryData && tookanTaskId && (
//             <View style={{ marginBottom: 24 }}>
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   marginBottom: 16,
//                 }}
//               >
//                 <Text
//                   style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
//                 >
//                   Live Tracking
//                 </Text>
//                 <TouchableOpacity
//                   style={{
//                     flexDirection: "row",
//                     alignItems: "center",
//                     backgroundColor: isTrackingActive ? "#FEE2E2" : "#EBF8FF",
//                     paddingHorizontal: 12,
//                     paddingVertical: 6,
//                     borderRadius: 16,
//                   }}
//                   onPress={toggleLiveTracking}
//                 >
//                   <View
//                     style={{
//                       width: 6,
//                       height: 6,
//                       borderRadius: 3,
//                       backgroundColor: isTrackingActive ? "#EF4444" : "#3B82F6",
//                       marginRight: 6,
//                     }}
//                   />
//                   <Text
//                     style={{
//                       fontSize: 12,
//                       fontWeight: "500",
//                       color: isTrackingActive ? "#EF4444" : "#3B82F6",
//                     }}
//                   >
//                     {isTrackingActive ? "Stop" : "Start"}
//                   </Text>
//                 </TouchableOpacity>
//               </View>

//               {/* Tracking Info */}
//               <View
//                 style={{
//                   backgroundColor: "#F9FAFB",
//                   padding: 16,
//                   borderRadius: 12,
//                   marginBottom: 16,
//                 }}
//               >
//                 <View
//                   style={{
//                     flexDirection: "row",
//                     justifyContent: "space-between",
//                     marginBottom: 8,
//                   }}
//                 >
//                   <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                     Status:
//                   </Text>
//                   <Text
//                     style={{
//                       fontWeight: "600",
//                       fontSize: 12,
//                       color: getDeliveryStatusColor(),
//                     }}
//                   >
//                     {getDeliveryStatusText()}
//                   </Text>
//                 </View>

//                 {trackingData && (
//                   <>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Driver Location:
//                       </Text>
//                       <Text
//                         style={{
//                           fontWeight: "600",
//                           fontSize: 12,
//                           color: "#111827",
//                         }}
//                       >
//                         {driverLocation ? "Available" : "Not available"}
//                       </Text>
//                     </View>

//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Last Update:
//                       </Text>
//                       <Text
//                         style={{
//                           fontWeight: "600",
//                           fontSize: 12,
//                           color: "#111827",
//                         }}
//                       >
//                         {lastTrackingUpdate
//                           ? new Date(lastTrackingUpdate).toLocaleTimeString()
//                           : "Never"}
//                       </Text>
//                     </View>
//                   </>
//                 )}

//                 {trackingError && (
//                   <Text
//                     style={{
//                       color: "#EF4444",
//                       fontSize: 12,
//                       marginTop: 8,
//                       textAlign: "center",
//                     }}
//                   >
//                     {trackingError}
//                   </Text>
//                 )}
//               </View>

//               {/* External Tracking Button */}
//               <TouchableOpacity
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   backgroundColor: "#F3F4F6",
//                   paddingVertical: 12,
//                   paddingHorizontal: 16,
//                   borderRadius: 8,
//                   borderWidth: 1,
//                   borderColor: "#D1D5DB",
//                 }}
//                 onPress={handleOpenExternalTracking}
//                 disabled={!trackingUrl}
//               >
//                 <ExternalLink
//                   size={16}
//                   color={trackingUrl ? "#6B7280" : "#9CA3AF"}
//                 />
//                 <Text
//                   style={{
//                     marginLeft: 8,
//                     fontSize: 14,
//                     fontWeight: "500",
//                     color: trackingUrl ? "#6B7280" : "#9CA3AF",
//                   }}
//                 >
//                   Open in Tookan Tracker
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* Package Information */}
//           <Text
//             style={{
//               fontSize: 20,
//               fontWeight: "600",
//               marginBottom: 16,
//               color: "#111827",
//             }}
//           >
//             Delivery Information
//           </Text>

//           {deliveryData ? (
//             <>
//               {/* Status Section */}
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   marginBottom: 24,
//                 }}
//               >
//                 <View style={{ flex: 1, marginRight: 16 }}>
//                   <Text
//                     style={{ color: "#6B7280", marginBottom: 4, fontSize: 12 }}
//                   >
//                     Delivery Type
//                   </Text>
//                   <Text style={{ fontWeight: "600", fontSize: 14 }}>
//                     {deliveryData.shipmentDetails?.deliveryType ||
//                       "Standard delivery"}
//                   </Text>
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text
//                     style={{ color: "#6B7280", marginBottom: 4, fontSize: 12 }}
//                   >
//                     Status
//                   </Text>
//                   <Text
//                     style={{
//                       fontWeight: "600",
//                       color: getDeliveryStatusColor(),
//                       fontSize: 14,
//                     }}
//                   >
//                     {getDeliveryStatusText()}
//                   </Text>
//                 </View>
//               </View>

//               {/* Task Information */}
//               {(tookanTaskId || trackingUrl || deliveryData.deliveryId) && (
//                 <View
//                   style={{
//                     marginBottom: 24,
//                     backgroundColor: "#EBF8FF",
//                     padding: 16,
//                     borderRadius: 12,
//                   }}
//                 >
//                   <Text
//                     style={{
//                       color: "#1E40AF",
//                       fontWeight: "600",
//                       marginBottom: 8,
//                       fontSize: 14,
//                     }}
//                   >
//                     Tracking Details
//                   </Text>

//                   {deliveryData.deliveryId && (
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#3B82F6", fontSize: 12 }}>
//                         Delivery ID:
//                       </Text>
//                       <Text
//                         style={{
//                           color: "#1E40AF",
//                           fontSize: 12,
//                           fontFamily: "monospace",
//                         }}
//                       >
//                         {deliveryData.deliveryId}
//                       </Text>
//                     </View>
//                   )}

//                   {tookanTaskId && (
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#3B82F6", fontSize: 12 }}>
//                         Task ID:
//                       </Text>
//                       <Text
//                         style={{
//                           color: "#1E40AF",
//                           fontSize: 12,
//                           fontFamily: "monospace",
//                         }}
//                       >
//                         {tookanTaskId}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               )}

//               {deliveryData.shipmentDetails && (
//                 <>
//                   {/* Addresses */}
//                   {/* Addresses */}
//                   <View
//                     style={{
//                       marginBottom: 24,
//                       backgroundColor: "#F9FAFB",
//                       padding: 16,
//                       borderRadius: 12,
//                     }}
//                   >
//                     <View style={{ marginBottom: 12 }}>
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <MapPin size={16} color="#6B7280" />
//                         <Text
//                           style={{
//                             color: "#6B7280",
//                             fontSize: 12,
//                             marginLeft: 8,
//                           }}
//                         >
//                           Pickup Location
//                         </Text>
//                       </View>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.pickupAddress}
//                       </Text>
//                     </View>

//                     <View
//                       style={{
//                         height: 1,
//                         backgroundColor: "#E5E7EB",
//                         marginVertical: 8,
//                       }}
//                     />

//                     <View>
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <MapPin size={16} color="#6B7280" />
//                         <Text
//                           style={{
//                             color: "#6B7280",
//                             fontSize: 12,
//                             marginLeft: 8,
//                           }}
//                         >
//                           Delivery Location
//                         </Text>
//                       </View>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.receiverAddress}
//                       </Text>
//                     </View>
//                   </View>

//                   {/* Package Details */}
//                   <TouchableOpacity
//                     style={{ marginBottom: 24 }}
//                     onPress={() => setIsPrintModalVisible(true)}
//                     activeOpacity={0.7}
//                   >
//                     <View
//                       style={{
//                         backgroundColor: "#F9FAFB",
//                         padding: 16,
//                         borderRadius: 12,
//                         borderWidth: 2,
//                         borderColor: "#8328FA",
//                       }}
//                     >
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           alignItems: "center",
//                           justifyContent: "space-between",
//                           marginBottom: 12,
//                         }}
//                       >
//                         <View
//                           style={{ flexDirection: "row", alignItems: "center" }}
//                         >
//                           <Package size={20} color="#8328FA" />
//                           <Text
//                             style={{
//                               color: "#8328FA",
//                               fontSize: 16,
//                               fontWeight: "600",
//                               marginLeft: 8,
//                             }}
//                           >
//                             Package Details
//                           </Text>
//                         </View>
//                         <View
//                           style={{
//                             backgroundColor: "#8328FA",
//                             paddingHorizontal: 12,
//                             paddingVertical: 6,
//                             borderRadius: 20,
//                             flexDirection: "row",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Printer size={14} color="#fff" />
//                           <Text
//                             style={{
//                               color: "#fff",
//                               fontSize: 12,
//                               fontWeight: "600",
//                               marginLeft: 4,
//                             }}
//                           >
//                             View
//                           </Text>
//                         </View>
//                       </View>

//                       <View style={{ marginTop: 4 }}>
//                         <View
//                           style={{
//                             flexDirection: "row",
//                             justifyContent: "space-between",
//                             marginBottom: 6,
//                           }}
//                         >
//                           <Text style={{ color: "#6B7280", fontSize: 13 }}>
//                             Item Type:
//                           </Text>
//                           <Text
//                             style={{
//                               fontWeight: "600",
//                               fontSize: 13,
//                               color: "#111827",
//                             }}
//                           >
//                             {deliveryData.shipmentDetails.itemType}
//                           </Text>
//                         </View>
//                         <View
//                           style={{
//                             flexDirection: "row",
//                             justifyContent: "space-between",
//                             marginBottom: 6,
//                           }}
//                         >
//                           <Text style={{ color: "#6B7280", fontSize: 13 }}>
//                             Weight:
//                           </Text>
//                           <Text
//                             style={{
//                               fontWeight: "600",
//                               fontSize: 13,
//                               color: "#111827",
//                             }}
//                           >
//                             {deliveryData.shipmentDetails.selectedWeight}
//                           </Text>
//                         </View>
//                         <View
//                           style={{
//                             flexDirection: "row",
//                             justifyContent: "space-between",
//                             marginBottom: 6,
//                           }}
//                         >
//                           <Text style={{ color: "#6B7280", fontSize: 13 }}>
//                             Fragile:
//                           </Text>
//                           <Text
//                             style={{
//                               fontWeight: "600",
//                               fontSize: 13,
//                               color: "#111827",
//                             }}
//                           >
//                             {deliveryData.shipmentDetails.isFragile
//                               ? "Yes"
//                               : "No"}
//                           </Text>
//                         </View>
//                         <View
//                           style={{
//                             height: 1,
//                             backgroundColor: "#E5E7EB",
//                             marginVertical: 8,
//                           }}
//                         />
//                         <View
//                           style={{
//                             flexDirection: "row",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Text
//                             style={{
//                               color: "#111827",
//                               fontSize: 14,
//                               fontWeight: "600",
//                             }}
//                           >
//                             Total Amount:
//                           </Text>
//                           <Text
//                             style={{
//                               fontWeight: "700",
//                               fontSize: 16,
//                               color: "#8328FA",
//                             }}
//                           >
//                             {formatCurrency(deliveryData.totalAmount)}
//                           </Text>
//                         </View>
//                       </View>

//                       <View
//                         style={{
//                           marginTop: 12,
//                           paddingTop: 12,
//                           borderTopWidth: 1,
//                           borderTopColor: "#E5E7EB",
//                           alignItems: "center",
//                         }}
//                       >
//                         <Text
//                           style={{
//                             color: "#8328FA",
//                             fontSize: 12,
//                             fontWeight: "500",
//                           }}
//                         >
//                           Tap to view full receipt & print
//                         </Text>
//                       </View>
//                     </View>
//                   </TouchableOpacity>

//                   <Modal
//                     visible={isPrintModalVisible}
//                     animationType="slide"
//                     transparent={false}
//                     onRequestClose={() => setIsPrintModalVisible(false)}
//                   >
//                     <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
//                       {/* Header */}
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           alignItems: "center",
//                           justifyContent: "space-between",
//                           paddingHorizontal: 20,
//                           paddingVertical: 16,
//                           borderBottomWidth: 1,
//                           borderBottomColor: "#E5E7EB",
//                         }}
//                       >
//                         <Text
//                           style={{
//                             fontSize: 20,
//                             fontWeight: "600",
//                             color: "#111827",
//                           }}
//                         >
//                           Delivery Information
//                         </Text>
//                         <TouchableOpacity
//                           onPress={() => setIsPrintModalVisible(false)}
//                           style={{
//                             width: 40,
//                             height: 40,
//                             borderRadius: 20,
//                             backgroundColor: "#F3F4F6",
//                             alignItems: "center",
//                             justifyContent: "center",
//                           }}
//                         >
//                           <X size={24} color="#6B7280" />
//                         </TouchableOpacity>
//                       </View>

//                       {/* Content */}
//                       <ScrollView
//                         style={{ flex: 1 }}
//                         contentContainerStyle={{ padding: 20 }}
//                       >
//                         {/* Status Badge */}
//                         <View
//                           style={{ alignItems: "center", marginBottom: 24 }}
//                         >
//                           <Text
//                             style={{
//                               color: "#6B7280",
//                               fontSize: 12,
//                               marginTop: 8,
//                             }}
//                           >
//                             Generated on {new Date().toLocaleString()}
//                           </Text>
//                         </View>

//                         {/* Tracking IDs */}
//                         {(deliveryData?.deliveryId || tookanTaskId) && (
//                           <View
//                             style={{
//                               backgroundColor: "#EBF8FF",
//                               padding: 16,
//                               borderRadius: 12,
//                               marginBottom: 20,
//                             }}
//                           >
//                             <Text
//                               style={{
//                                 fontSize: 16,
//                                 fontWeight: "600",
//                                 color: "#1E40AF",
//                                 marginBottom: 12,
//                               }}
//                             >
//                               Tracking Information
//                             </Text>

//                             {tookanTaskId && (
//                               <View style={{ marginBottom: 8 }}>
//                                 <Text
//                                   style={{ color: "#3B82F6", fontSize: 12 }}
//                                 >
//                                   Task ID
//                                 </Text>
//                                 <Text
//                                   style={{
//                                     fontFamily: "monospace",
//                                     color: "#1E40AF",
//                                     fontSize: 14,
//                                     fontWeight: "600",
//                                   }}
//                                 >
//                                   {tookanTaskId}
//                                 </Text>
//                               </View>
//                             )}
//                           </View>
//                         )}

//                         {/* Delivery Details */}
//                         <View
//                           style={{
//                             backgroundColor: "#F9FAFB",
//                             padding: 16,
//                             borderRadius: 12,
//                             marginBottom: 20,
//                           }}
//                         >
//                           <Text
//                             style={{
//                               fontSize: 16,
//                               fontWeight: "600",
//                               color: "#111827",
//                               marginBottom: 12,
//                             }}
//                           >
//                             Delivery Details
//                           </Text>
//                           <View style={{ marginBottom: 10 }}>
//                             <View
//                               style={{
//                                 flexDirection: "row",
//                                 justifyContent: "space-between",
//                                 marginBottom: 8,
//                               }}
//                             >
//                               <Text style={{ color: "#6B7280", fontSize: 14 }}>
//                                 Delivery Type
//                               </Text>
//                               <Text style={{ fontWeight: "600", fontSize: 14 }}>
//                                 {deliveryData?.shipmentDetails?.deliveryType ||
//                                   "Standard"}
//                               </Text>
//                             </View>
//                             <View
//                               style={{
//                                 flexDirection: "row",
//                                 justifyContent: "space-between",
//                                 marginBottom: 8,
//                               }}
//                             >
//                               <Text style={{ color: "#6B7280", fontSize: 14 }}>
//                                 Item Type
//                               </Text>
//                               <Text style={{ fontWeight: "600", fontSize: 14 }}>
//                                 {deliveryData?.shipmentDetails?.itemType}
//                               </Text>
//                             </View>
//                             <View
//                               style={{
//                                 flexDirection: "row",
//                                 justifyContent: "space-between",
//                                 marginBottom: 8,
//                               }}
//                             >
//                               <Text style={{ color: "#6B7280", fontSize: 14 }}>
//                                 Weight
//                               </Text>
//                               <Text style={{ fontWeight: "600", fontSize: 14 }}>
//                                 {deliveryData?.shipmentDetails?.selectedWeight}
//                               </Text>
//                             </View>
//                             <View
//                               style={{
//                                 flexDirection: "row",
//                                 justifyContent: "space-between",
//                                 marginBottom: 8,
//                               }}
//                             >
//                               <Text style={{ color: "#6B7280", fontSize: 14 }}>
//                                 Fragile
//                               </Text>
//                               <Text style={{ fontWeight: "600", fontSize: 14 }}>
//                                 {deliveryData?.shipmentDetails?.isFragile
//                                   ? "Yes"
//                                   : "No"}
//                               </Text>
//                             </View>
//                             <View
//                               style={{
//                                 height: 1,
//                                 backgroundColor: "#E5E7EB",
//                                 marginVertical: 12,
//                               }}
//                             />
//                             <View
//                               style={{
//                                 flexDirection: "row",
//                                 justifyContent: "space-between",
//                               }}
//                             >
//                               <Text
//                                 style={{
//                                   color: "#111827",
//                                   fontSize: 16,
//                                   fontWeight: "600",
//                                 }}
//                               >
//                                 Total Amount
//                               </Text>
//                               <Text
//                                 style={{
//                                   fontWeight: "700",
//                                   fontSize: 18,
//                                   color: "#8328FA",
//                                 }}
//                               >
//                                 {formatCurrency(deliveryData?.totalAmount)}
//                               </Text>
//                             </View>
//                           </View>
//                         </View>

//                         {/* Locations */}
//                         <View
//                           style={{
//                             backgroundColor: "#F9FAFB",
//                             padding: 16,
//                             borderRadius: 12,
//                             marginBottom: 20,
//                           }}
//                         >
//                           <Text
//                             style={{
//                               fontSize: 16,
//                               fontWeight: "600",
//                               color: "#111827",
//                               marginBottom: 12,
//                             }}
//                           >
//                             Locations
//                           </Text>
//                           <View
//                             style={{
//                               backgroundColor: "white",
//                               padding: 12,
//                               borderRadius: 8,
//                               marginBottom: 12,
//                             }}
//                           >
//                             <Text
//                               style={{
//                                 color: "#6B7280",
//                                 fontSize: 12,
//                                 marginBottom: 6,
//                               }}
//                             >
//                               📍 Pickup Location
//                             </Text>
//                             <Text
//                               style={{
//                                 fontWeight: "600",
//                                 fontSize: 14,
//                                 color: "#111827",
//                                 lineHeight: 20,
//                               }}
//                             >
//                               {deliveryData?.shipmentDetails?.pickupAddress}
//                             </Text>
//                             {deliveryData?.shipmentDetails?.pickupPostcode && (
//                               <Text
//                                 style={{
//                                   fontSize: 12,
//                                   color: "#6B7280",
//                                   marginTop: 4,
//                                 }}
//                               >
//                                 {deliveryData.shipmentDetails.pickupPostcode}
//                               </Text>
//                             )}
//                           </View>
//                           <View
//                             style={{
//                               backgroundColor: "white",
//                               padding: 12,
//                               borderRadius: 8,
//                             }}
//                           >
//                             <Text
//                               style={{
//                                 color: "#6B7280",
//                                 fontSize: 12,
//                                 marginBottom: 6,
//                               }}
//                             >
//                               📍 Delivery Location
//                             </Text>
//                             <Text
//                               style={{
//                                 fontWeight: "600",
//                                 fontSize: 14,
//                                 color: "#111827",
//                                 lineHeight: 20,
//                               }}
//                             >
//                               {deliveryData?.shipmentDetails?.receiverAddress}
//                             </Text>
//                             {deliveryData?.shipmentDetails
//                               ?.receiverPostcode && (
//                               <Text
//                                 style={{
//                                   fontSize: 12,
//                                   color: "#6B7280",
//                                   marginTop: 4,
//                                 }}
//                               >
//                                 {deliveryData.shipmentDetails.receiverPostcode}
//                               </Text>
//                             )}
//                           </View>
//                         </View>

//                         {/* Receiver Info */}
//                         {(deliveryData?.shipmentDetails?.receiverName ||
//                           deliveryData?.shipmentDetails?.receiverPhone) && (
//                           <View
//                             style={{
//                               backgroundColor: "#F9FAFB",
//                               padding: 16,
//                               borderRadius: 12,
//                               marginBottom: 20,
//                             }}
//                           >
//                             <Text
//                               style={{
//                                 fontSize: 16,
//                                 fontWeight: "600",
//                                 color: "#111827",
//                                 marginBottom: 12,
//                               }}
//                             >
//                               Receiver Information
//                             </Text>
//                             {deliveryData.shipmentDetails.receiverName && (
//                               <View
//                                 style={{
//                                   flexDirection: "row",
//                                   justifyContent: "space-between",
//                                   marginBottom: 8,
//                                 }}
//                               >
//                                 <Text
//                                   style={{ color: "#6B7280", fontSize: 14 }}
//                                 >
//                                   Name
//                                 </Text>
//                                 <Text
//                                   style={{ fontWeight: "600", fontSize: 14 }}
//                                 >
//                                   {deliveryData.shipmentDetails.receiverName}
//                                 </Text>
//                               </View>
//                             )}
//                             {deliveryData.shipmentDetails.receiverPhone && (
//                               <View
//                                 style={{
//                                   flexDirection: "row",
//                                   justifyContent: "space-between",
//                                 }}
//                               >
//                                 <Text
//                                   style={{ color: "#6B7280", fontSize: 14 }}
//                                 >
//                                   Phone
//                                 </Text>
//                                 <Text
//                                   style={{ fontWeight: "600", fontSize: 14 }}
//                                 >
//                                   {deliveryData.shipmentDetails.receiverPhone}
//                                 </Text>
//                               </View>
//                             )}
//                           </View>
//                         )}

//                         {/* Footer */}
//                         <View
//                           style={{
//                             borderTopWidth: 2,
//                             borderTopColor: "#E5E7EB",
//                             paddingTop: 20,
//                             alignItems: "center",
//                           }}
//                         >
//                           <Text
//                             style={{
//                               color: "#6B7280",
//                               fontSize: 12,
//                               textAlign: "center",
//                               marginBottom: 8,
//                             }}
//                           >
//                             This is a computer-generated receipt and does not
//                             require a signature.
//                           </Text>
//                           <Text
//                             style={{
//                               color: "#6B7280",
//                               fontSize: 12,
//                               textAlign: "center",
//                             }}
//                           >
//                             For any inquiries, please contact support with your
//                             delivery ID.
//                           </Text>
//                         </View>
//                       </ScrollView>

//                       {/* Action Buttons */}
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           padding: 20,
//                           borderTopWidth: 1,
//                           borderTopColor: "#E5E7EB",
//                           backgroundColor: "white",
//                         }}
//                       >
//                         <TouchableOpacity
//                           style={{
//                             flex: 1,
//                             backgroundColor: "#8328FA",
//                             paddingVertical: 14,
//                             borderRadius: 10,
//                             flexDirection: "row",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             marginRight: 8,
//                           }}
//                           onPress={handlePrint}
//                         >
//                           <Printer size={20} color="#fff" />
//                           <Text
//                             style={{
//                               color: "white",
//                               fontWeight: "600",
//                               fontSize: 16,
//                               marginLeft: 8,
//                             }}
//                           >
//                             Print
//                           </Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                           style={{
//                             flex: 1,
//                             backgroundColor: "#3B82F6",
//                             paddingVertical: 14,
//                             borderRadius: 10,
//                             flexDirection: "row",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             marginLeft: 8,
//                           }}
//                           onPress={handleShare}
//                         >
//                           <Share2 size={20} color="#fff" />
//                           <Text
//                             style={{
//                               color: "white",
//                               fontWeight: "600",
//                               fontSize: 16,
//                               marginLeft: 8,
//                             }}
//                           >
//                             Share
//                           </Text>
//                         </TouchableOpacity>
//                       </View>
//                     </SafeAreaView>
//                   </Modal>

//                   {/* Contact Actions */}
//                   <View
//                     style={{
//                       flexDirection: "row",
//                       justifyContent: "space-between",
//                       marginBottom: 16,
//                     }}
//                   >
//                     <TouchableOpacity
//                       style={{
//                         flex: 1,
//                         backgroundColor: tookanTaskId ? "#8328FA" : "#D1D5DB",
//                         paddingVertical: 12,
//                         paddingHorizontal: 16,
//                         borderRadius: 8,
//                         marginRight: 8,
//                         flexDirection: "row",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                       disabled={!tookanTaskId}
//                     >
//                       <Phone
//                         size={18}
//                         color={tookanTaskId ? "#fff" : "#9CA3AF"}
//                       />
//                       <Text
//                         style={{
//                           color: tookanTaskId ? "white" : "#9CA3AF",
//                           fontWeight: "600",
//                           marginLeft: 8,
//                           fontSize: 14,
//                         }}
//                       >
//                         Call Driver
//                       </Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       style={{
//                         flex: 1,
//                         borderWidth: 1,
//                         borderColor: tookanTaskId ? "#8328FA" : "#D1D5DB",
//                         paddingVertical: 12,
//                         paddingHorizontal: 16,
//                         borderRadius: 8,
//                         marginLeft: 8,
//                         flexDirection: "row",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                       disabled={!tookanTaskId}
//                     >
//                       <MessageCircle
//                         size={18}
//                         color={tookanTaskId ? "#8328FA" : "#9CA3AF"}
//                       />
//                       <Text
//                         style={{
//                           color: tookanTaskId ? "#8328FA" : "#9CA3AF",
//                           fontWeight: "600",
//                           marginLeft: 8,
//                           fontSize: 14,
//                         }}
//                       >
//                         Message
//                       </Text>
//                     </TouchableOpacity>
//                   </View>

//                   {!tookanTaskId && !isCreatingTask && (
//                     <Text
//                       style={{
//                         color: "#6B7280",
//                         textAlign: "center",
//                         fontSize: 12,
//                         marginBottom: 16,
//                       }}
//                     >
//                       Driver contact will be available once task is created
//                     </Text>
//                   )}

//                   {/* Create New Delivery Button */}
//                   <TouchableOpacity
//                     onPress={handleCreateNewDelivery}
//                     style={{
//                       backgroundColor: "#F3F4F6",
//                       borderWidth: 1,
//                       borderColor: "#D1D5DB",
//                       paddingVertical: 12,
//                       paddingHorizontal: 16,
//                       borderRadius: 8,
//                       marginTop: 16,
//                       alignItems: "center",
//                     }}
//                   >
//                     <Text
//                       style={{
//                         color: "#6B7280",
//                         fontWeight: "600",
//                         fontSize: 14,
//                       }}
//                     >
//                       Create New Delivery
//                     </Text>
//                   </TouchableOpacity>
//                 </>
//               )}
//             </>
//           ) : (
//             <View style={{ alignItems: "center", paddingVertical: 32 }}>
//               <Text
//                 style={{
//                   color: "#6B7280",
//                   textAlign: "center",
//                   marginBottom: 16,
//                 }}
//               >
//                 No delivery information available
//               </Text>
//               <TouchableOpacity
//                 onPress={handleCreateNewDelivery}
//                 style={{
//                   backgroundColor: "#8328FA",
//                   paddingVertical: 12,
//                   paddingHorizontal: 24,
//                   borderRadius: 8,
//                 }}
//               >
//                 <Text style={{ color: "white", fontWeight: "600" }}>
//                   Create New Delivery
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

////////////////////////////original code////////////////////////////

// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   Linking,
//   ScrollView,
//   Platform,
//   Dimensions,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import {
//   ChevronLeft,
//   Search,
//   Phone,
//   MessageCircle,
//   MapPin,
//   Package,
//   Navigation,
//   RefreshCw,
//   ExternalLink,
// } from "lucide-react-native";
// import {
//   useRoute,
//   useNavigation,
//   useFocusEffect,
// } from "@react-navigation/native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

// const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// export default function LocationScreen() {
//   const route = useRoute();
//   const navigation = useNavigation();
//   const mapRef = useRef(null);
//   const trackingIntervalRef = useRef(null);

//   const [isLoading, setIsLoading] = useState(false);
//   const [deliveryData, setDeliveryData] = useState(null);
//   const [error, setError] = useState(null);
//   const [tookanTaskId, setTookanTaskId] = useState(null);
//   const [trackingUrl, setTrackingUrl] = useState(null);
//   const [isCreatingTask, setIsCreatingTask] = useState(false);
//   const [taskCreationStatus, setTaskCreationStatus] = useState(null);
//   const [hasCheckedForDelivery, setHasCheckedForDelivery] = useState(false);

//   // Live tracking states
//   const [mapRegion, setMapRegion] = useState({
//     latitude: 51.5074, // Default to London
//     longitude: -0.1278,
//     latitudeDelta: 0.0922,
//     longitudeDelta: 0.0421,
//   });
//   const [trackingData, setTrackingData] = useState(null);
//   const [isTrackingActive, setIsTrackingActive] = useState(false);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [pickupCoordinates, setPickupCoordinates] = useState(null);
//   const [deliveryCoordinates, setDeliveryCoordinates] = useState(null);
//   const [trackingError, setTrackingError] = useState(null);
//   const [lastTrackingUpdate, setLastTrackingUpdate] = useState(null);

//   // Get parameters from route
//   const params = route.params || {};
//   const {
//     sessionId,
//     paymentStatus,
//     fromPayment,
//     shipmentDetails,
//     verifiedPayment,
//   } = params;

//   const backendUrl = "http://192.168.43.176:3000";

//   // // Function to get coordinates from postcode using Google Geocoding API

//   const getCoordinatesFromPostcode = async (postcode) => {
//     if (!postcode || postcode.trim().length === 0) {
//       console.error("Invalid postcode provided:", postcode);
//       return null;
//     }

//     try {
//       console.log("[Frontend] Geocoding postcode:", postcode);

//       const response = await fetch(
//         `${backendUrl}/api/geocode?postcode=${encodeURIComponent(
//           postcode.trim()
//         )}`
//       );

//       console.log("[Frontend] Geocoding response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(
//           "[Frontend] Geocoding HTTP error:",
//           response.status,
//           errorText
//         );

//         if (response.status === 404) {
//           console.warn(`[Frontend] Postcode not found: ${postcode}`);
//           return null;
//         }

//         throw new Error(`Geocoding failed: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("[Frontend] Geocoding response data:", data);

//       if (data.success && data.coordinates) {
//         console.log("[Frontend] Geocoding successful:", {
//           postcode: postcode,
//           coordinates: data.coordinates,
//           source: data.source,
//         });

//         return {
//           latitude: data.coordinates.lat,
//           longitude: data.coordinates.lng,
//         };
//       }

//       console.warn("[Frontend] Geocoding failed - no coordinates:", data);
//       return null;
//     } catch (error) {
//       console.error("[Frontend] Geocoding error:", error.message);

//       // Show user-friendly error for specific cases
//       if (error.message.includes("404")) {
//         console.warn(`[Frontend] Postcode not recognized: ${postcode}`);
//       } else {
//         console.error(`[Frontend] Geocoding service error: ${error.message}`);
//       }

//       return null;
//     }
//   };

//   // Function to get route between two points using Google Directions API
//   const getRouteCoordinates = async (origin, destination) => {
//     try {
//       const response = await fetch(
//         `${backendUrl}/api/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`
//       );

//       if (!response.ok) {
//         throw new Error(`Directions failed: ${response.status}`);
//       }

//       const data = await response.json();

//       if (data.success && data.route && data.route.length > 0) {
//         return data.route;
//       }

//       return [origin, destination]; // Fallback to straight line
//     } catch (error) {
//       console.error("Error getting route:", error);
//       return [origin, destination]; // Fallback to straight line
//     }
//   };

//   const initializeMap = async () => {
//     if (!deliveryData?.shipmentDetails) {
//       console.log("[Map] No shipment details available");
//       return;
//     }

//     const { pickupPostcode, receiverPostcode } = deliveryData.shipmentDetails;

//     if (!pickupPostcode || !receiverPostcode) {
//       console.warn("[Map] Missing postcode data:", {
//         pickupPostcode,
//         receiverPostcode,
//       });
//       return;
//     }

//     try {
//       console.log("[Map] Initializing with postcodes:", {
//         pickupPostcode,
//         receiverPostcode,
//       });

//       const [pickupCoords, deliveryCoords] = await Promise.all([
//         getCoordinatesFromPostcode(pickupPostcode),
//         getCoordinatesFromPostcode(receiverPostcode),
//       ]);

//       console.log("[Map] Geocoding results:", {
//         pickup: pickupCoords,
//         delivery: deliveryCoords,
//       });

//       // Handle partial failures
//       if (!pickupCoords && !deliveryCoords) {
//         console.error("[Map] Failed to geocode both postcodes");
//         Alert.alert(
//           "Location Error",
//           "Unable to locate pickup and delivery addresses. Please check the postcodes.",
//           [{ text: "OK" }]
//         );
//         return;
//       }

//       if (!pickupCoords) {
//         console.warn(
//           "[Map] Failed to geocode pickup postcode:",
//           pickupPostcode
//         );
//         Alert.alert(
//           "Location Warning",
//           `Unable to locate pickup address: ${pickupPostcode}`,
//           [{ text: "OK" }]
//         );
//       }

//       if (!deliveryCoords) {
//         console.warn(
//           "[Map] Failed to geocode delivery postcode:",
//           receiverPostcode
//         );
//         Alert.alert(
//           "Location Warning",
//           `Unable to locate delivery address: ${receiverPostcode}`,
//           [{ text: "OK" }]
//         );
//       }

//       // Use available coordinates
//       const availableCoords = [pickupCoords, deliveryCoords].filter(Boolean);

//       if (availableCoords.length > 0) {
//         if (pickupCoords) setPickupCoordinates(pickupCoords);
//         if (deliveryCoords) setDeliveryCoordinates(deliveryCoords);

//         // Get route between available coordinates
//         if (pickupCoords && deliveryCoords) {
//           console.log("[Map] Getting route between coordinates");
//           const route = await getRouteCoordinates(pickupCoords, deliveryCoords);
//           setRouteCoordinates(route);

//           // Center map on the route
//           const minLat = Math.min(
//             pickupCoords.latitude,
//             deliveryCoords.latitude
//           );
//           const maxLat = Math.max(
//             pickupCoords.latitude,
//             deliveryCoords.latitude
//           );
//           const minLng = Math.min(
//             pickupCoords.longitude,
//             deliveryCoords.longitude
//           );
//           const maxLng = Math.max(
//             pickupCoords.longitude,
//             deliveryCoords.longitude
//           );

//           const centerLat = (minLat + maxLat) / 2;
//           const centerLng = (minLng + maxLng) / 2;
//           const latDelta = (maxLat - minLat) * 1.5; // Add padding
//           const lngDelta = (maxLng - minLng) * 1.5;

//           const newRegion = {
//             latitude: centerLat,
//             longitude: centerLng,
//             latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
//             longitudeDelta: Math.max(lngDelta, 0.01),
//           };

//           setMapRegion(newRegion);

//           // Animate map to show the route
//           if (mapRef.current) {
//             setTimeout(() => {
//               mapRef.current?.animateToRegion(newRegion, 1000);
//             }, 100);
//           }
//         } else {
//           // Center on single available location
//           const singleCoord = availableCoords[0];
//           const newRegion = {
//             latitude: singleCoord.latitude,
//             longitude: singleCoord.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           };

//           setMapRegion(newRegion);

//           if (mapRef.current) {
//             setTimeout(() => {
//               mapRef.current?.animateToRegion(newRegion, 1000);
//             }, 100);
//           }
//         }

//         console.log("[Map] Map initialized successfully");
//       }
//     } catch (error) {
//       console.error("[Map] Error initializing map:", error);
//       Alert.alert(
//         "Map Error",
//         "Unable to load map locations. The tracking will still work when the driver is assigned.",
//         [{ text: "OK" }]
//       );
//     }
//   };

//   // Replace your fetchTrackingData function with this fixed version

//   const fetchTrackingData = async () => {
//     if (!tookanTaskId) {
//       console.log("No Tookan task ID available for tracking");
//       return;
//     }

//     try {
//       console.log("[Tracking] Fetching data for task:", tookanTaskId);

//       const response = await fetch(
//         `${backendUrl}/api/tookan/tracking/${tookanTaskId}`
//       );

//       console.log("[Tracking] Response status:", response.status);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("[Tracking] HTTP Error:", response.status, errorText);
//         throw new Error(`Tracking fetch failed: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("[Tracking] Response data:", JSON.stringify(data, null, 2));

//       if (data.success && data.trackingData) {
//         setTrackingData(data.trackingData);
//         setTrackingError(null);
//         setLastTrackingUpdate(new Date().toISOString());

//         const { agent_location, job_status } = data.trackingData;

//         // Status mapping with complete Tookan status codes
//         // Add this to your LocationScreen.js - REPLACE the getStatusInfo function inside fetchTrackingData

//         const getStatusInfo = (status) => {
//           const statusCode = parseInt(status);
//           console.log("[Tracking] Mapping status code:", statusCode);

//           switch (statusCode) {
//             case 0:
//               return {
//                 key: "confirmed",
//                 text: "Task created",
//                 color: "#6B7280",
//               };
//             case 1:
//               return {
//                 key: "assigned",
//                 text: "Driver assigned",
//                 color: "#3B82F6",
//               };
//             case 2:
//               return {
//                 key: "started",
//                 text: "Driver en route",
//                 color: "#F59E0B",
//               };
//             case 3:
//               return {
//                 key: "completed",
//                 text: "Delivery completed ✓",
//                 color: "#10B981",
//               };
//             case 4:
//               return {
//                 key: "failed",
//                 text: "Delivery failed ✗",
//                 color: "#EF4444",
//               };
//             case 5:
//               return {
//                 key: "cancelled",
//                 text: "Cancelled",
//                 color: "#6B7280",
//               };
//             case 6:
//               return {
//                 key: "cancelled",
//                 text: "Cancelled by dispatcher",
//                 color: "#6B7280",
//               };
//             case 7:
//               return {
//                 key: "accepted",
//                 text: "Driver accepted",
//                 color: "#3B82F6",
//               };
//             case 8:
//               return {
//                 key: "arrived_pickup", // NEW: Separate state for arrival
//                 text: "Driver arrived at pickup 📍",
//                 color: "#F59E0B",
//               };
//             case 9:
//               return {
//                 key: "started",
//                 text: "Started delivery 🚗",
//                 color: "#F59E0B",
//               };
//             case 10:
//               return {
//                 key: "unassigned",
//                 text: "Unassigned",
//                 color: "#6B7280",
//               };
//             default:
//               return {
//                 key: "confirmed",
//                 text: "Processing",
//                 color: "#6B7280",
//               };
//           }
//         };

//         const statusInfo = getStatusInfo(job_status);
//         console.log("[Tracking] Status info:", statusInfo);

//         // Update agent location
//         if (
//           agent_location &&
//           agent_location.latitude &&
//           agent_location.longitude
//         ) {
//           const newDriverLocation = {
//             latitude: parseFloat(agent_location.latitude),
//             longitude: parseFloat(agent_location.longitude),
//           };

//           console.log("[Tracking] Driver location:", newDriverLocation);
//           setDriverLocation(newDriverLocation);

//           // Auto-center map on driver if tracking is active
//           if (isTrackingActive && mapRef.current) {
//             mapRef.current.animateToRegion(
//               {
//                 ...newDriverLocation,
//                 latitudeDelta: 0.01,
//                 longitudeDelta: 0.01,
//               },
//               1000
//             );
//           }
//         }

//         // ✅ CRITICAL FIX: Use current deliveryData to check previous status
//         const previousStatus = deliveryData?.status;
//         const wasCompleted = previousStatus === "completed";
//         const wasFailed = previousStatus === "failed";

//         // Update delivery data with new status
//         setDeliveryData((prev) => {
//           const updated = {
//             ...prev,
//             status: statusInfo.key,
//             statusText: statusInfo.text,
//             statusColor: statusInfo.color,
//             driverName: data.trackingData.agent_name || "Not assigned",
//             driverId: data.trackingData.agent_id || null,
//             lastStatusUpdate: new Date().toISOString(),
//           };

//           console.log("[Tracking] Updated delivery data:", {
//             previousStatus,
//             newStatus: updated.status,
//             timestamp: new Date().toISOString(),
//           });

//           return updated;
//         });

//         // ✅ CRITICAL FIX: Check status changes AFTER state update using the actual status
//         // Show alert when delivery is completed (only once per session)
//         if (statusInfo.key === "completed" && !wasCompleted) {
//           console.log("[Tracking] Delivery completed!");
//           Alert.alert(
//             "Delivery Completed! 🎉",
//             "Your package has been successfully delivered.",
//             [{ text: "OK" }]
//           );

//           // Stop tracking when completed
//           if (isTrackingActive) {
//             stopLiveTracking();
//           }
//         }

//         // Show alert when delivery failed (only once per session)
//         if (statusInfo.key === "failed" && !wasFailed) {
//           console.log("[Tracking] Delivery failed!");
//           Alert.alert(
//             "Delivery Failed",
//             "There was an issue with the delivery. Please contact support.",
//             [{ text: "OK" }]
//           );
//         }

//         console.log("[Tracking] Updated status to:", {
//           status: statusInfo.key,
//           statusText: statusInfo.text,
//           timestamp: new Date().toISOString(),
//         });
//       } else {
//         setTrackingError(data.error || "No tracking data available");
//         console.error("[Tracking] API returned error:", data.error);
//       }
//     } catch (error) {
//       console.error("[Tracking] Error fetching data:", error);
//       setTrackingError(`Tracking error: ${error.message}`);
//     }
//   };

//   // Start live tracking
//   const startLiveTracking = () => {
//     if (!tookanTaskId) {
//       Alert.alert("Tracking Unavailable", "No active delivery task found.");
//       return;
//     }

//     setIsTrackingActive(true);
//     fetchTrackingData(); // Initial fetch

//     // Set up polling interval (every 30 seconds)
//     trackingIntervalRef.current = setInterval(() => {
//       fetchTrackingData();
//     }, 30000);

//     console.log("Live tracking started for task:", tookanTaskId);
//   };

//   // Stop live tracking
//   const stopLiveTracking = () => {
//     setIsTrackingActive(false);

//     if (trackingIntervalRef.current) {
//       clearInterval(trackingIntervalRef.current);
//       trackingIntervalRef.current = null;
//     }

//     console.log("Live tracking stopped");
//   };

//   // Toggle tracking state
//   const toggleLiveTracking = () => {
//     if (isTrackingActive) {
//       stopLiveTracking();
//     } else {
//       startLiveTracking();
//     }
//   };

//   // Center map on specific location
//   const centerMapOn = (location, title) => {
//     if (!location || !mapRef.current) return;

//     mapRef.current.animateToRegion(
//       {
//         ...location,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       1000
//     );

//     Alert.alert("Map Centered", `Centered on ${title}`);
//   };

//   // Fit map to show all markers
//   const fitMapToMarkers = () => {
//     if (!mapRef.current) return;

//     const markers = [
//       pickupCoordinates,
//       deliveryCoordinates,
//       driverLocation,
//     ].filter(Boolean);

//     if (markers.length === 0) return;

//     if (markers.length === 1) {
//       mapRef.current.animateToRegion(
//         {
//           ...markers[0],
//           latitudeDelta: 0.01,
//           longitudeDelta: 0.01,
//         },
//         1000
//       );
//       return;
//     }

//     const minLat = Math.min(...markers.map((m) => m.latitude));
//     const maxLat = Math.max(...markers.map((m) => m.latitude));
//     const minLng = Math.min(...markers.map((m) => m.longitude));
//     const maxLng = Math.max(...markers.map((m) => m.longitude));

//     const padding = 0.01; // Padding around markers

//     mapRef.current.animateToRegion(
//       {
//         latitude: (minLat + maxLat) / 2,
//         longitude: (minLng + maxLng) / 2,
//         latitudeDelta: maxLat - minLat + padding,
//         longitudeDelta: maxLng - minLng + padding,
//       },
//       1000
//     );
//   };

//   // Cleanup tracking on unmount
//   useEffect(() => {
//     return () => {
//       if (trackingIntervalRef.current) {
//         clearInterval(trackingIntervalRef.current);
//       }
//     };
//   }, []);

//   // Initialize map when delivery data is available
//   useEffect(() => {
//     if (deliveryData?.shipmentDetails) {
//       initializeMap();
//     }
//   }, [deliveryData]);

//   // Auto-start tracking when task ID becomes available
//   useEffect(() => {
//     if (tookanTaskId && deliveryData && !isTrackingActive) {
//       setTimeout(() => {
//         startLiveTracking();
//       }, 2000); // Delay to allow map to initialize
//     }
//   }, [tookanTaskId, deliveryData]);

//   // Function to check for recent delivery in AsyncStorage
//   const checkForRecentDelivery = async () => {
//     try {
//       const keys = await AsyncStorage.getAllKeys();
//       const deliveryKeys = keys.filter((key) =>
//         key.startsWith("recentDelivery_")
//       );

//       if (deliveryKeys.length > 0) {
//         const deliveryPromises = deliveryKeys.map(async (key) => {
//           const deliveryData = await AsyncStorage.getItem(key);
//           return deliveryData ? JSON.parse(deliveryData) : null;
//         });

//         const deliveries = await Promise.all(deliveryPromises);
//         const validDeliveries = deliveries.filter(
//           (delivery) => delivery && delivery.timestamp
//         );

//         if (validDeliveries.length > 0) {
//           const mostRecent = validDeliveries.sort(
//             (a, b) => b.timestamp - a.timestamp
//           )[0];

//           const ageInHours =
//             (Date.now() - mostRecent.timestamp) / (1000 * 60 * 60);
//           if (ageInHours < 24) {
//             return mostRecent;
//           }
//         }
//       }
//       return null;
//     } catch (error) {
//       console.log("Error checking for recent delivery:", error);
//       return null;
//     }
//   };

//   // Deep link handling
//   useEffect(() => {
//     const handleDeepLinkInLocationScreen = (event) => {
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

//       console.log("LocationScreen received deep link:", incomingUrl);

//       if (incomingUrl.includes("/payment-success")) {
//         try {
//           const urlObj = new URL(incomingUrl);
//           const sessionId = urlObj.searchParams.get("session_id");

//           if (sessionId) {
//             console.log(
//               "LocationScreen processing payment success for session:",
//               sessionId
//             );

//             if (!deliveryData || deliveryData.sessionId !== sessionId) {
//               fetchDeliveryDetailsForSession(sessionId);
//             }
//           }
//         } catch (urlError) {
//           console.error(
//             "Invalid URL in LocationScreen deep link:",
//             incomingUrl,
//             urlError
//           );
//         }
//       }
//     };

//     const linkingSubscription = Linking.addEventListener(
//       "url",
//       handleDeepLinkInLocationScreen
//     );

//     return () => {
//       linkingSubscription?.remove();
//     };
//   }, [deliveryData]);

//   const fetchDeliveryDetailsForSession = async (sessionId) => {
//     if (!sessionId) return;

//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log(
//         "Fetching delivery details for deep link session:",
//         sessionId
//       );

//       const statusResponse = await fetch(
//         `${backendUrl}/api/payment-status/${sessionId}`
//       );

//       if (!statusResponse.ok) {
//         throw new Error(
//           `Failed to get payment status: ${statusResponse.status}`
//         );
//       }

//       const statusData = await statusResponse.json();
//       console.log("Deep link payment status data:", statusData);

//       if (statusData.paymentStatus !== "paid") {
//         setError(`Payment not completed. Status: ${statusData.paymentStatus}`);
//         return;
//       }

//       const deliveryInfo = {
//         sessionId: sessionId,
//         status: "payment_completed",
//         paymentStatus: statusData.paymentStatus,
//         shipmentDetails: statusData.shipmentDetails,
//         totalAmount: statusData.totalAmount,
//         createdAt: statusData.createdAt,
//         completedAt: statusData.completedAt,
//         fromDeepLink: true,
//       };

//       setDeliveryData(deliveryInfo);
//       await storeDeliveryData(deliveryInfo);

//       await AsyncStorage.removeItem("pendingPayment");

//       if (statusData.shipmentDetails) {
//         createTookanTask(sessionId, statusData.shipmentDetails);
//       }

//       Alert.alert(
//         "Payment Confirmed",
//         "Your delivery has been confirmed and is being processed.",
//         [{ text: "OK" }]
//       );
//     } catch (error) {
//       console.error("Error fetching delivery details from deep link:", error);
//       setError(`Failed to load delivery details: ${error.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const storeDeliveryData = async (deliveryData) => {
//     try {
//       const storageKey = `recentDelivery_${deliveryData.sessionId}`;
//       const storageData = {
//         ...deliveryData,
//         timestamp: Date.now(),
//       };
//       await AsyncStorage.setItem(storageKey, JSON.stringify(storageData));
//     } catch (error) {
//       console.log("Error storing delivery data:", error);
//     }
//   };

//   useFocusEffect(
//     React.useCallback(() => {
//       const initializeScreen = async () => {
//         console.log("LocationScreen focused with params:", params);

//         const checkPendingPayment = async () => {
//           try {
//             const pendingPayment = await AsyncStorage.getItem("pendingPayment");
//             if (pendingPayment) {
//               const paymentData = JSON.parse(pendingPayment);
//               console.log("Found pending payment:", paymentData);

//               const statusResponse = await fetch(
//                 `${backendUrl}/api/payment-status/${paymentData.sessionId}`
//               );

//               if (statusResponse.ok) {
//                 const statusData = await statusResponse.json();
//                 console.log("Pending payment status:", statusData);

//                 if (statusData.paymentStatus === "paid") {
//                   await AsyncStorage.removeItem("pendingPayment");

//                   const deliveryInfo = {
//                     sessionId: paymentData.sessionId,
//                     status: "payment_completed",
//                     paymentStatus: statusData.paymentStatus,
//                     shipmentDetails:
//                       statusData.shipmentDetails || paymentData.shipmentDetails,
//                     totalAmount:
//                       statusData.totalAmount || paymentData.totalAmount,
//                     createdAt: statusData.createdAt,
//                     completedAt: statusData.completedAt,
//                   };

//                   setDeliveryData(deliveryInfo);
//                   await storeDeliveryData(deliveryInfo);

//                   if (deliveryInfo.shipmentDetails) {
//                     createTookanTask(
//                       paymentData.sessionId,
//                       deliveryInfo.shipmentDetails
//                     );
//                   }
//                   return true;
//                 }
//               }
//             }
//           } catch (error) {
//             console.log("Error checking pending payment:", error);
//           }
//           return false;
//         };

//         if (sessionId && paymentStatus === "completed") {
//           if (shipmentDetails && verifiedPayment) {
//             const deliveryInfo = {
//               sessionId: sessionId,
//               status: "payment_completed",
//               paymentStatus: verifiedPayment.paymentStatus,
//               shipmentDetails: shipmentDetails,
//               totalAmount: verifiedPayment.totalAmount,
//               createdAt: verifiedPayment.createdAt,
//               completedAt: verifiedPayment.completedAt,
//             };
//             setDeliveryData(deliveryInfo);
//             await storeDeliveryData(deliveryInfo);
//             createTookanTask(sessionId, shipmentDetails);
//             return;
//           } else {
//             fetchDeliveryDetails();
//             return;
//           }
//         }

//         const handledPending = await checkPendingPayment();

//         if (!handledPending && !hasCheckedForDelivery) {
//           setHasCheckedForDelivery(true);
//           const recentDelivery = await checkForRecentDelivery();

//           if (recentDelivery) {
//             console.log("Found recent delivery:", recentDelivery);
//             setDeliveryData(recentDelivery);

//             if (
//               recentDelivery.shipmentDetails &&
//               !recentDelivery.tookanTaskId
//             ) {
//               try {
//                 const statusResponse = await fetch(
//                   `${backendUrl}/api/payment-status/${recentDelivery.sessionId}`
//                 );

//                 if (statusResponse.ok) {
//                   const statusData = await statusResponse.json();
//                   if (statusData.paymentStatus === "paid") {
//                     createTookanTask(
//                       recentDelivery.sessionId,
//                       recentDelivery.shipmentDetails
//                     );
//                   } else {
//                     console.log("Session exists but payment not confirmed");
//                   }
//                 } else {
//                   console.log(
//                     "Session not found on backend, skipping Tookan task creation"
//                   );
//                   setError(
//                     "Previous session expired. Please create a new delivery."
//                   );
//                 }
//               } catch (error) {
//                 console.log("Error checking session status:", error);
//                 setError(
//                   "Unable to verify previous session. Please create a new delivery."
//                 );
//               }
//             } else if (recentDelivery.tookanTaskId) {
//               setTookanTaskId(recentDelivery.tookanTaskId);
//               setTrackingUrl(recentDelivery.trackingUrl);
//             }
//           } else {
//             setError(
//               "No recent delivery found. Create a new delivery to track."
//             );
//           }
//         }
//       };

//       initializeScreen();
//     }, [sessionId, paymentStatus, shipmentDetails, verifiedPayment])
//   );

//   const fetchDeliveryDetails = async () => {
//     if (!sessionId) {
//       setError("No session ID provided");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       console.log("Fetching delivery details for session:", sessionId);

//       const statusResponse = await fetch(
//         `${backendUrl}/api/payment-status/${sessionId}`
//       );

//       if (!statusResponse.ok) {
//         throw new Error(
//           `Failed to get payment status: ${statusResponse.status}`
//         );
//       }

//       const statusData = await statusResponse.json();
//       console.log("Payment status data:", statusData);

//       if (statusData.paymentStatus !== "paid") {
//         setError(`Payment not completed. Status: ${statusData.paymentStatus}`);
//         return;
//       }

//       const deliveryInfo = {
//         sessionId: sessionId,
//         status: "payment_completed",
//         paymentStatus: statusData.paymentStatus,
//         shipmentDetails: statusData.shipmentDetails,
//         totalAmount: statusData.totalAmount,
//         createdAt: statusData.createdAt,
//         completedAt: statusData.completedAt,
//       };

//       setDeliveryData(deliveryInfo);
//       await storeDeliveryData(deliveryInfo);

//       if (statusData.shipmentDetails) {
//         createTookanTask(sessionId, statusData.shipmentDetails);
//       }
//     } catch (error) {
//       console.error("Error fetching delivery details:", error);
//       setError(`Failed to load delivery details: ${error.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // const createTookanTask = async (sessionId, shipmentDetails) => {
//   //   if (!sessionId || !shipmentDetails) {
//   //     console.log(
//   //       "Cannot create Tookan task: missing sessionId or shipmentDetails"
//   //     );
//   //     return;
//   //   }

//   //   setIsCreatingTask(true);
//   //   setTaskCreationStatus("Creating delivery task...");

//   //   try {
//   //     console.log("Creating Tookan task for session:", sessionId);

//   //     const sessionTaskResponse = await fetch(
//   //       `${backendUrl}/api/session/${sessionId}/create-tookan-task`
//   //     );

//   //     if (sessionTaskResponse.ok) {
//   //       const sessionTaskData = await sessionTaskResponse.json();
//   //       console.log("Session-based task creation response:", sessionTaskData);

//   //       if (sessionTaskData.success) {
//   //         setTookanTaskId(sessionTaskData.tookanTaskId);
//   //         setTrackingUrl(sessionTaskData.trackingUrl);
//   //         setTaskCreationStatus(
//   //           sessionTaskData.message || "Task created successfully"
//   //         );

//   //         setDeliveryData((prev) => {
//   //           const updated = {
//   //             ...prev,
//   //             tookanTaskId: sessionTaskData.tookanTaskId,
//   //             trackingUrl: sessionTaskData.trackingUrl,
//   //             deliveryId: sessionTaskData.deliveryId,
//   //           };
//   //           storeDeliveryData(updated);
//   //           return updated;
//   //         });

//   //         return;
//   //       }
//   //     }

//   //     const directTaskResponse = await fetch(
//   //       `${backendUrl}/api/tookan/create-task`,
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //         },
//   //         body: JSON.stringify({
//   //           sessionId: sessionId,
//   //           shipmentDetails: shipmentDetails,
//   //         }),
//   //       }
//   //     );

//   //     const directTaskData = await directTaskResponse.json();
//   //     console.log("Direct task creation response:", directTaskData);

//   //     if (directTaskResponse.ok && directTaskData.success) {
//   //       setTookanTaskId(directTaskData.tookanTaskId);
//   //       setTrackingUrl(directTaskData.trackingUrl);
//   //       setTaskCreationStatus(
//   //         directTaskData.message || "Task created successfully"
//   //       );

//   //       setDeliveryData((prev) => {
//   //         const updated = {
//   //           ...prev,
//   //           tookanTaskId: directTaskData.tookanTaskId,
//   //           trackingUrl: directTaskData.trackingUrl,
//   //           deliveryId: directTaskData.deliveryId,
//   //         };
//   //         storeDeliveryData(updated);
//   //         return updated;
//   //       });
//   //     } else {
//   //       throw new Error(
//   //         directTaskData.error || "Failed to create delivery task"
//   //       );
//   //     }
//   //   } catch (error) {
//   //     console.error("Error creating Tookan task:", error);
//   //     setTaskCreationStatus(`Task creation failed: ${error.message}`);

//   //     if (deliveryData) {
//   //       console.log("Continuing without Tookan task - delivery data available");
//   //     }
//   //   } finally {
//   //     setIsCreatingTask(false);
//   //     setTimeout(() => setTaskCreationStatus(null), 5000);
//   //   }
//   // };
//   const createTookanTask = async (sessionId, shipmentDetails) => {
//     if (!sessionId || !shipmentDetails) {
//       console.log(
//         "Cannot create Tookan task: missing sessionId or shipmentDetails"
//       );
//       return;
//     }

//     setIsCreatingTask(true);
//     setTaskCreationStatus("Creating delivery task...");

//     try {
//       console.log("Creating Tookan task for session:", sessionId);

//       const sessionTaskResponse = await fetch(
//         `${backendUrl}/api/session/${sessionId}/create-tookan-task`
//       );

//       // ✅ IMPROVED ERROR HANDLING
//       if (sessionTaskResponse.ok) {
//         const sessionTaskData = await sessionTaskResponse.json();
//         console.log("Session-based task creation response:", sessionTaskData);

//         if (sessionTaskData.success) {
//           setTookanTaskId(sessionTaskData.tookanTaskId);
//           setTrackingUrl(sessionTaskData.trackingUrl);
//           setTaskCreationStatus(
//             sessionTaskData.message || "Task created successfully"
//           );

//           setDeliveryData((prev) => {
//             const updated = {
//               ...prev,
//               tookanTaskId: sessionTaskData.tookanTaskId,
//               trackingUrl: sessionTaskData.trackingUrl,
//               deliveryId: sessionTaskData.deliveryId,
//             };
//             storeDeliveryData(updated);
//             return updated;
//           });

//           return;
//         } else if (sessionTaskData.details) {
//           // Show detailed geocoding error
//           const errorMsg =
//             sessionTaskData.details.suggestion || sessionTaskData.error;
//           Alert.alert("Address Issue", errorMsg, [{ text: "OK" }]);
//           setTaskCreationStatus(errorMsg);
//           return;
//         }
//       }

//       // Try direct task creation as fallback
//       const directTaskResponse = await fetch(
//         `${backendUrl}/api/tookan/create-task`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             sessionId: sessionId,
//             shipmentDetails: shipmentDetails,
//           }),
//         }
//       );

//       const directTaskData = await directTaskResponse.json();
//       console.log("Direct task creation response:", directTaskData);

//       if (directTaskResponse.ok && directTaskData.success) {
//         setTookanTaskId(directTaskData.tookanTaskId);
//         setTrackingUrl(directTaskData.trackingUrl);
//         setTaskCreationStatus(
//           directTaskData.message || "Task created successfully"
//         );

//         setDeliveryData((prev) => {
//           const updated = {
//             ...prev,
//             tookanTaskId: directTaskData.tookanTaskId,
//             trackingUrl: directTaskData.trackingUrl,
//             deliveryId: directTaskData.deliveryId,
//           };
//           storeDeliveryData(updated);
//           return updated;
//         });
//       } else if (directTaskData.details) {
//         // Show detailed error from direct creation
//         const errorMsg =
//           directTaskData.details.suggestion || directTaskData.error;
//         Alert.alert("Cannot Create Delivery", errorMsg, [
//           { text: "Edit Address", onPress: () => navigation.goBack() },
//           { text: "Cancel", style: "cancel" },
//         ]);
//         setTaskCreationStatus(errorMsg);
//       } else {
//         throw new Error(
//           directTaskData.error || "Failed to create delivery task"
//         );
//       }
//     } catch (error) {
//       console.error("Error creating Tookan task:", error);

//       const errorMessage = error.message.includes("geocode")
//         ? "Unable to locate the addresses. Please verify the addresses are correct."
//         : `Task creation failed: ${error.message}`;

//       setTaskCreationStatus(errorMessage);

//       Alert.alert("Task Creation Failed", errorMessage, [
//         { text: "Edit Address", onPress: () => navigation.goBack() },
//         { text: "Continue Anyway", style: "cancel" },
//       ]);

//       if (deliveryData) {
//         console.log("Continuing without Tookan task - delivery data available");
//       }
//     } finally {
//       setIsCreatingTask(false);
//       setTimeout(() => setTaskCreationStatus(null), 8000); // Increased timeout for error messages
//     }
//   };

//   const handleGoBack = () => {
//     if (navigation.canGoBack()) {
//       navigation.goBack();
//     } else {
//       navigation.navigate("Home");
//     }
//   };

//   const handleRetry = () => {
//     if (sessionId) {
//       fetchDeliveryDetails();
//     } else {
//       setError(null);
//       setHasCheckedForDelivery(false);
//       navigation.navigate("Send", { screen: "PackageDetails" });
//     }
//   };

//   const handleCreateNewDelivery = () => {
//     navigation.navigate("Send", { screen: "PackageDetails" });
//   };

//   const handleOpenExternalTracking = () => {
//     if (trackingUrl) {
//       Linking.openURL(trackingUrl);
//     } else {
//       Alert.alert(
//         "Tracking Unavailable",
//         "External tracking URL is not available yet."
//       );
//     }
//   };

//   const formatCurrency = (amount) => {
//     if (!amount) return "£0.00";
//     return new Intl.NumberFormat("en-GB", {
//       style: "currency",
//       currency: "GBP",
//     }).format(amount);
//   };

//   const getDeliveryStatusColor = () => {
//     if (!deliveryData) return "#6B7280";

//     // Use statusColor if available from tracking data
//     if (deliveryData.statusColor) {
//       return deliveryData.statusColor;
//     }

//     // Fallback to status key
//     switch (deliveryData.status) {
//       case "completed":
//         return "#10B981"; // Green
//       case "started":
//       case "arrived":
//       case "arrived_pickup": // ✅ FIXED: Add this new status
//         return "#F59E0B"; // Orange/Yellow
//       case "assigned":
//       case "accepted":
//         return "#3B82F6"; // Blue
//       case "failed":
//         return "#EF4444"; // Red
//       case "cancelled":
//         return "#6B7280"; // Gray
//       default:
//         return "#6B7280"; // Gray
//     }
//   };

//   // const getDeliveryStatusColor = () => {
//   //   if (!deliveryData) return "#6B7280";

//   //   // Use statusColor if available from tracking data
//   //   if (deliveryData.statusColor) {
//   //     return deliveryData.statusColor;
//   //   }

//   //   // Fallback to status key
//   //   switch (deliveryData.status) {
//   //     case "completed":
//   //       return "#10B981"; // Green
//   //     case "started":
//   //     case "arrived":
//   //       return "#F59E0B"; // Orange/Yellow
//   //     case "assigned":
//   //     case "accepted":
//   //       return "#3B82F6"; // Blue
//   //     case "failed":
//   //       return "#EF4444"; // Red
//   //     case "cancelled":
//   //       return "#6B7280"; // Gray
//   //     default:
//   //       return "#6B7280"; // Gray
//   //   }
//   // };
//   const getDeliveryStatusText = () => {
//     if (isCreatingTask) return "Setting up delivery...";
//     if (!deliveryData) return "Loading...";

//     // Use the statusText if available (from tracking data)
//     if (deliveryData.statusText) {
//       return deliveryData.statusText;
//     }

//     // Fallback to status key
//     switch (deliveryData.status) {
//       case "completed":
//         return "Delivery completed ✓";
//       case "started":
//         return "Driver en route 🚗";
//       case "assigned":
//         return "Driver assigned";
//       case "accepted":
//         return "Driver accepted";
//       case "arrived":
//         return "Driver arrived at pickup";
//       case "failed":
//         return "Delivery failed ✗";
//       case "cancelled":
//         return "Cancelled";
//       case "unassigned":
//         return "Unassigned";
//       default:
//         return tookanTaskId
//           ? "Awaiting driver assignment"
//           : "Payment confirmed";
//     }
//   };
//   const getTrackingStatusText = () => {
//     if (trackingError) return "Tracking unavailable";
//     if (!isTrackingActive) return "Tap to start live tracking";
//     if (!trackingData) return "Connecting...";

//     const timeSinceUpdate = lastTrackingUpdate
//       ? Math.floor((Date.now() - new Date(lastTrackingUpdate).getTime()) / 1000)
//       : 0;

//     return `Live tracking • Updated ${timeSinceUpdate}s ago`;
//   };
//   // Add this to your LocationScreen.js - REPLACE the getStatusInfo function inside fetchTrackingData

//   // ✅ ALSO UPDATE: getDeliveryStatusColor function

//   if (isLoading) {
//     return (
//       <SafeAreaView className="flex-1 bg-white">
//         <View className="flex-1 justify-center items-center">
//           <ActivityIndicator size="large" color="#8328FA" />
//           <Text className="mt-4 text-gray-600 text-center px-6">
//             Loading delivery details...
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (error) {
//     return (
//       <SafeAreaView className="flex-1 bg-white">
//         <View className="absolute top-14 left-6 z-10">
//           <TouchableOpacity
//             className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
//             onPress={handleGoBack}
//           >
//             <ChevronLeft size={24} color="#000" />
//           </TouchableOpacity>
//         </View>

//         <View className="flex-1 justify-center items-center p-6">
//           <Text className="text-xl font-semibold text-red-600 mb-4 text-center">
//             {error.includes("No recent delivery")
//               ? "No Active Delivery"
//               : "Error"}
//           </Text>
//           <Text className="text-gray-600 text-center mb-6">{error}</Text>
//           <TouchableOpacity
//             className="bg-[#8328FA] px-6 py-3 rounded-lg mb-3"
//             onPress={handleCreateNewDelivery}
//           >
//             <Text className="text-white font-semibold">
//               Create New Delivery
//             </Text>
//           </TouchableOpacity>
//           {sessionId && (
//             <TouchableOpacity
//               className="border border-[#8328FA] px-6 py-3 rounded-lg"
//               onPress={handleRetry}
//             >
//               <Text className="text-[#8328FA] font-semibold">Try Again</Text>
//             </TouchableOpacity>
//           )}
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
//       {/* Fixed Header */}
//       <View
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           zIndex: 20,
//           backgroundColor: "white",
//           flexDirection: "row",
//           alignItems: "center",
//           paddingHorizontal: 24,
//           paddingVertical: 16,
//           height: 60,
//         }}
//       >
//         <TouchableOpacity
//           style={{
//             width: 40,
//             height: 40,
//             backgroundColor: "white",
//             borderRadius: 20,
//             alignItems: "center",
//             justifyContent: "center",
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.1,
//             shadowRadius: 8,
//             elevation: 3,
//           }}
//           onPress={handleGoBack}
//         >
//           <ChevronLeft size={24} color="#000" />
//         </TouchableOpacity>

//         <View style={{ flex: 1, alignItems: "center" }}>
//           <Text style={{ fontSize: 18, fontWeight: "600", color: "#000" }}>
//             {deliveryData ? "Live Tracking" : "Delivery Status"}
//           </Text>
//         </View>

//         {/* Map Controls */}
//         <View style={{ flexDirection: "row", alignItems: "center" }}>
//           {deliveryData && (
//             <TouchableOpacity
//               style={{
//                 width: 40,
//                 height: 40,
//                 backgroundColor: isTrackingActive ? "#10B981" : "#6B7280",
//                 borderRadius: 20,
//                 alignItems: "center",
//                 justifyContent: "center",
//                 marginRight: 8,
//               }}
//               onPress={toggleLiveTracking}
//             >
//               <Navigation size={16} color="white" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Scrollable Content */}
//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{ paddingTop: 60 }}
//         showsVerticalScrollIndicator={false}
//         bounces={false}
//       >
//         {/* Live Map Container */}
//         <View style={{ height: 350, backgroundColor: "#f5f5f5" }}>
//           <MapView
//             ref={mapRef}
//             provider={PROVIDER_GOOGLE}
//             style={{ flex: 1 }}
//             region={mapRegion}
//             onRegionChangeComplete={setMapRegion}
//             showsUserLocation={false}
//             showsMyLocationButton={false}
//             showsCompass={true}
//             showsScale={true}
//             loadingEnabled={true}
//             loadingIndicatorColor="#8328FA"
//             mapType="standard"
//           >
//             {/* Pickup Marker */}
//             {pickupCoordinates && (
//               <Marker
//                 coordinate={pickupCoordinates}
//                 title="Pickup Location"
//                 description={
//                   deliveryData?.shipmentDetails?.pickupAddress || "Pickup"
//                 }
//                 pinColor="#3B82F6"
//                 identifier="pickup"
//               />
//             )}

//             {/* Delivery Marker */}
//             {deliveryCoordinates && (
//               <Marker
//                 coordinate={deliveryCoordinates}
//                 title="Delivery Location"
//                 description={
//                   deliveryData?.shipmentDetails?.receiverAddress || "Delivery"
//                 }
//                 pinColor="#10B981"
//                 identifier="delivery"
//               />
//             )}

//             {/* Driver Marker */}
//             {driverLocation && (
//               <Marker
//                 coordinate={driverLocation}
//                 title="Driver Location"
//                 description="Current driver position"
//                 pinColor="#F59E0B"
//                 identifier="driver"
//               >
//                 <View
//                   style={{
//                     width: 30,
//                     height: 30,
//                     borderRadius: 15,
//                     backgroundColor: "#F59E0B",
//                     borderWidth: 3,
//                     borderColor: "white",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <View
//                     style={{
//                       width: 12,
//                       height: 12,
//                       borderRadius: 6,
//                       backgroundColor: "white",
//                     }}
//                   />
//                 </View>
//               </Marker>
//             )}

//             {/* Route Polyline */}
//             {routeCoordinates.length > 1 && (
//               <Polyline
//                 coordinates={routeCoordinates}
//                 strokeColor="#8328FA"
//                 strokeWidth={3}
//                 strokePattern={[1]}
//               />
//             )}
//           </MapView>

//           {/* Map Overlay Controls */}
//           <View
//             style={{
//               position: "absolute",
//               top: 16,
//               left: 16,
//               right: 16,
//               zIndex: 10,
//             }}
//           >
//             {/* Tracking Status */}
//             <TouchableOpacity
//               style={{
//                 backgroundColor: "rgba(0,0,0,0.8)",
//                 paddingHorizontal: 12,
//                 paddingVertical: 8,
//                 borderRadius: 20,
//                 flexDirection: "row",
//                 alignItems: "center",
//                 alignSelf: "flex-start",
//                 marginBottom: 8,
//               }}
//               onPress={toggleLiveTracking}
//             >
//               <View
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: 4,
//                   backgroundColor: isTrackingActive ? "#10B981" : "#6B7280",
//                   marginRight: 8,
//                 }}
//               />
//               <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }}>
//                 {getTrackingStatusText()}
//               </Text>
//               {isTrackingActive && (
//                 <RefreshCw size={12} color="white" style={{ marginLeft: 4 }} />
//               )}
//             </TouchableOpacity>

//             {/* Delivery Status */}
//             <View
//               style={{
//                 backgroundColor: "rgba(0,0,0,0.7)",
//                 paddingHorizontal: 12,
//                 paddingVertical: 6,
//                 borderRadius: 16,
//                 alignSelf: "flex-start",
//               }}
//             >
//               <Text
//                 style={{
//                   color: "white",
//                   fontSize: 11,
//                   fontWeight: "500",
//                 }}
//               >
//                 {getDeliveryStatusText()}
//               </Text>
//             </View>
//           </View>

//           {/* Map Action Buttons */}
//           <View
//             style={{
//               position: "absolute",
//               bottom: 16,
//               right: 16,
//               zIndex: 10,
//             }}
//           >
//             <TouchableOpacity
//               style={{
//                 width: 44,
//                 height: 44,
//                 backgroundColor: "white",
//                 borderRadius: 22,
//                 alignItems: "center",
//                 justifyContent: "center",
//                 marginBottom: 8,
//                 shadowColor: "#000",
//                 shadowOffset: { width: 0, height: 2 },
//                 shadowOpacity: 0.2,
//                 shadowRadius: 4,
//                 elevation: 3,
//               }}
//               onPress={fitMapToMarkers}
//             >
//               <Search size={20} color="#6B7280" />
//             </TouchableOpacity>

//             {driverLocation && (
//               <TouchableOpacity
//                 style={{
//                   width: 44,
//                   height: 44,
//                   backgroundColor: "white",
//                   borderRadius: 22,
//                   alignItems: "center",
//                   justifyContent: "center",
//                   marginBottom: 8,
//                   shadowColor: "#000",
//                   shadowOffset: { width: 0, height: 2 },
//                   shadowOpacity: 0.2,
//                   shadowRadius: 4,
//                   elevation: 3,
//                 }}
//                 onPress={() => centerMapOn(driverLocation, "Driver")}
//               >
//                 <Navigation size={18} color="#F59E0B" />
//               </TouchableOpacity>
//             )}
//           </View>

//           {/* Quick Location Buttons */}
//           <View
//             style={{
//               position: "absolute",
//               bottom: 16,
//               left: 16,
//               zIndex: 10,
//               flexDirection: "row",
//             }}
//           >
//             {pickupCoordinates && (
//               <TouchableOpacity
//                 style={{
//                   backgroundColor: "rgba(59, 130, 246, 0.9)",
//                   paddingHorizontal: 8,
//                   paddingVertical: 4,
//                   borderRadius: 12,
//                   marginRight: 6,
//                 }}
//                 onPress={() => centerMapOn(pickupCoordinates, "Pickup")}
//               >
//                 <Text
//                   style={{ color: "white", fontSize: 10, fontWeight: "500" }}
//                 >
//                   Pickup
//                 </Text>
//               </TouchableOpacity>
//             )}

//             {deliveryCoordinates && (
//               <TouchableOpacity
//                 style={{
//                   backgroundColor: "rgba(16, 185, 129, 0.9)",
//                   paddingHorizontal: 8,
//                   paddingVertical: 4,
//                   borderRadius: 12,
//                 }}
//                 onPress={() => centerMapOn(deliveryCoordinates, "Delivery")}
//               >
//                 <Text
//                   style={{ color: "white", fontSize: 10, fontWeight: "500" }}
//                 >
//                   Delivery
//                 </Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Content Section */}
//         <View
//           style={{
//             backgroundColor: "white",
//             borderTopLeftRadius: 24,
//             borderTopRightRadius: 24,
//             paddingHorizontal: 24,
//             paddingTop: 24,
//             paddingBottom: 50,
//             marginTop: -20,
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: -4 },
//             shadowOpacity: 0.1,
//             shadowRadius: 12,
//             elevation: 8,
//           }}
//         >
//           {/* Handle */}
//           <View
//             style={{
//               width: 48,
//               height: 4,
//               backgroundColor: "#D1D5DB",
//               borderRadius: 12,
//               alignSelf: "center",
//               marginBottom: 24,
//             }}
//           />

//           {/* Tracking Controls */}
//           {deliveryData && tookanTaskId && (
//             <View style={{ marginBottom: 24 }}>
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                   marginBottom: 16,
//                 }}
//               >
//                 <Text
//                   style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
//                 >
//                   Live Tracking
//                 </Text>
//                 <TouchableOpacity
//                   style={{
//                     flexDirection: "row",
//                     alignItems: "center",
//                     backgroundColor: isTrackingActive ? "#FEE2E2" : "#EBF8FF",
//                     paddingHorizontal: 12,
//                     paddingVertical: 6,
//                     borderRadius: 16,
//                   }}
//                   onPress={toggleLiveTracking}
//                 >
//                   <View
//                     style={{
//                       width: 6,
//                       height: 6,
//                       borderRadius: 3,
//                       backgroundColor: isTrackingActive ? "#EF4444" : "#3B82F6",
//                       marginRight: 6,
//                     }}
//                   />
//                   <Text
//                     style={{
//                       fontSize: 12,
//                       fontWeight: "500",
//                       color: isTrackingActive ? "#EF4444" : "#3B82F6",
//                     }}
//                   >
//                     {isTrackingActive ? "Stop" : "Start"}
//                   </Text>
//                 </TouchableOpacity>
//               </View>

//               {/* Tracking Info */}
//               <View
//                 style={{
//                   backgroundColor: "#F9FAFB",
//                   padding: 16,
//                   borderRadius: 12,
//                   marginBottom: 16,
//                 }}
//               >
//                 <View
//                   style={{
//                     flexDirection: "row",
//                     justifyContent: "space-between",
//                     marginBottom: 8,
//                   }}
//                 >
//                   <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                     Status:
//                   </Text>
//                   <Text
//                     style={{
//                       fontWeight: "600",
//                       fontSize: 12,
//                       color: getDeliveryStatusColor(),
//                     }}
//                   >
//                     {getDeliveryStatusText()}
//                   </Text>
//                 </View>

//                 {trackingData && (
//                   <>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Driver Location:
//                       </Text>
//                       <Text
//                         style={{
//                           fontWeight: "600",
//                           fontSize: 12,
//                           color: "#111827",
//                         }}
//                       >
//                         {driverLocation ? "Available" : "Not available"}
//                       </Text>
//                     </View>

//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Last Update:
//                       </Text>
//                       <Text
//                         style={{
//                           fontWeight: "600",
//                           fontSize: 12,
//                           color: "#111827",
//                         }}
//                       >
//                         {lastTrackingUpdate
//                           ? new Date(lastTrackingUpdate).toLocaleTimeString()
//                           : "Never"}
//                       </Text>
//                     </View>
//                   </>
//                 )}

//                 {trackingError && (
//                   <Text
//                     style={{
//                       color: "#EF4444",
//                       fontSize: 12,
//                       marginTop: 8,
//                       textAlign: "center",
//                     }}
//                   >
//                     {trackingError}
//                   </Text>
//                 )}
//               </View>

//               {/* External Tracking Button */}
//               <TouchableOpacity
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   backgroundColor: "#F3F4F6",
//                   paddingVertical: 12,
//                   paddingHorizontal: 16,
//                   borderRadius: 8,
//                   borderWidth: 1,
//                   borderColor: "#D1D5DB",
//                 }}
//                 onPress={handleOpenExternalTracking}
//                 disabled={!trackingUrl}
//               >
//                 <ExternalLink
//                   size={16}
//                   color={trackingUrl ? "#6B7280" : "#9CA3AF"}
//                 />
//                 <Text
//                   style={{
//                     marginLeft: 8,
//                     fontSize: 14,
//                     fontWeight: "500",
//                     color: trackingUrl ? "#6B7280" : "#9CA3AF",
//                   }}
//                 >
//                   Open in Tookan Tracker
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* Package Information */}
//           <Text
//             style={{
//               fontSize: 20,
//               fontWeight: "600",
//               marginBottom: 16,
//               color: "#111827",
//             }}
//           >
//             Delivery Information
//           </Text>

//           {deliveryData ? (
//             <>
//               {/* Status Section */}
//               <View
//                 style={{
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   marginBottom: 24,
//                 }}
//               >
//                 <View style={{ flex: 1, marginRight: 16 }}>
//                   <Text
//                     style={{ color: "#6B7280", marginBottom: 4, fontSize: 12 }}
//                   >
//                     Delivery Type
//                   </Text>
//                   <Text style={{ fontWeight: "600", fontSize: 14 }}>
//                     {deliveryData.shipmentDetails?.deliveryType ||
//                       "Standard delivery"}
//                   </Text>
//                 </View>
//                 <View style={{ flex: 1 }}>
//                   <Text
//                     style={{ color: "#6B7280", marginBottom: 4, fontSize: 12 }}
//                   >
//                     Status
//                   </Text>
//                   <Text
//                     style={{
//                       fontWeight: "600",
//                       color: getDeliveryStatusColor(),
//                       fontSize: 14,
//                     }}
//                   >
//                     {getDeliveryStatusText()}
//                   </Text>
//                 </View>
//               </View>

//               {/* Task Information */}
//               {(tookanTaskId || trackingUrl || deliveryData.deliveryId) && (
//                 <View
//                   style={{
//                     marginBottom: 24,
//                     backgroundColor: "#EBF8FF",
//                     padding: 16,
//                     borderRadius: 12,
//                   }}
//                 >
//                   <Text
//                     style={{
//                       color: "#1E40AF",
//                       fontWeight: "600",
//                       marginBottom: 8,
//                       fontSize: 14,
//                     }}
//                   >
//                     Tracking Details
//                   </Text>

//                   {deliveryData.deliveryId && (
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#3B82F6", fontSize: 12 }}>
//                         Delivery ID:
//                       </Text>
//                       <Text
//                         style={{
//                           color: "#1E40AF",
//                           fontSize: 12,
//                           fontFamily: "monospace",
//                         }}
//                       >
//                         {deliveryData.deliveryId}
//                       </Text>
//                     </View>
//                   )}

//                   {tookanTaskId && (
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#3B82F6", fontSize: 12 }}>
//                         Task ID:
//                       </Text>
//                       <Text
//                         style={{
//                           color: "#1E40AF",
//                           fontSize: 12,
//                           fontFamily: "monospace",
//                         }}
//                       >
//                         {tookanTaskId}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               )}

//               {deliveryData.shipmentDetails && (
//                 <>
//                   {/* Addresses */}
//                   <View
//                     style={{
//                       marginBottom: 24,
//                       backgroundColor: "#F9FAFB",
//                       padding: 16,
//                       borderRadius: 12,
//                     }}
//                   >
//                     <View style={{ marginBottom: 12 }}>
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <MapPin size={16} color="#6B7280" />
//                         <Text
//                           style={{
//                             color: "#6B7280",
//                             fontSize: 12,
//                             marginLeft: 8,
//                           }}
//                         >
//                           Pickup Location
//                         </Text>
//                       </View>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.pickupAddress}
//                       </Text>
//                     </View>

//                     <View
//                       style={{
//                         height: 1,
//                         backgroundColor: "#E5E7EB",
//                         marginVertical: 8,
//                       }}
//                     />

//                     <View>
//                       <View
//                         style={{
//                           flexDirection: "row",
//                           alignItems: "center",
//                           marginBottom: 8,
//                         }}
//                       >
//                         <MapPin size={16} color="#6B7280" />
//                         <Text
//                           style={{
//                             color: "#6B7280",
//                             fontSize: 12,
//                             marginLeft: 8,
//                           }}
//                         >
//                           Delivery Location
//                         </Text>
//                       </View>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.receiverAddress}
//                       </Text>
//                     </View>
//                   </View>

//                   {/* Package Details */}
//                   <View style={{ marginBottom: 24 }}>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <Package size={16} color="#6B7280" />
//                       <Text
//                         style={{
//                           color: "#6B7280",
//                           fontSize: 12,
//                           marginLeft: 8,
//                         }}
//                       >
//                         Package Details
//                       </Text>
//                     </View>

//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Item Type:
//                       </Text>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.itemType}
//                       </Text>
//                     </View>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Weight:
//                       </Text>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.selectedWeight}
//                       </Text>
//                     </View>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Fragile:
//                       </Text>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {deliveryData.shipmentDetails.isFragile ? "Yes" : "No"}
//                       </Text>
//                     </View>
//                     <View
//                       style={{
//                         flexDirection: "row",
//                         justifyContent: "space-between",
//                         marginBottom: 8,
//                       }}
//                     >
//                       <Text style={{ color: "#6B7280", fontSize: 12 }}>
//                         Total Amount:
//                       </Text>
//                       <Text style={{ fontWeight: "600", fontSize: 12 }}>
//                         {formatCurrency(deliveryData.totalAmount)}
//                       </Text>
//                     </View>
//                   </View>

//                   {/* Contact Actions */}
//                   <View
//                     style={{
//                       flexDirection: "row",
//                       justifyContent: "space-between",
//                       marginBottom: 16,
//                     }}
//                   >
//                     <TouchableOpacity
//                       style={{
//                         flex: 1,
//                         backgroundColor: tookanTaskId ? "#8328FA" : "#D1D5DB",
//                         paddingVertical: 12,
//                         paddingHorizontal: 16,
//                         borderRadius: 8,
//                         marginRight: 8,
//                         flexDirection: "row",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                       disabled={!tookanTaskId}
//                     >
//                       <Phone
//                         size={18}
//                         color={tookanTaskId ? "#fff" : "#9CA3AF"}
//                       />
//                       <Text
//                         style={{
//                           color: tookanTaskId ? "white" : "#9CA3AF",
//                           fontWeight: "600",
//                           marginLeft: 8,
//                           fontSize: 14,
//                         }}
//                       >
//                         Call Driver
//                       </Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       style={{
//                         flex: 1,
//                         borderWidth: 1,
//                         borderColor: tookanTaskId ? "#8328FA" : "#D1D5DB",
//                         paddingVertical: 12,
//                         paddingHorizontal: 16,
//                         borderRadius: 8,
//                         marginLeft: 8,
//                         flexDirection: "row",
//                         alignItems: "center",
//                         justifyContent: "center",
//                       }}
//                       disabled={!tookanTaskId}
//                     >
//                       <MessageCircle
//                         size={18}
//                         color={tookanTaskId ? "#8328FA" : "#9CA3AF"}
//                       />
//                       <Text
//                         style={{
//                           color: tookanTaskId ? "#8328FA" : "#9CA3AF",
//                           fontWeight: "600",
//                           marginLeft: 8,
//                           fontSize: 14,
//                         }}
//                       >
//                         Message
//                       </Text>
//                     </TouchableOpacity>
//                   </View>

//                   {!tookanTaskId && !isCreatingTask && (
//                     <Text
//                       style={{
//                         color: "#6B7280",
//                         textAlign: "center",
//                         fontSize: 12,
//                         marginBottom: 16,
//                       }}
//                     >
//                       Driver contact will be available once task is created
//                     </Text>
//                   )}

//                   {/* Create New Delivery Button */}
//                   <TouchableOpacity
//                     onPress={handleCreateNewDelivery}
//                     style={{
//                       backgroundColor: "#F3F4F6",
//                       borderWidth: 1,
//                       borderColor: "#D1D5DB",
//                       paddingVertical: 12,
//                       paddingHorizontal: 16,
//                       borderRadius: 8,
//                       marginTop: 16,
//                       alignItems: "center",
//                     }}
//                   >
//                     <Text
//                       style={{
//                         color: "#6B7280",
//                         fontWeight: "600",
//                         fontSize: 14,
//                       }}
//                     >
//                       Create New Delivery
//                     </Text>
//                   </TouchableOpacity>
//                 </>
//               )}
//             </>
//           ) : (
//             <View style={{ alignItems: "center", paddingVertical: 32 }}>
//               <Text
//                 style={{
//                   color: "#6B7280",
//                   textAlign: "center",
//                   marginBottom: 16,
//                 }}
//               >
//                 No delivery information available
//               </Text>
//               <TouchableOpacity
//                 onPress={handleCreateNewDelivery}
//                 style={{
//                   backgroundColor: "#8328FA",
//                   paddingVertical: 12,
//                   paddingHorizontal: 24,
//                   borderRadius: 8,
//                 }}
//               >
//                 <Text style={{ color: "white", fontWeight: "600" }}>
//                   Create New Delivery
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Package,
  Navigation,
  RefreshCw,
  ExternalLink,
} from "lucide-react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Modal } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { X, Printer, Share2 } from "lucide-react-native";
import { updateShipmentStatus } from "../../utils/deliveryFirestore";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function LocationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [deliveryData, setDeliveryData] = useState(null);
  const [error, setError] = useState(null);
  const [tookanTaskId, setTookanTaskId] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskCreationStatus, setTaskCreationStatus] = useState(null);
  const [hasCheckedForDelivery, setHasCheckedForDelivery] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  // Live tracking states
  const [mapRegion, setMapRegion] = useState({
    latitude: 51.5074, // Default to London
    longitude: -0.1278,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [previousStatusKey, setPreviousStatusKey] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [deliveryCoordinates, setDeliveryCoordinates] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  const [lastTrackingUpdate, setLastTrackingUpdate] = useState(null);

  // Get parameters from route
  const params = route.params || {};
  const {
    sessionId,
    paymentStatus,
    fromPayment,
    shipmentDetails,
    verifiedPayment,
  } = params;

  const backendUrl = "http://192.168.43.176:3000";

  // // Function to get coordinates from postcode using Google Geocoding API

  const getCoordinatesFromPostcode = async (postcode) => {
    if (!postcode || postcode.trim().length === 0) {
      console.error("Invalid postcode provided:", postcode);
      return null;
    }

    try {
      console.log("[Frontend] Geocoding postcode:", postcode);

      const response = await fetch(
        `${backendUrl}/api/geocode?postcode=${encodeURIComponent(
          postcode.trim()
        )}`
      );

      console.log("[Frontend] Geocoding response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[Frontend] Geocoding HTTP error:",
          response.status,
          errorText
        );

        if (response.status === 404) {
          console.warn(`[Frontend] Postcode not found: ${postcode}`);
          return null;
        }

        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[Frontend] Geocoding response data:", data);

      if (data.success && data.coordinates) {
        console.log("[Frontend] Geocoding successful:", {
          postcode: postcode,
          coordinates: data.coordinates,
          source: data.source,
        });

        return {
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng,
        };
      }

      console.warn("[Frontend] Geocoding failed - no coordinates:", data);
      return null;
    } catch (error) {
      console.error("[Frontend] Geocoding error:", error.message);

      // Show user-friendly error for specific cases
      if (error.message.includes("404")) {
        console.warn(`[Frontend] Postcode not recognized: ${postcode}`);
      } else {
        console.error(`[Frontend] Geocoding service error: ${error.message}`);
      }

      return null;
    }
  };

  // Function to get route between two points using Google Directions API
  const getRouteCoordinates = async (origin, destination) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/directions?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`
      );

      if (!response.ok) {
        throw new Error(`Directions failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.route && data.route.length > 0) {
        return data.route;
      }

      return [origin, destination]; // Fallback to straight line
    } catch (error) {
      console.error("Error getting route:", error);
      return [origin, destination]; // Fallback to straight line
    }
  };

  const initializeMap = async () => {
    if (!deliveryData?.shipmentDetails) {
      console.log("[Map] No shipment details available");
      return;
    }

    const { pickupPostcode, receiverPostcode } = deliveryData.shipmentDetails;

    if (!pickupPostcode || !receiverPostcode) {
      console.warn("[Map] Missing postcode data:", {
        pickupPostcode,
        receiverPostcode,
      });
      return;
    }

    try {
      console.log("[Map] Initializing with postcodes:", {
        pickupPostcode,
        receiverPostcode,
      });

      const [pickupCoords, deliveryCoords] = await Promise.all([
        getCoordinatesFromPostcode(pickupPostcode),
        getCoordinatesFromPostcode(receiverPostcode),
      ]);

      console.log("[Map] Geocoding results:", {
        pickup: pickupCoords,
        delivery: deliveryCoords,
      });

      // Handle partial failures
      if (!pickupCoords && !deliveryCoords) {
        console.error("[Map] Failed to geocode both postcodes");
        Alert.alert(
          "Location Error",
          "Unable to locate pickup and delivery addresses. Please check the postcodes.",
          [{ text: "OK" }]
        );
        return;
      }

      if (!pickupCoords) {
        console.warn(
          "[Map] Failed to geocode pickup postcode:",
          pickupPostcode
        );
        Alert.alert(
          "Location Warning",
          `Unable to locate pickup address: ${pickupPostcode}`,
          [{ text: "OK" }]
        );
      }

      if (!deliveryCoords) {
        console.warn(
          "[Map] Failed to geocode delivery postcode:",
          receiverPostcode
        );
        Alert.alert(
          "Location Warning",
          `Unable to locate delivery address: ${receiverPostcode}`,
          [{ text: "OK" }]
        );
      }

      // Use available coordinates
      const availableCoords = [pickupCoords, deliveryCoords].filter(Boolean);

      if (availableCoords.length > 0) {
        if (pickupCoords) setPickupCoordinates(pickupCoords);
        if (deliveryCoords) setDeliveryCoordinates(deliveryCoords);

        // Get route between available coordinates
        if (pickupCoords && deliveryCoords) {
          console.log("[Map] Getting route between coordinates");
          const route = await getRouteCoordinates(pickupCoords, deliveryCoords);
          setRouteCoordinates(route);

          // Center map on the route
          const minLat = Math.min(
            pickupCoords.latitude,
            deliveryCoords.latitude
          );
          const maxLat = Math.max(
            pickupCoords.latitude,
            deliveryCoords.latitude
          );
          const minLng = Math.min(
            pickupCoords.longitude,
            deliveryCoords.longitude
          );
          const maxLng = Math.max(
            pickupCoords.longitude,
            deliveryCoords.longitude
          );

          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const latDelta = (maxLat - minLat) * 1.5; // Add padding
          const lngDelta = (maxLng - minLng) * 1.5;

          const newRegion = {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
            longitudeDelta: Math.max(lngDelta, 0.01),
          };

          setMapRegion(newRegion);

          // Animate map to show the route
          if (mapRef.current) {
            setTimeout(() => {
              mapRef.current?.animateToRegion(newRegion, 1000);
            }, 100);
          }
        } else {
          // Center on single available location
          const singleCoord = availableCoords[0];
          const newRegion = {
            latitude: singleCoord.latitude,
            longitude: singleCoord.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };

          setMapRegion(newRegion);

          if (mapRef.current) {
            setTimeout(() => {
              mapRef.current?.animateToRegion(newRegion, 1000);
            }, 100);
          }
        }

        console.log("[Map] Map initialized successfully");
      }
    } catch (error) {
      console.error("[Map] Error initializing map:", error);
      Alert.alert(
        "Map Error",
        "Unable to load map locations. The tracking will still work when the driver is assigned.",
        [{ text: "OK" }]
      );
    }
  };

  const fetchTrackingData = async () => {
    if (!tookanTaskId) {
      console.log("No Tookan task ID available for tracking");
      return;
    }

    try {
      console.log("[Tracking] Fetching data for task:", tookanTaskId);

      const response = await fetch(
        `${backendUrl}/api/tookan/tracking/${tookanTaskId}`
        //`${backendUrl}/api/webhook/tookan/latest/${tookanTaskId}`
      );

      console.log("[Tracking] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Tracking] HTTP Error:", response.status, errorText);
        throw new Error(`Tracking fetch failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[Tracking] RAW Response:", JSON.stringify(data, null, 2));

      if (data.success && data.trackingData) {
        setTrackingData(data.trackingData);
        setTrackingError(null);
        setLastTrackingUpdate(new Date().toISOString());

        const { agent_location, job_status } = data.trackingData;

        const getStatusInfo = (status) => {
          const statusCode = parseInt(status);
          console.log("[Tracking] ====================");
          console.log("[Tracking] Processing status code:", statusCode);

          let statusInfo;

          switch (statusCode) {
            case 0:
              statusInfo = {
                key: "created",
                text: "Task created",
                color: "#6B7280",
              };
              break;
            case 1:
              statusInfo = {
                key: "assigned",
                text: "Driver assigned",
                color: "#3B82F6",
              };
              break;
            case 2:
              statusInfo = {
                key: "started",
                text: "Driver started 🚗",
                color: "#F59E0B",
              };
              break;
            case 3:
              statusInfo = {
                key: "completed",
                text: "Delivered successfully ✓",
                color: "#10B981",
              };
              break;
            case 4:
              statusInfo = {
                key: "failed",
                text: "Delivery failed ✗",
                color: "#EF4444",
              };
              break;
            case 5:
              statusInfo = {
                key: "cancelled",
                text: "Cancelled",
                color: "#6B7280",
              };
              break;
            case 6:
              statusInfo = {
                key: "cancelled_dispatcher",
                text: "Cancelled by dispatcher",
                color: "#6B7280",
              };
              break;
            case 7:
              statusInfo = {
                key: "acknowledged",
                text: "Driver accepted",
                color: "#3B82F6",
              };
              break;
            case 8:
              statusInfo = {
                key: "arrived",
                text: "Driver arrived 📍",
                color: "#F59E0B",
              };
              break;
            case 9:
              statusInfo = {
                key: "started_delivery",
                text: "En route to delivery 🚗",
                color: "#F59E0B",
              };
              break;
            case 10:
              statusInfo = {
                key: "unassigned",
                text: "Unassigned",
                color: "#6B7280",
              };
              break;
            case 11:
              statusInfo = {
                key: "confirming_delivery",
                text: "Driver confirming delivery 📸",
                color: "#F59E0B",
              };
              break;
            case 12:
              statusInfo = {
                key: "delivery_confirmed",
                text: "Delivery confirmed ✓",
                color: "#10B981",
              };
              break;
            default:
              statusInfo = {
                key: "unknown",
                text: `Status ${statusCode}`,
                color: "#6B7280",
              };
          }

          console.log("[Tracking] Mapped to:", statusInfo);
          console.log("[Tracking] ====================");
          return statusInfo;
        };

        const statusInfo = getStatusInfo(job_status);

        // ✅ CRITICAL: Log the status transition BEFORE updating state
        console.log("[Tracking] Status Transition Check:", {
          previousStatus: previousStatusKey,
          newStatus: statusInfo.key,
          hasChanged: previousStatusKey !== statusInfo.key,
        });

        // Update driver location
        if (
          agent_location &&
          agent_location.latitude &&
          agent_location.longitude
        ) {
          const newDriverLocation = {
            latitude: parseFloat(agent_location.latitude),
            longitude: parseFloat(agent_location.longitude),
          };

          console.log("[Tracking] Driver location:", newDriverLocation);
          setDriverLocation(newDriverLocation);

          if (isTrackingActive && mapRef.current) {
            mapRef.current.animateToRegion(
              {
                ...newDriverLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              1000
            );
          }
        }

        // ✅ CHECK STATUS CHANGES BEFORE UPDATING STATE
        // This way we can detect transitions
        const statusHasChanged = previousStatusKey !== statusInfo.key;

        console.log("[Tracking] ========== STATUS CHANGE DETECTION ==========");
        console.log("[Tracking] Previous:", previousStatusKey);
        console.log("[Tracking] Current:", statusInfo.key);
        console.log("[Tracking] Changed:", statusHasChanged);

        if (statusHasChanged) {
          // Completed
          if (statusInfo.key === "completed") {
            console.log("[Tracking] 🎉 DELIVERY COMPLETED DETECTED!");

            Alert.alert(
              "Delivery Completed! 🎉",
              "Your package has been successfully delivered.",
              [{ text: "OK" }]
            );
            if (isTrackingActive) {
              stopLiveTracking();
            }
          }

          // Failed
          if (statusInfo.key === "failed") {
            console.log("[Tracking] ❌ DELIVERY FAILED DETECTED!");
            Alert.alert(
              "Delivery Failed",
              "There was an issue with the delivery. Please contact support.",
              [{ text: "OK" }]
            );
          }

          // Driver accepted
          if (statusInfo.key === "acknowledged") {
            console.log("[Tracking] ✅ DRIVER ACCEPTED DETECTED!");
            Alert.alert(
              "Driver Accepted",
              "The driver has accepted your delivery task.",
              [{ text: "OK" }]
            );
          }

          // Driver started moving
          if (
            statusInfo.key === "started" ||
            statusInfo.key === "started_delivery"
          ) {
            console.log("[Tracking] 🚗 DRIVER STARTED DETECTED!");

            Alert.alert(
              "Driver Started",
              "The driver is on the way to pick up your package.",
              [{ text: "OK" }]
            );
          }

          // Driver arrived
          if (statusInfo.key === "arrived") {
            console.log("[Tracking] 📍 DRIVER ARRIVED DETECTED!");
            Alert.alert(
              "Driver Arrived",
              "The driver has arrived at the pickup location.",
              [{ text: "OK" }]
            );
          }
        }

        // ✅ Update delivery data with new status
        setDeliveryData((prev) => ({
          ...prev,
          status: statusInfo.key,
          statusKey: statusInfo.key,
          statusText: statusInfo.text,
          statusColor: statusInfo.color,
          driverName: data.trackingData.agent_name || "Not assigned",
          driverId: data.trackingData.agent_id || null,
          lastStatusUpdate: new Date().toISOString(),
          rawJobStatus: job_status,
        }));

        // ✅ Update the previousStatusKey for NEXT comparison
        setPreviousStatusKey(statusInfo.key);

        console.log(
          "[Tracking] State updated with new status:",
          statusInfo.key
        );
      } else {
        setTrackingError(data.error || "No tracking data available");
        console.error("[Tracking] API returned error:", data.error);
      }
    } catch (error) {
      console.error("[Tracking] Error fetching data:", error);
      setTrackingError(`Tracking error: ${error.message}`);
    }
  };
  useEffect(() => {
    if (tookanTaskId && !previousStatusKey) {
      console.log("[Tracking] Initializing previousStatusKey");
      setPreviousStatusKey(null); // Reset for fresh comparison
    }
  }, [tookanTaskId]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Start live tracking
  const startLiveTracking = () => {
    if (!tookanTaskId) {
      Alert.alert("Tracking Unavailable", "No active delivery task found.");
      return;
    }

    setIsTrackingActive(true);
    fetchTrackingData(); // Initial fetch

    // Set up polling interval (every 30 seconds)
    trackingIntervalRef.current = setInterval(() => {
      fetchTrackingData();
    }, 30000);

    console.log("Live tracking started for task:", tookanTaskId);
  };

  // Stop live tracking
  const stopLiveTracking = () => {
    setIsTrackingActive(false);

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    console.log("Live tracking stopped");
  };

  // Toggle tracking state
  const toggleLiveTracking = () => {
    if (isTrackingActive) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  };

  // Center map on specific location
  const centerMapOn = (location, title) => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );

    Alert.alert("Map Centered", `Centered on ${title}`);
  };

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current) return;

    const markers = [
      pickupCoordinates,
      deliveryCoordinates,
      driverLocation,
    ].filter(Boolean);

    if (markers.length === 0) return;

    if (markers.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...markers[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
      return;
    }

    const minLat = Math.min(...markers.map((m) => m.latitude));
    const maxLat = Math.max(...markers.map((m) => m.latitude));
    const minLng = Math.min(...markers.map((m) => m.longitude));
    const maxLng = Math.max(...markers.map((m) => m.longitude));

    const padding = 0.01; // Padding around markers

    mapRef.current.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: maxLat - minLat + padding,
        longitudeDelta: maxLng - minLng + padding,
      },
      1000
    );
  };

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Initialize map when delivery data is available
  useEffect(() => {
    if (deliveryData?.shipmentDetails) {
      initializeMap();
    }
  }, [deliveryData]);

  // Auto-start tracking when task ID becomes available
  useEffect(() => {
    if (tookanTaskId && deliveryData && !isTrackingActive) {
      setTimeout(() => {
        startLiveTracking();
      }, 2000); // Delay to allow map to initialize
    }
  }, [tookanTaskId, deliveryData]);

  // Function to check for recent delivery in AsyncStorage
  const checkForRecentDelivery = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const deliveryKeys = keys.filter((key) =>
        key.startsWith("recentDelivery_")
      );

      if (deliveryKeys.length > 0) {
        const deliveryPromises = deliveryKeys.map(async (key) => {
          const deliveryData = await AsyncStorage.getItem(key);
          return deliveryData ? JSON.parse(deliveryData) : null;
        });

        const deliveries = await Promise.all(deliveryPromises);
        const validDeliveries = deliveries.filter(
          (delivery) => delivery && delivery.timestamp
        );

        if (validDeliveries.length > 0) {
          const mostRecent = validDeliveries.sort(
            (a, b) => b.timestamp - a.timestamp
          )[0];

          const ageInHours =
            (Date.now() - mostRecent.timestamp) / (1000 * 60 * 60);
          if (ageInHours < 24) {
            return mostRecent;
          }
        }
      }
      return null;
    } catch (error) {
      console.log("Error checking for recent delivery:", error);
      return null;
    }
  };

  // Deep link handling
  useEffect(() => {
    const handleDeepLinkInLocationScreen = (event) => {
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

      console.log("LocationScreen received deep link:", incomingUrl);

      if (incomingUrl.includes("/payment-success")) {
        try {
          const urlObj = new URL(incomingUrl);
          const sessionId = urlObj.searchParams.get("session_id");

          if (sessionId) {
            console.log(
              "LocationScreen processing payment success for session:",
              sessionId
            );

            if (!deliveryData || deliveryData.sessionId !== sessionId) {
              fetchDeliveryDetailsForSession(sessionId);
            }
          }
        } catch (urlError) {
          console.error(
            "Invalid URL in LocationScreen deep link:",
            incomingUrl,
            urlError
          );
        }
      }
    };

    const linkingSubscription = Linking.addEventListener(
      "url",
      handleDeepLinkInLocationScreen
    );

    return () => {
      linkingSubscription?.remove();
    };
  }, [deliveryData]);

  const fetchDeliveryDetailsForSession = async (sessionId) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "Fetching delivery details for deep link session:",
        sessionId
      );

      const statusResponse = await fetch(
        `${backendUrl}/api/payment-status/${sessionId}`
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to get payment status: ${statusResponse.status}`
        );
      }

      const statusData = await statusResponse.json();
      console.log("Deep link payment status data:", statusData);

      if (statusData.paymentStatus !== "paid") {
        setError(`Payment not completed. Status: ${statusData.paymentStatus}`);
        return;
      }

      const deliveryInfo = {
        sessionId: sessionId,
        status: "payment_completed",
        paymentStatus: statusData.paymentStatus,
        shipmentDetails: statusData.shipmentDetails,
        totalAmount: statusData.totalAmount,
        createdAt: statusData.createdAt,
        completedAt: statusData.completedAt,
        fromDeepLink: true,
      };

      setDeliveryData(deliveryInfo);
      await storeDeliveryData(deliveryInfo);

      await AsyncStorage.removeItem("pendingPayment");

      if (statusData.shipmentDetails) {
        createTookanTask(sessionId, statusData.shipmentDetails);
      }

      Alert.alert(
        "Payment Confirmed",
        "Your delivery has been confirmed and is being processed.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error fetching delivery details from deep link:", error);
      setError(`Failed to load delivery details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const storeDeliveryData = async (deliveryData) => {
    try {
      const storageKey = `recentDelivery_${deliveryData.sessionId}`;
      const storageData = {
        ...deliveryData,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(storageData));
    } catch (error) {
      console.log("Error storing delivery data:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const initializeScreen = async () => {
        console.log("LocationScreen focused with params:", params);

        const checkPendingPayment = async () => {
          try {
            const pendingPayment = await AsyncStorage.getItem("pendingPayment");
            if (pendingPayment) {
              const paymentData = JSON.parse(pendingPayment);
              console.log("Found pending payment:", paymentData);

              const statusResponse = await fetch(
                `${backendUrl}/api/payment-status/${paymentData.sessionId}`
              );

              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log("Pending payment status:", statusData);

                if (statusData.paymentStatus === "paid") {
                  await AsyncStorage.removeItem("pendingPayment");

                  const deliveryInfo = {
                    sessionId: paymentData.sessionId,
                    status: "payment_completed",
                    paymentStatus: statusData.paymentStatus,
                    shipmentDetails:
                      statusData.shipmentDetails || paymentData.shipmentDetails,
                    totalAmount:
                      statusData.totalAmount || paymentData.totalAmount,
                    createdAt: statusData.createdAt,
                    completedAt: statusData.completedAt,
                  };

                  setDeliveryData(deliveryInfo);
                  await storeDeliveryData(deliveryInfo);

                  if (deliveryInfo.shipmentDetails) {
                    createTookanTask(
                      paymentData.sessionId,
                      deliveryInfo.shipmentDetails
                    );
                  }
                  return true;
                }
              }
            }
          } catch (error) {
            console.log("Error checking pending payment:", error);
          }
          return false;
        };

        if (sessionId && paymentStatus === "completed") {
          if (shipmentDetails && verifiedPayment) {
            const deliveryInfo = {
              sessionId: sessionId,
              status: "payment_completed",
              paymentStatus: verifiedPayment.paymentStatus,
              shipmentDetails: shipmentDetails,
              totalAmount: verifiedPayment.totalAmount,
              createdAt: verifiedPayment.createdAt,
              completedAt: verifiedPayment.completedAt,
            };
            setDeliveryData(deliveryInfo);
            await storeDeliveryData(deliveryInfo);
            createTookanTask(sessionId, shipmentDetails);
            return;
          } else {
            fetchDeliveryDetails();
            return;
          }
        }

        const handledPending = await checkPendingPayment();

        if (!handledPending && !hasCheckedForDelivery) {
          setHasCheckedForDelivery(true);
          const recentDelivery = await checkForRecentDelivery();

          if (recentDelivery) {
            console.log("Found recent delivery:", recentDelivery);
            setDeliveryData(recentDelivery);

            if (
              recentDelivery.shipmentDetails &&
              !recentDelivery.tookanTaskId
            ) {
              try {
                const statusResponse = await fetch(
                  `${backendUrl}/api/payment-status/${recentDelivery.sessionId}`
                );

                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  if (statusData.paymentStatus === "paid") {
                    createTookanTask(
                      recentDelivery.sessionId,
                      recentDelivery.shipmentDetails
                    );
                  } else {
                    console.log("Session exists but payment not confirmed");
                  }
                } else {
                  console.log(
                    "Session not found on backend, skipping Tookan task creation"
                  );
                  setError(
                    "Previous session expired. Please create a new delivery."
                  );
                }
              } catch (error) {
                console.log("Error checking session status:", error);
                setError(
                  "Unable to verify previous session. Please create a new delivery."
                );
              }
            } else if (recentDelivery.tookanTaskId) {
              setTookanTaskId(recentDelivery.tookanTaskId);
              setTrackingUrl(recentDelivery.trackingUrl);
            }
          } else {
            setError(
              "No recent delivery found. Create a new delivery to track."
            );
          }
        }
      };

      initializeScreen();
    }, [sessionId, paymentStatus, shipmentDetails, verifiedPayment])
  );

  const fetchDeliveryDetails = async () => {
    if (!sessionId) {
      setError("No session ID provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching delivery details for session:", sessionId);

      const statusResponse = await fetch(
        `${backendUrl}/api/payment-status/${sessionId}`
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to get payment status: ${statusResponse.status}`
        );
      }

      const statusData = await statusResponse.json();
      console.log("Payment status data:", statusData);

      if (statusData.paymentStatus !== "paid") {
        setError(`Payment not completed. Status: ${statusData.paymentStatus}`);
        return;
      }

      const deliveryInfo = {
        sessionId: sessionId,
        status: "payment_completed",
        paymentStatus: statusData.paymentStatus,
        shipmentDetails: statusData.shipmentDetails,
        totalAmount: statusData.totalAmount,
        createdAt: statusData.createdAt,
        completedAt: statusData.completedAt,
      };

      setDeliveryData(deliveryInfo);
      await storeDeliveryData(deliveryInfo);

      if (statusData.shipmentDetails) {
        createTookanTask(sessionId, statusData.shipmentDetails);
      }
    } catch (error) {
      console.error("Error fetching delivery details:", error);
      setError(`Failed to load delivery details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTookanTask = async (sessionId, shipmentDetails) => {
    if (!sessionId || !shipmentDetails) {
      console.log(
        "Cannot create Tookan task: missing sessionId or shipmentDetails"
      );
      return;
    }

    setIsCreatingTask(true);
    setTaskCreationStatus("Creating delivery task...");

    try {
      console.log("Creating Tookan task for session:", sessionId);

      const sessionTaskResponse = await fetch(
        `${backendUrl}/api/session/${sessionId}/create-tookan-task`
      );

      // ✅ IMPROVED ERROR HANDLING
      if (sessionTaskResponse.ok) {
        const sessionTaskData = await sessionTaskResponse.json();
        console.log("Session-based task creation response:", sessionTaskData);

        if (sessionTaskData.success) {
          setTookanTaskId(sessionTaskData.tookanTaskId);
          setTrackingUrl(sessionTaskData.trackingUrl);
          setTaskCreationStatus(
            sessionTaskData.message || "Task created successfully"
          );

          setDeliveryData((prev) => {
            const updated = {
              ...prev,
              tookanTaskId: sessionTaskData.tookanTaskId,
              trackingUrl: sessionTaskData.trackingUrl,
              deliveryId: sessionTaskData.deliveryId,
            };
            storeDeliveryData(updated);
            return updated;
          });

          return;
        } else if (sessionTaskData.details) {
          // Show detailed geocoding error
          const errorMsg =
            sessionTaskData.details.suggestion || sessionTaskData.error;
          Alert.alert("Address Issue", errorMsg, [{ text: "OK" }]);
          setTaskCreationStatus(errorMsg);
          return;
        }
      }

      // Try direct task creation as fallback
      const directTaskResponse = await fetch(
        `${backendUrl}/api/tookan/create-task`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId,
            shipmentDetails: shipmentDetails,
          }),
        }
      );

      const directTaskData = await directTaskResponse.json();
      console.log("Direct task creation response:", directTaskData);

      if (directTaskResponse.ok && directTaskData.success) {
        setTookanTaskId(directTaskData.tookanTaskId);
        setTrackingUrl(directTaskData.trackingUrl);
        setTaskCreationStatus(
          directTaskData.message || "Task created successfully"
        );

        setDeliveryData((prev) => {
          const updated = {
            ...prev,
            tookanTaskId: directTaskData.tookanTaskId,
            trackingUrl: directTaskData.trackingUrl,
            deliveryId: directTaskData.deliveryId,
          };
          storeDeliveryData(updated);
          return updated;
        });
      } else if (directTaskData.details) {
        // Show detailed error from direct creation
        const errorMsg =
          directTaskData.details.suggestion || directTaskData.error;
        Alert.alert("Cannot Create Delivery", errorMsg, [
          { text: "Edit Address", onPress: () => navigation.goBack() },
          { text: "Cancel", style: "cancel" },
        ]);
        setTaskCreationStatus(errorMsg);
      } else {
        throw new Error(
          directTaskData.error || "Failed to create delivery task"
        );
      }
    } catch (error) {
      console.error("Error creating Tookan task:", error);

      const errorMessage = error.message.includes("geocode")
        ? "Unable to locate the addresses. Please verify the addresses are correct."
        : `Task creation failed: ${error.message}`;

      setTaskCreationStatus(errorMessage);

      Alert.alert("Task Creation Failed", errorMessage, [
        { text: "Edit Address", onPress: () => navigation.goBack() },
        { text: "Continue Anyway", style: "cancel" },
      ]);

      if (deliveryData) {
        console.log("Continuing without Tookan task - delivery data available");
      }
    } finally {
      setIsCreatingTask(false);
      setTimeout(() => setTaskCreationStatus(null), 8000); // Increased timeout for error messages
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  };

  const handleRetry = () => {
    if (sessionId) {
      fetchDeliveryDetails();
    } else {
      setError(null);
      setHasCheckedForDelivery(false);
      navigation.navigate("Send", { screen: "PackageDetails" });
    }
  };

  const handleCreateNewDelivery = () => {
    navigation.navigate("Send", { screen: "PackageDetails" });
  };

  const handleOpenExternalTracking = () => {
    if (trackingUrl) {
      Linking.openURL(trackingUrl);
    } else {
      Alert.alert(
        "Tracking Unavailable",
        "External tracking URL is not available yet."
      );
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "£0.00";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const getDeliveryStatusText = () => {
    if (isCreatingTask) return "Setting up delivery...";
    if (!deliveryData) return "Loading...";

    // Use the statusText directly from deliveryData (set by fetchTrackingData)
    if (deliveryData.statusText) {
      return deliveryData.statusText;
    }

    // Fallback to status key mapping
    switch (deliveryData.status) {
      case "completed":
        return "Delivered successfully ✓";
      case "started":
        return "Driver en route 🚗";
      case "assigned":
        return "Driver assigned";
      case "accepted":
        return "Driver accepted";
      case "arrived_pickup":
        return "Driver arrived at pickup 📍";
      case "failed":
        return "Delivery failed ✗";
      case "cancelled":
        return "Cancelled";
      case "unassigned":
        return "Unassigned";
      case "started_delivery":
        return "En route to delivery 🚗";
      default:
        return tookanTaskId
          ? "Awaiting driver assignment"
          : "Payment confirmed";
    }
  };

  // ✅ ALSO UPDATE: getDeliveryStatusColor to handle all status keys
  const getDeliveryStatusColor = () => {
    if (!deliveryData) return "#6B7280";

    // Use statusColor if available from tracking data
    if (deliveryData.statusColor) {
      return deliveryData.statusColor;
    }

    // Fallback to status key
    switch (deliveryData.status) {
      case "completed":
        return "#10B981"; // Green
      case "started":
      case "arrived_pickup":
        return "#F59E0B"; // Orange/Yellow
      case "assigned":
      case "accepted":
        return "#3B82F6"; // Blue
      case "failed":
        return "#EF4444"; // Red
      case "cancelled":
        return "#6B7280"; // Gray
      default:
        return "#6B7280"; // Gray
    }
  };
  const getTrackingStatusText = () => {
    if (trackingError) return "Tracking unavailable";
    if (!isTrackingActive) return "Tap to start live tracking";
    if (!trackingData) return "Connecting...";

    const timeSinceUpdate = lastTrackingUpdate
      ? Math.floor((Date.now() - new Date(lastTrackingUpdate).getTime()) / 1000)
      : 0;

    return `Live tracking • Updated ${timeSinceUpdate}s ago`;
  };
  // Add this to your LocationScreen.js - REPLACE the getStatusInfo function inside fetchTrackingData

  // ✅ ALSO UPDATE: getDeliveryStatusColor function
  const generateHTMLContent = () => {
    if (!deliveryData || !deliveryData.shipmentDetails) return "";

    const statusColor = getDeliveryStatusColor();
    const statusText = getDeliveryStatusText();

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px 20px;
            background: #ffffff;
            color: #111827;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #8328FA;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #8328FA;
            font-size: 32px;
            margin-bottom: 10px;
          }
          .header p {
            color: #6B7280;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            background: ${statusColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin: 20px 0;
          }
          .section {
            margin-bottom: 30px;
            background: #F9FAFB;
            padding: 20px;
            border-radius: 12px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }
          .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: #8328FA;
            margin-right: 10px;
            border-radius: 2px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            color: #6B7280;
            font-size: 14px;
          }
          .info-value {
            font-weight: 600;
            font-size: 14px;
            color: #111827;
            text-align: right;
          }
          .address-block {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          .address-label {
            color: #6B7280;
            font-size: 12px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }
          .address-text {
            color: #111827;
            font-weight: 600;
            font-size: 14px;
            line-height: 1.5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
          }
          .tracking-ids {
            background: #EBF8FF;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          .tracking-id {
            font-family: 'Courier New', monospace;
            color: #1E40AF;
            font-size: 13px;
            margin: 5px 0;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Delivery Receipt</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <div class="status-badge">${statusText}</div>
          </div>

          ${
            deliveryData.deliveryId || tookanTaskId
              ? `
          <div class="section tracking-ids">
            <div class="section-title">Tracking Information</div>
            ${
              deliveryData.deliveryId
                ? `<div class="tracking-id"><strong>Delivery ID:</strong> ${deliveryData.deliveryId}</div>`
                : ""
            }
            ${
              tookanTaskId
                ? `<div class="tracking-id"><strong>Task ID:</strong> ${tookanTaskId}</div>`
                : ""
            }
            ${
              deliveryData.sessionId
                ? `<div class="tracking-id"><strong>Session ID:</strong> ${deliveryData.sessionId}</div>`
                : ""
            }
          </div>
          `
              : ""
          }

          <div class="section">
            <div class="section-title">Delivery Details</div>
            <div class="info-row">
              <span class="info-label">Delivery Type</span>
              <span class="info-value">${
                deliveryData.shipmentDetails.deliveryType || "Standard"
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Item Type</span>
              <span class="info-value">${
                deliveryData.shipmentDetails.itemType
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Weight</span>
              <span class="info-value">${
                deliveryData.shipmentDetails.selectedWeight
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fragile</span>
              <span class="info-value">${
                deliveryData.shipmentDetails.isFragile ? "Yes" : "No"
              }</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount</span>
              <span class="info-value">${formatCurrency(
                deliveryData.totalAmount
              )}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Locations</div>
            <div class="address-block">
              <div class="address-label">📍 Pickup Location</div>
              <div class="address-text">${
                deliveryData.shipmentDetails.pickupAddress
              }</div>
              <div class="info-value" style="margin-top: 8px; font-size: 12px;">
                ${deliveryData.shipmentDetails.pickupPostcode || ""}
              </div>
            </div>
            <div class="address-block">
              <div class="address-label">📍 Delivery Location</div>
              <div class="address-text">${
                deliveryData.shipmentDetails.receiverAddress
              }</div>
              <div class="info-value" style="margin-top: 8px; font-size: 12px;">
                ${deliveryData.shipmentDetails.receiverPostcode || ""}
              </div>
            </div>
          </div>

          ${
            deliveryData.shipmentDetails.receiverName ||
            deliveryData.shipmentDetails.receiverPhone
              ? `
          <div class="section">
            <div class="section-title">Receiver Information</div>
            ${
              deliveryData.shipmentDetails.receiverName
                ? `
            <div class="info-row">
              <span class="info-label">Name</span>
              <span class="info-value">${deliveryData.shipmentDetails.receiverName}</span>
            </div>
            `
                : ""
            }
            ${
              deliveryData.shipmentDetails.receiverPhone
                ? `
            <div class="info-row">
              <span class="info-label">Phone</span>
              <span class="info-value">${deliveryData.shipmentDetails.receiverPhone}</span>
            </div>
            `
                : ""
            }
          </div>
          `
              : ""
          }

          <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p style="margin-top: 8px;">For any inquiries, please contact support with your delivery ID.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  };

  const handlePrint = async () => {
    try {
      const html = generateHTMLContent();
      await Print.printAsync({
        html,
        printerUrl: undefined,
      });
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert("Print Error", "Unable to print at this time.");
    }
  };

  const handleShare = async () => {
    try {
      const html = generateHTMLContent();
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device."
        );
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Share Error", "Unable to share at this time.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8328FA" />
          <Text className="mt-4 text-gray-600 text-center px-6">
            Loading delivery details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="absolute top-14 left-6 z-10">
          <TouchableOpacity
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
            onPress={handleGoBack}
          >
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-xl font-semibold text-red-600 mb-4 text-center">
            {error.includes("No recent delivery")
              ? "No Active Delivery"
              : "Error"}
          </Text>
          <Text className="text-gray-600 text-center mb-6">{error}</Text>
          <TouchableOpacity
            className="bg-[#8328FA] px-6 py-3 rounded-lg mb-3"
            onPress={handleCreateNewDelivery}
          >
            <Text className="text-white font-semibold">
              Create New Delivery
            </Text>
          </TouchableOpacity>
          {sessionId && (
            <TouchableOpacity
              className="border border-[#8328FA] px-6 py-3 rounded-lg"
              onPress={handleRetry}
            >
              <Text className="text-[#8328FA] font-semibold">Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Fixed Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          backgroundColor: "white",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingVertical: 16,
          height: 60,
        }}
      >
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            backgroundColor: "white",
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
          onPress={handleGoBack}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#000" }}>
            {deliveryData ? "Live Tracking" : "Delivery Status"}
          </Text>
        </View>

        {/* Map Controls */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {deliveryData && (
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                backgroundColor: isTrackingActive ? "#10B981" : "#6B7280",
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
              onPress={toggleLiveTracking}
            >
              <Navigation size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 60 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Live Map Container */}
        <View style={{ height: 350, backgroundColor: "#f5f5f5" }}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            loadingEnabled={true}
            loadingIndicatorColor="#8328FA"
            mapType="standard"
          >
            {/* Pickup Marker */}
            {pickupCoordinates && (
              <Marker
                coordinate={pickupCoordinates}
                title="Pickup Location"
                description={
                  deliveryData?.shipmentDetails?.pickupAddress || "Pickup"
                }
                pinColor="#3B82F6"
                identifier="pickup"
              />
            )}

            {/* Delivery Marker */}
            {deliveryCoordinates && (
              <Marker
                coordinate={deliveryCoordinates}
                title="Delivery Location"
                description={
                  deliveryData?.shipmentDetails?.receiverAddress || "Delivery"
                }
                pinColor="#10B981"
                identifier="delivery"
              />
            )}

            {/* Driver Marker */}
            {driverLocation && (
              <Marker
                coordinate={driverLocation}
                title="Driver Location"
                description="Current driver position"
                pinColor="#F59E0B"
                identifier="driver"
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#F59E0B",
                    borderWidth: 3,
                    borderColor: "white",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "white",
                    }}
                  />
                </View>
              </Marker>
            )}

            {/* Route Polyline */}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#8328FA"
                strokeWidth={3}
                strokePattern={[1]}
              />
            )}
          </MapView>

          {/* Map Overlay Controls */}
          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            {/* Tracking Status */}
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(0,0,0,0.8)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                marginBottom: 8,
              }}
              onPress={toggleLiveTracking}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: isTrackingActive ? "#10B981" : "#6B7280",
                  marginRight: 8,
                }}
              />
              <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }}>
                {getTrackingStatusText()}
              </Text>
              {isTrackingActive && (
                <RefreshCw size={12} color="white" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>

            {/* Delivery Status */}
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 11,
                  fontWeight: "500",
                }}
              >
                {getDeliveryStatusText()}
              </Text>
            </View>
          </View>

          {/* Map Action Buttons */}
          <View
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                backgroundColor: "white",
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={fitMapToMarkers}
            >
              <Search size={20} color="#6B7280" />
            </TouchableOpacity>

            {driverLocation && (
              <TouchableOpacity
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: "white",
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => centerMapOn(driverLocation, "Driver")}
              >
                <Navigation size={18} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Location Buttons */}
          <View
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              zIndex: 10,
              flexDirection: "row",
            }}
          >
            {pickupCoordinates && (
              <TouchableOpacity
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.9)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginRight: 6,
                }}
                onPress={() => centerMapOn(pickupCoordinates, "Pickup")}
              >
                <Text
                  style={{ color: "white", fontSize: 10, fontWeight: "500" }}
                >
                  Pickup
                </Text>
              </TouchableOpacity>
            )}

            {deliveryCoordinates && (
              <TouchableOpacity
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.9)",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
                onPress={() => centerMapOn(deliveryCoordinates, "Delivery")}
              >
                <Text
                  style={{ color: "white", fontSize: 10, fontWeight: "500" }}
                >
                  Delivery
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 50,
            marginTop: -20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 48,
              height: 4,
              backgroundColor: "#D1D5DB",
              borderRadius: 12,
              alignSelf: "center",
              marginBottom: 24,
            }}
          />

          {/* Tracking Controls */}
          {deliveryData && tookanTaskId && (
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
                >
                  Live Tracking
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isTrackingActive ? "#FEE2E2" : "#EBF8FF",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                  onPress={toggleLiveTracking}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isTrackingActive ? "#EF4444" : "#3B82F6",
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: isTrackingActive ? "#EF4444" : "#3B82F6",
                    }}
                  >
                    {isTrackingActive ? "Stop" : "Start"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tracking Info */}
              <View
                style={{
                  backgroundColor: "#F9FAFB",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>
                    Status:
                  </Text>
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 12,
                      color: getDeliveryStatusColor(),
                    }}
                  >
                    {getDeliveryStatusText()}
                  </Text>
                </View>

                {trackingData && (
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: "#6B7280", fontSize: 12 }}>
                        Driver Location:
                      </Text>
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 12,
                          color: "#111827",
                        }}
                      >
                        {driverLocation ? "Available" : "Not available"}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: "#6B7280", fontSize: 12 }}>
                        Last Update:
                      </Text>
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 12,
                          color: "#111827",
                        }}
                      >
                        {lastTrackingUpdate
                          ? new Date(lastTrackingUpdate).toLocaleTimeString()
                          : "Never"}
                      </Text>
                    </View>
                  </>
                )}

                {trackingError && (
                  <Text
                    style={{
                      color: "#EF4444",
                      fontSize: 12,
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    {trackingError}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                }}
                onPress={handleOpenExternalTracking}
                disabled={!trackingUrl}
              >
                <ExternalLink
                  size={16}
                  color={trackingUrl ? "#6B7280" : "#9CA3AF"}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: "500",
                    color: trackingUrl ? "#6B7280" : "#9CA3AF",
                  }}
                >
                  Open in Tookan Tracker
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              marginBottom: 16,
              color: "#111827",
            }}
          >
            Delivery Information
          </Text>

          {deliveryData ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text
                    style={{ color: "#6B7280", marginBottom: 4, fontSize: 12 }}
                  >
                    Delivery Type
                  </Text>
                  <Text style={{ fontWeight: "600", fontSize: 14 }}>
                    {deliveryData.shipmentDetails?.deliveryType ||
                      "Standard delivery"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "#6B7280", marginBottom: 4, fontSize: 12 }}
                  >
                    Status
                  </Text>
                  <Text
                    style={{
                      fontWeight: "600",
                      color: getDeliveryStatusColor(),
                      fontSize: 14,
                    }}
                  >
                    {getDeliveryStatusText()}
                  </Text>
                </View>
              </View>

              {(tookanTaskId || trackingUrl || deliveryData.deliveryId) && (
                <View
                  style={{
                    marginBottom: 24,
                    backgroundColor: "#EBF8FF",
                    padding: 16,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#1E40AF",
                      fontWeight: "600",
                      marginBottom: 8,
                      fontSize: 14,
                    }}
                  >
                    Tracking Details
                  </Text>

                  {deliveryData.deliveryId && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: "#3B82F6", fontSize: 12 }}>
                        Delivery ID:
                      </Text>
                      <Text
                        style={{
                          color: "#1E40AF",
                          fontSize: 12,
                          fontFamily: "monospace",
                        }}
                      >
                        {deliveryData.deliveryId}
                      </Text>
                    </View>
                  )}

                  {tookanTaskId && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: "#3B82F6", fontSize: 12 }}>
                        Task ID:
                      </Text>
                      <Text
                        style={{
                          color: "#1E40AF",
                          fontSize: 12,
                          fontFamily: "monospace",
                        }}
                      >
                        {tookanTaskId}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {deliveryData.shipmentDetails && (
                <>
                  <View
                    style={{
                      marginBottom: 24,
                      backgroundColor: "#F9FAFB",
                      padding: 16,
                      borderRadius: 12,
                    }}
                  >
                    <View style={{ marginBottom: 12 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <MapPin size={16} color="#6B7280" />
                        <Text
                          style={{
                            color: "#6B7280",
                            fontSize: 12,
                            marginLeft: 8,
                          }}
                        >
                          Pickup Location
                        </Text>
                      </View>
                      <Text style={{ fontWeight: "600", fontSize: 12 }}>
                        {deliveryData.shipmentDetails.pickupAddress}
                      </Text>
                    </View>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#E5E7EB",
                        marginVertical: 8,
                      }}
                    />

                    <View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <MapPin size={16} color="#6B7280" />
                        <Text
                          style={{
                            color: "#6B7280",
                            fontSize: 12,
                            marginLeft: 8,
                          }}
                        >
                          Delivery Location
                        </Text>
                      </View>
                      <Text style={{ fontWeight: "600", fontSize: 12 }}>
                        {deliveryData.shipmentDetails.receiverAddress}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={{ marginBottom: 24 }}
                    onPress={() => setIsPrintModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        backgroundColor: "#F9FAFB",
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: "#8328FA",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Package size={20} color="#8328FA" />
                          <Text
                            style={{
                              color: "#8328FA",
                              fontSize: 16,
                              fontWeight: "600",
                              marginLeft: 8,
                            }}
                          >
                            Package Details
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: "#8328FA",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Printer size={14} color="#fff" />
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "600",
                              marginLeft: 4,
                            }}
                          >
                            View
                          </Text>
                        </View>
                      </View>

                      <View style={{ marginTop: 4 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: "#6B7280", fontSize: 13 }}>
                            Item Type:
                          </Text>
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: 13,
                              color: "#111827",
                            }}
                          >
                            {deliveryData.shipmentDetails.itemType}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: "#6B7280", fontSize: 13 }}>
                            Weight:
                          </Text>
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: 13,
                              color: "#111827",
                            }}
                          >
                            {deliveryData.shipmentDetails.selectedWeight}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <Text style={{ color: "#6B7280", fontSize: 13 }}>
                            Fragile:
                          </Text>
                          <Text
                            style={{
                              fontWeight: "600",
                              fontSize: 13,
                              color: "#111827",
                            }}
                          >
                            {deliveryData.shipmentDetails.isFragile
                              ? "Yes"
                              : "No"}
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#E5E7EB",
                            marginVertical: 8,
                          }}
                        />
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#111827",
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            Total Amount:
                          </Text>
                          <Text
                            style={{
                              fontWeight: "700",
                              fontSize: 16,
                              color: "#8328FA",
                            }}
                          >
                            {formatCurrency(deliveryData.totalAmount)}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: "#E5E7EB",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "#8328FA",
                            fontSize: 12,
                            fontWeight: "500",
                          }}
                        >
                          Tap to view full receipt & print
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <Modal
                    visible={isPrintModalVisible}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setIsPrintModalVisible(false)}
                  >
                    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 20,
                          paddingVertical: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: "#E5E7EB",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "600",
                            color: "#111827",
                          }}
                        >
                          Delivery Information
                        </Text>
                        <TouchableOpacity
                          onPress={() => setIsPrintModalVisible(false)}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "#F3F4F6",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                      </View>

                      <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 20 }}
                      >
                        <View
                          style={{ alignItems: "center", marginBottom: 24 }}
                        >
                          <Text
                            style={{
                              color: "#6B7280",
                              fontSize: 12,
                              marginTop: 8,
                            }}
                          >
                            Generated on {new Date().toLocaleString()}
                          </Text>
                        </View>

                        {(deliveryData?.deliveryId || tookanTaskId) && (
                          <View
                            style={{
                              backgroundColor: "#EBF8FF",
                              padding: 16,
                              borderRadius: 12,
                              marginBottom: 20,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#1E40AF",
                                marginBottom: 12,
                              }}
                            >
                              Tracking Information
                            </Text>

                            {tookanTaskId && (
                              <View style={{ marginBottom: 8 }}>
                                <Text
                                  style={{ color: "#3B82F6", fontSize: 12 }}
                                >
                                  Task ID
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: "monospace",
                                    color: "#1E40AF",
                                    fontSize: 14,
                                    fontWeight: "600",
                                  }}
                                >
                                  {tookanTaskId}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}

                        <View
                          style={{
                            backgroundColor: "#F9FAFB",
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 20,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: 12,
                            }}
                          >
                            Delivery Details
                          </Text>
                          <View style={{ marginBottom: 10 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                Delivery Type
                              </Text>
                              <Text style={{ fontWeight: "600", fontSize: 14 }}>
                                {deliveryData?.shipmentDetails?.deliveryType ||
                                  "Standard"}
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                Item Type
                              </Text>
                              <Text style={{ fontWeight: "600", fontSize: 14 }}>
                                {deliveryData?.shipmentDetails?.itemType}
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                Weight
                              </Text>
                              <Text style={{ fontWeight: "600", fontSize: 14 }}>
                                {deliveryData?.shipmentDetails?.selectedWeight}
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 8,
                              }}
                            >
                              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                                Fragile
                              </Text>
                              <Text style={{ fontWeight: "600", fontSize: 14 }}>
                                {deliveryData?.shipmentDetails?.isFragile
                                  ? "Yes"
                                  : "No"}
                              </Text>
                            </View>
                            <View
                              style={{
                                height: 1,
                                backgroundColor: "#E5E7EB",
                                marginVertical: 12,
                              }}
                            />
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text
                                style={{
                                  color: "#111827",
                                  fontSize: 16,
                                  fontWeight: "600",
                                }}
                              >
                                Total Amount
                              </Text>
                              <Text
                                style={{
                                  fontWeight: "700",
                                  fontSize: 18,
                                  color: "#8328FA",
                                }}
                              >
                                {formatCurrency(deliveryData?.totalAmount)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View
                          style={{
                            backgroundColor: "#F9FAFB",
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 20,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: 12,
                            }}
                          >
                            Locations
                          </Text>
                          <View
                            style={{
                              backgroundColor: "white",
                              padding: 12,
                              borderRadius: 8,
                              marginBottom: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: "#6B7280",
                                fontSize: 12,
                                marginBottom: 6,
                              }}
                            >
                              📍 Pickup Location
                            </Text>
                            <Text
                              style={{
                                fontWeight: "600",
                                fontSize: 14,
                                color: "#111827",
                                lineHeight: 20,
                              }}
                            >
                              {deliveryData?.shipmentDetails?.pickupAddress}
                            </Text>
                            {deliveryData?.shipmentDetails?.pickupPostcode && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  marginTop: 4,
                                }}
                              >
                                {deliveryData.shipmentDetails.pickupPostcode}
                              </Text>
                            )}
                          </View>
                          <View
                            style={{
                              backgroundColor: "white",
                              padding: 12,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "#6B7280",
                                fontSize: 12,
                                marginBottom: 6,
                              }}
                            >
                              📍 Delivery Location
                            </Text>
                            <Text
                              style={{
                                fontWeight: "600",
                                fontSize: 14,
                                color: "#111827",
                                lineHeight: 20,
                              }}
                            >
                              {deliveryData?.shipmentDetails?.receiverAddress}
                            </Text>
                            {deliveryData?.shipmentDetails
                              ?.receiverPostcode && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  marginTop: 4,
                                }}
                              >
                                {deliveryData.shipmentDetails.receiverPostcode}
                              </Text>
                            )}
                          </View>
                        </View>

                        {(deliveryData?.shipmentDetails?.receiverName ||
                          deliveryData?.shipmentDetails?.receiverPhone) && (
                          <View
                            style={{
                              backgroundColor: "#F9FAFB",
                              padding: 16,
                              borderRadius: 12,
                              marginBottom: 20,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: 12,
                              }}
                            >
                              Receiver Information
                            </Text>
                            {deliveryData.shipmentDetails.receiverName && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  marginBottom: 8,
                                }}
                              >
                                <Text
                                  style={{ color: "#6B7280", fontSize: 14 }}
                                >
                                  Name
                                </Text>
                                <Text
                                  style={{ fontWeight: "600", fontSize: 14 }}
                                >
                                  {deliveryData.shipmentDetails.receiverName}
                                </Text>
                              </View>
                            )}
                            {deliveryData.shipmentDetails.receiverPhone && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Text
                                  style={{ color: "#6B7280", fontSize: 14 }}
                                >
                                  Phone
                                </Text>
                                <Text
                                  style={{ fontWeight: "600", fontSize: 14 }}
                                >
                                  {deliveryData.shipmentDetails.receiverPhone}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}

                        <View
                          style={{
                            borderTopWidth: 2,
                            borderTopColor: "#E5E7EB",
                            paddingTop: 20,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#6B7280",
                              fontSize: 12,
                              textAlign: "center",
                              marginBottom: 8,
                            }}
                          >
                            This is a computer-generated receipt and does not
                            require a signature.
                          </Text>
                          <Text
                            style={{
                              color: "#6B7280",
                              fontSize: 12,
                              textAlign: "center",
                            }}
                          >
                            For any inquiries, please contact support with your
                            delivery ID.
                          </Text>
                        </View>
                      </ScrollView>

                      <View
                        style={{
                          flexDirection: "row",
                          padding: 20,
                          borderTopWidth: 1,
                          borderTopColor: "#E5E7EB",
                          backgroundColor: "white",
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: "#8328FA",
                            paddingVertical: 14,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 8,
                          }}
                          onPress={handlePrint}
                        >
                          <Printer size={20} color="#fff" />
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "600",
                              fontSize: 16,
                              marginLeft: 8,
                            }}
                          >
                            Print
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: "#3B82F6",
                            paddingVertical: 14,
                            borderRadius: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 8,
                          }}
                          onPress={handleShare}
                        >
                          <Share2 size={20} color="#fff" />
                          <Text
                            style={{
                              color: "white",
                              fontWeight: "600",
                              fontSize: 16,
                              marginLeft: 8,
                            }}
                          >
                            Share
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </SafeAreaView>
                  </Modal>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: tookanTaskId ? "#8328FA" : "#D1D5DB",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        marginRight: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      disabled={!tookanTaskId}
                    >
                      <Phone
                        size={18}
                        color={tookanTaskId ? "#fff" : "#9CA3AF"}
                      />
                      <Text
                        style={{
                          color: tookanTaskId ? "white" : "#9CA3AF",
                          fontWeight: "600",
                          marginLeft: 8,
                          fontSize: 14,
                        }}
                      >
                        Call Driver
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: tookanTaskId ? "#8328FA" : "#D1D5DB",
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        marginLeft: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      disabled={!tookanTaskId}
                    >
                      <MessageCircle
                        size={18}
                        color={tookanTaskId ? "#8328FA" : "#9CA3AF"}
                      />
                      <Text
                        style={{
                          color: tookanTaskId ? "#8328FA" : "#9CA3AF",
                          fontWeight: "600",
                          marginLeft: 8,
                          fontSize: 14,
                        }}
                      >
                        Message
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!tookanTaskId && !isCreatingTask && (
                    <Text
                      style={{
                        color: "#6B7280",
                        textAlign: "center",
                        fontSize: 12,
                        marginBottom: 16,
                      }}
                    >
                      Driver contact will be available once task is created
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={handleCreateNewDelivery}
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      marginTop: 16,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#6B7280",
                        fontWeight: "600",
                        fontSize: 14,
                      }}
                    >
                      Create New Delivery
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text
                style={{
                  color: "#6B7280",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                No delivery information available
              </Text>
              <TouchableOpacity
                onPress={handleCreateNewDelivery}
                style={{
                  backgroundColor: "#8328FA",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Create New Delivery
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
