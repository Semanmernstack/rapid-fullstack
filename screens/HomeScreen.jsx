import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Search, Bell, QrCode } from "lucide-react-native"

export default function HomeScreen() {
  const recentShipments = [
    { id: "1234890", description: "1 Bag of rice and 12 bottles of Oil", status: "Delivered" },
    { id: "1234890", description: "1 Bag of rice and 12 bottles of Oil", status: "Pending" },
    { id: "1234890", description: "1 Bag of rice and 12 bottles of Oil", status: "Delivered" },
  ]

  return (
    <SafeAreaView className="flex-1 bg-purple-600">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
          <View className="flex-row items-center">
            <Image source={{ uri: "/placeholder.svg?height=50&width=50" }} className="w-12 h-12 rounded-full mr-3" />
            <Text className="text-white text-lg font-medium">Welcome, Tayo</Text>
          </View>
          <TouchableOpacity className="relative">
            <Bell size={24} color="white" />
            <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </TouchableOpacity>
        </View>

        {/* Track Package Section */}
        <View className="px-6 pb-8">
          <Text className="text-white text-xl font-semibold mb-4 text-center">Track Your Package</Text>

          <View className="flex-row items-center bg-white rounded-full px-4 py-3">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Enter your tracking number or Scan"
              className="flex-1 ml-3 text-gray-700"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity>
              <QrCode size={24} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">
          {/* Discount Banner */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-purple-600 mb-1">45% Discount</Text>
                <Text className="text-gray-600 mb-2">off your next express delivery</Text>
                <Text className="text-sm text-gray-500 mb-4">Save tracking IDs to check status faster!</Text>
                <TouchableOpacity className="bg-red-500 px-4 py-2 rounded-full self-start">
                  <Text className="text-white font-medium">Get 30% offer</Text>
                </TouchableOpacity>
              </View>
              <Image source={{ uri: "/placeholder.svg?height=100&width=100" }} className="w-24 h-24" />
            </View>
          </View>

          {/* Send Package Button */}
          <TouchableOpacity className="bg-purple-600 rounded-2xl py-4 mb-8">
            <Text className="text-white text-center text-lg font-semibold">Send a Package</Text>
          </TouchableOpacity>

          {/* Recent Shipments */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">Your Recent Shipments</Text>
              <TouchableOpacity>
                <Text className="text-purple-600 font-medium">View all</Text>
              </TouchableOpacity>
            </View>

            {recentShipments.map((shipment, index) => (
              <View key={index} className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3">
                <Image source={{ uri: "/placeholder.svg?height=40&width=40" }} className="w-10 h-10 mr-4" />
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 mb-1">{shipment.description}</Text>
                  <Text className="text-gray-500 text-sm">#{shipment.id}</Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    shipment.status === "Delivered" ? "bg-green-100" : "bg-yellow-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      shipment.status === "Delivered" ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {shipment.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
