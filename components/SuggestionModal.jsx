import React from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";

const SuggestionModal = ({ visible, data, onSelect, onClose, isLoading = false }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View className="flex-row items-center justify-between">
            <Text style={styles.title}>Select from Previous</Text>
            <TouchableOpacity onPress={onClose}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8328FA" />
            </View>
          ) : data && data.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item, index) => item.id || index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelect(item)}
                  style={styles.item}
                >
                  <Text style={styles.text}>{item.fullName}'s Information</Text>
                  <Text style={styles.sub}>
                    {item.pickupAddress || item.deliveryAddress}
                  </Text>
                  <Text style={styles.sub}>{item.phone}</Text>
                </TouchableOpacity>
              )}
              style={styles.flatList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No previous data found</Text>
              <Text style={styles.emptySubText}>
                Start by creating your first shipment
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SuggestionModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  text: {
    fontWeight: "600",
  },
  sub: {
    fontSize: 12,
    color: "#555",
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  closeText: {
    color: "#8328FA",
    fontWeight: "700",
  },
});
