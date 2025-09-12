import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Checks if a document with the same fullName, phone, and address already exists.
 * @param {object} db - Firestore db instance
 * @param {string} collectionName - Firestore collection name ("senders" or "receivers")
 * @param {string} uid - The user ID
 * @param {object} data - The object to match { fullName, phone, address }
 * @returns {boolean} - Whether such a document exists
 */
export const checkIfExists = async (db, collectionName, uid, data) => {
  const colRef = collection(db, collectionName);
  const q = query(
    colRef,
    where("userId", "==", uid),
    where("fullName", "==", data.fullName),
    where("phone", "==", data.phone),
    where(
      collectionName === "senders" ? "pickupAddress" : "deliveryAddress",
      "==",
      data.address
    )
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};
