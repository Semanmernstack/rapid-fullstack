// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { 
//   initializeAuth,
//   getReactNativePersistence,
//  } from 'firebase/auth';
// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// const firebaseConfig = {
//   apiKey: "AIzaSyDc5BTeQQXV3uCTOCGJAxE6LMst-6bl5qM",
//   authDomain: "rapid-delivery-app.firebaseapp.com",
//   projectId: "rapid-delivery-app",
//   storageBucket: "rapid-delivery-app.firebasestorage.app",
//   messagingSenderId: "895967179101",
//   appId: "1:895967179101:web:faaa5c0e62cde8c58238b4",
//   measurementId: "G-MTFBVQJRH0"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(ReactNativeAsyncStorage),
//   });

  
// export { auth };


import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCuTI3nVbNWPtgOTFNJVgJCywjB-L9fJhw",
  authDomain: "rapid-delivery-app-1d838.firebaseapp.com",
  projectId: "rapid-delivery-app-1d838",
  storageBucket: "rapid-delivery-app-1d838.appspot.com",
  messagingSenderId: "794305130358",
  appId: "1:794305130358:web:4ddbc2ced0a909cd2f1457",
  measurementId: "G-MLRXRQWK6M",
};

// Initialize Firebase app (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);

// Initialize Auth with AsyncStorage persistence (only once)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

console.log("🔥 Firebase Auth initialized with AsyncStorage persistence");

export { auth, app, firestore };