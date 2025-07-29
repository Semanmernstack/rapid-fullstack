import { View, Text, TextInput, TouchableOpacity, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, Search, Phone, MessageCircle } from "lucide-react-native"

export default function LocationScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="absolute top-16 left-6 z-10">
        <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md">
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
        <Text className="text-lg font-semibold">Live Tracking</Text>
      </View>

      {/* Map Area */}
      <View className="flex-1 bg-green-100 relative">
        <Image source={{ uri: "/placeholder.svg?height=400&width=400" }} className="w-full h-full" resizeMode="cover" />

        {/* Search Bar */}
        <View className="absolute top-20 left-6 right-6">
          <View className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-md">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search Location"
              className="flex-1 ml-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Tracking Info */}
        <View className="absolute top-1/2 right-6 bg-black bg-opacity-70 px-3 py-1 rounded">
          <Text className="text-white text-sm">1 hour remaining</Text>
        </View>

        {/* Zoom Controls */}
        <View className="absolute bottom-32 right-6">
          <TouchableOpacity className="w-10 h-10 bg-white rounded items-center justify-center shadow-md mb-2">
            <Text className="text-xl font-bold">+</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-white rounded items-center justify-center shadow-md">
            <Text className="text-xl font-bold">-</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
        {/* Handle */}
        <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />

        {/* Package Information */}
        <Text className="text-xl font-semibold mb-4">Package Information</Text>

        <View className="flex-row justify-between mb-6">
          <View>
            <Text className="text-gray-500 mb-1">Delivery Type</Text>
            <Text className="font-semibold">Express delivery</Text>
          </View>
          <View>
            <Text className="text-gray-500 mb-1">Status</Text>
            <Text className="font-semibold">On the way</Text>
          </View>
        </View>

        {/* Delivery Person */}
        <View className="bg-purple-600 rounded-2xl p-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Image source={{ uri: "/placeholder.svg?height=50&width=50" }} className="w-12 h-12 rounded-full mr-3" />
            <View>
              <Text className="text-white font-semibold">Steven bobby</Text>
              <Text className="text-purple-200">Delivery man</Text>
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center mr-3">
              <Phone size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 bg-white bg-opacity-20 rounded-full items-center justify-center">
              <MessageCircle size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
