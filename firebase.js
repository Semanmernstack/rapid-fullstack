// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc5BTeQQXV3uCTOCGJAxE6LMst-6bl5qM",
  authDomain: "rapid-delivery-app.firebaseapp.com",
  projectId: "rapid-delivery-app",
  storageBucket: "rapid-delivery-app.firebasestorage.app",
  messagingSenderId: "895967179101",
  appId: "1:895967179101:web:faaa5c0e62cde8c58238b4",
  measurementId: "G-MTFBVQJRH0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);