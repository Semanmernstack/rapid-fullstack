import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowRight } from "lucide-react-native";

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/welcomeImage.png")}
        className="w-56 h-56"
      />
      <Text style={styles.title}>Welcome to Rapid Delivery</Text>
      <Text className="text-sm text-gray-500">
        Fast. Reliable. Right to your doorstep.
      </Text>
      <Text className="text-sm text-gray-500 mb-10">
        Login to track, send, and manage your deliveries.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Onboarding")}
      >
        <Text style={styles.buttonText}>
          Let's Get Started <ArrowRight size={15} color={'#fff'} />
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text className="text-[#8328FA] mt-4">
          <Text className="text-[#010101]">Already have an account?</Text> Sign
          In
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 15 },
  button: {
    backgroundColor: "#8328FA",
    padding: 16,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: "3rem",
    marginBottom: "1.5rem",
  },
  buttonText: { color: "#fff", fontSize: 16 },
  signInText: { marginTop: 20, color: "#8328FA" },
});
