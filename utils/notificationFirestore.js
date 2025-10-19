/////////for one signal////////
// import {
//   collection,
//   addDoc,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   updateDoc,
//   doc,
//   serverTimestamp,
//   limit,
//   getDocs,
// } from "firebase/firestore";

// import { firestore } from "../firebase";
// /**
//  * Save notification to Firestore
//  */
// export async function saveNotificationToFirestore(userId, notification) {
//   try {
//     const notificationData = {
//       userId,
//       title: notification.title,
//       message: notification.message,
//       type: notification.type || "general",
//       data: notification.data || {},
//       read: false,
//       createdAt: serverTimestamp(),
//       shipmentId: notification.shipmentId || null,
//       icon: notification.icon || "📦",
//     };

//     const docRef = await addDoc(
//       collection(firestore, "notifications"),
//       notificationData
//     );

//     console.log("✅ Notification saved to Firestore:", docRef.id);
//     return { success: true, id: docRef.id };
//   } catch (error) {
//     console.error("❌ Error saving notification:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Subscribe to user's notifications in real-time
//  */
// export function subscribeToUserNotifications(userId, callback) {
//   try {
//     const q = query(
//       collection(firestore, "notifications"),
//       where("userId", "==", userId),
//       orderBy("createdAt", "desc"),
//       limit(50)
//     );

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const notifications = [];
//         snapshot.forEach((doc) => {
//           notifications.push({
//             id: doc.id,
//             ...doc.data(),
//           });
//         });

//         console.log(`📱 Received ${notifications.length} notifications`);
//         callback(notifications);
//       },
//       (error) => {
//         console.error("❌ Error listening to notifications:", error);
//       }
//     );

//     return unsubscribe;
//   } catch (error) {
//     console.error("❌ Error subscribing to notifications:", error);
//     return () => {};
//   }
// }

// /**
//  * Mark notification as read
//  */
// export async function markNotificationAsRead(notificationId) {
//   try {
//     const notificationRef = doc(firestore, "notifications", notificationId);
//     await updateDoc(notificationRef, {
//       read: true,
//       readAt: serverTimestamp(),
//     });

//     console.log("✅ Notification marked as read:", notificationId);
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Error marking notification as read:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Mark all notifications as read
//  */
// export async function markAllNotificationsAsRead(userId) {
//   try {
//     const q = query(
//       collection(firestore, "notifications"),
//       where("userId", "==", userId),
//       where("read", "==", false)
//     );

//     const snapshot = await getDocs(q);

//     const updatePromises = snapshot.docs.map((doc) =>
//       updateDoc(doc.ref, {
//         read: true,
//         readAt: serverTimestamp(),
//       })
//     );

//     await Promise.all(updatePromises);

//     console.log(`✅ Marked ${snapshot.docs.length} notifications as read`);
//     return { success: true, count: snapshot.docs.length };
//   } catch (error) {
//     console.error("❌ Error marking all as read:", error);
//     return { success: false, error: error.message };
//   }
// }

// /**
//  * Get unread notification count
//  */
// export async function getUnreadNotificationCount(userId) {
//   try {
//     const q = query(
//       collection(firestore, "notifications"),
//       where("userId", "==", userId),
//       where("read", "==", false)
//     );

//     const snapshot = await getDocs(q);
//     return snapshot.size;
//   } catch (error) {
//     console.error("❌ Error getting unread count:", error);
//     return 0;
//   }
// }

// /**
//  * Delete a notification
//  */
// async function deleteNotification(notificationId) {
//   try {
//     await deleteDoc(doc(firestore, "notifications", notificationId));
//     console.log("✅ Notification deleted:", notificationId);
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Error deleting notification:", error);
//     return { success: false, error: error.message };
//   }
// }

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  limit,
  getDocs,
} from "firebase/firestore";

import { firestore } from "../firebase";

/**
 * Save notification to Firestore
 */
export async function saveNotificationToFirestore(userId, notification) {
  try {
    const notificationData = {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || "general",
      data: notification.data || {},
      read: false,
      createdAt: serverTimestamp(),
      shipmentId: notification.shipmentId || null,
      icon: notification.icon || "📦",
    };

    const docRef = await addDoc(
      collection(firestore, "notifications"),
      notificationData
    );

    console.log("✅ Notification saved to Firestore:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Error saving notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to user's notifications in real-time
 */
export function subscribeToUserNotifications(userId, callback) {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort by creation date (newest first) - done in JavaScript instead of Firestore
        notifications.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        console.log(`📱 Received ${notifications.length} notifications`);
        callback(notifications);
      },
      (error) => {
        console.error("❌ Error listening to notifications:", error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error subscribing to notifications:", error);
    return () => {};
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const notificationRef = doc(firestore, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });

    console.log("✅ Notification marked as read:", notificationId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);

    console.log(`✅ Marked ${snapshot.docs.length} notifications as read`);
    return { success: true, count: snapshot.docs.length };
  } catch (error) {
    console.error("❌ Error marking all as read:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    return 0;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId) {
  try {
    await deleteDoc(doc(firestore, "notifications", notificationId));
    console.log("✅ Notification deleted:", notificationId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return { success: false, error: error.message };
  }
}

export default {
  saveNotificationToFirestore,
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification,
};
