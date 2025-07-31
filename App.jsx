// Rapid Delivery's App Core Imports
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { enableScreens } from "react-native-screens";
import { Home, MapPin, User, Bus, Settings } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";


// Rapid Delivery's Core Screens
import HomeScreen from "./components/screens/HomeScreen";
import LocationScreen from "./components/screens/LocationScreen";
import ProfileScreen from "./components/screens/ProfileScreen";
import PackageDetailsScreen from "./components/screens/PackageDetailsScreen";


// Toast Configuration & Loading Configuration
import toastConfig from "./config/toastConfig";
import { LoadingProvider } from "./context/LoadingContext";
import LoadingOverlay from "./components/LoadingOverlay";


// Rapid Delivery's Onboarding Screens
import Splash from "./components/onboarding/Splash";
import WelcomeScreen from "./components/onboarding/WelcomeScreen";
import OnboardingSlides from "./components/onboarding/OnboardingSlides";
import LoginScreen from "./components/onboarding/auth/LoginScreen";
import RegistrationScreen from "./components/onboarding/auth/RegistrationScreen";

// // Rapid Delivery's Style sheet
import "./global.css";

enableScreens();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


// Stack Options Constant
const stackScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  animation: "slide_from_right", // This works with native stack
};

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
    </Stack.Navigator>
  );
}

// Location Screen Stack
function LocationStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="LocationScreen" component={LocationScreen} />
    </Stack.Navigator>
  );
}

// Send Screen Stack
function SendStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="PackageDetails" component={PackageDetailsScreen} />
      <Stack.Screen name="LocationScreen" component={LocationScreen} />
    </Stack.Navigator>
  );
}

// Location Screen Stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 10,
          shadowOpacity: 0.1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#8328FA",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;

          if (route.name === "Home") {
            IconComponent = Home;
          } else if (route.name === "Send") {
            IconComponent = Bus;
          } else if (route.name === "Location") {
            IconComponent = MapPin;
          } else if (route.name === "Profile") {
            IconComponent = User;
          } else if (route.name === "Test") {
            IconComponent = Settings;
          }

          return (
            <IconComponent
              size={size}
              color={color}
              fill={focused ? color : "none"}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Send" component={SendStack} />
      <Tab.Screen name="Location" component={LocationStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false); // Firebase has finished checking
    });

    return () => unsubscribe();
  }, []);

  if (initializing) return null;
  return (
    <LoadingProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Splash"
        >
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingSlides} />
          <Stack.Screen name="Register" component={RegistrationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainApp" component={TabNavigator} />
        </Stack.Navigator>

      </NavigationContainer>
      <LoadingOverlay/>
        <Toast
          config={toastConfig}
          position="top" // or "bottom"
          autoHide
          visibilityTime={4000} // 4 seconds
          topOffset={60}
          bottomOffset={60}
          swipeable={true}
        />
    </LoadingProvider>
  );
}
