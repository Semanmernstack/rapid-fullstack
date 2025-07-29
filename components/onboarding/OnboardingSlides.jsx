// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native';

// const slides = [
//   { key: '1', title: 'Track Your Package', description: 'Real-time tracking at your fingertips.' },
//   { key: '2', title: 'Fast & Secure Delivery', description: 'Your items, delivered with care.' },
//   { key: '3', title: 'Trusted by Thousands', description: 'Join our community of satisfied customers.' },
// ]

// export default function OnboardingSlides() {
//   const navigation = useNavigation();

//   const finishOnboarding = async () => {
//     await AsyncStorage.setItem('hasSeenIntro', 'true');
//     navigation.replace('Register');
//   };

//   return (
//     <View style={styles.container}>
//       <FlatList
//         horizontal
//         pagingEnabled
//         data={slides}
//         keyExtractor={(item) => item.key}
//         renderItem={({ item }) => (
//           <View style={styles.slide}>
//             <Text style={styles.title}>{item.title}</Text>
//             <Text style={styles.description}>{item.description}</Text>
//           </View>
//         )}
//       />
//       <TouchableOpacity style={styles.skip} onPress={finishOnboarding}>
//         <Text style={styles.skipText}>Skip</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   slide: { width: 360, justifyContent: 'center', alignItems: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
//   description: { fontSize: 16, textAlign: 'center' },
//   skip: { position: 'absolute', top: 50, right: 20 },
//   skipText: { fontSize: 16, color: '#8328FA' },
// });

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Easing,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { ArrowRight, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "1",
    image: require("../../assets/images/Slide1.png"),
    title: "Track Your Package with Ease\nFrom Pickup to Doorstep",
    titleHighlight: ["Your", "Package", "Doorstep"],
    description:
      "Stay updated every step of the way with real-time delivery tracking.",
  },
  {
    key: "2",
    image: require("../../assets/images/Slide2.png"),

    title: "Send Anything, Anywhere\nFast & Secure",
    titleHighlight: ["Anywhere", "Fast"],
    description:
      "Whether it’s documents, gifts, or goods, our seamless pickup and delivery service has you covered.",
  },
  {
    key: "3",
    image: require("../../assets/images/Slide3.png"),
    title: "Smart, Simple, Reliable\nDelivery Made for You",
    titleHighlight: ["Smart", "Made", "for", "You"],
    description:
      "From pickup to drop-off, experience seamless delivery tailored to your schedule—fast, easy, and always dependable.",
  },
];

export default function OnboardingSlides() {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleSkip = async () => {
    await AsyncStorage.setItem("hasSeenIntro", "true");
    navigation.replace("Register");
  };

  // Smooth fade-out and fade-in transition with glitch prevention
  const transitionTo = (targetIndex) => {
    // Step 1: Fade out current slide
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      // Step 2: Update currentIndex after fade-out completes
      setCurrentIndex(targetIndex);

      // Step 3: Wait one frame to allow layout to stabilize
      requestAnimationFrame(() => {
        // Step 4: Fade in the next slide
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    });
  };
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      transitionTo(currentIndex + 1);
    } else {
      handleSkip();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      transitionTo(currentIndex - 1);
    }
  };

  const item = slides[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.slide, { opacity: fadeAnim }]}>
        <View style={styles.slide}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Pagination dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index ? styles.activeDot : null,
                ]}
              />
            ))}
          </View>
          <View style={styles.textContainer}>
          <Text style={styles.title}>
  {item.title.split(" ").map((word, index) => {
    // Check if this word is part of any highlight phrase
    const cleanWord = word.replace("\n", "");
    const isHighlight = item.titleHighlight.some(phrase => 
      phrase.toLowerCase().includes(cleanWord.toLowerCase()) || 
      cleanWord.toLowerCase().includes(phrase.toLowerCase())
    );
    
    return (
      <Text
        key={index}
        style={isHighlight ? styles.highlight : undefined}
      >
        {word + " "}
      </Text>
    );
  })}
</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </Animated.View>
      {/* Skip Button */}
      {currentIndex === 2 ? (
        <></>
      ) : (
        <TouchableOpacity onPress={handleSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
      {/* Navigation Buttons */}
      <View
        style={[
          styles.navButtons,
          currentIndex > 0 ? styles.navSpaceBetween : styles.navFlexEnd,
        ]}
      >
        {currentIndex > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            className="border"
            style={styles.circleBtn1}
          >
            <ArrowLeft size={22} color="#8328FA" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleNext} style={styles.circleBtn2}>
          <ArrowRight size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  slide: { width, alignItems: "center", justifyContent: "flex-start" },
  image: { width: "100%", height: "82%" },
  textContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#000",
    lineHeight: 28,
  },
  highlight: {
    color: "#8328FA",
  },
  description: {
    fontSize: 17,
    textAlign: "center",
    color: "#4B5563",
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
    margin: 5,
  },
  activeDot: {
    backgroundColor: "#8328FA",
  },
  skip: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    color: "#8328FA",
    fontWeight: "600",
    fontSize: 14,
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  navFlexEnd: {
    justifyContent: "flex-end",
  },

  navSpaceBetween: {
    justifyContent: "space-between",
  },
  circleBtn2: {
    backgroundColor: "#8328FA",
    padding: 12,
    borderRadius: 100,
  },
  circleBtn1: {
    borderColor: "#8328FA",
    borderStyle: "solid",
    color: "#8328FA",
    padding: 12,
    borderRadius: 100,
  },
});
