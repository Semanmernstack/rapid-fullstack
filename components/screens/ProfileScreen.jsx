import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Edit,
  CreditCard,
  Settings,
  MapPin,
  LogOut,
  ChevronRight,
  X,
  Archive,
  Trash2,
  Edit2,
} from "lucide-react-native";
import { auth } from "../../firebase";
import { useLoading } from "../../context/LoadingContext";
import Toast from "react-native-toast-message";
import { updateProfile } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "@env";
import {
  fetchSavedInfo,
  deleteSavedInfo,
  updateSavedInfo,
} from "../../utils/savedInfoUtils";
import {
  getCurrentUserProfile,
  updateUserDisplayName,
  updateUserProfilePhoto,
  subscribeToProfileUpdates,
} from "../../utils/userProfileUtils";
import { fetchDeliveryStats } from "../../utils/deliveryUtils";

export default function ProfileScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const { showLoading, hideLoading } = useLoading();
  const [profileImage, setProfileImage] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempUserName, setTempUserName] = useState("");
  const [confirmSignOut, setConfirmSignOut] = useState("");
  const [savedInfoModal, setSavedInfoModal] = useState(false);
  const [infoTypeModal, setInfoTypeModal] = useState(false);
  const [selectedInfoType, setSelectedInfoType] = useState("");
  const [savedData, setSavedData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [deliveryStats, setDeliveryStats] = useState({
    totalShipments: 0,
    totalTransactions: 0,
    totalSpending: 0,
    completedDeliveries: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const [userProfile, setUserProfile] = useState({
    displayName: "",
    email: "",
    photoURL: null,
  });
  useEffect(() => {
    const loadDeliveryStats = async () => {
      setIsLoadingStats(true);
      const stats = await fetchDeliveryStats();
      setDeliveryStats(stats);
      setIsLoadingStats(false);
    };

    loadDeliveryStats();
  }, []);

  // Fetching User Photo
  useEffect(() => {
    const user = auth.currentUser;
    setProfileImage(user?.photoURL || null);
  }, []);

  useEffect(() => {
    // Subscribe to real-time profile updates
    const unsubscribe = subscribeToProfileUpdates((profile) => {
      if (profile) {
        setUserProfile(profile);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Fetch delivery stats on mount

  //  Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Function to Change Diplay Photo
  const handleImagePick = async () => {
    const newPhotoURL = await updateUserProfilePhoto(showLoading, hideLoading);
    if (newPhotoURL) {
      setUserProfile((prev) => ({ ...prev, photoURL: newPhotoURL }));
    }
  };

  // Modal to Edit User Display Name
  const openEditModal = () => {
    setTempUserName(userProfile.displayName);
    setIsEditModalVisible(true);
  };

  // User Confirm Sign out
  const handleConfirmSignOut = () => {
    setConfirmSignOut(true);
  };

  // Function to Edit User Display name
  const handleEditName = async () => {
    const success = await updateUserDisplayName(
      tempUserName,
      showLoading,
      hideLoading
    );
    if (success) {
      setUserProfile((prev) => ({
        ...prev,
        displayName: tempUserName.trim(),
        firstName: tempUserName.trim().split(" ")[0],
      }));
      setIsEditModalVisible(false);
    }
  };

  // User Sign out
  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.setItem("userLoggedIn", "false");
      Toast.show({
        type: "success",
        text1: "Signed out successfully",
      });
      // navigation.replace("Login");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }], // or "Welcome" or "AuthStack" depending on your flow
      });
    } catch (error) {
      console.error("Error signing out:", error);
      Toast.show({
        type: "danger",
        text1: "Logout Failed",
        text2: error.message,
      });
    }
  };

  // Display Name
  useEffect(() => {
    const user = auth.currentUser;

    if (user?.displayName) {
      const username = user.displayName;
      setUserName(username);
    }
  }, []);

  // User Email
  useEffect(() => {
    const userEmail = auth.currentUser;

    if (userEmail?.email) {
      const Email = userEmail.email;
      setUserEmail(Email);
    }
  }, []);

  // Function to Retreive Saved User Information from Utils folder
  const fetchSavedInfoLocal = async (type) => {
    const data = await fetchSavedInfo(type, showLoading, hideLoading);
    setSavedData(data);
    setSelectedInfoType(type);
    setInfoTypeModal(false);
    setSavedInfoModal(true);
  };

  // Function to delete saved information from Utils folder
  const deleteSavedInfoLocal = async (id, type) => {
    const success = await deleteSavedInfo(id, type, showLoading, hideLoading);
    if (success) {
      setSavedData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-center flex-1">
          Profile
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* User Profile Header */}
        <View className="relative mb-6">
          <Image
            source={require("../../assets/images/profile-cover.png")}
            className="w-full h-36"
            resizeMode="cover"
          />

          <View className="absolute -bottom-9 left-6">
            <TouchableOpacity onPress={handleImagePick}>
              <Image
                source={
                  userProfile.photoURL
                    ? { uri: userProfile.photoURL }
                    : require("../../assets/images/avatar.png")
                }
                className="w-20 h-20 rounded-full border-4 border-white"
              />
              <View className="w-4 h-4 bg-[#009933] border-2 border-white rounded-full absolute bottom-1 right-2" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-6 px-6">
          <View>
            <Text className="text-xl font-bold text-gray-900">
              {userProfile.displayName}
            </Text>
            <Text className="text-gray-70">{userProfile.email}</Text>
          </View>

          <TouchableOpacity
            onPress={openEditModal}
            className="absolute bottom-1 right-2 w-7 h-7 bg-white rounded-md items-center justify-center shadow-md"
          >
            <Edit size={15} color="#9D1F00" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row justify-between mb-8">
            <View>
              <Text className="text-2xl font-semibold text-[#8328FA]">
                {isLoadingStats ? "..." : deliveryStats.totalShipments}{" "}
              </Text>
              <Text className="text-gray-600">Shipment</Text>
            </View>
            <View>
              <Text className="text-2xl font-semibold text-[#8328FA]">
                {isLoadingStats ? "..." : deliveryStats.totalTransactions}
              </Text>
              <Text className="text-gray-600">Transaction</Text>
            </View>
            <View>
              <Text className="text-2xl font-semibold text-[#8328FA]">
                {isLoadingStats
                  ? "..."
                  : formatCurrency(Number(deliveryStats.totalSpending || 0))}
              </Text>
              <Text className="text-gray-600">Spending</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View className="space-y-4">
            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-4">
                <CreditCard size={20} color="#6C03F5" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">
                Payment Setting
              </Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4 mb-1">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                <Settings size={20} color="#6B7280" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">
                App setting
              </Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setInfoTypeModal(true)}
              className="flex-row items-center py-4"
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Archive size={20} color="#2563EB" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">
                Saved Information
              </Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                <MapPin size={20} color="#006D24" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">
                Location Setting
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmSignOut}
              className="flex-row items-center py-4"
            >
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                <LogOut size={20} color="#9D1F00" />
              </View>
              <Text className="flex-1 text-[#9D1F00] font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View
          style={styles.modalOverlay}
          className="flex-1 justify-center items-center px-6"
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-gray-900">
                Edit Display Name
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                className="w-6 h-6 items-center justify-center"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Input Field */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Display Name
              </Text>
              <TextInput
                value={tempUserName}
                onChangeText={setTempUserName}
                placeholder="Enter your display name"
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-gray-50"
                maxLength={50}
                autoFocus={true}
                selectTextOnFocus={true}
              />
              <Text className="text-xs text-gray-500 mt-1">
                {tempUserName.length}/50 characters
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEditName}
                className="flex-1 bg-[#8328FA] rounded-lg py-3 items-center"
                disabled={!tempUserName.trim()}
              >
                <Text className="text-white font-medium">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Sign Out Confirmation */}
      <Modal
        visible={confirmSignOut}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmSignOut(false)}
      >
        <View
          style={styles.modalOverlay}
          className="flex-1 justify-center items-center px-6"
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-gray-900">
                Confirm Sign Out
              </Text>
              <TouchableOpacity
                onPress={() => setConfirmSignOut(false)}
                className="w-6 h-6 items-center justify-center"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Input Field */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Are You Sure You Want To Sign Out?
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => setConfirmSignOut(false)}
                className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                className="flex-1 bg-[#8328FA] rounded-lg py-3 items-center"
              >
                <Text className="text-white font-medium">Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Information Selection Modal */}
      <Modal
        visible={infoTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInfoTypeModal(false)}
      >
        <View
          style={styles.modalOverlay}
          className="flex-1 justify-center items-center px-6"
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-gray-900">
                Select Information Type
              </Text>
              <TouchableOpacity
                onPress={() => setInfoTypeModal(false)}
                className="w-6 h-6 items-center justify-center"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => fetchSavedInfoLocal("sender")}
                className="p-4 border border-gray-200 rounded-lg mb-2"
              >
                <Text className="text-gray-900 font-medium">
                  Sender Information
                </Text>
                <Text className="text-gray-600 text-sm">
                  View saved sender details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fetchSavedInfoLocal("receiver")}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <Text className="text-gray-900 font-medium">
                  Receiver Information
                </Text>
                <Text className="text-gray-600 text-sm">
                  View saved receiver details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Information List Modal */}
      <Modal
        visible={savedInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSavedInfoModal(false)}
      >
        <View
          style={styles.modalOverlay}
          className="flex-1 justify-center items-center px-6"
        >
          <View
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            style={{ maxHeight: "80%" }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-gray-900">
                Saved {selectedInfoType === "sender" ? "Sender" : "Receiver"}{" "}
                Info
              </Text>
              <TouchableOpacity
                onPress={() => setSavedInfoModal(false)}
                className="w-6 h-6 items-center justify-center"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Debug info - remove this after fixing */}
            <Text style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
              Debug: {savedData.length} items, Type: {selectedInfoType}
            </Text>

            {savedData.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center">
                  No saved information found
                </Text>
              </View>
            ) : (
              <FlatList
                data={savedData}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="p-4 border border-gray-200 rounded-lg mb-3">
                    <Text className="font-semibold text-gray-900">
                      {item.fullName || "No Name"}
                    </Text>
                    <Text className="text-gray-600">
                      {item.phone || "No Phone"}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {selectedInfoType === "sender"
                        ? item.pickupAddress || "No Pickup Address"
                        : item.deliveryAddress || "No Delivery Address"}
                    </Text>

                    <View className="flex-row justify-end mt-3 space-x-2">
                      <TouchableOpacity
                        onPress={() => {
                          setEditingItem(item);
                          setEditModal(true);
                          // setSavedInfoModal(false);
                        }}
                        className="p-2"
                      >
                        <Edit2 size={16} color="#8328FA" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          deleteSavedInfoLocal(item.id, selectedInfoType)
                        }
                        className="p-2"
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                style={{ maxHeight: 300 }}
              />
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={editModal && !!editingItem}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setEditModal(false);
          setEditingItem(null);
        }}
      >
        <View
          style={styles.modalOverlay}
          className="flex-1 justify-center items-center px-6"
        >
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-gray-900">
                Edit {selectedInfoType === "sender" ? "Sender" : "Receiver"}{" "}
                Info
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEditModal(false);
                  setEditingItem(null);
                }}
                className="w-6 h-6 items-center justify-center"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {editingItem && (
              <ScrollView className="max-h-80">
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </Text>
                  <TextInput
                    value={editingItem.fullName}
                    onChangeText={(text) =>
                      setEditingItem({ ...editingItem, fullName: text })
                    }
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    placeholder="Enter full name"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </Text>
                  <TextInput
                    value={editingItem.phone}
                    onChangeText={(text) =>
                      setEditingItem({ ...editingItem, phone: text })
                    }
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    {selectedInfoType === "sender"
                      ? "Pickup Address"
                      : "Delivery Address"}
                  </Text>
                  <TextInput
                    value={
                      selectedInfoType === "sender"
                        ? editingItem.pickupAddress
                        : editingItem.deliveryAddress
                    }
                    onChangeText={(text) => {
                      const addressField =
                        selectedInfoType === "sender"
                          ? "pickupAddress"
                          : "deliveryAddress";
                      setEditingItem({ ...editingItem, [addressField]: text });
                    }}
                    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    placeholder="Enter address"
                    multiline
                  />
                </View>

                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => {
                      setEditModal(false);
                      setEditingItem(null);
                      setSavedInfoModal(true);
                    }}
                    className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                  >
                    <Text className="text-gray-700 font-medium">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      const updateData = {
                        fullName: editingItem.fullName,
                        phone: editingItem.phone,
                        ...(selectedInfoType === "sender"
                          ? { pickupAddress: editingItem.pickupAddress }
                          : { deliveryAddress: editingItem.deliveryAddress }),
                      };

                      const success = await updateSavedInfo(
                        editingItem.id,
                        selectedInfoType,
                        updateData,
                        showLoading,
                        hideLoading
                      );

                      if (success) {
                        setSavedData((prev) =>
                          prev.map((item) =>
                            item.id === editingItem.id ? editingItem : item
                          )
                        );

                        setEditModal(false);
                        setEditingItem(null);
                        setSavedInfoModal(true);
                      }
                    }}
                    className="flex-1 bg-[#8328FA] rounded-lg py-3 items-center"
                  >
                    <Text className="text-white font-medium">Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
