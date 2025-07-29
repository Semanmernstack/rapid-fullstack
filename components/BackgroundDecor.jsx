// components/BackgroundDecor.js
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function BackgroundDecor() {
  return (
    <>

      {/* Faded centered logo */}
      <View style={styles.centeredLogo}>
        <Image
          source={require('../assets/images/welcomeImage.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.1,
    zIndex: -10,
  },
  circleSmall: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
    zIndex: -10,
  },
  circleTiny: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    zIndex: -10,
  },
  bottomRight: {
    bottom: -50,
    right: -60,
  },
  bottomLeft: {
    bottom: -60,
    left: -50,
  },
  topRight: {
    top: 60,
    right: -20,
  },
  topLeft: {
    top: 150,
    left: -20,
  },
  centeredLogo: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: 200,
    height: 200,
    opacity: 0.1,
    zIndex: -10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
