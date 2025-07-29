import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Bell, ScanLine } from "lucide-react-native";

export default function HomeScreen({ navigation }) {
  const recentShipments = [
    {
      id: "1234890",
      description: "1 Bag of rice and 12 bottles of Oil",
      status: "Delivered",
    },
    {
      id: "1234890",
      description: "1 Bag of rice and 12 bottles of Oil",
      status: "Pending",
    },
    {
      id: "1234890",
      description: "1 Bag of rice and 12 bottles of Oil",
      status: "Delivered",
    },
    {
      id: "1234890",
      description: "1 Bag of rice and 12 bottles of Oil",
      status: "Failed",
    },
  ];

  return (
    <View className="flex-1 bg-[#8328FA]">
        <SafeAreaView>
          <View className="flex-row items-center justify-between px-6">
            <View className="flex-row items-center">
              <Image
                source={require("../../assets/images/avatar.png")}
                className="w-14 h-14 rounded-full mr-3"
              />
              <Text className="text-white text-lg font-medium">
                Welcome, Tayo
              </Text>
            </View>
            <TouchableOpacity className="relative p-3 rounded-full bg-white">
              <Bell size={24} color="black" />
              <View className="absolute -top-1 right-1 w-4 h-4 bg-red-700 flex justify-center items-center rounded-full">
                <Text className="text-white">7</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Track Package Section */}
         
        </SafeAreaView>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 my-6">
            <Text className="text-white text-xl font-semibold mb-4 text-center">
              Track Your Package
            </Text>

            <View className="flex-row items-center me-16 gap-2">
              <View className="flex-row items-center bg-white rounded-full px-3 py-2 w-full">
                <Search size={24} color="#9CA3AF" />
                <TextInput
                  placeholder="Enter your tracking number or Scan"
                  className="flex-1 ml-3 text-gray-700"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity className="flex justify-center items-center rounded-full bg-white h-14 w-14">
                <ScanLine size={30} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>

        {/* Main Content */}
        <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">
          {/* Discount Banner */}
          <View className="rounded-2xl p-6 mb-6 bg-gray-50">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-bold text-[#8328FA] mb-1">
                  45% <Text className="text-gray-700">Discount</Text>
                </Text>
                <Text className="text-gray-600 mb-2">
                  off your next express delivery
                </Text>
                <Text className="text-sm text-gray-500 mb-4">
                  Save tracking IDs to check status faster!
                </Text>
                <TouchableOpacity className="bg-red-700 px-2 py-1 rounded-full self-start">
                  <Text className="text-white font-medium">Get 30% offer</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={require("../../assets/images/rider.png")}
                className="w-32 h-32"
              />
            </View>
          </View>

          {/* Send Package Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Send")}
            className="bg-[#8328FA] rounded-2xl w-40 py-4 mb-8"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Send a Package
            </Text>
          </TouchableOpacity>

          {/* Recent Shipments */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-900">
                Your Recent Shipments
              </Text>
              <TouchableOpacity>
                <Text className="text-purple-600 font-medium">View all</Text>
              </TouchableOpacity>
            </View>

            {recentShipments.map((shipment, index) => (
              <View
                key={index}
                className="flex-row gap-2 items-center border border-gray-100 rounded-xl p-4 mb-3"
              >
                <View className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-50">
                  <Image
                    source={require("../../assets/images/package.png")}
                    className="w-14 h-14"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 mb-1">
                    {shipment.description}
                  </Text>
                  <Text className="text-gray-500 text-sm">#{shipment.id}</Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full items-center justify-center ${
                    shipment.status === "Delivered"
                      ? "bg-green-100"
                      : shipment.status === "Failed"
                      ? "bg-red-100"
                      : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      shipment.status === "Delivered"
                        ? "text-green-600"
                        : shipment.status === "Failed"
                        ? "text-red-600"
                        : "text-gray-600"
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
    </View>
  );
}
