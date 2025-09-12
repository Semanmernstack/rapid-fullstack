import { auth } from "../firebase"; // Adjust path as needed
import { updateProfile } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@env";

const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Get current user profile information
 * @returns {Object} User profile data
 */
export const getCurrentUserProfile = () => {
  const user = auth.currentUser;
  
  return {
    displayName: user?.displayName || "",
    firstName: user?.displayName ? user.displayName.split(' ')[0] : "",
    email: user?.email || "",
    photoURL: user?.photoURL || null,
    uid: user?.uid || null,
  };
};

/**
 * Update user display name
 * @param {string} newDisplayName - New display name
 * @param {function} showLoading - Loading function (optional)
 * @param {function} hideLoading - Hide loading function (optional)
 * @returns {Promise<boolean>} Success status
 */
export const updateUserDisplayName = async (newDisplayName, showLoading = null, hideLoading = null) => {
  if (!newDisplayName.trim()) {
    Toast.show({
      type: "error",
      text1: "Invalid Name",
      text2: "Name cannot be empty",
    });
    return false;
  }

  const currentUser = auth.currentUser;
  if (newDisplayName.trim() === currentUser?.displayName) {
    return true; // No change needed
  }

  try {
    if (showLoading) showLoading("Updating name...");
    
    await updateProfile(currentUser, { displayName: newDisplayName.trim() });
    
    Toast.show({
      type: "success",
      text1: "Name updated successfully!",
    });
    return true;
  } catch (error) {
    console.error("Error updating display name:", error);
    Toast.show({
      type: "error",
      text1: "Update failed",
      text2: error.message,
    });
    return false;
  } finally {
    if (hideLoading) hideLoading();
  }
};

/**
 * Update user profile photo
 * @param {function} showLoading - Loading function (optional)
 * @param {function} hideLoading - Hide loading function (optional)
 * @returns {Promise<string|null>} New photo URL or null if failed
 */
export const updateUserProfilePhoto = async (showLoading = null, hideLoading = null) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return null;
    
    const imageAsset = result.assets[0];
    const localUri = imageAsset.uri;

    if (showLoading) showLoading("Uploading image...");

    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      type: "image/jpeg",
      name: "profile.jpg",
    });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "profile-images");

    const res = await fetch(CLOUDINARY_API_URL, {
      method: "POST",
      body: formData,
    });

    const responseData = await res.json();

    if (responseData.error) {
      console.log("Cloudinary error:", responseData.error);
      throw new Error(responseData.error.message);
    }

    if (!responseData.secure_url) {
      console.log("Cloudinary response:", responseData);
      throw new Error("Upload failed - no URL returned.");
    }

    const downloadURL = responseData.secure_url;

    await updateProfile(auth.currentUser, { photoURL: downloadURL });

    Toast.show({ 
      type: "success", 
      text1: "Profile picture updated!" 
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    Toast.show({
      type: "error",
      text1: "Upload Failed",
      text2: error.message,
    });
    return null;
  } finally {
    if (hideLoading) hideLoading();
  }
};

/**
 * Subscribe to auth state changes for real-time profile updates
 * @param {function} callback - Callback function to handle profile changes
 * @returns {function} Unsubscribe function
 */
export const subscribeToProfileUpdates = (callback) => {
  return auth.onAuthStateChanged((user) => {
    if (user) {
      callback({
        displayName: user.displayName || "",
        firstName: user.displayName ? user.displayName.split(' ')[0] : "",
        email: user.email || "",
        photoURL: user.photoURL || null,
        uid: user.uid || null,
      });
    } else {
      callback(null);
    }
  });
};