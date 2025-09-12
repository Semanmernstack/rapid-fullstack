import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const SuggestionNotification = ({ visible, onAccept, onDismiss, yPosition = 100 }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.container,
        {
          top: yPosition + 25, // slightly below the input
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View className='border border-[#8328FA] rounded' style={styles.box}>
        <Text style={styles.text}>Make use of saved information?</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={onAccept}>
            <Text style={styles.action}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.action}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default SuggestionNotification;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    zIndex: 999,
  },
  box: {
    alignItems: 'center',
  },
  text: {
    color: '#8328FA',
    fontWeight: '500',
    fontSize: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  action: {
    color: '#8328FA',
    fontWeight: '700',
    fontSize: 15,
  },
});
