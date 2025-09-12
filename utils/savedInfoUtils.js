import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
  } from "firebase/firestore";
  import { auth, firestore } from "../firebase"; // Adjust path as needed
  import Toast from "react-native-toast-message";
  
  /**
   * Fetch saved user information (sender or receiver)
   * @param {string} type - "sender" or "receiver" 
   * @param {function} showLoading - Loading function (optional)
   * @param {function} hideLoading - Hide loading function (optional)
   * @returns {Promise<Array>} Array of saved information
   */
  export const fetchSavedInfo = async (type, showLoading = null, hideLoading = null) => {
    try {
      if (showLoading) showLoading("Loading saved information...");
      
      const collectionName = type === "sender" ? "senders" : "receivers";
      const q = query(
        collection(firestore, collectionName),
        where("userId", "==", auth.currentUser?.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: type,
      }));
      
      console.log(`Fetched ${type} data:`, data);
      return data;
    } catch (error) {
      console.error("Error fetching saved info:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load saved information",
      });
      return [];
    } finally {
      if (hideLoading) hideLoading();
    }
  };
  
  /**
   * Delete saved user information
   * @param {string} id - Document ID to delete
   * @param {string} type - "sender" or "receiver"
   * @param {function} showLoading - Loading function (optional)
   * @param {function} hideLoading - Hide loading function (optional)
   * @returns {Promise<boolean>} Success status
   */
  export const deleteSavedInfo = async (id, type, showLoading = null, hideLoading = null) => {
    try {
      if (showLoading) showLoading("Deleting...");
      
      const collectionName = type === "sender" ? "senders" : "receivers";
      await deleteDoc(doc(firestore, collectionName, id));
      
      Toast.show({
        type: "success",
        text1: "Information deleted successfully",
      });
      return true;
    } catch (error) {
      console.error("Error deleting:", error);
      Toast.show({
        type: "error",
        text1: "Failed to delete information",
      });
      return false;
    } finally {
      if (hideLoading) hideLoading();
    }
  };
  
  /**
   * Update saved user information
   * @param {string} id - Document ID to update
   * @param {string} type - "sender" or "receiver"
   * @param {Object} updateData - Data to update
   * @param {function} showLoading - Loading function (optional)
   * @param {function} hideLoading - Hide loading function (optional)
   * @returns {Promise<boolean>} Success status
   */
  export const updateSavedInfo = async (id, type, updateData, showLoading = null, hideLoading = null) => {
    try {
      if (showLoading) showLoading("Updating...");
      
      const collectionName = type === "sender" ? "senders" : "receivers";
      await updateDoc(doc(firestore, collectionName, id), updateData);
      
      Toast.show({
        type: "success",
        text1: "Information updated successfully",
      });
      return true;
    } catch (error) {
      console.error("Error updating:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update information",
      });
      return false;
    } finally {
      if (hideLoading) hideLoading();
    }
  };