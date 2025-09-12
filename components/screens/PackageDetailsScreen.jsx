"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
  StyleSheet,
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
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app, auth, firestore } from "../../firebase";
import SuggestionModal from "../SuggestionModal";
import SuggestionNotification from "../SuggestionNotification";
import Toast from "react-native-toast-message";
import { useLoading } from "../../context/LoadingContext";
import { checkIfExists } from "../../utils/checkIfExists";
import { fetchSavedInfo } from "../../utils/savedInfoUtils";

export default function PackageDetailsScreen({ navigation }) {
  const { showLoading, hideLoading } = useLoading();
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
  const [copyTimeout, setCopyTimeout] = useState(null);
  const trackingNumber = `#${Math.floor(
    100000000 + Math.random() * 900000000
  )}`;
  const [senderNotification, setSenderNotification] = useState(false);
  const [receiverNotification, setReceiverNotification] = useState(false);
  const [senderNotificationShown, setSenderNotificationShown] = useState(false);
  const [receiverNotificationShown, setReceiverNotificationShown] =
    useState(false);
  const [senderModal, setSenderModal] = useState(false);
  const [receiverModal, setReceiverModal] = useState(false);
  const [currentModalType, setCurrentModalType] = useState("");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [senderNotifY, setSenderNotifY] = useState(100);
  const [receiverNotifY, setReceiverNotifY] = useState(100);
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
  });

  const db = firestore;
  const user = auth.currentUser;

  // Copy Tracking Number
  const handleCopy = async () => {
    await Clipboard.setStringAsync(trackingNumber);
    setCopied(true);
    if (copyTimeout) clearTimeout(copyTimeout);
    const timeout = setTimeout(() => setCopied(false), 2000);
    setCopyTimeout(timeout);
  };

  // Copy Icon Timeout 
  useEffect(() => {
    return () => {
      if (copyTimeout) clearTimeout(copyTimeout);
    };
  }, [copyTimeout]);

  // Navigate to the Location Screen
  const handleTrackPress = () => {
    setModalVisible(false);
    navigation.navigate("Location");
  };

  // Creating a Shipment and Saving User Information
  const handleCreateShipment = async () => {
    showLoading("Creating your Shipment");
    try {
      const senderData = {
        fullName: formData.senderName,
        phone: senderPhone,
        address: pickupAddress,
      };
      
      const receiverData = {
        fullName: receiverName,
        phone: receiverNumber,
        address: receiverAddress,
      };
      
      const senderExists = await checkIfExists(db, "senders", user?.uid, senderData);
      if (!senderExists) {
        await addDoc(collection(db, "senders"), {
          fullName: senderData.fullName,
          phone: senderData.phone,
          pickupAddress: senderData.address,
          createdAt: serverTimestamp(),
          userId: user?.uid,
        });
      }
      
      const receiverExists = await checkIfExists(
        db,
        "receivers",
        user?.uid,
        receiverData
      );
      if (!receiverExists) {
        await addDoc(collection(db, "receivers"), {
          fullName: receiverData.fullName,
          phone: receiverData.phone,
          deliveryAddress: receiverData.address,
          createdAt: serverTimestamp(),
          userId: user?.uid,
        });
      }
      

      setModalVisible(true);
    } catch (error) {
      console.error("Error saving shipment:", error);
      Alert.alert("Failed", "Could not create shipment.");
    } finally {
      hideLoading();
      setReceiverNotificationShown(false);
      setSenderNotificationShown(false);
      setFormData({
        senderName: "",
        receiverName: "",
      });
      setDate("");
      setItemType("");
      setItemWeight("");
      setIsFragile(null);
      setSenderPhone("");
      setPickupAddress("");
      setReceiverAddress("");
      setReceiverNumber("");
    }
  };

  // Activates One-time Information Suggestion
  const handleInputFocus = (type, y) => {
    if (type === "sender" && !senderNotificationShown) {
      setSenderNotification(true);
      setReceiverNotification(false);
      setSenderNotificationShown(true);
      setSenderNotifY(y);
    } else if (type === "receiver" && !receiverNotificationShown) {
      setReceiverNotification(true);
      setSenderNotification(false);
      setReceiverNotificationShown(true);
      setReceiverNotifY(y);
    }
    setCurrentModalType(type);
  };

  // Fetch and display user saved information
  const handleAcceptSuggestions = async (type) => {
    try {
      setIsLoadingSuggestions(true);
  
      // Close notifications and open appropriate modal
      if (type === "sender") {
        setSenderNotification(false);
        setSenderModal(true);
        setReceiverModal(false); // Ensure receiver modal is closed
      } else {
        setReceiverNotification(false);
        setReceiverModal(true);
        setSenderModal(false); // Ensure sender modal is closed
      }
  
      // Use the imported function instead of local logic
      const result = await fetchSavedInfo(type, showLoading, hideLoading);
      console.log(result);
      console.log("Fetching suggestions for:", user?.uid, type);
  
      setSuggestions(result);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Load Suggestions",
      });
      if (type === "sender") {
        setSenderModal(false);
      } else {
        setReceiverModal(false);
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Populating user forms with selected information
  const applySuggestion = (data) => {
    if (currentModalType === "sender") {
      setFormData((prev) => ({
        ...prev,
        senderName: data.fullName,
        senderPhone: data.phone,
        senderAddress: data.pickupAddress,
      }));
      setSenderPhone(data.phone);
      setPickupAddress(data.pickupAddress);
      setSenderModal(false);
    } else {
      setFormData((prev) => ({
        ...prev,
        receiverName: data.fullName,
        receiverPhone: data.phone,
        receiverAddress: data.deliveryAddress,
      }));
      setReceiverName(data.fullName);
      setReceiverNumber(data.phone);
      setReceiverAddress(data.deliveryAddress);
      setReceiverModal(false);
    }
    setIsLoadingSuggestions(false);
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

            {/* Sender Full Name */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                Full Name
              </Text>
              <View className="flex-row items-center border-b border-gray-200 pb-3"
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setSenderNotifY(y);
              }}
              >
                <User size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter Your Full Name"
                  value={formData.senderName}
                  onFocus={() => handleInputFocus("sender", senderNotifY)}
                  onChangeText={(text) =>
                    setFormData({ ...formData, senderName: text })
                  }
                  className="flex-1 ml-3 text-black"
                  placeholderTextColor="#9CA3AF"
                />
                <SuggestionNotification
                  visible={senderNotification}
                  onAccept={() => handleAcceptSuggestions("sender")}
                  yPosition={senderNotifY}
                  onDismiss={() => setSenderNotification(false)}
                />
              </View>
            </View>
            
            {/* Sender Phone Number */}
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

            {/* Pickup Address */}
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

            {/* Delivery Date */}
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

              {/* Receiver Full Name */}
              <View className="mb-8">
                <Text className="text-gray-700 font-semibold mb-2">
                  Full Name
                </Text>
                <View className="flex-row items-center border-b border-gray-200 pb-3"
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  setReceiverNotifY(y);
                }}
                >
                  <User size={20} color="#9CA3AF" />
                  <TextInput
                    placeholder="Enter Your Full Name"
                    value={formData.receiverName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, receiverName: text })
                    }
                    onFocus={() => handleInputFocus("receiver", receiverNotifY)}
                    className="flex-1 ml-3 text-gray-900"
                    placeholderTextColor="#9CA3AF"
                  />
                  <SuggestionNotification
                    visible={receiverNotification}
                    onAccept={() => handleAcceptSuggestions("receiver")}
                    yPosition={receiverNotifY}
                    onDismiss={() => setReceiverNotification(false)}
                  />
                </View>
              </View>

              {/* Reveiver Phone Number */}
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

              {/* Delivery Address */}
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
              {/* Item Type */}
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
              
              {/* Item Weight */}
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
              {/* Fragile Selector */}
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
            {/* Action Buttons */}
            <View className="flex-row justify-between mt-4 mb-24">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="flex-1 mr-2 py-4 bg-gray-100 rounded-xl items-center"
              >
                <Text className="text-gray-900 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 py-4 bg-[#8328FA] rounded-xl items-center"
                onPress={handleCreateShipment}
              >
                <Text className="text-white font-semibold">
                  Create Shipment
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Shipment Modal */}
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

      {/* Sender Suggestion Modal */}
      <SuggestionModal
        visible={senderModal}
        data={suggestions}
        onSelect={applySuggestion}
        onClose={() => {
          setSenderModal(false);
          setIsLoadingSuggestions(false);
        }}
        isLoading={isLoadingSuggestions}
      />


      {/* Receiver Suggestion Modal */}
      <SuggestionModal
        visible={receiverModal}
        data={suggestions}
        onSelect={applySuggestion}
        onClose={() => {
          setReceiverModal(false);
          setIsLoadingSuggestions(false);
        }}
        isLoading={isLoadingSuggestions}
      />
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
