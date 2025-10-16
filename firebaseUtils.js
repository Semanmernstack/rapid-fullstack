// utils/firestoreUtils.js
/**
 * Get user's delivery statistics
 * @returns {Promise<Object>} - Statistics object with success flag
 */
export const getUserDeliveryStats = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated");
      return {
        success: false,
        error: "User not authenticated",
        stats: {
          totalShipments: 0,
          totalTransactions: 0,
          totalSpending: 0,
          completedDeliveries: 0,
        },
      };
    }

    const deliveriesRef = collection(firestore, "deliveries");
    const q = query(
      deliveriesRef,
      where("userId", "==", user.uid),
      where("paymentStatus", "==", "completed")
    );

    const querySnapshot = await getDocs(q);

    let totalShipments = 0;
    let totalTransactions = 0;
    let totalSpending = 0;
    let completedDeliveries = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalShipments += 1;
      totalTransactions += 1;
      totalSpending += data.totalPrice || 0;

      // Count completed deliveries
      if (data.deliveryStatus === "completed") {
        completedDeliveries += 1;
      }
    });

    console.log("✅ Delivery stats fetched:", {
      totalShipments,
      totalTransactions,
      totalSpending,
      completedDeliveries,
    });

    return {
      success: true,
      stats: {
        totalShipments,
        totalTransactions,
        totalSpending,
        completedDeliveries,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching delivery stats:", error);
    return {
      success: false,
      error: error.message,
      stats: {
        totalShipments: 0,
        totalTransactions: 0,
        totalSpending: 0,
        completedDeliveries: 0,
      },
    };
  }
};
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "./firebase";

/**
 * Save delivery/shipment data to Firestore
 * @param {Object} deliveryData - Complete delivery information
 * @returns {Promise<string>} - Document ID of saved delivery
 */
export const saveDeliveryToFirestore = async (deliveryData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const deliveryDoc = {
      userId: user.uid,
      userEmail: user.email,

      // Shipment details
      senderName: deliveryData.senderName,
      senderPhone: deliveryData.senderPhone,
      pickupAddress: deliveryData.pickupAddress,
      pickupPostcode: deliveryData.pickupPostcode,

      receiverName: deliveryData.receiverName,
      receiverNumber: deliveryData.receiverNumber,
      receiverAddress: deliveryData.receiverAddress,
      receiverPostcode: deliveryData.receiverPostcode,

      // Package details
      itemType: deliveryData.itemType,
      isFragile: deliveryData.isFragile,
      selectedWeight: deliveryData.selectedWeight,
      deliveryType: deliveryData.deliveryType,

      // Pricing
      basePrice: deliveryData.basePrice,
      deliveryCost: deliveryData.deliveryCost,
      vatAmount: deliveryData.vatAmount,
      totalPrice: deliveryData.totalPrice,

      // Distance info
      distanceInfo: deliveryData.distanceInfo || null,

      // Payment info
      sessionId: deliveryData.sessionId || null,
      paymentMethod: deliveryData.paymentMethod || "card",
      paymentStatus: "completed",

      // Delivery tracking
      tookanTaskId: deliveryData.tookanTaskId || null,
      deliveryId: deliveryData.deliveryId || null,
      trackingUrl: deliveryData.trackingUrl || null,
      deliveryStatus: "pending", // pending, in_progress, completed, failed

      // Timestamps
      createdAt: Timestamp.now(),
      scheduledDate: deliveryData.date || null,
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(firestore, "deliveries"),
      deliveryDoc
    );
    console.log("Delivery saved to Firestore with ID:", docRef.id);

    return docRef.id;
  } catch (error) {
    console.error(" Error saving delivery to Firestore:", error);
    throw error;
  }
};

/**
 * Update delivery status
 * @param {string} deliveryId - Firestore document ID
 * @param {string} status - New status
 */
export const updateDeliveryStatus = async (deliveryId, status) => {
  try {
    const deliveryRef = doc(firestore, "deliveries", deliveryId);
    await updateDoc(deliveryRef, {
      deliveryStatus: status,
      updatedAt: Timestamp.now(),
    });
    console.log(" Delivery status updated:", status);
  } catch (error) {
    console.error(" Error updating delivery status:", error);
    throw error;
  }
};

/**
 * Get user's delivery statistics
 * @returns {Promise<Object>} - Statistics object
 */

/**
 * Get delivery by session ID
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object|null>} - Delivery object or null
 */
export const getDeliveryBySessionId = async (sessionId) => {
  try {
    const deliveriesRef = collection(firestore, "deliveries");
    const q = query(deliveriesRef, where("sessionId", "==", sessionId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error(" Error fetching delivery by session ID:", error);
    return null;
  }
};

/**
 * Update delivery with Tookan task information
 * @param {string} deliveryId - Firestore document ID
 * @param {Object} tookanData - Tookan task data
 */
export const updateDeliveryWithTookanInfo = async (deliveryId, tookanData) => {
  try {
    const deliveryRef = doc(firestore, "deliveries", deliveryId);
    await updateDoc(deliveryRef, {
      tookanTaskId: tookanData.tookanTaskId,
      trackingUrl: tookanData.trackingUrl,
      deliveryId: tookanData.deliveryId,
      deliveryStatus: "in_progress",
      updatedAt: Timestamp.now(),
    });
    console.log("✅ Delivery updated with Tookan info");
  } catch (error) {
    console.error(" Error updating delivery with Tookan info:", error);
    throw error;
  }
};
