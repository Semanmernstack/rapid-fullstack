import { Text, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function SendScreen({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-purple-600 items-center justify-center">
      <Text className="text-white text-2xl font-bold mb-8">Send a Package</Text>
      <TouchableOpacity
        className="bg-white px-8 py-4 rounded-2xl"
        onPress={() => navigation.navigate("PackageDetails")}
      >
        <Text className="text-purple-600 font-semibold text-lg">Create Shipment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
