import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";

import Toast from "react-native-toast-message";
import { auth, firestore } from "../firebase";

/**
 * Save package/shipment details to Firestore
 * @param {Object} shipmentData - Complete shipment information
 * @param {string} sessionId - Payment session ID
 * @param {string} paymentMethod - Payment method used
 * @returns {Promise<Object>} Saved document data with ID
 */
// export const saveShipmentToFirestore = async (
//   shipmentData,
//   sessionId,
//   paymentMethod = "card"
// ) => {
//   try {
//     const userId = auth.currentUser?.uid;
//     if (!userId) {
//       throw new Error("User not authenticated");
//     }

//     const shipmentDoc = {
//       userId,
//       sessionId,
//       paymentMethod,

//       // Sender Information
//       senderName: shipmentData.senderName,
//       senderPhone: shipmentData.senderPhone,
//       pickupAddress: shipmentData.pickupAddress,
//       pickupPostcode: shipmentData.pickupPostcode,
//       pickupDate: shipmentData.date,

//       // Receiver Information
//       receiverName: shipmentData.receiverName,
//       receiverPhone: shipmentData.receiverNumber,
//       deliveryAddress: shipmentData.receiverAddress,
//       deliveryPostcode: shipmentData.receiverPostcode,

//       // Package Details
//       itemType: shipmentData.itemType,
//       isFragile: shipmentData.isFragile,
//       weight: shipmentData.selectedWeight,
//       deliveryType: shipmentData.deliveryType,

//       // Pricing
//       basePrice: shipmentData.basePrice,
//       deliveryCost: shipmentData.deliveryCost,
//       vatAmount: shipmentData.vatAmount,
//       totalPrice: shipmentData.totalPrice,

//       // Distance Info
//       distanceKm: shipmentData.distanceInfo?.distance || 0,
//       durationMinutes: shipmentData.distanceInfo?.duration || 0,

//       // Status and Timestamps
//       status: "pending",
//       paymentStatus: "completed",
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     };

//     const docRef = await addDoc(
//       collection(firestore, "shipments"),
//       shipmentDoc
//     );

//     console.log("Shipment saved to Firestore:", docRef.id);
//     return { id: docRef.id, ...shipmentDoc };
//   } catch (error) {
//     console.error(" Error saving shipment:", error);
//     Toast.show({
//       type: "error",
//       text1: "Failed to save shipment",
//       text2: error.message,
//     });
//     throw error;
//   }
// };

export const saveShipmentToFirestore = async (
  shipmentData,
  sessionId,
  paymentMethod = "card"
) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const shipmentDoc = {
      userId,
      sessionId,
      paymentMethod,

      // Sender Information
      senderName: shipmentData.senderName,
      senderPhone: shipmentData.senderPhone,
      pickupAddress: shipmentData.pickupAddress,
      pickupPostcode: shipmentData.pickupPostcode,
      pickupDate: shipmentData.date,

      // Receiver Information
      receiverName: shipmentData.receiverName,
      receiverPhone: shipmentData.receiverNumber,
      deliveryAddress: shipmentData.receiverAddress,
      deliveryPostcode: shipmentData.receiverPostcode,

      // Package Details
      itemType: shipmentData.itemType,
      isFragile: shipmentData.isFragile,
      weight: shipmentData.selectedWeight,
      deliveryType: shipmentData.deliveryType,

      // Pricing
      basePrice: shipmentData.basePrice,
      deliveryCost: shipmentData.deliveryCost,
      vatAmount: shipmentData.vatAmount,
      totalPrice: shipmentData.totalPrice,

      // Distance Info
      distanceKm: shipmentData.distanceInfo?.distance || 0,
      durationMinutes: shipmentData.distanceInfo?.duration || 0,

      // Status and Timestamps
      status: "pending", // ✅ Starts as pending, backend will update to "completed"
      paymentStatus: "pending", // ✅ Will be updated by webhook
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(firestore, "shipments"),
      shipmentDoc
    );

    console.log(
      "✅ Shipment saved to Firestore with pending status:",
      docRef.id
    );
    return { id: docRef.id, ...shipmentDoc };
  } catch (error) {
    console.error("❌ Error saving shipment:", error);
    Toast.show({
      type: "error",
      text1: "Failed to save shipment",
      text2: error.message,
    });
    throw error;
  }
};

/**
 * Update shipment status in Firestore
 * @param {string} sessionId - Payment session ID
 * @param {string} newStatus - New status to update
 * @returns {Promise<boolean>} Success status
 */
export const updateShipmentStatus = async (sessionId, newStatus) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log("No authenticated user");
      return false;
    }

    const q = query(
      collection(firestore, "shipments"),
      where("userId", "==", userId),
      where("sessionId", "==", sessionId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Shipment status updated to: ${newStatus}`);

      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: `Delivery status: ${newStatus}`,
        position: "bottom",
        visibilityTime: 2000,
      });

      return true;
    } else {
      console.log("⚠️ No shipment found with session ID:", sessionId);
      return false;
    }
  } catch (error) {
    console.error("❌ Error updating shipment status:", error);
    return false;
  }
};

/**
 * Fetch user delivery statistics
 * @returns {Promise<Object>} Statistics object
 */
export const fetchDeliveryStats = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const q = query(
      collection(firestore, "shipments"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);

    let totalShipments = 0;
    let totalTransactions = 0;
    let totalSpending = 0;
    let completedDeliveries = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalShipments++;

      if (data.paymentStatus === "completed") {
        totalTransactions++;
        totalSpending += data.totalPrice || 0;
      }

      if (data.status === "completed" || data.status === "delivered") {
        completedDeliveries++;
      }
    });

    return {
      totalShipments,
      totalTransactions,
      totalSpending,
      completedDeliveries,
    };
  } catch (error) {
    console.error(" Error fetching delivery stats:", error);
    return {
      totalShipments: 0,
      totalTransactions: 0,
      totalSpending: 0,
      completedDeliveries: 0,
    };
  }
};

/**
 * Fetch recent shipments for user
 * @param {number} limitCount - Number of shipments to fetch
 * @returns {Promise<Array>} Array of recent shipments
 */
export const fetchRecentShipments = async (limitCount = 10) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const q = query(
      collection(firestore, "shipments"),
      where("userId", "==", userId),
      orderBy("__name__", "asc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching recent shipments:", error);
    return [];
  }
};
