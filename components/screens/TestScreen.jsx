// Welcome Test Screen
// import React from "react";
// import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { ArrowRight } from "lucide-react-native";

// export default function TestScreen() {
//   const navigation = useNavigation();

//   return (
//     <View style={styles.container}>
//       <Image
//         source={require("../../assets/images/welcomeImage.png")}
//         className="w-56 h-56"
//       />
//       <Text style={styles.title}>Welcome to Rapid Delivery</Text>
//       <Text className="text-sm text-gray-500">
//         Fast. Reliable. Right to your doorstep.
//       </Text>
//       <Text className="text-sm text-gray-500 mb-10">
//         Login to track, send, and manage your deliveries.
//       </Text>
//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => navigation.navigate("Onboarding")}
//       >
//         <Text style={styles.buttonText}>
//           Let's Get Started <ArrowRight size={15} color={'#fff'} />
//         </Text>
//       </TouchableOpacity>
//       <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//         <Text className="text-[#8328FA] mt-4">
//           <Text className="text-[#010101]">Already have an account?</Text> Sign
//           In
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   title: { fontSize: 28, fontWeight: "bold", marginBottom: 15 },
//   button: {
//     backgroundColor: "#8328FA",
//     padding: 16,
//     borderRadius: 10,
//     width: "100%",
//     alignItems: "center",
//     marginTop: "3rem",
//     marginBottom: "1.5rem",
//   },
//   buttonText: { color: "#fff", fontSize: 16 },
//   signInText: { marginTop: 20, color: "#8328FA" },
// });





// Splash Test Screen 1




// import React, { useEffect } from 'react';
// import { View, Image, StyleSheet } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import * as SplashScreen from 'expo-splash-screen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// SplashScreen.preventAutoHideAsync();

// export default function Splash() {
//   const navigation = useNavigation();

//   useEffect(() => {
//     const checkOnboarding = async () => {
//       await new Promise(resolve => setTimeout(resolve, 2000)); // animation delay
//       const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
//       const rememberMe = await AsyncStorage.getItem('rememberMe');

//       SplashScreen.hideAsync();

//       if (!seenIntro) {
//         navigation.replace('Welcome');
//       } else if (rememberMe === 'true') {
//         navigation.replace('MainApp');
//       } else {
//         navigation.replace('Register');
//       }
//     };

//     checkOnboarding();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Image source={require('../../assets/images/splashImage.png')} style={styles.logo} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8328FA' },
//   logo: { width: 250, height: 250, resizeMode: 'contain' },
// });





// Splash test Screen 2



// import React, { useEffect, useRef } from 'react';
// import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import * as SplashScreen from 'expo-splash-screen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width, height } = Dimensions.get('window');

// SplashScreen.preventAutoHideAsync();

// export default function Splash() {
//   const navigation = useNavigation();

//   const diagonalAnim = useRef(new Animated.Value(0)).current;
//   const logoOpacity = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const animate = async () => {
//       // Diagonal purple sweep animation
//       Animated.timing(diagonalAnim, {
//         toValue: 1,
//         duration: 1200,
//         easing: Easing.out(Easing.ease),
//         useNativeDriver: true,
//       }).start(() => {
//         // Fade-in logo after sweep completes
//         Animated.timing(logoOpacity, {
//           toValue: 1,
//           duration: 800,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }).start();
//       });

//       await new Promise(resolve => setTimeout(resolve, 3000)); // total duration

//       const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
//       const rememberMe = await AsyncStorage.getItem('rememberMe');

//       SplashScreen.hideAsync();

//       if (!seenIntro) {
//         navigation.replace('Welcome');
//       } else if (rememberMe === 'true') {
//         navigation.replace('MainApp');
//       } else {
//         navigation.replace('Register');
//       }
//     };

//     animate();
//   }, []);

//   const sweepInterpolation = diagonalAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [ 0, -height],
//   });

//   return (
//     <View style={styles.container}>
//       {/* Diagonal background sweep */}
//       <Animated.View
//         style={[
//           styles.purpleSweep,
//           {
//             transform: [
//               { rotate: '-45deg' },
//               { translateY: sweepInterpolation },
//             ],
//           },
//         ]}
//       />
//       {/* Logo */}
//       <Animated.Image
//         source={require('../../assets/images/splashImage.png')}
//         style={[styles.logo, { opacity: logoOpacity }]}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff', // Initial white
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   purpleSweep: {
//     position: 'absolute',
//     width: width * 2,
//     height: height * 2,
//     backgroundColor: '#8328FA',
//   },
//   logo: {
//     width: 250,
//     height: 250,
//     resizeMode: 'contain',
//     zIndex: 1,
//   },
// });






// Splash Test Screen 3





// import React, { useEffect, useRef } from 'react';
// import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import * as SplashScreen from 'expo-splash-screen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width, height } = Dimensions.get('window');
// SplashScreen.preventAutoHideAsync();

// export default function Splash() {
//   const navigation = useNavigation();
//   const logoOpacity = useRef(new Animated.Value(0)).current;
  
//   // Create 8 animated values for 8 stripes
//   const stripeAnims = useRef(
//     Array.from({ length: 8 }, () => new Animated.Value(0))
//   ).current;

//   useEffect(() => {
//     const animate = async () => {
//       // Calculate stripe width and spacing
//       const stripeWidth = (width * 1.5) / 4; // Wider stripes to ensure coverage
//       const spacing = stripeWidth * 0.8; // Overlap slightly for seamless coverage
      
//       // Create staggered animations for all 8 stripes
//       const animations = stripeAnims.map((anim, index) => {
//         // Stagger start times
//         const delay = index * 150; // 150ms delay between each stripe
        
//         return Animated.timing(anim, {
//           toValue: 1,
//           duration: 1500,
//           delay,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         });
//       });

//       // Start all animations
//       Animated.parallel(animations).start(() => {
//         // Fade-in logo after all stripes complete
//         Animated.timing(logoOpacity, {
//           toValue: 1,
//           duration: 800,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }).start();
//       });

//       await new Promise(resolve => setTimeout(resolve, 4000)); // total duration

//       const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
//       const rememberMe = await AsyncStorage.getItem('rememberMe');
//       SplashScreen.hideAsync();

//       if (!seenIntro) {
//         navigation.replace('Welcome');
//       } else if (rememberMe === 'true') {
//         navigation.replace('MainApp');
//       } else {
//         navigation.replace('Register');
//       }
//     };

//     animate();
//   }, []);

//   // Calculate stripe positions and movements
//   const stripeWidth = (width * 1.5) / 4;
//   const spacing = stripeWidth * 0.8;

//   const renderStripes = () => {
//     return stripeAnims.map((anim, index) => {
//       const isUpward = index < 4; // First 4 go up, last 4 go down
//       const stripeIndex = index % 4; // 0, 1, 2, 3 for positioning
      
//       // Calculate horizontal position
//       const leftPosition = (stripeIndex * spacing) - (stripeWidth / 2);
      
//       // Create interpolation for vertical movement
//       const sweepInterpolation = anim.interpolate({
//         inputRange: [0, 1],
//         outputRange: isUpward 
//           ? [height * 1.5, -height * 0.5] // Upward: start below, end above
//           : [-height * 1.5, height * 0.5], // Downward: start above, end below
//       });

//       return (
//         <Animated.View
//           key={index}
//           style={[
//             styles.stripe,
//             {
//               width: stripeWidth,
//               left: leftPosition,
//               transform: [
//                 { rotate: '-15deg' }, // Slight diagonal angle
//                 { translateY: sweepInterpolation },
//               ],
//             },
//           ]}
//         />
//       );
//     });
//   };

//   return (
//     <View style={styles.container}>
//       {/* Render all 8 stripes */}
//       {renderStripes()}
      
//       {/* Logo */}
//       <Animated.Image
//         source={require('../../assets/images/splashImage.png')}
//         style={[styles.logo, { opacity: logoOpacity }]}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff', // Initial white background
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   stripe: {
//     position: 'absolute',
//     height: height * 2, // Extra height to ensure full coverage
//     backgroundColor: '#8328FA',
//   },
//   logo: {
//     width: 250,
//     height: 250,
//     resizeMode: 'contain',
//     zIndex: 10, // Higher z-index to appear above stripes
//   },
// });

// EXPLANATION OF THE STRIPE PATTERN:
// 
// Stripe 0: ↑ (upward)    |  Stripe 4: ↓ (downward)
// Stripe 1: ↑ (upward)    |  Stripe 5: ↓ (downward)  
// Stripe 2: ↑ (upward)    |  Stripe 6: ↓ (downward)
// Stripe 3: ↑ (upward)    |  Stripe 7: ↓ (downward)
//
// Layout:  [0][4][1][5][2][6][3][7]
//          ↑  ↓  ↑  ↓  ↑  ↓  ↑  ↓
//
// This creates alternating up/down movement that covers the screen
// without stripes intersecting each other.






// import React, { useEffect, useRef } from 'react';
// import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import * as SplashScreen from 'expo-splash-screen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width, height } = Dimensions.get('window');
// SplashScreen.preventAutoHideAsync();

// export default function Splash() {
//   const navigation = useNavigation();
//   const logoOpacity = useRef(new Animated.Value(0)).current;
  
//   // Create 8 animated values for 8 stripes
//   const stripeAnims = useRef(
//     Array.from({ length: 20 }, () => new Animated.Value(0))
//   ).current;

//   useEffect(() => {
//     const animate = async () => {
//       // Calculate stripe width and spacing
//       const stripeWidth = (width * 0.5) / 4; // Wider stripes to ensure coverage
//       const spacing = stripeWidth * 0.8; // Overlap slightly for seamless coverage
      
//       // Create staggered animations for all 8 stripes
//       const animations = stripeAnims.map((anim, index) => {
//         // Stagger start times - pairs start together for alternating effect
//         // const delay = Math.floor(index / 2) * 300;
        
//         return Animated.timing(anim, {
//           toValue: 1,
//           duration: 2500,
//           easing: Easing.out(Easing.ease),
//           useNativeDriver: true,
//         });
//       });

//       // Start all animations
//       Animated.parallel(animations).start(() => {
//         // Fade-in logo after all stripes complete
//         Animated.timing(logoOpacity, {
//           toValue: 1,
//           duration: 1000,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }).start();
//       });

//       await new Promise(resolve => setTimeout(resolve, 6000)); // total duration

//       const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
//       const rememberMe = await AsyncStorage.getItem('rememberMe');
//       SplashScreen.hideAsync();

//       if (!seenIntro) {
//         navigation.replace('Welcome');
//       } else if (rememberMe === 'true') {
//         navigation.replace('MainApp');
//       } else {
//         navigation.replace('Register');
//       }
//     };

//     animate();
//   }, []);

//   // Calculate stripe positions and movements
//   const stripeWidth = width / 2; // Exact width for 4 stripes to cover screen
//   const totalStripes = 8;

//   const renderStripes = () => {
//     return stripeAnims.map((anim, index) => {
//       // Alternate up/down: 0=up, 1=down, 2=up, 3=down, 4=up, 5=down, 6=up, 7=down
//       const isUpward = index % 2 === 0;
      
//       // Position stripes side by side with overlap to eliminate gaps
//       const leftPosition = (Math.floor(index / 2) * stripeWidth) - (stripeWidth * 2.5);
      
//       // Create interpolation for vertical movement
//       const sweepInterpolation = anim.interpolate({
//         inputRange: [0, 1],
//         outputRange: isUpward 
//           ? [height * 2, -height] // Upward: start way below, end way above
//           : [-height * 2, height], // Downward: start way above, end way below
//       });

//       return (
//         <Animated.View
//           key={index}
//           style={[
//             styles.stripe,
//             {
//               width: stripeWidth * 0.8, // Slightly wider to ensure no gaps
//               left: leftPosition,
//               transform: [
//                 { rotate: '-45deg' }, // Slight diagonal angle
//                 { translateY: sweepInterpolation },
//               ],
//             },
//           ]}
//         />
//       );
//     });
//   };

//   return (
//     <View style={styles.container}>
//       {/* Render all 8 stripes */}
//       {renderStripes()}
      
//       {/* Logo */}
//       <Animated.Image
//         source={require('../../assets/images/splashImage.png')}
//         style={[styles.logo, { opacity: logoOpacity }]}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff', // Initial white background
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   stripe: {
//     position: 'absolute',
//     height: height * 2, // Much taller to ensure full coverage
//     backgroundColor: '#8328FA',
//     left: -50, // Start slightly offscreen to cover edges
//   },
//   logo: {
//     width: 250,
//     height: 250,
//     resizeMode: 'contain',
//     zIndex: 10, // Higher z-index to appear above stripes
//   },
// });

// EXPLANATION OF THE STRIPE PATTERN:
// 
// Pair 0: Stripe 0 ↑ (upward)   & Stripe 1 ↓ (downward)   - Start together at 0ms
// Pair 1: Stripe 2 ↑ (upward)   & Stripe 3 ↓ (downward)   - Start together at 200ms  
// Pair 2: Stripe 4 ↑ (upward)   & Stripe 5 ↓ (downward)   - Start together at 400ms
// Pair 3: Stripe 6 ↑ (upward)   & Stripe 7 ↓ (downward)   - Start together at 600ms
//
// Layout:  [0↑][1↓]   [2↑][3↓]   [4↑][5↓]   [6↑][7↓]
//           \  /       \  /       \  /       \  /
//          PAIR 0     PAIR 1     PAIR 2     PAIR 3
//
// This creates true alternating up/down movement that's clearly visible
// Each pair covers 1/4 of the screen width with overlap to eliminate gaps





// import React, { useEffect, useRef, useState } from 'react';
// import { View, StyleSheet, Animated, Image } from 'react-native';
// import LottieView from 'lottie-react-native';
// import { useNavigation } from '@react-navigation/native';
// import * as SplashScreen from 'expo-splash-screen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// SplashScreen.preventAutoHideAsync();

// export default function Splash() {
//   const navigation = useNavigation();
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const [animationFinished, setAnimationFinished] = useState(false);

//   useEffect(() => {
//     if (animationFinished) {
//       // Fade in logo
//       Animated.timing(logoOpacity, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }).start(async () => {
//         await new Promise(resolve => setTimeout(resolve, 1200));

//         const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
//         const rememberMe = await AsyncStorage.getItem('rememberMe');

//         SplashScreen.hideAsync();

//         if (!seenIntro) {
//           navigation.replace('Welcome');
//         } else if (rememberMe === 'true') {
//           navigation.replace('MainApp');
//         } else {
//           navigation.replace('Register');
//         }
//       });
//     }
//   }, [animationFinished]);

//   return (
//     <View style={styles.container}>
//       {/* Lottie Animation */}
//       <LottieView
//         source={require('../../assets/images/Second_Scene.json')} // ← Replace with your file
//         autoPlay
//         loop={false}
//         resizeMode="cover" 
//         onAnimationFinish={() => setAnimationFinished(true)}
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: '100%',
//           zIndex: 1,
//         }}
//       />

//       {/* Logo fades in after Lottie */}
//       {animationFinished && (
//         <Animated.Image
//           source={require('../../assets/images/splashImage.png')}
//           style={[styles.logo, { opacity: logoOpacity }]}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   lottie: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 1,
//   },
//   logo: {
//     width: 250,
//     height: 250,
//     resizeMode: 'contain',
//     position: 'absolute',
//     zIndex: 2,
//   },
// });





// import React, { useEffect, useRef, useState, useCallback } from 'react';
// import { View, StyleSheet, Animated, Image } from 'react-native';
// import LottieView from 'lottie-react-native';
// import { useNavigation } from '@react-navigation/native';
// import * as SplashScreen from 'expo-splash-screen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// SplashScreen.preventAutoHideAsync(); // Keep native splash visible

// export default function Splash() {
//   const navigation = useNavigation();
//   const logoOpacity = useRef(new Animated.Value(0)).current;
//   const [appReady, setAppReady] = useState(false);

//   const startApp = async () => {
//     const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
//     const rememberMe = await AsyncStorage.getItem('rememberMe');

//     SplashScreen.hideAsync(); // Hide native splash only now

//     if (!seenIntro) {
//       navigation.replace('Welcome');
//     } else if (rememberMe === 'true') {
//       navigation.replace('MainApp');
//     } else {
//       navigation.replace('Register');
//     }
//   };

//   const onAnimationComplete = () => {
//     // Fade in logo
//     Animated.timing(logoOpacity, {
//       toValue: 1,
//       duration: 800,
//       useNativeDriver: true,
//     }).start(async () => {
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       setAppReady(true);
//     });
//   };

//   useEffect(() => {
//     if (appReady) {
//       startApp(); // navigation only happens *after* animation finishes
//     }
//   }, [appReady]);

//   return (
//     <View style={styles.container}>
//       {/* Lottie background animation */}
//       <LottieView
//         source={require('../../assets/images/Second_Scene.json')}
//         autoPlay
//         loop={false}
//         resizeMode="cover"
//         onAnimationFinish={onAnimationComplete}
//         style={styles.lottie}
//       />

//       {/* Logo appears after background */}
//       <Animated.Image
//         source={require('../../assets/images/splashImage.png')}
//         style={[styles.logo, { opacity: logoOpacity }]}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff', // Should match Lottie start frame or be removed entirely
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   lottie: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 1,
//   },
//   logo: {
//     width: 250,
//     height: 250,
//     resizeMode: 'contain',
//     position: 'absolute',
//     zIndex: 2,
//   },
// });





import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowRight } from "lucide-react-native";

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/welcomeImage.png")}
        className="w-56 h-56"
      />
      <Text style={styles.title}>Welcome to Rapid Delivery</Text>
      <Text className="text-sm text-gray-500">
        Fast. Reliable. Right to your doorstep.
      </Text>
      <Text className="text-sm text-gray-500 mb-10">
        Login to track, send, and manage your deliveries.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Onboarding")}
      >
        <Text style={styles.buttonText}>
          Let's Get Started <ArrowRight size={15} color={'#fff'} />
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text className="text-[#8328FA] mt-4">
          <Text className="text-[#010101]">Already have an account?</Text> Sign
          In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 15 },
  button: {
    backgroundColor: "#8328FA",
    padding: 16,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: "3rem",
    marginBottom: "1.5rem",
  },
  buttonText: { color: "#fff", fontSize: 16 },
  signInText: { marginTop: 20, color: "#8328FA" },
});
