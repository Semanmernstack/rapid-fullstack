import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Edit, CreditCard, Settings, MapPin, LogOut, ChevronRight } from "lucide-react-native"

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-4">Profile</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="relative">
          <View className="h-32 bg-gradient-to-r from-blue-900 to-blue-600" style={{ backgroundColor: "#1e3a8a" }}>
            <View className="absolute inset-0 opacity-20">
              <View className="w-full h-full bg-blue-500" />
            </View>
          </View>

          <View className="absolute -bottom-8 left-6">
            <View className="relative">
              <Image
                source={{ uri: "/placeholder.svg?height=80&width=80" }}
                className="w-20 h-20 rounded-full border-4 border-white"
              />
              <TouchableOpacity className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full items-center justify-center shadow-md">
                <Edit size={12} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Info */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-xl font-bold text-gray-900">Taiwo Adams</Text>
          <Text className="text-gray-600 mb-6">Taiwo123@gmail.com</Text>

          {/* Stats */}
          <View className="flex-row justify-between mb-8">
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">20</Text>
              <Text className="text-gray-600">Shipment</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">20,56</Text>
              <Text className="text-gray-600">Transaction</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-purple-600">$200</Text>
              <Text className="text-gray-600">Spending</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View className="space-y-4">
            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center mr-4">
                <CreditCard size={20} color="#8B5CF6" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">Payment Setting</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center mr-4">
                <Settings size={20} color="#6B7280" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">App setting</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center mr-4">
                <MapPin size={20} color="#10B981" />
              </View>
              <Text className="flex-1 text-gray-900 font-medium">Location Setting</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center py-4">
              <View className="w-10 h-10 bg-red-100 rounded-lg items-center justify-center mr-4">
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text className="flex-1 text-red-500 font-medium">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
