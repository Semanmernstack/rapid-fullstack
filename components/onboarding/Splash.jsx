
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


import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync(); // Keep native splash visible

export default function Splash() {
  const navigation = useNavigation();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const [appReady, setAppReady] = useState(false);

  // const startApp = async () => {
  //   const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
  //   const rememberMe = await AsyncStorage.getItem('rememberMe');

  //   SplashScreen.hideAsync(); // Hide native splash only now

  //   if (!seenIntro) {
  //     navigation.replace('Welcome');
  //   } else if (rememberMe === 'true') {
  //     navigation.replace('MainApp');
  //   } else {
  //     navigation.replace('Register');
  //   }
  // };


  const startApp = async () => {
    const seenIntro = await AsyncStorage.getItem('hasSeenIntro');
    const rememberMe = await AsyncStorage.getItem('rememberMe');
    const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
  
    SplashScreen.hideAsync(); // Hide native splash only now
  
    if (!seenIntro) {
      navigation.replace('Welcome');
    } else if (userLoggedIn === 'true') {
      navigation.replace('MainApp');
    } else if (rememberMe === 'true') {
      navigation.replace('MainApp');
    } else {
      navigation.replace('Login');
    }
  };
  const onAnimationComplete = () => {
    // Fade in logo
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAppReady(true);
    });
  };

  useEffect(() => {
    if (appReady) {
      startApp(); // navigation only happens *after* animation finishes
    }
  }, [appReady]);

  return (
    <View style={styles.container}>
      {/* Lottie background animation */}
      <LottieView
        source={require('../../assets/images/Second_Scene.json')}
        autoPlay
        loop={false}
        resizeMode="cover"
        onAnimationFinish={onAnimationComplete}
        style={styles.lottie}
      />

      {/* Logo appears after background */}
      <Animated.Image
        source={require('../../assets/images/splashImage.png')}
        style={[styles.logo, { opacity: logoOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
    position: 'absolute',
    zIndex: 2,
  },
});
