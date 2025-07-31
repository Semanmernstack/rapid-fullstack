import React from "react";
import { View, Text, ActivityIndicator, StyleSheet, Modal } from "react-native";
import { useLoading } from "../context/LoadingContext";


const LoadingOverlay = () => {
  const { isLoading, loadingText } = useLoading();

  if (!isLoading) return null;

  return (
    <Modal visible={isLoading} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color="#8328FA" />
          {loadingText ? <Text style={styles.text}>{loadingText}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  box: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#8328FA",
  },
});

export default LoadingOverlay;
