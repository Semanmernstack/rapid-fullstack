import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ToastBase = ({ text1, text2, bgColor, icon }) => (
  <View style={[styles.toastContainer, { backgroundColor: bgColor }]}>
    <Ionicons name={icon} size={24} color="white" style={styles.icon} />
    <View style={styles.textContainer}>
      <Text style={styles.text1}>{text1}</Text>
      {text2 ? <Text style={styles.text2}>{text2}</Text> : null}
    </View>
  </View>
);

export const toastConfig = {
  success: (props) => (
    <ToastBase
      {...props}
      bgColor="#8328FA"
      icon="checkmark-circle-outline"
    />
  ),
  error: (props) => (
    <ToastBase
      {...props}
      bgColor="#FF3B30"
      icon="close-circle-outline"
    />
  ),
  info: (props) => (
    <ToastBase
      {...props}
      bgColor="#5AC8FA"
      icon="information-circle-outline"
    />
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 50,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  text2: {
    color: "white",
    fontSize: 14,
    marginTop: 2,
  },
});
