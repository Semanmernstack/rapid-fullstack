"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Copy,
  Check,
} from "lucide-react-native";
import { CheckBox } from "react-native-elements";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Clipboard from "expo-clipboard";

export default function PackageDetailsScreen({ navigation }) {
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [date, setDate] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverNumber, setReceiverNumber] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [itemType, setItemType] = useState("");
  const [itemWeight, setItemWeight] = useState("");
  const [isFragile, setIsFragile] = useState(null);

  // Delivery Dropdown
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState("Standard (2–3 days)");
  const [deliveryOptions, setDeliveryOptions] = useState([
    { label: "Standard (2–3 days)", value: "Standard (2–3 days)" },
    { label: "Express (1 day)", value: "Express (1 day)" },
    { label: "Same Day", value: "Same Day" },
  ]);

  // Payment Method Dropdown
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [paymentOptions, setPaymentOptions] = useState([
    { label: "Card", value: "Card" },
    { label: "Cash on Delivery", value: "Cash on Delivery" },
    { label: "Bank Transfer", value: "Bank Transfer" },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const trackingNumber = "#234678142";
  const [copyTimeout, setCopyTimeout] = useState(null);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(trackingNumber);
    setCopied(true);
    if (copyTimeout) clearTimeout(copyTimeout);
    const timeout = setTimeout(() => setCopied(false), 2000);
    setCopyTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (copyTimeout) clearTimeout(copyTimeout);
    };
  }, [copyTimeout]);

  const handleTrackPress = () => {
    setModalVisible(false);
    navigation.navigate("Location");
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <SafeAreaView className="flex-row items-center px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1 text-center">
          Package details
        </Text>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAwareScrollView
            className="flex-1 px-6 py-6"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            enableOnAndroid
          >
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Fill in the details to create your shipment
            </Text>

            {/* Sender Information */}
            <Text className="text-lg font-semibold text-gray-900 mb-6 mt-6">
              Sender Information
            </Text>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                Full Name
              </Text>
              <View className="flex-row items-center border-b border-gray-200 pb-3">
                <User size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter Your Full Name"
                  value={senderName}
                  onChangeText={setSenderName}
                  className="flex-1 ml-3 text-black"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                Phone Number
              </Text>
              <View className="flex-row items-center border-b border-gray-200 pb-3">
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter Your Phone Number"
                  value={senderPhone}
                  onChangeText={setSenderPhone}
                  className="flex-1 ml-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                Pickup Address
              </Text>
              <View className="flex-row items-center border-b border-gray-200 pb-3">
                <MapPin size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter Your Pickup Address"
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  className="flex-1 ml-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-gray-700 font-semibold mb-2">Date</Text>
              <View className="flex-row items-center border-b border-gray-200 pb-3">
                <TextInput
                  placeholder="Enter Your Date"
                  value={date}
                  onChangeText={setDate}
                  className="flex-1 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
                <Calendar size={20} color="#9CA3AF" />
              </View>
            </View>

            {/* Receiver Information */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-6">
                Receiver Information
              </Text>

              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">
                  Full Name
                </Text>
                <View className="flex-row items-center border-b border-gray-200 pb-3">
                  <User size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="Enter Your Full Name"
                    value={receiverName}
                    onChangeText={setReceiverName}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">
                  Phone Number
                </Text>
                <View className="flex-row items-center border-b border-gray-200 pb-3">
                  <Phone size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="Enter Your Phone Number"
                    value={receiverNumber}
                    onChangeText={setReceiverNumber}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">
                  Delivery Address
                </Text>
                <View className="flex-row items-center border-b border-gray-200 pb-3">
                  <MapPin size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="Enter Your Delivery Address"
                    value={receiverAddress}
                    onChangeText={setReceiverAddress}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
            {/* Package Details */}
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-6">
                Package Details
              </Text>
              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">
                  Item Type
                </Text>
                <View className="flex-row items-center border-b border-gray-200 pb-3">
                  <TextInput
                    placeholder="(e.g. Document, Electronics, Clothing, Food)"
                    value={itemType}
                    onChangeText={setItemType}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">Weight</Text>
                <View className="flex-row items-center border-b border-gray-200 pb-3">
                  <TextInput
                    placeholder="Kilograms (kg)"
                    value={itemWeight}
                    onChangeText={setItemWeight}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View className="mb-6">
                <Text className="text-gray-700 font-semibold mb-2">
                  Is it Fragile?
                </Text>
                <View className="flex-row items-center">
                  <CheckBox
                    title="Yes"
                    checked={isFragile === true}
                    onPress={() => setIsFragile(true)}
                    checkedColor="#8328FA"
                    containerStyle={{
                      backgroundColor: "transparent",
                      borderWidth: 0,
                    }}
                  />
                  <CheckBox
                    title="No"
                    checked={isFragile === false}
                    onPress={() => setIsFragile(false)}
                    checkedColor="#8328FA"
                    containerStyle={{
                      backgroundColor: "transparent",
                      borderWidth: 0,
                    }}
                  />
                </View>
              </View>

              {/* Delivery Options Dropdown */}
              <View
                className="mb-6"
                style={{ zIndex: deliveryOpen ? 3000 : 1000 }}
              >
                <Text className="text-gray-700 font-semibold mb-2">
                  Delivery Type
                </Text>
                <DropDownPicker
                  open={deliveryOpen}
                  value={deliveryType}
                  items={deliveryOptions}
                  setOpen={(open) => {
                    setDeliveryOpen(open);
                    if (open) setPaymentOpen(false); // close other
                  }}
                  setValue={setDeliveryType}
                  setItems={setDeliveryOptions}
                  placeholder="Select delivery type"
                  style={{ borderColor: "#D1D5DB" }}
                  dropDownContainerStyle={{ borderColor: "#D1D5DB" }}
                  zIndex={deliveryOpen ? 3000 : 1000}
                  zIndexInverse={1000}
                />
              </View>

              {/* Payment Method Dropdown */}
              <View
                className="mb-8"
                style={{ zIndex: paymentOpen ? 3000 : 1000 }}
              >
                <Text className="text-gray-700 font-semibold mb-2">
                  Payment Method
                </Text>
                <DropDownPicker
                  open={paymentOpen}
                  value={paymentMethod}
                  items={paymentOptions}
                  setOpen={(open) => {
                    setPaymentOpen(open);
                    if (open) setDeliveryOpen(false); // close other
                  }}
                  setValue={setPaymentMethod}
                  setItems={setPaymentOptions}
                  placeholder="Select payment method"
                  style={{ borderColor: "#D1D5DB" }}
                  dropDownContainerStyle={{ borderColor: "#D1D5DB" }}
                  zIndex={paymentOpen ? 3000 : 1000}
                  zIndexInverse={1000}
                />
              </View>
            </View>
            <View className="flex-row justify-between mt-4 mb-16">
              <TouchableOpacity onPress={() => navigation.goBack()} className="flex-1 mr-2 py-4 bg-gray-100 rounded-xl items-center">
                <Text className="text-gray-900 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 py-4 bg-[#8328FA] rounded-xl items-center"
                onPress={() => setModalVisible(true)}
              >
                <Text className="text-white font-semibold">
                  Create Shipment
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View className="bg-white rounded-2xl p-6 w-11/12">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-gray-900">
                Tracking Number
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between bg-gray-100 rounded-xl p-3 mb-3">
              <Text className="text-base font-semibold text-gray-900">
                #234678142
              </Text>
              <Pressable onPress={handleCopy}>
                {copied ? (
                  <Check size={20} color="#10B981" />
                ) : (
                  <Copy size={20} color="#8328FA" />
                )}
              </Pressable>
            </View>

            <Text className="text-sm text-[#8328FA] mb-2">
              Your shipment has been scheduled successfully.
            </Text>

            <Text className="text-sm text-gray-700 mb-1 font-semibold">
              For Express Delivery (24 Hours):
            </Text>
            <Text className="text-sm text-gray-700 mb-6">
              Your shipment has been scheduled successfully.
            </Text>

            <TouchableOpacity
              onPress={handleTrackPress}
              className="py-4 bg-[#8328FA] rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Track</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
