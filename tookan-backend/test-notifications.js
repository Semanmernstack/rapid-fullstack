// test-notifications.js
// Run this script to test your notifications
import axios from "axios";

const BASE_URL = "https://rapid-fullstack.vercel.app";

// Test configuration
const TEST_USER_ID = "wNJOV7nmOyPdC91cPZs1dM7kHA12"; // Replace with actual Firebase user ID
const TEST_TOKEN = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"; // Replace with actual token from app

async function testRegisterToken() {
  console.log("\n📝 Testing token registration...");
  try {
    const response = await axios.post(`${BASE_URL}/api/register-token`, {
      userId: TEST_USER_ID,
      expoPushToken: TEST_TOKEN,
      platform: "ios",
    });
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testShipmentUpdate() {
  console.log("\n📦 Testing shipment update notification...");
  try {
    const response = await axios.post(`${BASE_URL}/api/shipment-update`, {
      userId: TEST_USER_ID,
      userName: "John Doe",
      itemName: "Electronics",
      quantity: 2,
      shipmentId: "SHIP-12345",
    });
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testDeliveryStatus() {
  console.log("\n🚚 Testing delivery status notification...");
  try {
    const response = await axios.post(`${BASE_URL}/api/delivery-status`, {
      userId: TEST_USER_ID,
      status: "in_transit",
      trackingNumber: "TRK123456789",
      estimatedTime: "2:00 PM",
      location: "Lagos, Nigeria",
    });
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testDriverAssigned() {
  console.log("\n🚗 Testing driver assignment notification...");
  try {
    const response = await axios.post(`${BASE_URL}/api/driver-assigned`, {
      userId: TEST_USER_ID,
      driverName: "Michael Johnson",
      driverPhone: "+234 801 234 5678",
      estimatedArrival: "30 minutes",
    });
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testGlobalAnnouncement() {
  console.log("\n📢 Testing global announcement...");
  try {
    const response = await axios.post(`${BASE_URL}/api/announce`, {
      title: "Flash Sale! 🎉",
      message: "Get 50% off all express deliveries today only!",
    });
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testHealthCheck() {
  console.log("\n❤️ Testing health check...");
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log("✅ Success:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🧪 Starting notification tests...");
  console.log("================================\n");

  await testHealthCheck();
  await testRegisterToken();

  // Wait a bit for token registration
  console.log("\n⏳ Waiting 2 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await testShipmentUpdate();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await testDeliveryStatus();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await testDriverAssigned();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await testGlobalAnnouncement();

  console.log("\n================================");
  console.log("✅ All tests completed!");
  console.log("\nTo test with real data:");
  console.log("1. Update TEST_USER_ID with your Firebase user ID");
  console.log("2. Update TEST_TOKEN with your actual Expo push token");
  console.log("3. Run: npm run test\n");
}

// Run tests
runAllTests();
