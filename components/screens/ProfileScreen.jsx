import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Edit,
  CreditCard,
  Settings,
  MapPin,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { auth } from "../../firebase";
import { useLoading } from "../../context/LoadingContext";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen({ navigation }) {

  const [ userName, setUserName] = useState('')
  const [ userEmail, setUserEmail] = useState('')
  const { showLoading, hideLoading } = useLoading();

  const handleLogout = async () => {
    showLoading("Signing you out...");
    try {
      await auth.signOut();
      // await AsyncStorage.removeItem('userLoggedIn');
    await AsyncStorage.setItem('userLoggedIn', 'false');
      Toast.show({
        type: 'success',
        text1: 'Signed out successfully',
      });
      // navigation.replace("Login");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }], // or "Welcome" or "AuthStack" depending on your flow
      });
  
    } catch (error) {
      console.error("Error signing out:", error);
      Toast.show({
        type: 'danger',
        text1: 'Logout Failed',
        text2: error.message,
      });
    } finally {
      hideLoading();
    }
  };

  // Display Name
  useEffect(()=>{
    const user = auth.currentUser;

    if ( user?.displayName){
      const username = user.displayName;
      setUserName(username);
    }
  }, []);

  // Email
  useEffect(()=>{
    const userEmail = auth.currentUser;

    if ( userEmail?.email){
      const Email = userEmail.email;
      setUserEmail(Email);
    }
  }, []);

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
        <View className="relative">
          <Image
            source={require("../../assets/images/profile-cover.png")}
            className="w-full h-36"
            resizeMode="cover"
          />

          <View className="absolute -bottom-9 left-6">
            <View className="relative">
              <Image
                source={require("../../assets/images/avatar.png")}
                className="w-20 h-20 rounded-full border-4 border-white"
              />
              {/* Online Indicator */}
              <View className="w-4 h-4 bg-[#009933] border-2 border-white rounded-full absolute bottom-1 right-2" />
            </View>
          </View>
          {/* User Name and Email */}
          <View className="absolute -bottom-6 right-40">
            <Text className="text-xl font-bold text-gray-100">{userName}</Text>
            <Text className="text-gray-50 mb-6">{userEmail}</Text>
          </View>

          <TouchableOpacity className="absolute bottom-1 right-2 w-7 h-7 bg-white rounded-md items-center justify-center shadow-md">
            <Edit size={15} color="#9D1F00" />
          </TouchableOpacity>
        </View>

          {/* Stats */}
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row justify-between mb-8">
            <View>
              <Text className="text-2xl font-semibold text-[#8328FA]">20</Text>
              <Text className="text-gray-600">Shipment</Text>
            </View>
            <View>
              <Text className="text-2xl font-semibold text-[#8328FA]">
                20,56
              </Text>
              <Text className="text-gray-600">Transaction</Text>
            </View>
            <View>
              <Text className="text-2xl font-semibold text-[#8328FA]">
                $200
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

            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                <MapPin size={20} color="#006D24" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">
                Location Setting
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                <LogOut size={20} color="#9D1F00" />
              </View>
              <Text className="flex-1 text-[#9D1F00] font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
