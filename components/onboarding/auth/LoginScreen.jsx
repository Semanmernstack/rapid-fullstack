import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Mail, Lock, X } from "lucide-react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BackgroundDecor from "../../BackgroundDecor";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../../firebase";
import { useLoading } from "../../../context/LoadingContext";
import Toast from "react-native-toast-message";
import { useGoogleAuth } from "./GoogleAuth";

export default function LoginScreen() {
  const { showLoading, hideLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(90);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
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

      await AsyncStorage.setItem("userLoggedIn", "true");
      Toast.show({ type: "success", text1: "Welcome Home!" });
      navigation.replace("MainApp");
    },
    (error) => {
      console.log(error.message);
      Toast.show({
        type: "danger",
        text1: "Google Sign-In Failed",
        text2: error.message,
      });
    }
  );

  const handleGoogleLogin = async () => {
    showLoading("Please Wait...");
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google login error:", error);
      Toast.show({
        type: "danger",
        text1: "Google Sign-In Failed",
        text2: error.message,
      });
    } finally {
      hideLoading();
    }
  };

  // Email & Password Function
  const handleLogin = async () => {
    showLoading("Logging you in...");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        Toast.show({
          type: "warning",
          text1: "Email Not Verified",
          text2: "Check your inbox or spam to verify.",
        });

        setShowResend(true);
        setResendDisabled(true);
        setResendTimer(90);

        // Start countdown
        let countdown = 90;
        const interval = setInterval(() => {
          countdown -= 1;
          setResendTimer(countdown);
          if (countdown <= 0) {
            setResendDisabled(false);
            clearInterval(interval);
          }
        }, 1000);

        return;
      }

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

      Toast.show({
        type: "success",
        text1: "Welcome Home!",
        text2: "You have successfully logged in",
      });
      await AsyncStorage.setItem("userLoggedIn", "true");
      navigation.replace("MainApp");
    } catch (error) {
      Toast.show({
        type: "danger",
        text1: "Login Failed",
        text2: error.message,
      });
    } finally {
      hideLoading();
    }
  };

  // Resend Verification Function
  const handleResendVerification = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.sendEmailVerification();
        Toast.show({
          type: "success",
          text1: "Verification Sent",
          text2: "Check your inbox or spam folder.",
        });
        setResendDisabled(true);
        setResendTimer(90);

        // Restart countdown
        let countdown = 90;
        const interval = setInterval(() => {
          countdown -= 1;
          setResendTimer(countdown);
          if (countdown <= 0) {
            setResendDisabled(false);
            clearInterval(interval);
          }
        }, 1000);
      }
    } catch (error) {
      Toast.show({
        type: "danger",
        text1: "Error Sending Email",
        text2: error.message,
      });
    }
  };

  // Forgotten Password Function
  const handlePasswordReset = async () => {
    if (!forgotEmail.trim()) {
      Toast.show({
        type: "warning",
        text1: "Enter your email",
        text2: "We need your email to send a reset link",
      });
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      Toast.show({
        type: "success",
        text1: "Reset Email Sent",
        text2: "Check your inbox or spam folder",
      });
      setForgotModalVisible(false);
      setForgotEmail("");
    } catch (error) {
      Toast.show({
        type: "danger",
        text1: "Failed to Send",
        text2: error.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Login Screen UI
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
        <Text style={styles.title}>Welcome Home.</Text>

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

        {/* Forgotten Password Button */}
        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => setForgotModalVisible(true)}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Log in</Text>
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
            onPress={handleGoogleLogin}
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

        {/* Login Screen Footer */}
        <View style={styles.footer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>Sign Up!</Text>
          </TouchableOpacity>
        </View>

        {/* Conditional Resend Button */}
        {showResend && (
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <TouchableOpacity
              disabled={resendDisabled}
              onPress={handleResendVerification}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: resendDisabled ? "#ccc" : "#8328FA",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {resendDisabled
                  ? `Resend in ${resendTimer}s`
                  : "Resend Verification Email"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Email Input for Forgotten Passward Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={forgotModalVisible}
          onRequestClose={() => setForgotModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View className="bg-white rounded-2xl p-6 w-11/12">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-base font-semibold text-gray-900">
                  Reset Your Password
                </Text>
                <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Instruction */}
              <Text className="text-sm text-gray-700 mb-2">
                Enter the email linked to your account
              </Text>

              {/* Email input */}
              <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mb-4">
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  inputMode="email"
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    paddingVertical: 8,
                    fontSize: 15,
                    color: "#111827",
                  }}
                />
              </View>

              {/* Buttons */}
              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  onPress={() => setForgotModalVisible(false)}
                  className="py-2 px-4"
                >
                  <Text className="text-gray-500 font-medium">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePasswordReset}
                  disabled={isResetting}
                  className="bg-[#8328FA] px-6 py-2 rounded-xl"
                  style={{ opacity: isResetting ? 0.7 : 1 }}
                >
                  <Text className="text-white font-semibold">
                    {isResetting ? "Sending..." : "Send Link"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  label: { fontWeight: "500", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  forgotButton: { alignSelf: "flex-end" },
  forgotText: { color: "#8328FA", fontSize: 13, fontWeight: "500" },
  loginButton: {
    backgroundColor: "#8328FA",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: "center",
  },
  loginText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  line: { flex: 1, height: 1, backgroundColor: "#ccc" },
  or: { marginHorizontal: 8, color: "#888" },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    alignItems: "center",
  },
});
