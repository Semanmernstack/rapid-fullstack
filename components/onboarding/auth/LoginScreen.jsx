// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, Switch } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useNavigation } from '@react-navigation/native';

// export default function LoginScreen() {
//   const [rememberMe, setRememberMe] = useState(false);
//   const navigation = useNavigation();

//   const handleLogin = async () => {
//     if (rememberMe) {
//       await AsyncStorage.setItem('rememberMe', 'true');
//     } else {
//       await AsyncStorage.removeItem('rememberMe');
//     }
//     navigation.replace('MainApp');
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Login</Text>
//       <TextInput placeholder="Email" style={styles.input} />
//       <TextInput placeholder="Password" secureTextEntry style={styles.input} />
//       <View style={styles.switchContainer}>
//         <Text>Remember Me</Text>
//         <Switch value={rememberMe} onValueChange={setRememberMe} />
//       </View>
//       <Button title="Sign In" onPress={handleLogin} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', padding: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, padding: 12 },
//   switchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between' },
// });

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Mail, Lock, CircleUser, Phone } from "lucide-react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BackgroundDecor from "../../BackgroundDecor";

export default function LoginScreen() {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (rememberMe) {
      await AsyncStorage.setItem("rememberMe", "true");
    } else {
      await AsyncStorage.removeItem("rememberMe");
    }
    navigation.replace("MainApp");
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
          <Text style={styles.title}>Welcome back.</Text>
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
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Log in</Text>
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
            <Text>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Sign Up!</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <Text>Save Login</Text>
            <Switch value={rememberMe} onValueChange={setRememberMe} />
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
