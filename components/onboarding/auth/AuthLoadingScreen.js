// components/auth/AuthLoadingScreen.js
import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';

export default function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* You can add your app logo here */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Rapid Delivery</Text>
        </View>
        
        <ActivityIndicator 
          size="large" 
          color="#000" 
          style={styles.loader}
        />
        
        <Text style={styles.loadingText}>
          Setting up your session...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8328FA',
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});