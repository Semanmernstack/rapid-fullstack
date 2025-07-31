// config/toastConfig.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <CheckCircle size={20} color="#10B981" />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.successText]}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <XCircle size={20} color="#EF4444" />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.errorText]}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),

  warning: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.warningToast]}>
      <AlertCircle size={20} color="#F59E0B" />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.warningText]}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),

  info: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <Info size={20} color="#3B82F6" />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.infoText]}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),

  // Custom danger type (since you're using it in your auth functions)
  danger: ({ text1, text2 }) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <XCircle size={20} color="#EF4444" />
      <View style={styles.textContainer}>
        <Text style={[styles.text1, styles.errorText]}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    height: 60,
    width: '90%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  text1: {
    fontSize: 14,
    fontWeight: '600',
  },
  text2: {
    fontSize: 12,
    marginTop: 2,
    color: '#6B7280',
  },
  successToast: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  errorToast: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningToast: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoToast: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  successText: {
    color: '#065F46',
  },
  errorText: {
    color: '#991B1B',
  },
  warningText: {
    color: '#92400E',
  },
  infoText: {
    color: '#1E40AF',
  },
});

export default toastConfig;