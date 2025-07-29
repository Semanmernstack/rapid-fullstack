"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ArrowLeft, User, Phone, MapPin, Calendar } from "lucide-react-native"

export default function PackageDetailsScreen({ navigation }) {
  const [senderName, setSenderName] = useState("")
  const [senderPhone, setSenderPhone] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [date, setDate] = useState("")
  const [receiverName, setReceiverName] = useState("")

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-4">Package details</Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900 mb-2">Fill in the details to create your shipment</Text>

        {/* Sender Information */}
        <Text className="text-lg font-semibold text-gray-900 mb-6 mt-6">Sender Information</Text>

        <View className="mb-6">
          <Text className="text-gray-600 mb-2">Full Name</Text>
          <View className="flex-row items-center border-b border-gray-200 pb-3">
            <User size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Enter Your Full Name"
              value={senderName}
              onChangeText={setSenderName}
              className="flex-1 ml-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-gray-600 mb-2">Phone Number</Text>
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
          <Text className="text-gray-600 mb-2">Pickup Address</Text>
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
          <Text className="text-gray-600 mb-2">Date</Text>
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
        <Text className="text-lg font-semibold text-gray-900 mb-6">Receiver Information</Text>

        <View className="mb-8">
          <Text className="text-gray-600 mb-2">Full Name</Text>
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
      </ScrollView>
    </SafeAreaView>
  )
}
