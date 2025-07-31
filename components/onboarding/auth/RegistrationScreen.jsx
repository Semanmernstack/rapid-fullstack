import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Mail, Lock, CircleUser } from "lucide-react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BackgroundDecor from "../../BackgroundDecor";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../../firebase";
import { useLoading } from "../../../context/LoadingContext";
import Toast from "react-native-toast-message";
import { useGoogleAuth } from "./GoogleAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendEmailVerification } from "firebase/auth";

export default function RegistrationScreen() {
  const { showLoading, hideLoading } = useLoading();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const navigation = useNavigation();

  // Google Sign In Functionalities
  const { promptAsync } = useGoogleAuth(
    async (userCredential) => {
      const user = userCredential.user;

      // Save session
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      );

      Toast.show({ type: "success", text1: "Registration Successful!" });
      await AsyncStorage.setItem("userLoggedIn", "true");
      navigation.replace("MainApp");
    },
    (error) => {
      console.log(error.message);
      Toast.show({
        type: "danger",
        text1: "Google Sign-Up Failed",
        text2: error.message,
      });
    }
  );

  const handleGoogleSignup = async () => {
    showLoading("Creating your account...");
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google sign-up error:", error);
      Toast.show({
        type: "danger",
        text1: "Google Sign-Up Failed",
        text2: error.message,
      });
    } finally {
      hideLoading();
    }
  };

  // Email & Password Registration
  const handleRegister = async () => {
    if (password !== confirm) {
      Toast.show({
        type: "danger",
        text1: "Password Mismatch",
        text2: "Passwords do not match",
      });
      return;
    }

    if (!email || !name) {
      Toast.show({
        type: "warning",
        text1: "Missing Information",
        text2: "Please fill all fields",
      });
      return;
    }

    showLoading("Creating your account...");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // 🔐 Send email verification
      await sendEmailVerification(user);

      // Save session
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: name,
          photoURL: user.photoURL,
        })
      );

      Toast.show({
        type: "success",
        text1: "Verify Your Email",
        text2: "A verification link has been sent to your email.",
      });
      navigation.replace("Login");
    } catch (error) {
      Toast.show({
        type: "danger",
        text1: "Registration Failed",
        text2: error.message,
      });
    } finally {
      hideLoading();
    }
  };

  // Registration UI
  return (
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

        {/* User Full Name */}
        <View className="mb-3">
          <Text className="text-gray-700 font-semibold mb-2">Full Name</Text>
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

        {/* Email Input */}
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

        {/* Password Input */}
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

        {/* Confirm Password Input */}
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

        {/* Registration Button */}
        <TouchableOpacity style={styles.signupButton} onPress={handleRegister}>
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity>

        {/* Other Options */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>Or continue with</Text>
          <View style={styles.line} />
        </View>

        {/* Optional Providers */}
        <View className="flex-row gap-2 justify-center items-center mb-4">
          <TouchableOpacity className="p-2 border border-gray-200 flex justify-center items-center rounded w-14 h-12">
            <FontAwesome name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoogleSignup}
            className="p-2 border border-gray-200 flex justify-center items-center rounded w-14 h-12"
          >
            <Image
              source={require("../../../assets/images/google-logo.png")}
              style={{ width: 26, height: 26 }}
            />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 border border-gray-200 flex justify-center items-center rounded w-14 h-12">
            <FontAwesome name="apple" size={24} color="#010101" />
          </TouchableOpacity>
        </View>

        {/* Registration Screen Footer */}
        <View style={styles.footer}>
          <Text>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Sign in!</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}


// Styles
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
