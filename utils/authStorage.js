// utils/authStorage.js - Create this file
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_KEY = 'rapid_delivery_user';

export const authStorage = {
  // Save user to storage
  saveUser: async (user) => {
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        loginTime: Date.now()
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      console.log('✅ User saved to storage:', userData.email);
      return true;
    } catch (error) {
      console.error('❌ Error saving user:', error);
      return false;
    }
  },

  // Get user from storage
  getUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        console.log('📱 User loaded from storage:', user.email);
        return user;
      }
      console.log('📱 No user found in storage');
      return null;
    } catch (error) {
      console.error('❌ Error loading user:', error);
      return null;
    }
  },

  // Remove user from storage
  removeUser: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
      console.log('🗑️ User removed from storage');
      return true;
    } catch (error) {
      console.error('❌ Error removing user:', error);
      return false;
    }
  },

  // Check if user session is valid (optional: add expiry logic)
  isSessionValid: (user) => {
    if (!user || !user.loginTime) return false;
    
    // Optional: Check if session is older than 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - user.loginTime > thirtyDays;
    
    return !isExpired;
  }
};