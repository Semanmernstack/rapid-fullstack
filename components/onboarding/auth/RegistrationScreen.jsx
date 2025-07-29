import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Image,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Mail, Lock, CircleUser } from "lucide-react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BackgroundDecor from "../../BackgroundDecor";

export default function RegistrationScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const navigation = useNavigation();

  const handleRegister = () => {
    // Mock: Normally you would validate and submit to backend
    if (password === confirm && email && name) {
      navigation.replace("Login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          className="flex-1 px-6 py-6"
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          enableOnAndroid
        >
          <BackgroundDecor />
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subText}>
            Create an account to enjoy the benefit of the application
          </Text>
          <View className="mb-3">
            <Text className="text-gray-700 font-semibold mb-2">Name</Text>
            <View
              style={{ padding: "4" }}
              className="flex-row items-center border border-gray-200 rounded-xl"
            >
              <CircleUser size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Input Your Full Name"
                value={name}
                onChangeText={setName}
                className="flex-1 ml-3 text-black"
                placeholderTextColor="#9CA3AF"
                inputMode="text"
              />
            </View>
          </View>
          <View className="mb-3">
            <Text className="text-gray-700 font-semibold mb-2">Email</Text>
            <View
              style={{ padding: "4" }}
              className="flex-row items-center border border-gray-200 rounded"
            >
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Input Your Email"
                value={email}
                onChangeText={setEmail}
                className="flex-1 ml-3 text-black"
                placeholderTextColor="#9CA3AF"
                inputMode="email"
              />
            </View>
          </View>
          <View className="mb-3">
            <Text className="text-gray-700 font-semibold mb-2">Password</Text>
            <View
              style={{ padding: "4" }}
              className="flex-row items-center border border-gray-200 rounded"
            >
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Input Your Password"
                value={password}
                onChangeText={setPassword}
                className="flex-1 ml-3 text-black"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((prev) => !prev)}
              >
                <Feather
                  name={passwordVisible ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View className="mb-3">
            <Text className="text-gray-700 font-semibold mb-2">
              Confirm Password
            </Text>
            <View
              style={{ padding: "4" }}
              className="flex-row items-center border border-gray-200 rounded"
            >
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Confirm Your Password"
                value={confirm}
                onChangeText={setConfirm}
                className="flex-1 ml-3 text-black"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!confirmVisible}
              />
              <TouchableOpacity
                onPress={() => setConfirmVisible((prev) => !prev)}
              >
                <Feather
                  name={confirmVisible ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={handleRegister}
          >
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>Or continue with</Text>
            <View style={styles.line} />
          </View>

          <View className="flex-row gap-2 justify-center items-center mb-4">
            <TouchableOpacity className="p-2 border border-gray-200 flex justify-center items-center rounded w-14 h-12">
              <FontAwesome name="facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 border border-gray-200 flex justify-center items-center rounded w-14 h-12">
              <Image
                source={require("../../../assets/images/google-logo.png")}
                style={{ width: 26, height: 26 }}
              />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 border border-gray-200 flex justify-center items-center rounded w-14 h-12">
              <FontAwesome name="apple" size={24} color="#010101" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text>Don’t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Sign in!</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  subText: { color: "#555", marginBottom: 20 },
  label: { fontWeight: "500", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  signupButton: {
    backgroundColor: "#8328FA",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
  },
  signupText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  line: { flex: 1, height: 1, backgroundColor: "#ccc" },
  or: { marginHorizontal: 8, color: "#888" },
  socialRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  icon: { width: 40, height: 40, marginHorizontal: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: { color: "black", fontWeight: "bold" },
});
