import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";

import {
  ChevronLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  Map,
} from "lucide-react-native";
import { CheckBox } from "react-native-elements";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
//import { saveShipmentToFirestore } from "../../utils/deliveryUtils";
import { saveSenderReceiverInfo } from "../../utils/savedInfoUtils";
import { saveShipmentToFirestore } from "../../utils/deliveryFirestore";

export default function PackageDetailsScreen() {
  const router = useRouter();
  //const params = useLocalSearchParams();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const weightOptions = [
    { label: "1-5kg", value: "1-5kg", price: 25.0 },
    { label: "5-10kg", value: "5-10kg", price: 40.0 },
    { label: "10-20kg", value: "10-20kg", price: 60.0 },
    { label: "20-30kg", value: "20-30kg", price: 80.0 },
  ];

  const VAT_RATE = 0.2;
  //const { presentGooglePay, initGooglePay, isGooglePaySupported } = useStripe();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupPostcode, setPickupPostcode] = useState("");
  const [date, setDate] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverNumber, setReceiverNumber] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverPostcode, setReceiverPostcode] = useState("");
  const [itemType, setItemType] = useState("");
  const [isFragile, setIsFragile] = useState(false);

  const [weightOpen, setWeightOpen] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0].value);

  const [basePrice, setBasePrice] = useState(weightOptions[0].price);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [vatAmount, setVatAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  // ADD these two state for google pay variables to your existing state variables
  const [isGooglePayProcessing, setIsGooglePayProcessing] = useState(false);
  const [googlePayConfig, setGooglePayConfig] = useState(null);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  //adding apple pay
  const [isApplePayProcessing, setIsApplePayProcessing] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  //adding klarna payment
  const [isKlarnaProcessing, setIsKlarnaProcessing] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState("Standard (2–3 days)");
  const [deliveryOptions] = useState([
    { label: "Standard (2–3 days)", value: "Standard (2–3 days)" },
    { label: "Express (1 day)", value: "Express (1 day)" },
    { label: "Same Day", value: "Same Day" },
  ]);

  //const backendUrl = "http://192.168.43.176:3000";
  const backendUrl = "https://rapid-fullstack.vercel.app";

  // Check for returning from payment
  useEffect(() => {
    const checkReturnFromPayment = async () => {
      try {
        const returnedFromPayment = await AsyncStorage.getItem(
          "returnedFromPayment"
        );
        if (returnedFromPayment) {
          await AsyncStorage.removeItem("returnedFromPayment");
          Alert.alert(
            "Payment Status",
            "Please check your payment status or try again if needed."
          );
        }
      } catch (error) {
        console.log("Error checking return from payment:", error);
      }
    };

    checkReturnFromPayment();
  }, []);

  // Validate UK postcode format
  const isValidUKPostcode = (postcode) => {
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  };

  const calculateDeliveryCost = async (
    pickupPostcode,
    receiverPostcode,
    weight
  ) => {
    // Clear previous results
    setDeliveryCost(0);
    setDistanceInfo(null);

    if (!pickupPostcode || !receiverPostcode || !weight) {
      return;
    }

    // Validate UK postcodes
    if (!isValidUKPostcode(pickupPostcode)) {
      Alert.alert(
        "Invalid Postcode",
        "Please enter a valid UK pickup postcode (e.g., SW1A 1AA)"
      );
      return;
    }

    if (!isValidUKPostcode(receiverPostcode)) {
      Alert.alert(
        "Invalid Postcode",
        "Please enter a valid UK delivery postcode (e.g., SW1A 1AA)"
      );
      return;
    }

    setIsLoading(true);
    try {
      console.log(
        `Calculating cost from ${pickupPostcode} to ${receiverPostcode} for ${weight}`
      );

      const response = await fetch(`${backendUrl}/api/tookan/delivery-cost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_postcode: pickupPostcode.trim().toUpperCase(),
          delivery_postcode: receiverPostcode.trim().toUpperCase(),
          weight_range: weight,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Delivery cost response:", data);

      setDeliveryCost(data.cost);
      setDistanceInfo({
        distance: data.distance_km,
        duration: data.duration_minutes,
        note: data.note,
      });
    } catch (error) {
      console.error("Failed to calculate delivery cost:", error);
      Alert.alert(
        "Delivery Cost Error",
        "Could not calculate delivery cost. Please check your postcodes and try again."
      );
      setDeliveryCost(0);
      setDistanceInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const calculatedVat = (basePrice + deliveryCost) * VAT_RATE;
    setVatAmount(calculatedVat);
    setTotalPrice(basePrice + deliveryCost + calculatedVat);
  }, [basePrice, deliveryCost]);

  useEffect(() => {
    const selectedPrice = weightOptions.find(
      (opt) => opt.value === selectedWeight
    )?.price;
    setBasePrice(selectedPrice || 0);
  }, [selectedWeight]);

  // Debounced delivery cost calculation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateDeliveryCost(pickupPostcode, receiverPostcode, selectedWeight);
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [pickupPostcode, receiverPostcode, selectedWeight]);

  useEffect(() => {
    const checkApplePay = async () => {
      try {
        // Apple Pay is only available on iOS
        if (Platform.OS === "ios") {
          console.log("[ApplePay] iOS detected, enabling Apple Pay");
          setApplePayAvailable(true);
        } else {
          console.log("[ApplePay] Not on iOS, disabling Apple Pay");
          setApplePayAvailable(false);
        }
      } catch (error) {
        console.log("[ApplePay] Setup error:", error);
        setApplePayAvailable(false);
      }
    };

    checkApplePay();
  }, []);
  useEffect(() => {
    const checkGooglePay = async () => {
      try {
        // Google Pay is only available on Android
        // On iOS, you'd use Apple Pay instead
        if (Platform.OS === "android") {
          console.log("[GooglePay] Android detected, enabling Google Pay");
          setGooglePayAvailable(true);
        } else {
          console.log("[GooglePay] Not on Android, disabling Google Pay");
          setGooglePayAvailable(false);
        }
      } catch (error) {
        console.log("[GooglePay] Setup error:", error);
        setGooglePayAvailable(false);
      }
    };

    checkGooglePay();
  }, []);

  const handleApplePay = async () => {
    // Validation (same as other payment methods)
    const requiredFields = [
      { value: senderName, name: "Sender name" },
      { value: senderPhone, name: "Sender phone" },
      { value: pickupAddress, name: "Pickup address" },
      { value: pickupPostcode, name: "Pickup postcode" },
      { value: date, name: "Date" },
      { value: receiverName, name: "Receiver name" },
      { value: receiverNumber, name: "Receiver phone" },
      { value: receiverAddress, name: "Delivery address" },
      { value: receiverPostcode, name: "Delivery postcode" },
      { value: itemType, name: "Item type" },
    ];

    const missingFields = requiredFields.filter((field) => !field.value.trim());
    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missingFields.map((f) => f.name).join(", ")}`
      );
      return;
    }

    if (
      !isValidUKPostcode(pickupPostcode) ||
      !isValidUKPostcode(receiverPostcode)
    ) {
      Alert.alert("Invalid Postcode", "Please enter valid UK postcodes");
      return;
    }

    if (totalPrice <= 0) {
      Alert.alert(
        "Pricing Error",
        "Please ensure a valid total price is calculated"
      );
      return;
    }

    setIsApplePayProcessing(true);

    try {
      const shipmentDetails = {
        senderName,
        senderPhone,
        pickupAddress,
        pickupPostcode: pickupPostcode.trim().toUpperCase(),
        date,
        receiverName,
        receiverNumber,
        receiverAddress,
        receiverPostcode: receiverPostcode.trim().toUpperCase(),
        itemType,
        isFragile,
        selectedWeight,
        deliveryType,
        basePrice,
        deliveryCost,
        vatAmount,
        totalPrice,
        distanceInfo,
      };

      console.log("[ApplePay] Creating payment intent...");

      // Step 1: Create Payment Intent
      const intentResponse = await fetch(
        `${backendUrl}/api/create-apple-pay-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: totalPrice,
            shipmentDetails,
          }),
        }
      );

      const { clientSecret, paymentIntentId } = await intentResponse.json();

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      console.log("[ApplePay] Initializing payment sheet...");

      // Step 2: Initialize Payment Sheet with Apple Pay
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Rapid Delivery",
        paymentIntentClientSecret: clientSecret,
        applePay: {
          merchantCountryCode: "GB",
          cartItems: [
            {
              label: "Delivery Service",
              amount: totalPrice.toFixed(2),
              paymentType: "Immediate",
            },
          ],
        },
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        console.log("[ApplePay] Init error:", initError);
        Alert.alert("Setup Error", initError.message);
        return;
      }

      console.log("[ApplePay] Presenting payment sheet...");

      // Step 3: Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          Alert.alert("Cancelled", "Payment was cancelled");
        } else {
          Alert.alert("Payment Error", presentError.message);
        }
        return;
      }

      console.log("[ApplePay] Payment successful, confirming...");

      // Step 4: Confirm on backend
      const confirmResponse = await fetch(
        `${backendUrl}/api/confirm-apple-pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId,
            shipmentDetails,
          }),
        }
      );

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        // Store payment data
        const pendingPaymentData = {
          sessionId: confirmData.sessionId,
          deliveryId: confirmData.deliveryId,
          timestamp: Date.now(),
          shiipmentDetails,
          totalAmount: totalPrice,
          paymentMethod: "apple_pay",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          "pendingPayment",
          JSON.stringify(pendingPaymentData)
        );

        await AsyncStorage.setItem(
          `recentDelivery_${confirmData.sessionId}`,
          JSON.stringify({
            ...pendingPaymentData,
            status: "payment_completed",
          })
        );
        ////////////////////
        // Save to Firestore for statistics and history
        try {
          await saveShipmentToFirestore(
            shipmentDetails,
            confirmData.sessionId,
            "apple_pay"
          );

          // Save sender/receiver info for autocomplete (non-blocking)
          saveSenderReceiverInfo("sender", {
            fullName: senderName,
            phone: senderPhone,
            address: pickupAddress,
            postcode: pickupPostcode,
          }).catch((err) => console.log("Sender info save failed:", err));

          saveSenderReceiverInfo("receiver", {
            fullName: receiverName,
            phone: receiverNumber,
            address: receiverAddress,
            postcode: receiverPostcode,
          }).catch((err) => console.log("Receiver info save failed:", err));
        } catch (firestoreError) {
          console.error(
            "Firestore save failed (non-critical):",
            firestoreError
          );
        }

        ////////////////////

        // Navigate to tracking
        navigation.navigate("Location", {
          screen: "LocationScreen",
          params: {
            sessionId: confirmData.sessionId,
            paymentStatus: "completed",
            fromPayment: true,
            shipmentDetails,
            verifiedPayment: {
              paymentStatus: "paid",
              totalAmount: totalPrice,
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          },
        });

        Alert.alert(
          "Payment Successful!",
          "Your delivery has been confirmed.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Payment Failed",
          confirmData.error || "Payment could not be processed"
        );
      }
    } catch (error) {
      console.error("[ApplePay] Error:", error);
      Alert.alert(
        "Transaction Error",
        error.message || "Could not process payment"
      );
    } finally {
      setIsApplePayProcessing(false);
    }
  };

  const handleCreateShipment = async () => {
    // Validation
    const requiredFields = [
      { value: senderName, name: "Sender name" },
      { value: senderPhone, name: "Sender phone" },
      { value: pickupAddress, name: "Pickup address" },
      { value: pickupPostcode, name: "Pickup postcode" },
      { value: date, name: "Date" },
      { value: receiverName, name: "Receiver name" },
      { value: receiverNumber, name: "Receiver phone" },
      { value: receiverAddress, name: "Delivery address" },
      { value: receiverPostcode, name: "Delivery postcode" },
      { value: itemType, name: "Item type" },
    ];

    const missingFields = requiredFields.filter((field) => !field.value.trim());
    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missingFields.map((f) => f.name).join(", ")}`
      );
      return;
    }

    if (
      !isValidUKPostcode(pickupPostcode) ||
      !isValidUKPostcode(receiverPostcode)
    ) {
      Alert.alert("Invalid Postcode", "Please enter valid UK postcodes");
      return;
    }

    if (totalPrice <= 0) {
      Alert.alert(
        "Pricing Error",
        "Please ensure a valid total price is calculated"
      );
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const shipmentDetails = {
        senderName,
        senderPhone,
        pickupAddress,
        pickupPostcode: pickupPostcode.trim().toUpperCase(),
        date,
        receiverName,
        receiverNumber,
        receiverAddress,
        receiverPostcode: receiverPostcode.trim().toUpperCase(),
        itemType,
        isFragile,
        selectedWeight,
        deliveryType,
        basePrice,
        deliveryCost,
        vatAmount,
        totalPrice,
        distanceInfo,
      };

      console.log("Creating checkout session with details:", {
        totalAmount: totalPrice,
        hasShipmentDetails: !!shipmentDetails,
        sessionTimestamp: Date.now(),
      });

      const response = await fetch(
        `${backendUrl}/api/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalAmount: totalPrice,
            shipmentDetails: shipmentDetails,
          }),
        }
      );

      const data = await response.json();
      console.log("Checkout session response:", data);

      //     if (response.ok && data.url) {

      //       // Store session info for when user returns to the app

      //       const pendingPaymentData = {
      //         sessionId: data.sessionId,
      //         timestamp: Date.now(),
      //         shipmentDetails: shipmentDetails,
      //         totalAmount: totalPrice,
      //         createdAt: new Date().toISOString(),
      //       };

      //       await AsyncStorage.setItem(
      //         "pendingPayment",
      //         JSON.stringify(pendingPaymentData)
      //       );

      //       console.log("Stored pending payment with session ID:", data.sessionId);

      //       // Also store with a backup key for redundancy
      //       await AsyncStorage.setItem(
      //         `recentDelivery_${data.sessionId}`,
      //         JSON.stringify({
      //           ...pendingPaymentData,
      //           status: "payment_pending",
      //         })
      //       );
      //       ///////////////////////////////
      //       // Save to Firestore for statistics and history
      //       try {
      //         await saveShipmentToFirestore(
      //           shipmentDetails,
      //           data.sessionId,
      //           "card"
      //         );

      //         // Save sender/receiver info for autocomplete (non-blocking)
      //         saveSenderReceiverInfo("sender", {
      //           fullName: senderName,
      //           phone: senderPhone,
      //           address: pickupAddress,
      //           postcode: pickupPostcode,
      //         }).catch((err) => console.log("Sender info save failed:", err));

      //         saveSenderReceiverInfo("receiver", {
      //           fullName: receiverName,
      //           phone: receiverNumber,
      //           address: receiverAddress,
      //           postcode: receiverPostcode,
      //         }).catch((err) => console.log("Receiver info save failed:", err));
      //       } catch (firestoreError) {
      //         console.error(
      //           "Firestore save failed (non-critical):",
      //           firestoreError
      //         );
      //         // Don't block navigation if Firestore fails
      //       }
      //       //////////////////////////////

      //       // Show user guidance about the payment process
      //       Alert.alert(
      //         "Redirecting to Payment",
      //         "You'll be redirected to complete your payment. After payment, the app will automatically open to show your delivery tracking.",
      //         [
      //           {
      //             text: "Continue",
      //             onPress: () => {
      //               // Open Stripe checkout
      //               console.log("Opening payment URL:", data.url);
      //               Linking.openURL(data.url);
      //             },
      //           },
      //         ]
      //       );
      //     } else {
      //       console.error("Checkout session creation failed:", data);
      //       Alert.alert(
      //         "Payment Error",
      //         data.error || "Could not initiate payment. Please try again."
      //       );
      //     }
      //   } catch (error) {
      //     console.error("Error creating checkout session:", error);
      //     Alert.alert(
      //       "Network Error",
      //       "Could not connect to the payment server. Please check your internet connection and try again."
      //     );
      //   } finally {
      //     setIsPaymentProcessing(false);
      //   }
      // };
      if (response.ok && data.url) {
        // ✅ Save to Firestore IMMEDIATELY with "pending" status
        try {
          await saveShipmentToFirestore(
            shipmentDetails,
            data.sessionId,
            "card"
          );
          console.log("✅ Shipment saved to Firestore with pending status");

          // Save sender/receiver info for autocomplete (non-blocking)
          saveSenderReceiverInfo("sender", {
            fullName: senderName,
            phone: senderPhone,
            address: pickupAddress,
            postcode: pickupPostcode,
          }).catch((err) => console.log("Sender info save failed:", err));

          saveSenderReceiverInfo("receiver", {
            fullName: receiverName,
            phone: receiverNumber,
            address: receiverAddress,
            postcode: receiverPostcode,
          }).catch((err) => console.log("Receiver info save failed:", err));
        } catch (firestoreError) {
          console.error("Firestore save failed:", firestoreError);
          Alert.alert(
            "Warning",
            "Payment will proceed but shipment tracking may be affected."
          );
        }

        // Store session info for when user returns to the app
        const pendingPaymentData = {
          sessionId: data.sessionId,
          timestamp: Date.now(),
          shipmentDetails: shipmentDetails,
          totalAmount: totalPrice,
          createdAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          "pendingPayment",
          JSON.stringify(pendingPaymentData)
        );

        console.log("Stored pending payment with session ID:", data.sessionId);

        // Also store with a backup key for redundancy
        await AsyncStorage.setItem(
          `recentDelivery_${data.sessionId}`,
          JSON.stringify({
            ...pendingPaymentData,
            status: "payment_pending",
          })
        );

        // Show user guidance about the payment process
        Alert.alert(
          "Redirecting to Payment",
          "You'll be redirected to complete your payment. After payment, the app will automatically open to show your delivery tracking.",
          [
            {
              text: "Continue",
              onPress: () => {
                // Open Stripe checkout
                console.log("Opening payment URL:", data.url);
                Linking.openURL(data.url);
              },
            },
          ]
        );
      } else {
        console.error("Checkout session creation failed:", data);
        Alert.alert(
          "Payment Error",
          data.error || "Could not initiate payment. Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      Alert.alert(
        "Network Error",
        "Could not connect to the payment server. Please check your internet connection and try again."
      );
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleGooglePay = async () => {
    // Validation (same as before)
    const requiredFields = [
      { value: senderName, name: "Sender name" },
      { value: senderPhone, name: "Sender phone" },
      { value: pickupAddress, name: "Pickup address" },
      { value: pickupPostcode, name: "Pickup postcode" },
      { value: date, name: "Date" },
      { value: receiverName, name: "Receiver name" },
      { value: receiverNumber, name: "Receiver phone" },
      { value: receiverAddress, name: "Delivery address" },
      { value: receiverPostcode, name: "Delivery postcode" },
      { value: itemType, name: "Item type" },
    ];

    const missingFields = requiredFields.filter((field) => !field.value.trim());
    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missingFields.map((f) => f.name).join(", ")}`
      );
      return;
    }

    if (
      !isValidUKPostcode(pickupPostcode) ||
      !isValidUKPostcode(receiverPostcode)
    ) {
      Alert.alert("Invalid Postcode", "Please enter valid UK postcodes");
      return;
    }

    if (totalPrice <= 0) {
      Alert.alert(
        "Pricing Error",
        "Please ensure a valid total price is calculated"
      );
      return;
    }

    setIsGooglePayProcessing(true);

    try {
      const shipmentDetails = {
        senderName,
        senderPhone,
        pickupAddress,
        pickupPostcode: pickupPostcode.trim().toUpperCase(),
        date,
        receiverName,
        receiverNumber,
        receiverAddress,
        receiverPostcode: receiverPostcode.trim().toUpperCase(),
        itemType,
        isFragile,
        selectedWeight,
        deliveryType,
        basePrice,
        deliveryCost,
        vatAmount,
        totalPrice,
        distanceInfo,
      };

      console.log("[GooglePay] Creating payment intent...");

      // Step 1: Create Payment Intent
      const intentResponse = await fetch(
        `${backendUrl}/api/create-google-pay-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: totalPrice,
            shipmentDetails,
          }),
        }
      );

      const { clientSecret, paymentIntentId } = await intentResponse.json();

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      console.log("[GooglePay] Initializing payment sheet...");

      // Step 2: Initialize Payment Sheet with Google Pay
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Rapid Delivery",
        paymentIntentClientSecret: clientSecret,
        googlePay: {
          merchantCountryCode: "GB",
          testEnv: true, // Set to false in production
          currencyCode: "GBP",
        },
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        console.log("[GooglePay] Init error:", initError);
        Alert.alert("Setup Error", initError.message);
        return;
      }

      console.log("[GooglePay] Presenting payment sheet...");

      // Step 3: Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          Alert.alert("Cancelled", "Payment was cancelled");
        } else {
          Alert.alert("Payment Error", presentError.message);
        }
        return;
      }

      console.log("[GooglePay] Payment successful, confirming...");

      // Step 4: Confirm on backend
      const confirmResponse = await fetch(
        `${backendUrl}/api/confirm-google-pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId,
            shipmentDetails,
          }),
        }
      );

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        const pendingPaymentData = {
          sessionId: confirmData.sessionId,
          deliveryId: confirmData.deliveryId,
          timestamp: Date.now(),
          shipmentDetails,
          totalAmount: totalPrice,
          paymentMethod: "google_pay",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          "pendingPayment",
          JSON.stringify(pendingPaymentData)
        );

        await AsyncStorage.setItem(
          `recentDelivery_${confirmData.sessionId}`,
          JSON.stringify({
            ...pendingPaymentData,
            status: "payment_completed",
          })
        );

        // Navigate to tracking
        navigation.navigate("Location", {
          screen: "LocationScreen",
          params: {
            sessionId: confirmData.sessionId,
            paymentStatus: "completed",
            fromPayment: true,
            shipmentDetails,
            verifiedPayment: {
              paymentStatus: "paid",
              totalAmount: totalPrice,
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          },
        });

        Alert.alert(
          "Payment Successful!",
          "Your delivery has been confirmed.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Payment Failed",
          confirmData.error || "Payment could not be processed"
        );
      }
    } catch (error) {
      console.error("[GooglePay] Error:", error);
      Alert.alert(
        "Transaction Error",
        error.message || "Could not process payment"
      );
    } finally {
      setIsGooglePayProcessing(false);
    }
  };

  // Adding klarna
  const handleKlarna = async () => {
    const requiredFields = [
      { value: senderName, name: "Sender name" },
      { value: senderPhone, name: "Sender phone" },
      { value: pickupAddress, name: "Pickup address" },
      { value: pickupPostcode, name: "Pickup postcode" },
      { value: date, name: "Date" },
      { value: receiverName, name: "Receiver name" },
      { value: receiverNumber, name: "Receiver phone" },
      { value: receiverAddress, name: "Delivery address" },
      { value: receiverPostcode, name: "Delivery postcode" },
      { value: itemType, name: "Item type" },
    ];

    const missingFields = requiredFields.filter((field) => !field.value.trim());
    if (missingFields.length > 0) {
      Alert.alert(
        "Missing Information",
        `Please fill in: ${missingFields.map((f) => f.name).join(", ")}`
      );
      return;
    }

    if (
      !isValidUKPostcode(pickupPostcode) ||
      !isValidUKPostcode(receiverPostcode)
    ) {
      Alert.alert("Invalid Postcode", "Please enter valid UK postcodes");
      return;
    }

    if (totalPrice <= 0) {
      Alert.alert(
        "Pricing Error",
        "Please ensure a valid total price is calculated"
      );
      return;
    }

    setIsKlarnaProcessing(true);

    try {
      const shipmentDetails = {
        senderName,
        senderPhone,
        pickupAddress,
        pickupPostcode: pickupPostcode.trim().toUpperCase(),
        date,
        receiverName,
        receiverNumber,
        receiverAddress,
        receiverPostcode: receiverPostcode.trim().toUpperCase(),
        itemType,
        isFragile,
        selectedWeight,
        deliveryType,
        basePrice,
        deliveryCost,
        vatAmount,
        totalPrice,
        distanceInfo,
      };

      console.log("[Klarna] Creating payment intent...");

      // Step 1: Create Payment Intent
      const intentResponse = await fetch(
        `${backendUrl}/api/create-klarna-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalAmount: totalPrice,
            shipmentDetails,
          }),
        }
      );

      const { clientSecret, paymentIntentId } = await intentResponse.json();

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      console.log("[Klarna] Initializing payment sheet...");

      // Step 2: Initialize Payment Sheet with Klarna
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Rapid Delivery",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true, // Required for Klarna
        //returnURL: "rapiddelivery://payment-return", // Deep link for your app
      });

      if (initError) {
        console.log("[Klarna] Init error:", initError);
        Alert.alert("Setup Error", initError.message);
        return;
      }

      console.log("[Klarna] Presenting payment sheet...");

      // Step 3: Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === "Canceled") {
          Alert.alert("Cancelled", "Payment was cancelled");
        } else {
          Alert.alert("Payment Error", presentError.message);
        }
        return;
      }

      console.log("[Klarna] Payment successful, confirming...");

      // Step 4: Confirm on backend
      const confirmResponse = await fetch(`${backendUrl}/api/confirm-klarna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          shipmentDetails,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        // Store payment data
        const pendingPaymentData = {
          sessionId: confirmData.sessionId,
          deliveryId: confirmData.deliveryId,
          timestamp: Date.now(),
          shipmentDetails,
          totalAmount: totalPrice,
          paymentMethod: "klarna",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(
          "pendingPayment",
          JSON.stringify(pendingPaymentData)
        );

        await AsyncStorage.setItem(
          `recentDelivery_${confirmData.sessionId}`,
          JSON.stringify({
            ...pendingPaymentData,
            status: "payment_completed",
          })
        );

        // Navigate to tracking
        navigation.navigate("Location", {
          screen: "LocationScreen",
          params: {
            sessionId: confirmData.sessionId,
            paymentStatus: "completed",
            fromPayment: true,
            shipmentDetails,
            verifiedPayment: {
              paymentStatus: "paid",
              totalAmount: totalPrice,
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            },
          },
        });

        Alert.alert(
          "Payment Successful!",
          "Your delivery has been confirmed.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Payment Failed",
          confirmData.error || "Payment could not be processed"
        );
      }
    } catch (error) {
      console.error("[Klarna] Error:", error);
      Alert.alert(
        "Transaction Error",
        error.message || "Could not process payment"
      );
    } finally {
      setIsKlarnaProcessing(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Package details</Text>
        </View>

        <View style={styles.formContent}>
          <Text style={styles.title}>
            Fill in the details to create your shipment
          </Text>

          <Text style={styles.sectionTitle}>Sender Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter Your Full Name"
                placeholderTextColor="#9CA3AF"
                value={senderName}
                onChangeText={setSenderName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter Your Phone Number"
                placeholderTextColor="#9CA3AF"
                value={senderPhone}
                onChangeText={setSenderPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Address</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter Your Pickup Address"
                placeholderTextColor="#9CA3AF"
                value={pickupAddress}
                onChangeText={setPickupAddress}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Postcode</Text>
            <View style={styles.inputContainer}>
              <Map size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="e.g., SW1A 1AA"
                placeholderTextColor="#9CA3AF"
                value={pickupPostcode}
                onChangeText={setPickupPostcode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#9CA3AF"
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Receiver Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter Receiver Full Name"
                placeholderTextColor="#9CA3AF"
                value={receiverName}
                onChangeText={setReceiverName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Phone size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter Receiver Phone Number"
                placeholderTextColor="#9CA3AF"
                value={receiverNumber}
                onChangeText={setReceiverNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Address</Text>
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter Delivery Address"
                placeholderTextColor="#9CA3AF"
                value={receiverAddress}
                onChangeText={setReceiverAddress}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Postcode</Text>
            <View style={styles.inputContainer}>
              <Map size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="e.g., SW1A 1AA"
                placeholderTextColor="#9CA3AF"
                value={receiverPostcode}
                onChangeText={setReceiverPostcode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Package Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Type</Text>
            <View style={styles.inputContainer}>
              <Package size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="(e.g. Document, Electronics, Clothing, Food)"
                placeholderTextColor="#9CA3AF"
                value={itemType}
                onChangeText={setItemType}
              />
            </View>
          </View>

          <View style={styles.dropdownGroup}>
            <Text style={styles.weightNotice}>
              *Delivery cost calculated based on distance between UK postcodes
              using Mapbox routing
            </Text>
            <Text style={styles.label}>Weight Range</Text>
            <DropDownPicker
              open={weightOpen}
              value={selectedWeight}
              items={weightOptions}
              setOpen={setWeightOpen}
              setValue={setSelectedWeight}
              setItems={() => {}}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              placeholder="Select Weight Range"
              listMode={Platform.OS === "android" ? "SCROLLVIEW" : "MODAL"}
              zIndex={4000}
              onOpen={() => {
                setDeliveryOpen(false);
              }}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Is it Fragile?</Text>
            <View style={styles.checkboxContainer}>
              <CheckBox
                title="Yes"
                checked={isFragile === true}
                onPress={() => setIsFragile(true)}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor="#8328FA"
              />
              <CheckBox
                title="No"
                checked={isFragile === false}
                onPress={() => setIsFragile(false)}
                containerStyle={styles.checkbox}
                textStyle={styles.checkboxText}
                checkedColor="#8328FA"
              />
            </View>
          </View>

          <View style={styles.dropdownGroup}>
            <Text style={styles.label}>Delivery Type</Text>
            <DropDownPicker
              open={deliveryOpen}
              value={deliveryType}
              items={deliveryOptions}
              setOpen={setDeliveryOpen}
              setValue={setDeliveryType}
              setItems={() => {}}
              style={styles.dropdown}
              textStyle={styles.dropdownText}
              placeholder="Select Delivery Type"
              listMode={Platform.OS === "android" ? "SCROLLVIEW" : "MODAL"}
              zIndex={3000}
              onOpen={() => {
                setWeightOpen(false);
              }}
            />
          </View>

          {distanceInfo && (
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceTitle}>Route Information</Text>
              <Text style={styles.distanceText}>
                Distance: {distanceInfo.distance} km
              </Text>
              <Text style={styles.distanceText}>
                Estimated time: {distanceInfo.duration} minutes
              </Text>
              {distanceInfo.note && (
                <Text style={styles.distanceNote}>
                  Note: {distanceInfo.note}
                </Text>
              )}
            </View>
          )}

          <View style={styles.priceSummary}>
            <Text style={styles.priceSummaryTitle}>Price Breakdown</Text>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>
                Base Price ({selectedWeight})
              </Text>
              <Text style={styles.priceValue}>{formatCurrency(basePrice)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>
                Distance-based Delivery Cost
              </Text>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8328FA" />
                  <Text style={styles.loadingText}>Calculating...</Text>
                </View>
              ) : (
                <Text style={styles.priceValue}>
                  {formatCurrency(deliveryCost)}
                </Text>
              )}
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>VAT ({VAT_RATE * 100}%)</Text>
              <Text style={styles.priceValue}>{formatCurrency(vatAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalPriceItem}>
              <Text style={styles.totalPriceLabel}>Total Price</Text>
              <Text style={styles.totalPriceValue}>
                {formatCurrency(totalPrice)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              (isPaymentProcessing || isLoading || totalPrice <= 0) &&
                styles.checkoutButtonDisabled,
            ]}
            onPress={handleCreateShipment}
            disabled={isPaymentProcessing || isLoading || totalPrice <= 0}
          >
            {isPaymentProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkoutButtonText}>Pay with Card</Text>
            )}
          </TouchableOpacity>

          {/* Google Pay Button - ADD THIS */}
          {Platform.OS === "android" && (
            <TouchableOpacity
              style={[
                styles.googlePayButton,
                (isGooglePayProcessing || isLoading || totalPrice <= 0) &&
                  styles.googlePayButtonDisabled,
              ]}
              onPress={handleGooglePay}
              disabled={isGooglePayProcessing || isLoading || totalPrice <= 0}
            >
              <View style={styles.googlePayButtonContent}>
                {isGooglePayProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.googlePayButtonText}>G</Text>
                    <Text style={styles.googlePayButtonLabel}>Pay</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.klarnaButton,
              (isKlarnaProcessing || isLoading || totalPrice <= 0) &&
                styles.klarnaButtonDisabled,
            ]}
            onPress={handleKlarna}
            disabled={isKlarnaProcessing || isLoading || totalPrice <= 0}
          >
            <View style={styles.klarnaButtonContent}>
              {isKlarnaProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.klarnaButtonText}>Pay with </Text>
                  <Text style={styles.klarnaButtonBrand}>Klarna</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[
                styles.applePayButton,
                (isApplePayProcessing || isLoading || totalPrice <= 0) &&
                  styles.applePayButtonDisabled,
              ]}
              onPress={handleApplePay}
              disabled={isApplePayProcessing || isLoading || totalPrice <= 0}
            >
              <View style={styles.applePayButtonContent}>
                {isApplePayProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.applePayIcon}></Text>
                    <Text style={styles.applePayButtonText}>Pay</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

// Add the styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 16,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 32,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },
  dropdownGroup: {
    marginBottom: 20,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: "#111827",
  },
  checkboxContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  checkbox: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#374151",
  },
  weightNotice: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    fontStyle: "italic",
  },
  distanceInfo: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  distanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0369A1",
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    color: "#0369A1",
    marginBottom: 4,
  },
  distanceNote: {
    fontSize: 12,
    color: "#0369A1",
    fontStyle: "italic",
    marginTop: 4,
  },
  priceSummary: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  priceSummaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  priceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    color: "#8328FA",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  totalPriceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  totalPriceLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  totalPriceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8328FA",
  },
  checkoutButton: {
    backgroundColor: "#8328FA",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  googlePayButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  googlePayButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  googlePayButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googlePayButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Arial",
  },
  googlePayButtonLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  klarnaButton: {
    backgroundColor: "#FFB3C7", // Klarna's pink brand color
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  klarnaButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  klarnaButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  klarnaButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  klarnaButtonBrand: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Helvetica Neue" : "sans-serif-medium",
  },
  applePayButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  applePayButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  applePayButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  applePayIcon: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 8,
  },
  applePayButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});

// //---------------------------------------firestore addition-------------------------------------------//
// import React, { useState, useEffect } from "react";
// import {
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Platform,
//   ActivityIndicator,
//   Linking,
//   Alert,
// } from "react-native";

// import {
//   ChevronLeft,
//   User,
//   Phone,
//   MapPin,
//   Calendar,
//   Package,
//   Map,
// } from "lucide-react-native";
// import { CheckBox } from "react-native-elements";
// import DropDownPicker from "react-native-dropdown-picker";
// import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
// import { useRouter, useLocalSearchParams } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // Firebase imports
// import { firestore } from "../path/to/your/firebase/config"; // Update this path to your firebase config file
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// export default function PackageDetailsScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();

//   const weightOptions = [
//     { label: "1-5kg", value: "1-5kg", price: 25.0 },
//     { label: "5-10kg", value: "5-10kg", price: 40.0 },
//     { label: "10-20kg", value: "10-20kg", price: 60.0 },
//     { label: "20-30kg", value: "20-30kg", price: 80.0 },
//   ];

//   const VAT_RATE = 0.2;

//   const [senderName, setSenderName] = useState("");
//   const [senderPhone, setSenderPhone] = useState("");
//   const [pickupAddress, setPickupAddress] = useState("");
//   const [pickupPostcode, setPickupPostcode] = useState("");
//   const [date, setDate] = useState("");
//   const [receiverName, setReceiverName] = useState("");
//   const [receiverNumber, setReceiverNumber] = useState("");
//   const [receiverAddress, setReceiverAddress] = useState("");
//   const [receiverPostcode, setReceiverPostcode] = useState("");
//   const [itemType, setItemType] = useState("");
//   const [isFragile, setIsFragile] = useState(false);

//   const [weightOpen, setWeightOpen] = useState(false);
//   const [selectedWeight, setSelectedWeight] = useState(weightOptions[0].value);

//   const [basePrice, setBasePrice] = useState(weightOptions[0].price);
//   const [deliveryCost, setDeliveryCost] = useState(0);
//   const [distanceInfo, setDistanceInfo] = useState(null);
//   const [vatAmount, setVatAmount] = useState(0);
//   const [totalPrice, setTotalPrice] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

//   const [deliveryOpen, setDeliveryOpen] = useState(false);
//   const [deliveryType, setDeliveryType] = useState("Standard (2–3 days)");
//   const [deliveryOptions] = useState([
//     { label: "Standard (2–3 days)", value: "Standard (2–3 days)" },
//     { label: "Express (1 day)", value: "Express (1 day)" },
//     { label: "Same Day", value: "Same Day" },
//   ]);

//   const backendUrl = "http://192.168.43.176:3000";

//   // Check for returning from payment
//   useEffect(() => {
//     const checkReturnFromPayment = async () => {
//       try {
//         const returnedFromPayment = await AsyncStorage.getItem(
//           "returnedFromPayment"
//         );
//         if (returnedFromPayment) {
//           await AsyncStorage.removeItem("returnedFromPayment");
//           Alert.alert(
//             "Payment Status",
//             "Please check your payment status or try again if needed."
//           );
//         }
//       } catch (error) {
//         console.log("Error checking return from payment:", error);
//       }
//     };

//     checkReturnFromPayment();
//   }, []);

//   // Function to save package details to Firestore
//   const savePackageToFirestore = async (packageData, status = "created") => {
//     try {
//       const packageRef = collection(firestore, "packages");
//       const docData = {
//         ...packageData,
//         status,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       };

//       const docRef = await addDoc(packageRef, docData);
//       console.log("Package saved to Firestore with ID: ", docRef.id);

//       return {
//         success: true,
//         firestoreId: docRef.id,
//       };
//     } catch (error) {
//       console.error("Error saving package to Firestore: ", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   };

//   // Validate UK postcode format
//   const isValidUKPostcode = (postcode) => {
//     const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
//     return ukPostcodeRegex.test(postcode.trim());
//   };

//   const calculateDeliveryCost = async (
//     pickupPostcode,
//     receiverPostcode,
//     weight
//   ) => {
//     // Clear previous results
//     setDeliveryCost(0);
//     setDistanceInfo(null);

//     if (!pickupPostcode || !receiverPostcode || !weight) {
//       return;
//     }

//     // Validate UK postcodes
//     if (!isValidUKPostcode(pickupPostcode)) {
//       Alert.alert(
//         "Invalid Postcode",
//         "Please enter a valid UK pickup postcode (e.g., SW1A 1AA)"
//       );
//       return;
//     }

//     if (!isValidUKPostcode(receiverPostcode)) {
//       Alert.alert(
//         "Invalid Postcode",
//         "Please enter a valid UK delivery postcode (e.g., SW1A 1AA)"
//       );
//       return;
//     }

//     setIsLoading(true);
//     try {
//       console.log(
//         `Calculating cost from ${pickupPostcode} to ${receiverPostcode} for ${weight}`
//       );

//       const response = await fetch(`${backendUrl}/api/tookan/delivery-cost`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           pickup_postcode: pickupPostcode.trim().toUpperCase(),
//           delivery_postcode: receiverPostcode.trim().toUpperCase(),
//           weight_range: weight,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("Delivery cost response:", data);

//       setDeliveryCost(data.cost);
//       setDistanceInfo({
//         distance: data.distance_km,
//         duration: data.duration_minutes,
//         note: data.note,
//       });
//     } catch (error) {
//       console.error("Failed to calculate delivery cost:", error);
//       Alert.alert(
//         "Delivery Cost Error",
//         "Could not calculate delivery cost. Please check your postcodes and try again."
//       );
//       setDeliveryCost(0);
//       setDistanceInfo(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const calculatedVat = (basePrice + deliveryCost) * VAT_RATE;
//     setVatAmount(calculatedVat);
//     setTotalPrice(basePrice + deliveryCost + calculatedVat);
//   }, [basePrice, deliveryCost]);

//   useEffect(() => {
//     const selectedPrice = weightOptions.find(
//       (opt) => opt.value === selectedWeight
//     )?.price;
//     setBasePrice(selectedPrice || 0);
//   }, [selectedWeight]);

//   // Debounced delivery cost calculation
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       calculateDeliveryCost(pickupPostcode, receiverPostcode, selectedWeight);
//     }, 1000); // Wait 1 second after user stops typing

//     return () => clearTimeout(timeoutId);
//   }, [pickupPostcode, receiverPostcode, selectedWeight]);

//   const handleCreateShipment = async () => {
//     // Validation
//     const requiredFields = [
//       { value: senderName, name: "Sender name" },
//       { value: senderPhone, name: "Sender phone" },
//       { value: pickupAddress, name: "Pickup address" },
//       { value: pickupPostcode, name: "Pickup postcode" },
//       { value: date, name: "Date" },
//       { value: receiverName, name: "Receiver name" },
//       { value: receiverNumber, name: "Receiver phone" },
//       { value: receiverAddress, name: "Delivery address" },
//       { value: receiverPostcode, name: "Delivery postcode" },
//       { value: itemType, name: "Item type" },
//     ];

//     const missingFields = requiredFields.filter((field) => !field.value.trim());
//     if (missingFields.length > 0) {
//       Alert.alert(
//         "Missing Information",
//         `Please fill in: ${missingFields.map((f) => f.name).join(", ")}`
//       );
//       return;
//     }

//     if (
//       !isValidUKPostcode(pickupPostcode) ||
//       !isValidUKPostcode(receiverPostcode)
//     ) {
//       Alert.alert("Invalid Postcode", "Please enter valid UK postcodes");
//       return;
//     }

//     if (totalPrice <= 0) {
//       Alert.alert(
//         "Pricing Error",
//         "Please ensure a valid total price is calculated"
//       );
//       return;
//     }

//     setIsPaymentProcessing(true);
//     try {
//       const shipmentDetails = {
//         senderName,
//         senderPhone,
//         pickupAddress,
//         pickupPostcode: pickupPostcode.trim().toUpperCase(),
//         date,
//         receiverName,
//         receiverNumber,
//         receiverAddress,
//         receiverPostcode: receiverPostcode.trim().toUpperCase(),
//         itemType,
//         isFragile,
//         selectedWeight,
//         deliveryType,
//         basePrice,
//         deliveryCost,
//         vatAmount,
//         totalPrice,
//         distanceInfo,
//       };

//       // Save package details to Firestore first
//       console.log("Saving package to Firestore...");
//       const firestoreResult = await savePackageToFirestore(
//         shipmentDetails,
//         "payment_pending"
//       );

//       if (!firestoreResult.success) {
//         Alert.alert(
//           "Database Error",
//           "Could not save package information. Please try again."
//         );
//         setIsPaymentProcessing(false);
//         return;
//       }

//       // Add Firestore ID to shipment details
//       shipmentDetails.firestoreId = firestoreResult.firestoreId;

//       console.log("Creating checkout session with details:", {
//         totalAmount: totalPrice,
//         hasShipmentDetails: !!shipmentDetails,
//         firestoreId: firestoreResult.firestoreId,
//         sessionTimestamp: Date.now(),
//       });

//       const response = await fetch(
//         `${backendUrl}/api/create-checkout-session`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             totalAmount: totalPrice,
//             shipmentDetails: shipmentDetails,
//           }),
//         }
//       );

//       const data = await response.json();
//       console.log("Checkout session response:", data);

//       if (response.ok && data.url) {
//         // Store session info for when user returns to the app
//         const pendingPaymentData = {
//           sessionId: data.sessionId,
//           timestamp: Date.now(),
//           shipmentDetails: shipmentDetails,
//           totalAmount: totalPrice,
//           firestoreId: firestoreResult.firestoreId,
//           createdAt: new Date().toISOString(),
//         };

//         await AsyncStorage.setItem(
//           "pendingPayment",
//           JSON.stringify(pendingPaymentData)
//         );

//         console.log("Stored pending payment with session ID:", data.sessionId);
//         console.log("Package saved to Firestore with ID:", firestoreResult.firestoreId);

//         // Also store with a backup key for redundancy
//         await AsyncStorage.setItem(
//           `recentDelivery_${data.sessionId}`,
//           JSON.stringify({
//             ...pendingPaymentData,
//             status: "payment_pending",
//           })
//         );

//         // Show user guidance about the payment process
//         Alert.alert(
//           "Package Saved & Redirecting to Payment",
//           "Your package details have been saved. You'll now be redirected to complete your payment. After payment, the app will automatically open to show your delivery tracking.",
//           [
//             {
//               text: "Continue",
//               onPress: () => {
//                 // Open Stripe checkout
//                 console.log("Opening payment URL:", data.url);
//                 Linking.openURL(data.url);
//               },
//             },
//           ]
//         );
//       } else {
//         console.error("Checkout session creation failed:", data);
//         Alert.alert(
//           "Payment Error",
//           data.error || "Could not initiate payment. Please try again."
//         );
//       }
//     } catch (error) {
//       console.error("Error creating checkout session:", error);
//       Alert.alert(
//         "Network Error",
//         "Could not connect to the payment server. Please check your internet connection and try again."
//       );
//     } finally {
//       setIsPaymentProcessing(false);
//     }
//   };

//   const handleGoBack = () => {
//     router.back();
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("en-GB", {
//       style: "currency",
//       currency: "GBP",
//     }).format(amount);
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <KeyboardAwareScrollView
//         style={styles.container}
//         contentContainerStyle={styles.contentContainer}
//         enableOnAndroid={true}
//         extraScrollHeight={100}
//       >
//         <View style={styles.header}>
//           <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
//             <ChevronLeft size={24} color="#000" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Package details</Text>
//         </View>

//         <View style={styles.formContent}>
//           <Text style={styles.title}>
//             Fill in the details to create your shipment
//           </Text>

//           <Text style={styles.sectionTitle}>Sender Information</Text>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Full Name</Text>
//             <View style={styles.inputContainer}>
//               <User size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter Your Full Name"
//                 placeholderTextColor="#9CA3AF"
//                 value={senderName}
//                 onChangeText={setSenderName}
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Phone Number</Text>
//             <View style={styles.inputContainer}>
//               <Phone size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter Your Phone Number"
//                 placeholderTextColor="#9CA3AF"
//                 value={senderPhone}
//                 onChangeText={setSenderPhone}
//                 keyboardType="phone-pad"
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Pickup Address</Text>
//             <View style={styles.inputContainer}>
//               <MapPin size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter Your Pickup Address"
//                 placeholderTextColor="#9CA3AF"
//                 value={pickupAddress}
//                 onChangeText={setPickupAddress}
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Pickup Postcode</Text>
//             <View style={styles.inputContainer}>
//               <Map size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., SW1A 1AA"
//                 placeholderTextColor="#9CA3AF"
//                 value={pickupPostcode}
//                 onChangeText={setPickupPostcode}
//                 autoCapitalize="characters"
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Date</Text>
//             <View style={styles.inputContainer}>
//               <Calendar size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="DD/MM/YYYY"
//                 placeholderTextColor="#9CA3AF"
//                 value={date}
//                 onChangeText={setDate}
//               />
//             </View>
//           </View>

//           <Text style={styles.sectionTitle}>Receiver Information</Text>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Full Name</Text>
//             <View style={styles.inputContainer}>
//               <User size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter Receiver Full Name"
//                 placeholderTextColor="#9CA3AF"
//                 value={receiverName}
//                 onChangeText={setReceiverName}
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Phone Number</Text>
//             <View style={styles.inputContainer}>
//               <Phone size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter Receiver Phone Number"
//                 placeholderTextColor="#9CA3AF"
//                 value={receiverNumber}
//                 onChangeText={setReceiverNumber}
//                 keyboardType="phone-pad"
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Delivery Address</Text>
//             <View style={styles.inputContainer}>
//               <MapPin size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="Enter Delivery Address"
//                 placeholderTextColor="#9CA3AF"
//                 value={receiverAddress}
//                 onChangeText={setReceiverAddress}
//               />
//             </View>
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Delivery Postcode</Text>
//             <View style={styles.inputContainer}>
//               <Map size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="e.g., SW1A 1AA"
//                 placeholderTextColor="#9CA3AF"
//                 value={receiverPostcode}
//                 onChangeText={setReceiverPostcode}
//                 autoCapitalize="characters"
//               />
//             </View>
//           </View>

//           <Text style={styles.sectionTitle}>Package Details</Text>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Item Type</Text>
//             <View style={styles.inputContainer}>
//               <Package size={20} color="#9CA3AF" />
//               <TextInput
//                 style={styles.input}
//                 placeholder="(e.g. Document, Electronics, Clothing, Food)"
//                 placeholderTextColor="#9CA3AF"
//                 value={itemType}
//                 onChangeText={setItemType}
//               />
//             </View>
//           </View>

//           <View style={styles.dropdownGroup}>
//             <Text style={styles.weightNotice}>
//               *Delivery cost calculated based on distance between UK postcodes
//               using Mapbox routing
//             </Text>
//             <Text style={styles.label}>Weight Range</Text>
//             <DropDownPicker
//               open={weightOpen}
//               value={selectedWeight}
//               items={weightOptions}
//               setOpen={setWeightOpen}
//               setValue={setSelectedWeight}
//               setItems={() => {}}
//               style={styles.dropdown}
//               textStyle={styles.dropdownText}
//               placeholder="Select Weight Range"
//               listMode={Platform.OS === "android" ? "SCROLLVIEW" : "MODAL"}
//               zIndex={4000}
//               onOpen={() => {
//                 setDeliveryOpen(false);
//               }}
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Is it Fragile?</Text>
//             <View style={styles.checkboxContainer}>
//               <CheckBox
//                 title="Yes"
//                 checked={isFragile === true}
//                 onPress={() => setIsFragile(true)}
//                 containerStyle={styles.checkbox}
//                 textStyle={styles.checkboxText}
//                 checkedColor="#8328FA"
//               />
//               <CheckBox
//                 title="No"
//                 checked={isFragile === false}
//                 onPress={() => setIsFragile(false)}
//                 containerStyle={styles.checkbox}
//                 textStyle={styles.checkboxText}
//                 checkedColor="#8328FA"
//               />
//             </View>
//           </View>

//           <View style={styles.dropdownGroup}>
//             <Text style={styles.label}>Delivery Type</Text>
//             <DropDownPicker
//               open={deliveryOpen}
//               value={deliveryType}
//               items={deliveryOptions}
//               setOpen={setDeliveryOpen}
//               setValue={setDeliveryType}
//               setItems={() => {}}
//               style={styles.dropdown}
//               textStyle={styles.dropdownText}
//               placeholder="Select Delivery Type"
//               listMode={Platform.OS === "android" ? "SCROLLVIEW" : "MODAL"}
//               zIndex={3000}
//               onOpen={() => {
//                 setWeightOpen(false);
//               }}
//             />
//           </View>

//           {distanceInfo && (
//             <View style={styles.distanceInfo}>
//               <Text style={styles.distanceTitle}>Route Information</Text>
//               <Text style={styles.distanceText}>
//                 Distance: {distanceInfo.distance} km
//               </Text>
//               <Text style={styles.distanceText}>
//                 Estimated time: {distanceInfo.duration} minutes
//               </Text>
//               {distanceInfo.note && (
//                 <Text style={styles.distanceNote}>
//                   Note: {distanceInfo.note}
//                 </Text>
//               )}
//             </View>
//           )}

//           <View style={styles.priceSummary}>
//             <Text style={styles.priceSummaryTitle}>Price Breakdown</Text>
//             <View style={styles.priceItem}>
//               <Text style={styles.priceLabel}>
//                 Base Price ({selectedWeight})
//               </Text>
//               <Text style={styles.priceValue}>{formatCurrency(basePrice)}</Text>
//             </View>
//             <View style={styles.priceItem}>
//               <Text style={styles.priceLabel}>
//                 Distance-based Delivery Cost
//               </Text>
//               {isLoading ? (
//                 <View style={styles.loadingContainer}>
//                   <ActivityIndicator size="small" color="#8328FA" />
//                   <Text style={styles.loadingText}>Calculating...</Text>
//                 </View>
//               ) : (
//                 <Text style={styles.priceValue}>
//                   {formatCurrency(deliveryCost)}
//                 </Text>
//               )}
//             </View>
//             <View style={styles.priceItem}>
//               <Text style={styles.priceLabel}>VAT ({VAT_RATE * 100}%)</Text>
//               <Text style={styles.priceValue}>{formatCurrency(vatAmount)}</Text>
//             </View>
//             <View style={styles.divider} />
//             <View style={styles.totalPriceItem}>
//               <Text style={styles.totalPriceLabel}>Total Price</Text>
//               <Text style={styles.totalPriceValue}>
//                 {formatCurrency(totalPrice)}
//               </Text>
//             </View>
//           </View>

//           <TouchableOpacity
//             style={[
//               styles.checkoutButton,
//               (isPaymentProcessing || isLoading || totalPrice <= 0) &&
//                 styles.checkoutButtonDisabled,
//             ]}
//             onPress={handleCreateShipment}
//             disabled={isPaymentProcessing || isLoading || totalPrice <= 0}
//           >
//             {isPaymentProcessing ? (
//               <ActivityIndicator color="#FFFFFF" />
//             ) : (
//               <Text style={styles.checkoutButtonText}>Pay with Card</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </KeyboardAwareScrollView>
//     </SafeAreaView>
//   );
// }

// // Add the styles
// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//   },
//   contentContainer: {
//     paddingBottom: 100,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     backgroundColor: "#FFFFFF",
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#111827",
//     marginLeft: 16,
//   },
//   formContent: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 32,
//     textAlign: "center",
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#111827",
//     marginBottom: 16,
//     marginTop: 24,
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//     marginBottom: 8,
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F9FAFB",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   input: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 16,
//     color: "#111827",
//   },
//   dropdownGroup: {
//     marginBottom: 20,
//     zIndex: 1000,
//   },
//   dropdown: {
//     backgroundColor: "#F9FAFB",
//     borderColor: "#E5E7EB",
//     borderRadius: 12,
//   },
//   dropdownText: {
//     fontSize: 16,
//     color: "#111827",
//   },
//   checkboxContainer: {
//     flexDirection: "row",
//     justifyContent: "space-around",
//   },
//   checkbox: {
//     backgroundColor: "transparent",
//     borderWidth: 0,
//     paddingHorizontal: 0,
//   },
//   checkboxText: {
//     fontSize: 16,
//     fontWeight: "normal",
//     color: "#374151",
//   },
//   weightNotice: {
//     fontSize: 12,
//     color: "#6B7280",
//     marginBottom: 8,
//     fontStyle: "italic",
//   },
//   distanceInfo: {
//     backgroundColor: "#F0F9FF",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "#BAE6FD",
//   },
//   distanceTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#0369A1",
//     marginBottom: 8,
//   },
//   distanceText: {
//     fontSize: 14,
//     color: "#0369A1",
//     marginBottom: 4,
//   },
//   distanceNote: {
//     fontSize: 12,
//     color: "#0369A1",
//     fontStyle: "italic",
//     marginTop: 4,
//   },
//   priceSummary: {
//     backgroundColor: "#F9FAFB",
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   priceSummaryTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#111827",
//     marginBottom: 16,
//   },
//   priceItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   priceLabel: {
//     fontSize: 14,
//     color: "#6B7280",
//     flex: 1,
//   },
//   priceValue: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#111827",
//   },
//   loadingContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   loadingText: {
//     fontSize: 12,
//     color: "#8328FA",
//     marginLeft: 8,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: "#E5E7EB",
//     marginVertical: 12,
//   },
//   totalPriceItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingTop: 8,
//   },
//   totalPriceLabel: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#111827",
//   },
//   totalPriceValue: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#8328FA",
//   },
//   checkoutButton: {
//     backgroundColor: "#8328FA",
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 24,
//   },
//   checkoutButtonDisabled: {
//     backgroundColor: "#9CA3AF",
//     opacity: 0.6,
//   },
//   checkoutButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#FFFFFF",
//   },
// });
