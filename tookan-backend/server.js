// import express from "express";
// import bodyParser from "body-parser";
// import fetch from "node-fetch";
// import dotenv from "dotenv";
// import Stripe from "stripe";

// dotenv.config();

// // ---------- Configuration ----------
// const app = express();
// const port = 3000;
// const stripeSecret = process.env.STRIPE_SECRET_KEY;
// const stripe = Stripe(stripeSecret);

// // Keep this the same IP your mobile app is using
// const PUBLIC_BASE_URL = "http://192.168.43.176:3000";

// // In-memory store (replace with Redis/Postgres in production)
// const sessionData = new Map();
// const deliveries = new Map();

// // ---------- Sanity checks ----------
// if (!process.env.STRIPE_SECRET_KEY) {
//   console.error("ERROR: STRIPE_SECRET_KEY is not set.");
//   process.exit(1);
// }
// if (!process.env.TOOKAN_API_KEY) {
//   console.error("ERROR: TOOKAN_API_KEY is not set.");
//   process.exit(1);
// }
// if (!process.env.MAPBOX_ACCESS_TOKEN) {
//   console.error("ERROR: MAPBOX_ACCESS_TOKEN is not set.");
//   process.exit(1);
// }

// console.log("✅ Env OK. Starting server…");

// // ---------- Utility helpers ----------
// // Add this function to your Utility helpers section
// // function getJobStatusText(jobStatus) {
// //   const statusCode = parseInt(jobStatus);

// //   const statusMap = {
// //     0: "Task created",
// //     1: "Assigned to driver",
// //     2: "Driver started / En route",
// //     3: "Delivered successfully",
// //     4: "Delivery failed",
// //     5: "Cancelled",
// //     6: "Cancelled by dispatcher",
// //     7: "Accepted by driver",
// //     8: "Driver arrived at pickup",
// //     9: "Started delivery",
// //     10: "Unassigned",
// //   };

// //   const statusText = statusMap[statusCode];

// //   if (statusText) {
// //     console.log(`[Status] Mapped ${statusCode} to: ${statusText}`);
// //     return statusText;
// //   }

// //   console.warn(`[Status] Unknown status code: ${statusCode}`);
// //   return `Status ${statusCode}`;
// // }

// function formatDateTime(date) {
//   // Tookan expects datetime in format: "YYYY-MM-DD HH:MM:SS"
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   const hours = String(date.getHours()).padStart(2, "0");
//   const minutes = String(date.getMinutes()).padStart(2, "0");
//   const seconds = String(date.getSeconds()).padStart(2, "0");

//   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// }

// // Add this helper function for geocoding
// async function getCoordinates(address) {
//   try {
//     const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

//     if (!googleApiKey) {
//       console.warn("[Geocode] Google Maps API key not available");
//       return null;
//     }

//     const encodedAddress = encodeURIComponent(address);
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=uk&key=${googleApiKey}`;

//     const response = await fetch(url);
//     const data = await response.json();

//     if (data.status === "OK" && data.results && data.results.length > 0) {
//       const location = data.results[0].geometry.location;
//       return [location.lng, location.lat]; // Returns [longitude, latitude]
//     }

//     return null;
//   } catch (error) {
//     console.warn("[Geocode] Error:", error.message);
//     return null;
//   }
// }

// function calculateDeliveryRate(distanceKm, weightRange) {
//   const weightRates = {
//     "1-5kg": 0.8,
//     "5-10kg": 1.2,
//     "10-20kg": 1.8,
//     "20-30kg": 2.5,
//   };
//   const baseRate = weightRates[weightRange] || 1.0;
//   const minimumCharge = 5.0;
//   const calculatedCost = distanceKm * baseRate;
//   return Math.max(calculatedCost, minimumCharge);
// }

// function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371;
//   const dLat = ((lat2 - lat1) * Math.PI) / 180;
//   const dLon = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) *
//       Math.cos((lat2 * Math.PI) / 180) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// async function getCoordinatesFromPostcodeUKGov(postcode) {
//   const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
//   const url = `https://api.postcodes.io/postcodes/${cleanPostcode}`;
//   const response = await fetch(url);
//   if (!response.ok) {
//     throw new Error(`UK Gov API ${response.status} ${response.statusText}`);
//   }
//   const data = await response.json();
//   if (data.status === 200 && data.result) {
//     const { latitude, longitude } = data.result;
//     return { latitude, longitude };
//   }
//   throw new Error(`Invalid UK postcode or no data for ${postcode}`);
// }

// async function getCoordinatesFromPostcode(postcode) {
//   const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
//   try {
//     return await getCoordinatesFromPostcodeUKGov(postcode);
//   } catch (e) {
//     console.log("[Geocode] UK Gov failed, trying Mapbox:", e.message);
//   }

//   const queries = [
//     postcode.trim().toUpperCase(),
//     postcode.replace(/\s+/g, "").toUpperCase(),
//     `${postcode.trim().toUpperCase()}, UK`,
//     `${postcode.trim().toUpperCase()}, United Kingdom`,
//   ];

//   for (const q of queries) {
//     try {
//       const encoded = encodeURIComponent(q);
//       let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=GB&types=postcode&access_token=${mapboxToken}`;
//       let res = await fetch(url);
//       let data = await res.json();
//       if (data.features?.length) {
//         const [lon, lat] = data.features[0].center;
//         return { latitude: lat, longitude: lon };
//       }
//       url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=GB&access_token=${mapboxToken}`;
//       res = await fetch(url);
//       data = await res.json();
//       if (data.features?.length) {
//         const [lon, lat] = data.features[0].center;
//         return { latitude: lat, longitude: lon };
//       }
//     } catch (err) {
//       console.log(`[Geocode] Mapbox query "${q}" error:`, err.message);
//     }
//   }

//   throw new Error(`No coordinates found for postcode: ${postcode}`);
// }

// async function calculateDistance(pickupCoords, deliveryCoords) {
//   console.log("[Distance] Using haversine estimate.");
//   const straight = calculateStraightLineDistance(
//     pickupCoords.latitude,
//     pickupCoords.longitude,
//     deliveryCoords.latitude,
//     deliveryCoords.longitude
//   );
//   const estimatedDriving = straight * 1.3;
//   const estimatedTimeSec = (estimatedDriving / 50) * 3600;
//   return {
//     distance: estimatedDriving,
//     duration: estimatedTimeSec,
//     estimated: true,
//     fallback: true,
//   };
// }

// function validateShipmentDetails(details) {
//   const required = [
//     "senderName",
//     "senderPhone",
//     "pickupAddress",
//     "pickupPostcode",
//     "date",
//     "receiverName",
//     "receiverNumber",
//     "receiverAddress",
//     "receiverPostcode",
//     "itemType",
//     "selectedWeight",
//     "deliveryType",
//     "basePrice",
//     "deliveryCost",
//     "vatAmount",
//     "totalPrice",
//   ];

//   const missing = required.filter(
//     (k) =>
//       details[k] === undefined ||
//       details[k] === null ||
//       (typeof details[k] === "string" && !details[k].trim())
//   );

//   return missing;
// }

// function sanitize(obj, keys = []) {
//   const copy = JSON.parse(JSON.stringify(obj || {}));
//   for (const k of keys) {
//     if (copy[k]) copy[k] = "***";
//   }
//   return copy;
// }

// // ---------- Middleware ----------
// // Raw body for Stripe webhook ONLY
// app.use((req, res, next) => {
//   if (req.originalUrl === "/webhook") {
//     next();
//   } else {
//     bodyParser.json({ limit: "1mb" })(req, res, next);
//   }
// });

// // Simple CORS
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization, Stripe-Signature"
//   );
//   if (req.method === "OPTIONS") return res.status(200).end();
//   next();
// });

// // ---------- Health / Debug ----------
// app.get("/", (req, res) => {
//   res.json({
//     message: "Delivery API running",
//     status: "OK",
//     timestamp: new Date().toISOString(),
//   });
// });

// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     services: {
//       stripe: !!process.env.STRIPE_SECRET_KEY,
//       tookan: !!process.env.TOOKAN_API_KEY,
//       googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
//       mapbox: !!process.env.MAPBOX_ACCESS_TOKEN,
//     },
//     api_endpoints: {
//       distance_matrix: !!process.env.GOOGLE_MAPS_API_KEY,
//       geocoding: !!process.env.GOOGLE_MAPS_API_KEY,
//       tookan_fare: !!process.env.TOOKAN_API_KEY,
//     },
//   });
// });

// app.post("/api/tookan/delivery-cost", async (req, res) => {
//   const { pickup_postcode, delivery_postcode, weight_range } = req.body || {};

//   if (!pickup_postcode || !delivery_postcode || !weight_range) {
//     return res.status(400).json({ error: "Missing required parameters." });
//   }

//   try {
//     console.log(
//       `[HybridFare] Getting distance from Matrix API and fare from Tookan: ${pickup_postcode} → ${delivery_postcode} (${weight_range})`
//     );

//     // Step 1: Get accurate coordinates and distance from Google Distance Matrix API
//     const { distanceData, coordinates } =
//       await getDistanceAndCoordinatesFromMatrix(
//         pickup_postcode,
//         delivery_postcode
//       );

//     // Step 2: Call Tookan API to get delivery fare using coordinates (Tookan's preferred method)
//     const tookanFare = await getTookanFareEstimate(
//       coordinates.pickup,
//       coordinates.delivery,
//       distanceData
//     );

//     // Step 3: Use Tookan's fare if available, otherwise fallback to your weight-based pricing
//     let finalCost;
//     let source = "tookan";

//     if (tookanFare.fare && parseFloat(tookanFare.fare) > 0) {
//       finalCost = parseFloat(tookanFare.fare);
//       console.log("[HybridFare] Using Tookan calculated fare:", finalCost);
//     } else {
//       // Fallback to your weight-based calculation using Matrix distance
//       finalCost = calculateDeliveryRate(distanceData.distance, weight_range);
//       source = "weight_based";
//       console.log(
//         "[HybridFare] Using weight-based fare with Matrix distance:",
//         finalCost
//       );
//     }

//     res.status(200).json({
//       success: true,
//       cost: parseFloat(finalCost.toFixed(2)),
//       distance_km: parseFloat(distanceData.distance.toFixed(2)),
//       duration_minutes: distanceData.durationMinutes,
//       note: `Cost calculated using Google Distance Matrix API + ${
//         source === "tookan" ? "Tookan fare estimation" : "weight-based pricing"
//       }`,
//       calculation_method: {
//         distance_source: "google_matrix",
//         fare_source: source,
//         tookan_original_fare: tookanFare.fare || null,
//         tookan_response: tookanFare.debug || null,
//       },
//     });
//   } catch (error) {
//     console.error("[HybridFare] Error:", error);

//     // Ultimate fallback to your existing geocoding + straight-line method
//     try {
//       console.log("[HybridFare] Falling back to existing method");
//       const pickupCoords = await getCoordinatesFromPostcode(pickup_postcode);
//       const deliveryCoords = await getCoordinatesFromPostcode(
//         delivery_postcode
//       );
//       const distanceData = await calculateDistance(
//         pickupCoords,
//         deliveryCoords
//       );
//       const distanceKm = parseFloat(distanceData.distance.toFixed(2));
//       const deliveryRate = calculateDeliveryRate(distanceKm, weight_range);

//       res.status(200).json({
//         success: true,
//         cost: parseFloat(deliveryRate.toFixed(2)),
//         distance_km: distanceKm,
//         duration_minutes: Math.round(distanceData.duration / 60),
//         note: "Cost calculated using fallback method (APIs unavailable)",
//         calculation_method: {
//           distance_source: "fallback_geocoding",
//           fare_source: "weight_based",
//         },
//         fallback: true,
//       });
//     } catch (fallbackError) {
//       console.error("[HybridFare] All methods failed:", fallbackError);
//       res.status(500).json({
//         success: false,
//         error: `Failed to calculate delivery cost: ${error.message}`,
//       });
//     }
//   }
// });

// // Function to get distance and coordinates from Google Distance Matrix API
// async function getDistanceAndCoordinatesFromMatrix(
//   pickupPostcode,
//   deliveryPostcode
// ) {
//   const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

//   if (!googleApiKey) {
//     throw new Error("Google Maps API key not configured");
//   }

//   const origins = encodeURIComponent(pickupPostcode.trim().toUpperCase());
//   const destinations = encodeURIComponent(
//     deliveryPostcode.trim().toUpperCase()
//   );

//   // Get distance matrix data
//   const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&region=uk&key=${googleApiKey}`;
//   const distanceResponse = await fetch(distanceUrl);

//   if (!distanceResponse.ok) {
//     throw new Error(
//       `Distance Matrix API HTTP error: ${distanceResponse.status}`
//     );
//   }

//   const distanceData = await distanceResponse.json();

//   if (distanceData.status !== "OK") {
//     throw new Error(`Distance Matrix API error: ${distanceData.status}`);
//   }

//   const element = distanceData.rows?.[0]?.elements?.[0];

//   if (!element || element.status !== "OK") {
//     throw new Error(
//       `Route calculation failed: ${element?.status || "No data"}`
//     );
//   }

//   // Get coordinates using Geocoding API
//   const pickupGeoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${origins}&region=uk&key=${googleApiKey}`;
//   const deliveryGeoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${destinations}&region=uk&key=${googleApiKey}`;

//   const [pickupGeoResponse, deliveryGeoResponse] = await Promise.all([
//     fetch(pickupGeoUrl),
//     fetch(deliveryGeoUrl),
//   ]);

//   const [pickupGeoData, deliveryGeoData] = await Promise.all([
//     pickupGeoResponse.json(),
//     deliveryGeoResponse.json(),
//   ]);

//   if (pickupGeoData.status !== "OK" || deliveryGeoData.status !== "OK") {
//     throw new Error("Failed to get coordinates from geocoding API");
//   }

//   const pickupLocation = pickupGeoData.results?.[0]?.geometry?.location;
//   const deliveryLocation = deliveryGeoData.results?.[0]?.geometry?.location;

//   if (!pickupLocation || !deliveryLocation) {
//     throw new Error("Invalid coordinates from geocoding API");
//   }

//   const distanceMeters = element.distance?.value;
//   const durationSeconds = element.duration?.value;

//   if (!distanceMeters || !durationSeconds) {
//     throw new Error("Invalid distance or duration data from Matrix API");
//   }

//   const distanceKm = distanceMeters / 1000;
//   const durationMinutes = Math.round(durationSeconds / 60);

//   console.log(
//     `[DistanceMatrix] ${pickupPostcode} → ${deliveryPostcode}: ${distanceKm}km, ${durationMinutes}min`
//   );

//   return {
//     distanceData: {
//       distance: distanceKm,
//       duration: durationSeconds,
//       durationMinutes: durationMinutes,
//       distanceText: element.distance.text,
//       durationText: element.duration.text,
//     },
//     coordinates: {
//       pickup: {
//         latitude: pickupLocation.lat,
//         longitude: pickupLocation.lng,
//       },
//       delivery: {
//         latitude: deliveryLocation.lat,
//         longitude: deliveryLocation.lng,
//       },
//     },
//   };
// }

// // Function to get fare estimate from Tookan API using their naming conventions
// async function getTookanFareEstimate(
//   pickupCoords,
//   deliveryCoords,
//   distanceData
// ) {
//   try {
//     // Using Tookan's exact naming conventions as specified
//     const tookanPayload = {
//       api_key: process.env.TOOKAN_API_KEY,
//       template_name: "Delivery",
//       pickup_latitude: pickupCoords.latitude,
//       pickup_longitude: pickupCoords.longitude,
//       delivery_latitude: deliveryCoords.latitude,
//       delivery_longitude: deliveryCoords.longitude,
//     };

//     console.log("[TookanFare] Requesting fare with coordinates:", {
//       pickup: `${pickupCoords.latitude}, ${pickupCoords.longitude}`,
//       delivery: `${deliveryCoords.latitude}, ${deliveryCoords.longitude}`,
//       distance: `${distanceData.distance}km`,
//     });

//     const response = await fetch(
//       "https://api.tookanapp.com/v2/get_fare_estimate",
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(tookanPayload),
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Tookan API HTTP error: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log("[TookanFare] API Response:", JSON.stringify(data, null, 2));

//     if (data.status === 200 || data.status === "200") {
//       return {
//         fare: data.data?.fare || data.data?.total_fare || data.data?.cost,
//         debug: data.data,
//       };
//     } else {
//       console.warn("[TookanFare] Tookan fare estimation failed:", data.message);
//       return { debug: data }; // Return debug info to help troubleshoot
//     }
//   } catch (error) {
//     console.warn("[TookanFare] Tookan API error:", error.message);
//     return { debug: { error: error.message } };
//   }
// }

// // Add environment variable checks
// if (!process.env.GOOGLE_MAPS_API_KEY) {
//   console.warn(
//     "WARNING: GOOGLE_MAPS_API_KEY is not set. Distance Matrix API will not work."
//   );
// }

// if (!process.env.TOOKAN_API_KEY) {
//   console.warn(
//     "WARNING: TOOKAN_API_KEY is not set. Tookan fare estimation will not work."
//   );
// }

// // Optional: Add a test endpoint to verify the hybrid system
// app.get("/api/test-hybrid-fare/:pickup/:delivery", async (req, res) => {
//   const { pickup, delivery } = req.params;
//   const weight = "1-5kg"; // Default weight for testing

//   try {
//     const { distanceData, coordinates } =
//       await getDistanceAndCoordinatesFromMatrix(pickup, delivery);
//     const tookanFare = await getTookanFareEstimate(
//       coordinates.pickup,
//       coordinates.delivery,
//       distanceData
//     );
//     const fallbackFare = calculateDeliveryRate(distanceData.distance, weight);

//     res.json({
//       test: "hybrid-fare-system",
//       pickup_postcode: pickup,
//       delivery_postcode: delivery,
//       distance_data: distanceData,
//       coordinates: coordinates,
//       tookan_fare: tookanFare,
//       fallback_fare: fallbackFare,
//       final_recommendation: tookanFare.fare || fallbackFare,
//     });
//   } catch (error) {
//     res.status(500).json({
//       test: "hybrid-fare-system",
//       error: error.message,
//       pickup_postcode: pickup,
//       delivery_postcode: delivery,
//     });
//   }
// });

// // ---------- Web Checkout Session (PRIMARY PAYMENT METHOD) ----------

// // Updated Stripe Checkout Session Creation with correct success URL
// // Complete the checkout session creation with proper success/cancel URLs
// app.post("/api/create-checkout-session", async (req, res) => {
//   const { totalAmount, shipmentDetails } = req.body || {};

//   if (!totalAmount || !shipmentDetails) {
//     return res
//       .status(400)
//       .json({ error: "Missing totalAmount or shipmentDetails" });
//   }

//   // Validate fields
//   const missing = validateShipmentDetails(shipmentDetails);
//   if (missing.length) {
//     return res.status(400).json({
//       error: `Missing fields in shipmentDetails: ${missing.join(", ")}`,
//     });
//   }

//   try {
//     // Stripe metadata must be strings
//     const metadata = {};
//     for (const k in shipmentDetails) {
//       metadata[k] = String(shipmentDetails[k]);
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: [
//         {
//           price_data: {
//             currency: "gbp",
//             product_data: {
//               name: "Delivery Service",
//               description: `Weight: ${
//                 shipmentDetails.selectedWeight
//               }, Distance: ${
//                 shipmentDetails?.distanceInfo?.distance ?? "n/a"
//               } km`,
//             },
//             unit_amount: Math.round(Number(totalAmount) * 100),
//           },
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       // Add the missing success and cancel URLs
//       success_url: `${PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${PUBLIC_BASE_URL}/payment-cancel`,

//       metadata: metadata,
//     });

//     // Store session data
//     sessionData.set(session.id, {
//       sessionId: session.id,
//       status: "payment_pending",
//       shipmentDetails,
//       totalAmount,
//       createdAt: new Date().toISOString(),
//     });

//     console.log("[Checkout] Created session", session.id);
//     res.json({ url: session.url, sessionId: session.id });
//   } catch (error) {
//     console.error("[Checkout] Error creating session:", error);
//     res.status(500).json({ error: "Failed to create checkout session." });
//   }
// });

// app.get("/payment-success", async (req, res) => {
//   const { session_id } = req.query;

//   if (!session_id) {
//     return res.send("Payment was successful but no session ID found.");
//   }

//   try {
//     // Retrieve the session from Stripe to verify it's actually paid
//     const session = await stripe.checkout.sessions.retrieve(session_id);

//     if (session.payment_status === "paid") {
//       // Update our session data
//       const storedData = sessionData.get(session_id);
//       if (storedData) {
//         storedData.status = "payment_completed";
//         storedData.completedAt = new Date().toISOString();
//         sessionData.set(session_id, storedData);
//       }
//     }

//     // HTML page that redirects back to the app with proper deep linking
//     res.send(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Payment Successful</title>
//         <meta name="viewport" content="width=device-width, initial-scale=1">
//         <script>
//           let redirectAttempts = 0;
//           const maxAttempts = 3;

//           function redirectToApp() {
//             redirectAttempts++;
//             const sessionId = '${session_id}';

//             // Primary deep link URLs to try
//             const appUrls = [
//               'rapiddelivery://payment-success?session_id=' + sessionId,
//               'com.yourcompany.rapiddelivery://payment-success?session_id=' + sessionId,
//               // Also try the web URL as a fallback for universal links
//               'https://192.168.43.176:3000/payment-success?session_id=' + sessionId,
//               'http://192.168.43.176:3000/payment-success?session_id=' + sessionId
//             ];

//             console.log('Attempt', redirectAttempts, '- Trying to redirect to app with session:', sessionId);

//             // Try each URL in sequence
//             appUrls.forEach((url, index) => {
//               setTimeout(() => {
//                 console.log('Trying URL:', url);
//                 window.location.href = url;
//               }, index * 1000);
//             });
//           }

//           // Try redirect immediately when page loads
//           document.addEventListener('DOMContentLoaded', function() {
//             console.log('DOM loaded, starting redirect process');
//             redirectToApp();
//           });

//           // Also try on page load as fallback
//           window.addEventListener('load', function() {
//             if (redirectAttempts === 0) {
//               console.log('Window loaded, starting redirect process');
//               redirectToApp();
//             }
//           });

//           // Update UI after attempts
//           setTimeout(function() {
//             const statusElement = document.getElementById('status');
//             if (statusElement) {
//               statusElement.innerHTML =
//                 '<h2>✅ Payment Successful!</h2>' +
//                 '<p>Your delivery order has been confirmed.</p>' +
//                 '<div style="margin: 20px 0;">' +
//                   '<button onclick="redirectToApp()" style="background: #8328FA; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 5px;">Open App</button>' +
//                   '<br>' +
//                   '<button onclick="window.close()" style="background: #6B7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; margin: 5px;">Close Window</button>' +
//                 '</div>' +
//                 '<p style="margin-top: 20px; font-size: 12px; color: #666;">If the app doesn\\'t open automatically, please tap "Open App" above.</p>' +
//                 '<details style="margin-top: 15px; font-size: 10px; color: #999;">' +
//                   '<summary style="cursor: pointer;">Debug Info</summary>' +
//                   '<p>Session ID: ${session_id}</p>' +
//                   '<p>Payment Status: ${session.payment_status}</p>' +
//                   '<p>Redirect Attempts: ' + redirectAttempts + '</p>' +
//                 '</details>';
//             }
//           }, 5000);

//           // Prevent navigation away from the success page too quickly
//           window.addEventListener('beforeunload', function(e) {
//             if (redirectAttempts < maxAttempts) {
//               const message = 'Redirecting to app...';
//               e.returnValue = message;
//               return message;
//             }
//           });
//         </script>
//       </head>
//       <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0;">
//         <div id="status" style="background: rgba(255,255,255,0.95); color: #333; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
//           <h2>🎉 Payment Successful!</h2>
//           <p>Processing your order and redirecting to the app...</p>
//           <div style="margin: 30px 0;">
//             <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #8328FA; border-radius: 50%; animation: spin 1s linear infinite;"></div>
//           </div>
//           <p style="font-size: 12px; color: #666; margin-top: 20px;">
//             Please wait while we redirect you to the app...
//           </p>
//         </div>
//         <style>
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         </style>
//       </body>
//       </html>
//     `);
//   } catch (error) {
//     console.error("Error retrieving session:", error);
//     res.status(500).send(`
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <title>Payment Error</title>
//         <meta name="viewport" content="width=device-width, initial-scale=1">
//       </head>
//       <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fee2e2;">
//         <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
//           <h2 style="color: #dc2626;">Error Processing Payment</h2>
//           <p style="color: #666;">There was an error verifying your payment. Please contact support if you believe this is an error.</p>
//           <button onclick="window.close()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Close</button>
//         </div>
//       </body>
//       </html>
//     `);
//   }
// });

// // Payment cancel page
// app.get("/payment-cancel", (req, res) => {
//   const { session_id } = req.query;

//   res.send(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Payment Cancelled</title>
//       <meta name="viewport" content="width=device-width, initial-scale=1">
//       <script>
//         function redirectToApp() {
//           const appUrl = 'com.yourcompany.rapiddelivery://payment-cancel?session_id=${
//             session_id || ""
//           }';
//           console.log('Attempting to redirect to:', appUrl);
//           window.location.href = appUrl;

//           // Fallback
//           setTimeout(function() {
//             window.location.href = 'rapiddelivery://payment-cancel?session_id=${
//               session_id || ""
//             }';
//           }, 1000);
//         }

//         // Auto redirect after 3 seconds
//         setTimeout(redirectToApp, 3000);
//       </script>
//     </head>
//     <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #ff7e7e 0%, #ff6b6b 100%); color: white; min-height: 100vh; margin: 0;">
//       <div style="background: rgba(255,255,255,0.95); color: #333; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
//         <h2>❌ Payment Cancelled</h2>
//         <p>Your payment was cancelled. You can try again anytime.</p>
//         <p><button onclick="redirectToApp()" style="background: #ff6b6b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer;">Return to App</button></p>
//         <p style="margin-top: 20px; font-size: 12px; color: #666;">Redirecting automatically in 3 seconds...</p>
//       </div>
//     </body>
//     </html>
//   `);
// });

// // app.get("/api/payment-status/:sessionId", async (req, res) => {
// //   const { sessionId } = req.params;

// //   try {
// //     // Get session from Stripe
// //     const session = await stripe.checkout.sessions.retrieve(sessionId);

// //     // Get our stored data
// //     const storedData = sessionData.get(sessionId);

// //     res.json({
// //       sessionId,
// //       paymentStatus: session.payment_status,
// //       sessionStatus: session.status,
// //       shipmentDetails: storedData?.shipmentDetails || null,
// //       totalAmount: storedData?.totalAmount || null,
// //       createdAt: storedData?.createdAt || null,
// //       completedAt: storedData?.completedAt || null,
// //     });
// //   } catch (error) {
// //     console.error("Error checking payment status:", error);
// //     res.status(500).json({ error: "Failed to check payment status" });
// //   }
// // });
// app.get("/api/payment-status/:sessionId", async (req, res) => {
//   const { sessionId } = req.params;

//   try {
//     // Check if this is a Google Pay or Klarna session
//     if (
//       sessionId.startsWith("gpay_") ||
//       sessionId.startsWith("applepay_") ||
//       sessionId.startsWith("klarna_")
//     ) {
//       // Try to get from in-memory store first
//       const storedData = sessionData.get(sessionId);

//       if (storedData) {
//         return res.json({
//           sessionId,
//           paymentStatus: "paid",
//           sessionStatus: "complete",
//           shipmentDetails: storedData.shipmentDetails || null,
//           totalAmount: storedData.totalAmount || null,
//           createdAt: storedData.createdAt || null,
//           completedAt: storedData.completedAt || null,
//         });
//       }

//       // If not in memory, try to retrieve the PaymentIntent from Stripe
//       try {
//         const paymentIntentId = sessionId
//           .replace("gpay_", "")
//           .replace("applepay_", "")
//           .replace("klarna_", "");
//         const paymentIntent = await stripe.paymentIntents.retrieve(
//           paymentIntentId
//         );

//         if (paymentIntent.status === "succeeded") {
//           const shipmentDetails = paymentIntent.metadata || {};

//           return res.json({
//             sessionId,
//             paymentStatus: "paid",
//             sessionStatus: "complete",
//             shipmentDetails: shipmentDetails,
//             totalAmount: paymentIntent.amount / 100,
//             createdAt: new Date(paymentIntent.created * 1000).toISOString(),
//             completedAt: new Date().toISOString(),
//             reconstructed: true,
//           });
//         } else {
//           return res.status(400).json({
//             error: `Payment not completed. Status: ${paymentIntent.status}`,
//             sessionId,
//           });
//         }
//       } catch (stripeError) {
//         console.error("Error retrieving PaymentIntent:", stripeError);
//         return res.status(404).json({
//           error: "Session not found in memory or Stripe",
//           sessionId,
//         });
//       }
//     }

//     // For regular Stripe Checkout Sessions
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     const storedData = sessionData.get(sessionId);

//     res.json({
//       sessionId,
//       paymentStatus: session.payment_status,
//       sessionStatus: session.status,
//       shipmentDetails: storedData?.shipmentDetails || null,
//       totalAmount: storedData?.totalAmount || null,
//       createdAt: storedData?.createdAt || null,
//       completedAt: storedData?.completedAt || null,
//     });
//   } catch (error) {
//     console.error("Error checking payment status:", error);
//     res.status(500).json({ error: "Failed to check payment status" });
//   }
// });

// app.post("/api/tookan/create-task", async (req, res) => {
//   try {
//     const { sessionId, shipmentDetails } = req.body;

//     if (!sessionId || !shipmentDetails) {
//       return res.status(400).json({
//         success: false,
//         error: "Missing sessionId or shipmentDetails",
//       });
//     }

//     const missing = validateShipmentDetails(shipmentDetails);
//     if (missing.length) {
//       return res.status(400).json({
//         success: false,
//         error: `Missing fields: ${missing.join(", ")}`,
//       });
//     }

//     const sessionEntry = sessionData.get(sessionId);
//     if (!sessionEntry) {
//       return res.status(404).json({
//         success: false,
//         error: "Session not found",
//       });
//     }

//     if (sessionEntry.status !== "payment_completed") {
//       return res.status(400).json({
//         success: false,
//         error: "Payment not completed",
//       });
//     }

//     if (sessionEntry.tookanTaskId) {
//       return res.json({
//         success: true,
//         taskId: sessionEntry.tookanTaskId,
//         trackingUrl: sessionEntry.trackingUrl || null,
//         deliveryId: sessionEntry.deliveryId,
//         message: "Task already exists",
//       });
//     }

//     console.log("[Tookan] Creating task for session:", sessionId);

//     const deliveryId =
//       sessionEntry.deliveryId ||
//       `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

//     // Get coordinates
//     let pickupCoords = null;
//     let deliveryCoords = null;

//     try {
//       const pickupAddress = `${shipmentDetails.pickupAddress}, ${shipmentDetails.pickupPostcode}`;
//       const deliveryAddress = `${shipmentDetails.receiverAddress}, ${shipmentDetails.receiverPostcode}`;

//       console.log("[Tookan] Geocoding:", { pickupAddress, deliveryAddress });

//       pickupCoords = await getCoordinates(pickupAddress);
//       deliveryCoords = await getCoordinates(deliveryAddress);

//       console.log("[Tookan] Coords result:", { pickupCoords, deliveryCoords });

//       if (!pickupCoords || !deliveryCoords) {
//         console.error("[Tookan] ❌ Geocoding failed - missing coordinates");
//         return res.status(400).json({
//           success: false,
//           error: "Could not geocode addresses",
//           details: {
//             pickupCoords: pickupCoords ? "✓" : "✗",
//             deliveryCoords: deliveryCoords ? "✓" : "✗",
//             pickupPostcode: shipmentDetails.pickupPostcode,
//             deliveryPostcode: shipmentDetails.receiverPostcode,
//           },
//         });
//       }
//     } catch (geocodeError) {
//       console.error("[Tookan] Geocoding error:", geocodeError);
//       return res.status(500).json({
//         success: false,
//         error: "Geocoding service error",
//         details: geocodeError.message,
//       });
//     }

//     // Time setup - MATCHING YOUR WORKING PROJECT
//     const now = new Date();
//     const pickupTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
//     const deliveryTime = new Date(pickupTime.getTime() + 6 * 60 * 60 * 1000); // 6 hours after pickup

//     const formatDateTime = (date) =>
//       date.toISOString().slice(0, 19).replace("T", " ");

//     // PAYLOAD - EXACTLY MATCHING YOUR WORKING PROJECT
//     const payload = {
//       api_key: process.env.TOOKAN_API_KEY,
//       order_id: deliveryId,
//       job_description: "Delivery Order",

//       // Pickup
//       job_pickup_name: (shipmentDetails.senderName || "Pickup").trim(),
//       job_pickup_phone: (shipmentDetails.senderPhone || "0000000000")
//         .replace(/\s+/g, "")
//         .substring(0, 15),
//       job_pickup_email: shipmentDetails.senderEmail || "",
//       job_pickup_address:
//         `${shipmentDetails.pickupAddress}, ${shipmentDetails.pickupPostcode}`.trim(),
//       job_pickup_datetime: formatDateTime(pickupTime),

//       // Pickup coordinates
//       job_pickup_latitude: pickupCoords[1].toString(),
//       job_pickup_longitude: pickupCoords[0].toString(),

//       // Delivery/Customer
//       customer_email: shipmentDetails.receiverEmail || "",
//       customer_username: (shipmentDetails.receiverName || "Delivery").trim(),
//       customer_phone: (shipmentDetails.receiverNumber || "0000000000")
//         .replace(/\s+/g, "")
//         .substring(0, 15),
//       customer_address:
//         `${shipmentDetails.receiverAddress}, ${shipmentDetails.receiverPostcode}`.trim(),
//       job_delivery_datetime: formatDateTime(deliveryTime),

//       // ⚠️ CRITICAL: Use 'latitude' and 'longitude' NOT 'job_latitude'/'job_longitude'
//       latitude: deliveryCoords[1].toString(),
//       longitude: deliveryCoords[0].toString(),

//       // Settings - EXACTLY as in working project
//       auto_assignment: 1,
//       has_pickup: "1",
//       has_delivery: "1",
//       layout_type: "0",
//       tracking_link: 1,
//       timezone: "0",
//     };

//     console.log("[Tookan] Final Payload:", {
//       order_id: payload.order_id,
//       auto_assignment: payload.auto_assignment,
//       job_pickup_latitude: payload.job_pickup_latitude,
//       job_pickup_longitude: payload.job_pickup_longitude,
//       latitude: payload.latitude,
//       longitude: payload.longitude,
//       job_pickup_name: payload.job_pickup_name,
//       customer_username: payload.customer_username,
//     });

//     const response = await fetch("https://api.tookanapp.com/v2/create_task", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();

//     console.log("[Tookan] Response:", {
//       status: response.status,
//       tookanStatus: data.status,
//       message: data.message,
//       job_id: data.data?.job_id,
//     });

//     if (data.status !== 200 || !data.data?.job_id) {
//       console.error("[Tookan] Task creation failed:", data);
//       return res.status(response.status || 502).json({
//         success: false,
//         error: data.message || "Failed to create Tookan task",
//         tookanResponse: data,
//       });
//     }

//     const taskId = data.data.job_id;
//     const trackingUrl =
//       data.data.pickup_tracking_link || data.data.delivery_tracing_link;

//     // Update session
//     sessionEntry.tookanTaskId = String(taskId);
//     sessionEntry.trackingUrl = trackingUrl ? String(trackingUrl) : null;
//     sessionEntry.deliveryId = deliveryId;
//     sessionEntry.updatedAt = new Date().toISOString();
//     sessionData.set(sessionId, sessionEntry);

//     // Store in deliveries map
//     deliveries.set(deliveryId, {
//       deliveryId,
//       sessionId,
//       jobId: taskId,
//       trackingUrl,
//       status: "confirmed",
//       shipmentDetails,
//       stripeSessionId: sessionId,
//       createdAt: sessionEntry.createdAt,
//       updatedAt: new Date().toISOString(),
//     });

//     console.log("[Tookan] ✅ Task created successfully:", taskId);

//     res.json({
//       success: true,
//       tookanTaskId: String(taskId),
//       trackingUrl: trackingUrl ? String(trackingUrl) : null,
//       deliveryId,
//       message: "Task created successfully",
//     });
//   } catch (error) {
//     console.error("[Tookan] Error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//       details: error.message,
//     });
//   }
// });

// app.get("/api/session/:sessionId/create-tookan-task", async (req, res) => {
//   const { sessionId } = req.params;

//   let entry = sessionData.get(sessionId);

//   if (!entry) {
//     try {
//       console.log(
//         `[Tookan] Session ${sessionId} not in memory, checking Stripe...`
//       );
//       const session = await stripe.checkout.sessions.retrieve(sessionId);

//       if (session.payment_status !== "paid") {
//         return res.status(400).json({
//           success: false,
//           error: "Payment not completed yet.",
//           status: session.payment_status,
//         });
//       }

//       const shipmentDetails = {};
//       for (const [key, value] of Object.entries(session.metadata)) {
//         if (
//           ["basePrice", "deliveryCost", "vatAmount", "totalPrice"].includes(key)
//         ) {
//           shipmentDetails[key] = parseFloat(value);
//         } else if (key === "isFragile") {
//           shipmentDetails[key] = value === "true";
//         } else {
//           shipmentDetails[key] = value;
//         }
//       }

//       entry = {
//         sessionId,
//         status: "payment_completed",
//         shipmentDetails,
//         totalAmount: session.amount_total / 100,
//         createdAt: new Date(session.created * 1000).toISOString(),
//         completedAt: new Date().toISOString(),
//         reconstructed: true,
//       };

//       sessionData.set(sessionId, entry);
//       console.log(`[Tookan] ✅ Reconstructed session from Stripe`);
//     } catch (stripeError) {
//       console.error("[Stripe] Error:", stripeError);
//       return res.status(404).json({
//         success: false,
//         error: "Session not found",
//         sessionId,
//       });
//     }
//   }

//   if (entry.tookanTaskId && entry.trackingUrl && entry.deliveryId) {
//     return res.status(200).json({
//       success: true,
//       message: "Task already created.",
//       tookanTaskId: entry.tookanTaskId,
//       trackingUrl: entry.trackingUrl,
//       deliveryId: entry.deliveryId,
//     });
//   }

//   const details = entry.shipmentDetails || {};
//   const missing = validateShipmentDetails(details);
//   if (missing.length) {
//     console.error("[Tookan] Missing fields:", missing);
//     return res.status(400).json({
//       success: false,
//       error: `Missing fields: ${missing.join(", ")}`,
//     });
//   }

//   if (!entry.deliveryId) {
//     entry.deliveryId = `DEL-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`;
//     sessionData.set(sessionId, entry);
//   }

//   // ✅ GEOCODE FIRST - BEFORE CREATING PAYLOAD
//   let pickupCoords = null;
//   let deliveryCoords = null;

//   try {
//     const pickupAddress = `${details.pickupAddress}, ${details.pickupPostcode}`;
//     const deliveryAddress = `${details.receiverAddress}, ${details.receiverPostcode}`;

//     console.log("[Tookan] Geocoding addresses...");
//     [pickupCoords, deliveryCoords] = await Promise.all([
//       getCoordinates(pickupAddress),
//       getCoordinates(deliveryAddress),
//     ]);

//     if (!pickupCoords || !deliveryCoords) {
//       console.error("[Tookan] ❌ Geocoding failed:", {
//         pickup: pickupCoords ? "✓" : "✗",
//         delivery: deliveryCoords ? "✓" : "✗",
//       });
//       return res.status(400).json({
//         success: false,
//         error: "Could not geocode addresses",
//         details: {
//           pickupCoords: pickupCoords ? "✓" : "✗",
//           deliveryCoords: deliveryCoords ? "✓" : "✗",
//         },
//       });
//     }

//     console.log("[Tookan] ✅ Geocoding successful:", {
//       pickup: pickupCoords,
//       delivery: deliveryCoords,
//     });
//   } catch (geocodeError) {
//     console.error("[Tookan] Geocoding error:", geocodeError);
//     return res.status(500).json({
//       success: false,
//       error: "Geocoding service error",
//       details: geocodeError.message,
//     });
//   }

//   const now = new Date();
//   const pickupTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
//   const deliveryTime = new Date(pickupTime.getTime() + 6 * 60 * 60 * 1000);

//   const formatDateTime = (date) =>
//     date.toISOString().slice(0, 19).replace("T", " ");

//   // ✅ COMPLETE PAYLOAD WITH COORDINATES - MATCHING YOUR WORKING PROJECT
//   const tookanPayload = {
//     api_key: process.env.TOOKAN_API_KEY,
//     order_id: entry.deliveryId,
//     job_description: "Delivery Order",

//     // Pickup details
//     job_pickup_name: (details.senderName || "Pickup").trim(),
//     job_pickup_phone: (details.senderPhone || "0000000000")
//       .replace(/\s+/g, "")
//       .substring(0, 15),
//     job_pickup_email: details.senderEmail || "",
//     job_pickup_address:
//       `${details.pickupAddress}, ${details.pickupPostcode}`.trim(),
//     job_pickup_datetime: formatDateTime(pickupTime),

//     // ✅ PICKUP COORDINATES
//     job_pickup_latitude: pickupCoords[1].toString(),
//     job_pickup_longitude: pickupCoords[0].toString(),

//     // Delivery details
//     customer_username: (details.receiverName || "Delivery").trim(),
//     customer_phone: (details.receiverNumber || "0000000000")
//       .replace(/\s+/g, "")
//       .substring(0, 15),
//     customer_email: details.receiverEmail || "",
//     customer_address:
//       `${details.receiverAddress}, ${details.receiverPostcode}`.trim(),
//     job_delivery_datetime: formatDateTime(deliveryTime),

//     // ✅ DELIVERY COORDINATES - CRITICAL
//     latitude: deliveryCoords[1].toString(),
//     longitude: deliveryCoords[0].toString(),

//     // Settings - EXACTLY AS WORKING PROJECT
//     auto_assignment: 1,
//     has_pickup: "1",
//     has_delivery: "1",
//     layout_type: "0",
//     tracking_link: 1,
//     timezone: "0",
//   };

//   console.log("[Tookan] Final Payload:", {
//     order_id: tookanPayload.order_id,
//     auto_assignment: tookanPayload.auto_assignment,
//     job_pickup_latitude: tookanPayload.job_pickup_latitude,
//     job_pickup_longitude: tookanPayload.job_pickup_longitude,
//     latitude: tookanPayload.latitude,
//     longitude: tookanPayload.longitude,
//     has_pickup: tookanPayload.has_pickup,
//     has_delivery: tookanPayload.has_delivery,
//   });

//   try {
//     const response = await fetch("https://api.tookanapp.com/v2/create_task", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(tookanPayload),
//     });

//     const data = await response.json();
//     console.log("[Tookan] Response:", {
//       status: response.status,
//       tookanStatus: data.status,
//       message: data.message,
//       job_id: data.data?.job_id,
//     });

//     if (data.status !== 200 || !data.data?.job_id) {
//       console.error("[Tookan] Task creation failed:", data);
//       return res.status(200).json({
//         success: true,
//         message: "Delivery created but Tookan unavailable",
//         deliveryId: entry.deliveryId,
//         tookanTaskId: null,
//         trackingUrl: null,
//         tookanError: data.message,
//       });
//     }

//     const taskId = data.data.job_id;
//     const trackingUrl =
//       data.data.pickup_tracking_link || data.data.delivery_tracking_link;

//     entry.tookanTaskId = String(taskId);
//     entry.trackingUrl = trackingUrl ? String(trackingUrl) : null;
//     entry.updatedAt = new Date().toISOString();
//     sessionData.set(sessionId, entry);

//     deliveries.set(entry.deliveryId, {
//       deliveryId: entry.deliveryId,
//       sessionId,
//       jobId: taskId,
//       trackingUrl,
//       status: "confirmed",
//       shipmentDetails: details,
//       createdAt: entry.createdAt || new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     });

//     console.log("[Tookan] ✅ Task created successfully:", taskId);

//     return res.status(200).json({
//       success: true,
//       tookanTaskId: entry.tookanTaskId,
//       trackingUrl: entry.trackingUrl,
//       deliveryId: entry.deliveryId,
//       message: "Task created successfully",
//     });
//   } catch (error) {
//     console.error("[Tookan] Error:", error);
//     return res.status(200).json({
//       success: true,
//       message: "Delivery created but Tookan unavailable",
//       deliveryId: entry.deliveryId,
//       tookanTaskId: null,
//       trackingUrl: null,
//       error: error.message,
//     });
//   }
// });

// // ---------- Delivery Status (for LocationScreen) ----------
// app.get("/api/delivery/:deliveryId", async (req, res) => {
//   const { deliveryId } = req.params;
//   const delivery = deliveries.get(deliveryId);

//   if (!delivery) {
//     return res.status(404).json({ error: "Delivery not found" });
//   }

//   // Try to get updated status from Tookan if we have a job ID
//   if (delivery.jobId) {
//     try {
//       const tookanResponse = await fetch(
//         "https://api.tookanapp.com/v2/get_job_details",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             api_key: process.env.TOOKAN_API_KEY,
//             job_id: delivery.jobId,
//           }),
//         }
//       );

//       const tookanData = await tookanResponse.json().catch(() => ({}));

//       if (tookanResponse.ok && tookanData.data) {
//         // Update delivery status based on Tookan response
//         const tookanStatus = tookanData.data.job_status;
//         let mappedStatus = "confirmed";

//         switch (tookanStatus) {
//           case 0:
//             mappedStatus = "confirmed";
//             break;
//           case 1:
//             mappedStatus = "assigned";
//             break;
//           case 2:
//             mappedStatus = "started";
//             break;
//           case 3:
//             mappedStatus = "successful";
//             break;
//           case 4:
//             mappedStatus = "failed";
//             break;
//           default:
//             mappedStatus = "confirmed";
//         }

//         delivery.status = mappedStatus;
//         delivery.tookanData = tookanData.data;
//         delivery.updatedAt = new Date().toISOString();
//         deliveries.set(deliveryId, delivery);
//       }
//     } catch (error) {
//       console.error("[Tookan] Error fetching job status:", error);
//       // Continue with existing data
//     }
//   }

//   // Format response for LocationScreen
//   res.json({
//     deliveryId: delivery.deliveryId,
//     status: delivery.status,
//     trackingUrl: delivery.trackingUrl,
//     jobId: delivery.jobId,
//     deliveryDetails: {
//       sender: {
//         name: delivery.shipmentDetails.senderName,
//         phone: delivery.shipmentDetails.senderPhone,
//         address: delivery.shipmentDetails.pickupAddress,
//         postcode: delivery.shipmentDetails.pickupPostcode,
//       },
//       receiver: {
//         name: delivery.shipmentDetails.receiverName,
//         phone: delivery.shipmentDetails.receiverNumber,
//         address: delivery.shipmentDetails.receiverAddress,
//         postcode: delivery.shipmentDetails.receiverPostcode,
//       },
//       weight: delivery.shipmentDetails.selectedWeight,
//       itemType: delivery.shipmentDetails.itemType,
//       isFragile: delivery.shipmentDetails.isFragile,
//       deliveryType: delivery.shipmentDetails.deliveryType,
//     },
//     cost: {
//       itemCost: delivery.shipmentDetails.basePrice,
//       deliveryCost: delivery.shipmentDetails.deliveryCost,
//       vat: delivery.shipmentDetails.vatAmount,
//       total: delivery.shipmentDetails.totalPrice,
//     },
//     createdAt: delivery.createdAt,
//     updatedAt: delivery.updatedAt,
//   });
// });

// // ---------- Stripe Webhook ----------
// app.post(
//   "/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   async (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//     if (!endpointSecret) {
//       console.error("[Webhook] Missing STRIPE_WEBHOOK_SECRET");
//       return res.status(500).send("Webhook secret not configured.");
//     }

//     let event;
//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       console.error("[Webhook] Signature verification failed:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     try {
//       if (event.type === "checkout.session.completed") {
//         const session = event.data.object;
//         const id = session.id;
//         const existing = sessionData.get(id) || {};
//         const customerEmail = session.customer_details?.email;

//         // Generate delivery ID if payment completed via web checkout
//         if (!existing.deliveryId) {
//           existing.deliveryId = `DEL-${Date.now()}-${Math.random()
//             .toString(36)
//             .substr(2, 9)}`;
//         }

//         sessionData.set(id, {
//           ...existing,
//           sessionId: id,
//           status: "payment_completed",
//           customerEmail,
//           shipmentDetails: {
//             ...existing.shipmentDetails,
//             ...session.metadata,
//             customerEmail,
//           },
//           updatedAt: new Date().toISOString(),
//         });

//         console.log(`[Webhook] Session ${id} -> payment_completed`);
//       } else {
//         console.log("[Webhook] Ignored event type:", event.type);
//       }

//       res.json({ received: true });
//     } catch (e) {
//       console.error("[Webhook] Handler error:", e);
//       res.status(500).send("Webhook handler error");
//     }
//   }
// );

// // Get task details from Tookan
// app.get("/api/tookan/task/:taskId", async (req, res) => {
//   try {
//     const { taskId } = req.params;

//     if (!taskId) {
//       return res.status(400).json({ error: "Task ID is required" });
//     }

//     console.log("[Tookan] Fetching task details for:", taskId);

//     const response = await fetch(
//       "https://api.tookanapp.com/v2/get_job_details",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           api_key: process.env.TOOKAN_API_KEY,
//           job_id: taskId,
//         }),
//       }
//     );

//     const data = await response.json().catch(() => ({}));

//     console.log("[Tookan] Task details response:", sanitize(data, ["api_key"]));

//     if (!response.ok || (data.status !== 200 && data.status !== "200")) {
//       return res.status(response.status || 502).json({
//         error: data.message || "Failed to fetch task details",
//         tookanResponse: data,
//       });
//     }

//     const taskData = data.data || data;
//     res.json(taskData);
//   } catch (error) {
//     console.error("[Tookan] Error fetching task details:", error);
//     res.status(500).json({
//       error: "Internal server error while fetching task details",
//     });
//   }
// });

// // ---------- Tookan Webhook for Status Updates ----------
// app.post("/api/webhook/tookan", (req, res) => {
//   try {
//     const { job_id, job_status, order_id } = req.body;

//     console.log("[Tookan Webhook] Received status update:", {
//       job_id,
//       job_status,
//       order_id,
//     });

//     // Find delivery by job_id and update status
//     for (const [deliveryId, delivery] of deliveries.entries()) {
//       if (delivery.jobId === job_id || delivery.deliveryId === order_id) {
//         let mappedStatus = "confirmed";

//         switch (job_status) {
//           case 0:
//             mappedStatus = "confirmed";
//             break;
//           case 1:
//             mappedStatus = "assigned";
//             break;
//           case 2:
//             mappedStatus = "started";
//             break;
//           case 3:
//             mappedStatus = "successful";
//             break;
//           case 4:
//             mappedStatus = "failed";
//             break;
//           default:
//             mappedStatus = "confirmed";
//         }

//         delivery.status = mappedStatus;
//         delivery.updatedAt = new Date().toISOString();
//         deliveries.set(deliveryId, delivery);

//         console.log(
//           "[Tookan Webhook] Updated delivery:",
//           deliveryId,
//           "to status:",
//           mappedStatus
//         );
//         break;
//       }
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("[Tookan Webhook] Error:", error);
//     res.status(500).json({ error: "Webhook processing failed" });
//   }
// });

// // ---------- Success/Cancel pages (fallback for web) ----------
// app.get("/payment-success", (req, res) => {
//   const { session_id } = req.query;

//   if (!session_id) {
//     return res.send("Payment was successful but no session ID found.");
//   }

//   // HTML page that redirects back to the app
//   res.send(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Payment Successful</title>
//       <meta name="viewport" content="width=device-width, initial-scale=1">
//       <script>
//         // Try to redirect back to the app
//         setTimeout(function() {
//           window.location.href = 'rapiddelivery://payment-success?session_id=${session_id}';
//         }, 1000);

//         // Fallback message after 3 seconds
//         setTimeout(function() {
//           document.getElementById('status').innerHTML =
//             '<h2>Payment Successful!</h2>' +
//             '<p>You can now close this window and return to the app.</p>' +
//             '<p><a href="rapiddelivery://payment-success?session_id=${session_id}">Click here</a> if not redirected automatically.</p>';
//         }, 3000);
//       </script>
//     </head>
//     <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
//       <div id="status">
//         <h2>Payment Successful!</h2>
//         <p>Redirecting back to the app...</p>
//         <div style="margin: 20px 0;">
//           <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite;"></div>
//         </div>
//       </div>
//       <style>
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//       </style>
//     </body>
//     </html>
//   `);
// });

// app.get("/payment-cancel", (req, res) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Payment Cancelled</title>
//       <meta name="viewport" content="width=device-width, initial-scale=1">
//       <script>
//         // Try to redirect back to the app
//         setTimeout(function() {
//           window.location.href = 'rapiddelivery://payment-cancel';
//         }, 1000);
//       </script>
//     </head>
//     <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
//       <h2>Payment Cancelled</h2>
//       <p>Your payment was cancelled. Redirecting back to the app...</p>
//       <p><a href="rapiddelivery://payment-cancel">Click here</a> if not redirected automatically.</p>
//     </body>
//     </html>
//   `);
// });

// // ---------- Debug endpoints ----------
// app.get("/api/debug/sessions", (req, res) => {
//   const sessions = Array.from(sessionData.entries()).map(([id, data]) => ({
//     sessionId: id,
//     status: data.status,
//     deliveryId: data.deliveryId,
//     hasShipmentDetails: !!data.shipmentDetails,
//     createdAt: data.createdAt,
//     updatedAt: data.updatedAt,
//   }));
//   res.json({ sessions, count: sessions.length });
// });

// app.get("/api/debug/deliveries", (req, res) => {
//   const deliveryList = Array.from(deliveries.entries()).map(([id, data]) => ({
//     deliveryId: id,
//     status: data.status,
//     jobId: data.jobId,
//     hasTrackingUrl: !!data.trackingUrl,
//     createdAt: data.createdAt,
//     updatedAt: data.updatedAt,
//   }));
//   res.json({ deliveries: deliveryList, count: deliveryList.length });
// });
// //-----------------------------------live tracking----------------------------------
// app.get("/api/geocode", async (req, res) => {
//   const { postcode } = req.query;

//   if (!postcode) {
//     return res.status(400).json({
//       success: false,
//       error: "Postcode parameter is required",
//     });
//   }

//   try {
//     const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

//     if (!googleApiKey) {
//       return res.status(503).json({
//         success: false,
//         error: "Google Maps API not configured",
//       });
//     }

//     // Clean and format postcode
//     const cleanPostcode = postcode.trim().replace(/\s+/g, " ").toUpperCase();
//     const encodedPostcode = encodeURIComponent(`${cleanPostcode}, UK`);

//     const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}&region=uk&key=${googleApiKey}`;

//     console.log("[Geocode] Geocoding postcode:", cleanPostcode);

//     const response = await fetch(geocodeUrl);

//     if (!response.ok) {
//       throw new Error(`Google Geocoding API error: ${response.status}`);
//     }

//     const data = await response.json();

//     if (data.status !== "OK" || !data.results || data.results.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: `No location found for postcode: ${cleanPostcode}`,
//         googleStatus: data.status,
//       });
//     }

//     const location = data.results[0].geometry.location;
//     const formattedAddress = data.results[0].formatted_address;

//     console.log("[Geocode] Success:", {
//       postcode: cleanPostcode,
//       coordinates: `${location.lat}, ${location.lng}`,
//       address: formattedAddress,
//     });

//     res.json({
//       success: true,
//       postcode: cleanPostcode,
//       coordinates: {
//         lat: location.lat,
//         lng: location.lng,
//       },
//       formattedAddress,
//       placeId: data.results[0].place_id,
//     });
//   } catch (error) {
//     console.error("[Geocode] Error:", error);
//     res.status(500).json({
//       success: false,
//       error: `Geocoding failed: ${error.message}`,
//     });
//   }
// });

// // Directions endpoint using Google Directions API
// app.get("/api/directions", async (req, res) => {
//   const { origin, destination } = req.query;

//   if (!origin || !destination) {
//     return res.status(400).json({
//       success: false,
//       error: "Origin and destination parameters are required",
//     });
//   }

//   try {
//     const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

//     if (!googleApiKey) {
//       return res.status(503).json({
//         success: false,
//         error: "Google Maps API not configured",
//       });
//     }

//     const encodedOrigin = encodeURIComponent(origin);
//     const encodedDestination = encodeURIComponent(destination);

//     const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodedOrigin}&destination=${encodedDestination}&key=${googleApiKey}`;

//     console.log("[Directions] Getting route:", { origin, destination });

//     const response = await fetch(directionsUrl);

//     if (!response.ok) {
//       throw new Error(`Google Directions API error: ${response.status}`);
//     }

//     const data = await response.json();

//     if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: "No route found between the specified locations",
//         googleStatus: data.status,
//       });
//     }

//     const route = data.routes[0];
//     const leg = route.legs[0];

//     // Decode the polyline to get route coordinates
//     const polylinePoints = decodePolyline(route.overview_polyline.points);

//     console.log("[Directions] Route found:", {
//       distance: leg.distance.text,
//       duration: leg.duration.text,
//       pointsCount: polylinePoints.length,
//     });

//     res.json({
//       success: true,
//       route: polylinePoints,
//       distance: {
//         text: leg.distance.text,
//         value: leg.distance.value, // in meters
//       },
//       duration: {
//         text: leg.duration.text,
//         value: leg.duration.value, // in seconds
//       },
//       startAddress: leg.start_address,
//       endAddress: leg.end_address,
//     });
//   } catch (error) {
//     console.error("[Directions] Error:", error);
//     res.status(500).json({
//       success: false,
//       error: `Directions failed: ${error.message}`,
//     });
//   }
// });

// // Polyline decoder utility function
// function decodePolyline(encoded) {
//   const points = [];
//   let index = 0;
//   const len = encoded.length;
//   let lat = 0;
//   let lng = 0;

//   while (index < len) {
//     let b,
//       shift = 0,
//       result = 0;
//     do {
//       b = encoded.charAt(index++).charCodeAt(0) - 63;
//       result |= (b & 0x1f) << shift;
//       shift += 5;
//     } while (b >= 0x20);
//     const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//     lat += dlat;

//     shift = 0;
//     result = 0;
//     do {
//       b = encoded.charAt(index++).charCodeAt(0) - 63;
//       result |= (b & 0x1f) << shift;
//       shift += 5;
//     } while (b >= 0x20);
//     const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
//     lng += dlng;

//     points.push({
//       latitude: lat / 1e5,
//       longitude: lng / 1e5,
//     });
//   }

//   return points;
// }

// function getJobStatusText(jobStatus) {
//   const statusCode = parseInt(jobStatus);

//   const statusMap = {
//     0: "Task created",
//     1: "Assigned to driver",
//     2: "Driver started / En route",
//     3: "Delivered successfully",
//     4: "Delivery failed",
//     5: "Cancelled",
//     6: "Cancelled by dispatcher",
//     7: "Accepted by driver",
//     8: "Driver arrived at pickup",
//     9: "Started delivery",
//     10: "Unassigned",
//   };

//   const statusText = statusMap[statusCode];

//   if (statusText) {
//     console.log(`[Status] Mapped ${statusCode} to: ${statusText}`);
//     return statusText;
//   }

//   console.warn(`[Status] Unknown status code: ${statusCode}`);
//   return `Status ${statusCode}`;
// }

// // app.get("/api/tookan/tracking/:taskId", async (req, res) => {
// //   const { taskId } = req.params;

// //   if (!taskId) {
// //     return res.status(400).json({
// //       success: false,
// //       error: "Task ID is required",
// //     });
// //   }

// //   try {
// //     console.log("[TookanTracking] Fetching live data for task:", taskId);

// //     const jobPayload = {
// //       api_key: process.env.TOOKAN_API_KEY,
// //       job_ids: [parseInt(taskId)],
// //       include_task_history: 1,
// //     };

// //     const jobResponse = await fetch(
// //       "https://api.tookanapp.com/v2/get_job_details",
// //       {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(jobPayload),
// //       }
// //     );

// //     if (!jobResponse.ok) {
// //       throw new Error(`Tookan job API error: ${jobResponse.status}`);
// //     }

// //     const jobData = await jobResponse.json();

// //     if (jobData.status !== 200 && jobData.status !== "200") {
// //       return res.status(404).json({
// //         success: false,
// //         error: `Task not found: ${jobData.message}`,
// //       });
// //     }

// //     const job = Array.isArray(jobData.data) ? jobData.data[0] : jobData.data;

// //     if (!job) {
// //       return res.status(404).json({
// //         success: false,
// //         error: "Job data not found",
// //       });
// //     }

// //     console.log("[TookanTracking] Raw job data from Tookan:", {
// //       job_id: job.job_id,
// //       job_status: job.job_status,
// //       completed_datetime: job.completed_datetime,
// //       completion_datetime: job.completion_datetime,
// //       completed_time: job.completed_time,
// //       creation_datetime: job.creation_datetime || job.created_datetime,
// //       started_datetime: job.started_datetime,
// //       arrived_datetime: job.arrived_datetime,
// //       fleet_id: job.fleet_id,
// //       order_id: job.order_id,
// //       hasTaskHistory: !!job.task_history && job.task_history.length > 0,
// //     });

// //     console.log("[TookanTracking] Job status code:", job.job_status);
// //     console.log(
// //       "[TookanTracking] Job status text:",
// //       getJobStatusText(job.job_status)
// //     );
// //     console.log("[TookanTracking] Fleet ID:", job.fleet_id);
// //     console.log("[TookanTracking] Fleet name:", job.fleet_name);

// //     // ✅ FIXED: Extract completed_datetime - Handle failed/cancelled deliveries too
// //     let completedDatetime = null;
// //     const jobStatus = parseInt(job.job_status);

// //     // For completed deliveries (status 3)
// //     if (jobStatus === 3) {
// //       if (
// //         job.completed_datetime &&
// //         job.completed_datetime !== "0000-00-00 00:00:00"
// //       ) {
// //         completedDatetime = job.completed_datetime;
// //         console.log(
// //           "[TookanTracking] Found completed_datetime:",
// //           completedDatetime
// //         );
// //       } else if (
// //         job.completion_datetime &&
// //         job.completion_datetime !== "0000-00-00 00:00:00"
// //       ) {
// //         completedDatetime = job.completion_datetime;
// //         console.log(
// //           "[TookanTracking] Found completion_datetime:",
// //           completedDatetime
// //         );
// //       } else if (
// //         job.completed_time &&
// //         job.completed_time !== "0000-00-00 00:00:00"
// //       ) {
// //         completedDatetime = job.completed_time;
// //         console.log(
// //           "[TookanTracking] Found completed_time:",
// //           completedDatetime
// //         );
// //       }
// //     }

// //     // ✅ NEW: For failed (4) or cancelled (5, 6) deliveries
// //     if ([4, 5, 6].includes(jobStatus)) {
// //       // For failed/cancelled, use arrived_datetime if available
// //       if (
// //         job.arrived_datetime &&
// //         job.arrived_datetime !== "0000-00-00 00:00:00"
// //       ) {
// //         completedDatetime = job.arrived_datetime;
// //         console.log(
// //           "[TookanTracking] Failed/Cancelled - Using arrived_datetime:",
// //           completedDatetime
// //         );
// //       } else if (
// //         job.started_datetime &&
// //         job.started_datetime !== "0000-00-00 00:00:00"
// //       ) {
// //         completedDatetime = job.started_datetime;
// //         console.log(
// //           "[TookanTracking] Failed/Cancelled - Using started_datetime:",
// //           completedDatetime
// //         );
// //       }
// //     }

// //     // ✅ Fallback: Check task_history for any completion event
// //     if (!completedDatetime && job.task_history && job.task_history.length > 0) {
// //       // Look for the most recent state change
// //       const stateChanges = job.task_history
// //         .filter((task) => task.type === "state_changed")
// //         .sort(
// //           (a, b) =>
// //             new Date(b.creation_datetime) - new Date(a.creation_datetime)
// //         );

// //       if (stateChanges.length > 0) {
// //         completedDatetime = stateChanges[0].creation_datetime;
// //         console.log(
// //           "[TookanTracking] Using most recent state change from history:",
// //           completedDatetime
// //         );
// //       }
// //     }

// //     // ✅ Final fallback: Use current time if status indicates completion but no time found
// //     if (!completedDatetime && [3, 4, 5, 6].includes(jobStatus)) {
// //       completedDatetime = new Date().toISOString();
// //       console.log(
// //         "[TookanTracking] Using current time for completed/failed status:",
// //         completedDatetime
// //       );
// //     }

// //     console.log(
// //       "[TookanTracking] Final completed_datetime:",
// //       completedDatetime
// //     );

// //     // Get fleet/driver location
// //     let fleetData = null;
// //     let agentLat = null;
// //     let agentLng = null;
// //     let agentName = "Not assigned";
// //     let agentPhone = null;

// //     if (job.fleet_id && parseInt(job.fleet_id) > 0) {
// //       try {
// //         console.log(
// //           "[TookanTracking] Fetching fleet location for fleet_id:",
// //           job.fleet_id
// //         );

// //         const fleetPayload = {
// //           api_key: process.env.TOOKAN_API_KEY,
// //           user_id: parseInt(job.fleet_id),
// //         };

// //         const fleetResponse = await fetch(
// //           "https://api.tookanapp.com/v2/get_available_agents",
// //           {
// //             method: "POST",
// //             headers: { "Content-Type": "application/json" },
// //             body: JSON.stringify(fleetPayload),
// //           }
// //         );

// //         if (fleetResponse.ok) {
// //           const fleetResult = await fleetResponse.json();
// //           console.log("[TookanTracking] Fleet API response:", {
// //             status: fleetResult.status,
// //             message: fleetResult.message,
// //             hasData: !!fleetResult.data,
// //           });

// //           if (fleetResult.status === 200 && fleetResult.data) {
// //             const agents = Array.isArray(fleetResult.data)
// //               ? fleetResult.data
// //               : [fleetResult.data];

// //             fleetData = agents.find(
// //               (agent) =>
// //                 parseInt(agent.fleet_id) === parseInt(job.fleet_id) ||
// //                 parseInt(agent.user_id) === parseInt(job.fleet_id)
// //             );

// //             if (fleetData) {
// //               agentLat = parseFloat(
// //                 fleetData.latitude || fleetData.fleet_latitude
// //               );
// //               agentLng = parseFloat(
// //                 fleetData.longitude || fleetData.fleet_longitude
// //               );
// //               agentName =
// //                 fleetData.fleet_name ||
// //                 fleetData.username ||
// //                 fleetData.name ||
// //                 "Driver";
// //               agentPhone = fleetData.phone || fleetData.fleet_phone;

// //               console.log("[TookanTracking] ✅ Fleet location found:", {
// //                 name: agentName,
// //                 coordinates: `${agentLat}, ${agentLng}`,
// //               });
// //             }
// //           }
// //         }
// //       } catch (fleetError) {
// //         console.log("[TookanTracking] Fleet lookup error:", fleetError.message);
// //       }
// //     } else {
// //       console.log(
// //         "[TookanTracking] No driver assigned yet (fleet_id is 0 or null)"
// //       );
// //     }

// //     // Validate coordinates
// //     const hasValidAgentLocation = !!(
// //       agentLat &&
// //       agentLng &&
// //       !isNaN(agentLat) &&
// //       !isNaN(agentLng) &&
// //       Math.abs(agentLat) > 0.001 &&
// //       Math.abs(agentLng) > 0.001
// //     );

// //     // Build tracking response
// //     const trackingData = {
// //       job_id: parseInt(job.job_id),
// //       job_status: parseInt(job.job_status || 0),
// //       order_id: job.order_id || null,

// //       agent_id: job.fleet_id || null,
// //       agent_name: agentName,
// //       agent_phone: agentPhone,
// //       agent_location: {
// //         latitude: hasValidAgentLocation ? agentLat : null,
// //         longitude: hasValidAgentLocation ? agentLng : null,
// //         timestamp: fleetData?.updated_time || new Date().toISOString(),
// //         accuracy: fleetData?.accuracy || null,
// //       },

// //       created_datetime: job.creation_datetime || job.created_datetime,
// //       started_datetime: job.started_datetime,
// //       completed_datetime: completedDatetime, // ✅ Now properly set for all statuses
// //       acknowledged_datetime: job.acknowledged_datetime,
// //       arrived_datetime: job.arrived_datetime,
// //       updated_datetime: job.updated_datetime,

// //       pickup_location: {
// //         latitude: job.job_pickup_latitude
// //           ? parseFloat(job.job_pickup_latitude)
// //           : null,
// //         longitude: job.job_pickup_longitude
// //           ? parseFloat(job.job_pickup_longitude)
// //           : null,
// //         address: job.job_pickup_address || "",
// //         name: job.job_pickup_name || "",
// //         phone: job.job_pickup_phone || "",
// //       },

// //       delivery_location: {
// //         latitude:
// //           job.job_latitude || job.latitude
// //             ? parseFloat(job.job_latitude || job.latitude)
// //             : null,
// //         longitude:
// //           job.job_longitude || job.longitude
// //             ? parseFloat(job.job_longitude || job.longitude)
// //             : null,
// //         address: job.job_address || "",
// //         name: job.customer_username || "",
// //         phone: job.customer_phone || "",
// //       },

// //       tracking_url: job.tracking_link || null,
// //       distance_travelled: job.total_distance_travelled || null,
// //       job_description: job.job_description || "",
// //       status_text: getJobStatusText(job.job_status),
// //       task_history: job.task_history || [],
// //     };

// //     console.log("[TookanTracking] ✅ Final tracking data:", {
// //       job_id: trackingData.job_id,
// //       status: trackingData.job_status,
// //       status_text: trackingData.status_text,
// //       completed_datetime: trackingData.completed_datetime,
// //       hasAgentLocation: hasValidAgentLocation,
// //       agentName: trackingData.agent_name,
// //     });

// //     res.json({
// //       success: true,
// //       trackingData: trackingData,
// //       lastUpdate: new Date().toISOString(),
// //       locationData: {
// //         hasAgentLocation: hasValidAgentLocation,
// //         hasPickupLocation: !!trackingData.pickup_location.latitude,
// //         hasDeliveryLocation: !!trackingData.delivery_location.latitude,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("[TookanTracking] ❌ Error:", error);
// //     res.status(500).json({
// //       success: false,
// //       error: `Tracking failed: ${error.message}`,
// //     });
// //   }
// // });
// app.get("/api/tookan/tracking/:taskId", async (req, res) => {
//   const { taskId } = req.params;

//   if (!taskId) {
//     return res.status(400).json({
//       success: false,
//       error: "Task ID is required",
//     });
//   }

//   try {
//     console.log("[TookanTracking] Fetching live data for task:", taskId);

//     // Step 1: Get job details
//     const jobPayload = {
//       api_key: process.env.TOOKAN_API_KEY,
//       job_ids: [parseInt(taskId)],
//       include_task_history: 1,
//     };

//     const jobResponse = await fetch(
//       "https://api.tookanapp.com/v2/get_job_details",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(jobPayload),
//       }
//     );

//     if (!jobResponse.ok) {
//       throw new Error(`Tookan job API error: ${jobResponse.status}`);
//     }

//     const jobData = await jobResponse.json();

//     if (jobData.status !== 200 && jobData.status !== "200") {
//       return res.status(404).json({
//         success: false,
//         error: `Task not found: ${jobData.message}`,
//       });
//     }

//     const job = Array.isArray(jobData.data) ? jobData.data[0] : jobData.data;

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         error: "Job data not found",
//       });
//     }

//     // ✅ ENHANCED LOGGING - Log raw Tookan response
//     console.log("[TookanTracking] Raw job data from Tookan:", {
//       job_id: job.job_id,
//       job_status: job.job_status,
//       completed_datetime: job.completed_datetime,
//       completion_datetime: job.completion_datetime,
//       completed_time: job.completed_time,
//       creation_datetime: job.creation_datetime || job.created_datetime,
//       started_datetime: job.started_datetime,
//       arrived_datetime: job.arrived_datetime,
//       fleet_id: job.fleet_id,
//       order_id: job.order_id,
//       hasTaskHistory: !!job.task_history && job.task_history.length > 0,
//     });

//     console.log("[TookanTracking] Job status code:", job.job_status);
//     console.log(
//       "[TookanTracking] Job status text:",
//       getJobStatusText(job.job_status)
//     );
//     console.log("[TookanTracking] Fleet ID:", job.fleet_id);
//     console.log("[TookanTracking] Fleet name:", job.fleet_name);

//     // ✅ FIXED: Extract completed_datetime from multiple possible sources
//     let completedDatetime = null;

//     // Try direct fields first
//     if (
//       job.completed_datetime &&
//       job.completed_datetime !== "0000-00-00 00:00:00"
//     ) {
//       completedDatetime = job.completed_datetime;
//       console.log(
//         "[TookanTracking] Found completed_datetime:",
//         completedDatetime
//       );
//     } else if (
//       job.completion_datetime &&
//       job.completion_datetime !== "0000-00-00 00:00:00"
//     ) {
//       completedDatetime = job.completion_datetime;
//       console.log(
//         "[TookanTracking] Found completion_datetime:",
//         completedDatetime
//       );
//     } else if (
//       job.completed_time &&
//       job.completed_time !== "0000-00-00 00:00:00"
//     ) {
//       completedDatetime = job.completed_time;
//       console.log("[TookanTracking] Found completed_time:", completedDatetime);
//     }

//     // ✅ CRITICAL FIX: Extract from task_history if not found above
//     if (!completedDatetime && job.task_history && job.task_history.length > 0) {
//       // Look for the "Successful" or completion event in task history
//       const successEvent = job.task_history.find(
//         (task) =>
//           task.type === "state_changed" &&
//           (task.description?.includes("Successful") ||
//             task.label_description?.includes("successful") ||
//             task.description?.includes("Delivered") ||
//             job.job_status === 3) // Status 3 = completed
//       );

//       if (successEvent) {
//         completedDatetime = successEvent.creation_datetime;
//         console.log(
//           "[TookanTracking] Found completion time from task_history:",
//           completedDatetime
//         );
//       }
//     }

//     // ✅ If job_status is 3 (completed) but we still don't have a time, use current time
//     if (!completedDatetime && parseInt(job.job_status) === 3) {
//       completedDatetime = new Date().toISOString();
//       console.log(
//         "[TookanTracking] Job status is 3 (completed) - using current time:",
//         completedDatetime
//       );
//     }

//     console.log(
//       "[TookanTracking] Final completed_datetime:",
//       completedDatetime
//     );

//     // Step 2: Get fleet/driver location if driver is assigned
//     let fleetData = null;
//     let agentLat = null;
//     let agentLng = null;
//     let agentName = "Not assigned";
//     let agentPhone = null;

//     if (job.fleet_id && parseInt(job.fleet_id) > 0) {
//       try {
//         console.log(
//           "[TookanTracking] Fetching fleet location for fleet_id:",
//           job.fleet_id
//         );

//         const fleetPayload = {
//           api_key: process.env.TOOKAN_API_KEY,
//           user_id: parseInt(job.fleet_id),
//         };

//         const fleetResponse = await fetch(
//           "https://api.tookanapp.com/v2/get_available_agents",
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(fleetPayload),
//           }
//         );

//         if (fleetResponse.ok) {
//           const fleetResult = await fleetResponse.json();
//           console.log("[TookanTracking] Fleet API response:", {
//             status: fleetResult.status,
//             message: fleetResult.message,
//             hasData: !!fleetResult.data,
//           });

//           if (fleetResult.status === 200 && fleetResult.data) {
//             const agents = Array.isArray(fleetResult.data)
//               ? fleetResult.data
//               : [fleetResult.data];

//             fleetData = agents.find(
//               (agent) =>
//                 parseInt(agent.fleet_id) === parseInt(job.fleet_id) ||
//                 parseInt(agent.user_id) === parseInt(job.fleet_id)
//             );

//             if (fleetData) {
//               agentLat = parseFloat(
//                 fleetData.latitude || fleetData.fleet_latitude
//               );
//               agentLng = parseFloat(
//                 fleetData.longitude || fleetData.fleet_longitude
//               );
//               agentName =
//                 fleetData.fleet_name ||
//                 fleetData.username ||
//                 fleetData.name ||
//                 "Driver";
//               agentPhone = fleetData.phone || fleetData.fleet_phone;

//               console.log("[TookanTracking] ✅ Fleet location found:", {
//                 name: agentName,
//                 coordinates: `${agentLat}, ${agentLng}`,
//               });
//             }
//           }
//         }
//       } catch (fleetError) {
//         console.log("[TookanTracking] Fleet lookup error:", fleetError.message);
//       }
//     } else {
//       console.log(
//         "[TookanTracking] No driver assigned yet (fleet_id is 0 or null)"
//       );
//     }

//     // Validate coordinates
//     const hasValidAgentLocation = !!(
//       agentLat &&
//       agentLng &&
//       !isNaN(agentLat) &&
//       !isNaN(agentLng) &&
//       Math.abs(agentLat) > 0.001 &&
//       Math.abs(agentLng) > 0.001
//     );

//     // Build tracking response
//     const trackingData = {
//       job_id: parseInt(job.job_id),
//       job_status: parseInt(job.job_status || 0),
//       order_id: job.order_id || null,

//       agent_id: job.fleet_id || null,
//       agent_name: agentName,
//       agent_phone: agentPhone,
//       agent_location: {
//         latitude: hasValidAgentLocation ? agentLat : null,
//         longitude: hasValidAgentLocation ? agentLng : null,
//         timestamp: fleetData?.updated_time || new Date().toISOString(),
//         accuracy: fleetData?.accuracy || null,
//       },

//       created_datetime: job.creation_datetime || job.created_datetime,
//       started_datetime: job.started_datetime,
//       completed_datetime: completedDatetime, // ✅ FIXED: Now uses all possible sources
//       acknowledged_datetime: job.acknowledged_datetime,
//       arrived_datetime: job.arrived_datetime,
//       updated_datetime: job.updated_datetime,

//       pickup_location: {
//         latitude: job.job_pickup_latitude
//           ? parseFloat(job.job_pickup_latitude)
//           : null,
//         longitude: job.job_pickup_longitude
//           ? parseFloat(job.job_pickup_longitude)
//           : null,
//         address: job.job_pickup_address || "",
//         name: job.job_pickup_name || "",
//         phone: job.job_pickup_phone || "",
//       },

//       delivery_location: {
//         latitude:
//           job.job_latitude || job.latitude
//             ? parseFloat(job.job_latitude || job.latitude)
//             : null,
//         longitude:
//           job.job_longitude || job.longitude
//             ? parseFloat(job.job_longitude || job.longitude)
//             : null,
//         address: job.job_address || "",
//         name: job.customer_username || "",
//         phone: job.customer_phone || "",
//       },

//       tracking_url: job.tracking_link || null,
//       distance_travelled: job.total_distance_travelled || null,
//       job_description: job.job_description || "",
//       status_text: getJobStatusText(job.job_status),
//       task_history: job.task_history || [],
//     };

//     console.log("[TookanTracking] ✅ Final tracking data:", {
//       job_id: trackingData.job_id,
//       status: trackingData.job_status,
//       status_text: trackingData.status_text,
//       completed_datetime: trackingData.completed_datetime,
//       hasAgentLocation: hasValidAgentLocation,
//       agentName: trackingData.agent_name,
//     });

//     res.json({
//       success: true,
//       trackingData: trackingData,
//       lastUpdate: new Date().toISOString(),
//       locationData: {
//         hasAgentLocation: hasValidAgentLocation,
//         hasPickupLocation: !!trackingData.pickup_location.latitude,
//         hasDeliveryLocation: !!trackingData.delivery_location.latitude,
//       },
//     });
//   } catch (error) {
//     console.error("[TookanTracking] ❌ Error:", error);
//     res.status(500).json({
//       success: false,
//       error: `Tracking failed: ${error.message}`,
//     });
//   }
// });
// // Helper function to map job status codes to readable text

// app.get("/api/delivery/:deliveryId/status", async (req, res) => {
//   const { deliveryId } = req.params;
//   const delivery = deliveries.get(deliveryId);

//   if (!delivery) {
//     return res.status(404).json({
//       success: false,
//       error: "Delivery not found",
//     });
//   }

//   try {
//     let trackingData = null;
//     let updatedStatus = delivery.status;

//     // Fetch live tracking data if we have a Tookan job ID
//     if (delivery.jobId) {
//       const trackingResponse = await fetch(
//         `${PUBLIC_BASE_URL}/api/tookan/tracking/${delivery.jobId}`
//       );

//       if (trackingResponse.ok) {
//         const trackingResult = await trackingResponse.json();

//         if (trackingResult.success) {
//           trackingData = trackingResult.trackingData;

//           // Update status based on Tookan job status
//           // const statusMap = {
//           //   0: "confirmed",
//           //   1: "assigned",
//           //   2: "started",
//           //   3: "completed",
//           //   4: "failed",
//           //   6: "cancelled",
//           // };
//           const statusMap = {
//             0: "confirmed",
//             1: "assigned",
//             2: "started",
//             3: "completed",
//             4: "failed",
//             5: "cancelled",
//             6: "cancelled",
//             7: "accepted",
//             8: "arrived_pickup", // ✅ NEW: Add this
//             9: "started",
//             10: "unassigned",
//           };

//           updatedStatus = statusMap[trackingData.job_status] || "confirmed";

//           // Update stored delivery data
//           delivery.status = updatedStatus;
//           delivery.lastTracked = new Date().toISOString();
//           deliveries.set(deliveryId, delivery);
//         }
//       }
//     }

//     res.json({
//       success: true,
//       deliveryId: delivery.deliveryId,
//       status: updatedStatus,
//       jobId: delivery.jobId,
//       trackingUrl: delivery.trackingUrl,
//       trackingData: trackingData,
//       deliveryDetails: {
//         sender: {
//           name: delivery.shipmentDetails.senderName,
//           phone: delivery.shipmentDetails.senderPhone,
//           address: delivery.shipmentDetails.pickupAddress,
//           postcode: delivery.shipmentDetails.pickupPostcode,
//         },
//         receiver: {
//           name: delivery.shipmentDetails.receiverName,
//           phone: delivery.shipmentDetails.receiverNumber,
//           address: delivery.shipmentDetails.receiverAddress,
//           postcode: delivery.shipmentDetails.receiverPostcode,
//         },
//         package: {
//           weight: delivery.shipmentDetails.selectedWeight,
//           itemType: delivery.shipmentDetails.itemType,
//           isFragile: delivery.shipmentDetails.isFragile,
//           deliveryType: delivery.shipmentDetails.deliveryType,
//         },
//       },
//       cost: {
//         itemCost: delivery.shipmentDetails.basePrice,
//         deliveryCost: delivery.shipmentDetails.deliveryCost,
//         vat: delivery.shipmentDetails.vatAmount,
//         total: delivery.shipmentDetails.totalPrice,
//       },
//       timestamps: {
//         created: delivery.createdAt,
//         updated: delivery.updatedAt,
//         lastTracked: delivery.lastTracked,
//       },
//     });
//   } catch (error) {
//     console.error("[DeliveryStatus] Error fetching tracking data:", error);

//     // Return delivery info without tracking data if tracking fails
//     res.json({
//       success: true,
//       deliveryId: delivery.deliveryId,
//       status: delivery.status,
//       jobId: delivery.jobId,
//       trackingUrl: delivery.trackingUrl,
//       trackingData: null,
//       trackingError: error.message,
//       deliveryDetails: {
//         sender: {
//           name: delivery.shipmentDetails.senderName,
//           phone: delivery.shipmentDetails.senderPhone,
//           address: delivery.shipmentDetails.pickupAddress,
//           postcode: delivery.shipmentDetails.pickupPostcode,
//         },
//         receiver: {
//           name: delivery.shipmentDetails.receiverName,
//           phone: delivery.shipmentDetails.receiverNumber,
//           address: delivery.shipmentDetails.receiverAddress,
//           postcode: delivery.shipmentDetails.receiverPostcode,
//         },
//         package: {
//           weight: delivery.shipmentDetails.selectedWeight,
//           itemType: delivery.shipmentDetails.itemType,
//           isFragile: delivery.shipmentDetails.isFragile,
//           deliveryType: delivery.shipmentDetails.deliveryType,
//         },
//       },
//       cost: {
//         itemCost: delivery.shipmentDetails.basePrice,
//         deliveryCost: delivery.shipmentDetails.deliveryCost,
//         vat: delivery.shipmentDetails.vatAmount,
//         total: delivery.shipmentDetails.totalPrice,
//       },
//       timestamps: {
//         created: delivery.createdAt,
//         updated: delivery.updatedAt,
//       },
//     });
//   }
// });

// // Bulk tracking status for multiple deliveries (useful for dashboard)
// app.post("/api/tracking/bulk-status", async (req, res) => {
//   const { taskIds } = req.body;

//   if (!Array.isArray(taskIds) || taskIds.length === 0) {
//     return res.status(400).json({
//       success: false,
//       error: "Task IDs array is required",
//     });
//   }

//   try {
//     const trackingPromises = taskIds.map(async (taskId) => {
//       try {
//         const response = await fetch(
//           `${PUBLIC_BASE_URL}/api/tookan/tracking/${taskId}`
//         );
//         const data = await response.json();

//         return {
//           taskId,
//           success: data.success,
//           trackingData: data.success ? data.trackingData : null,
//           error: data.success ? null : data.error,
//         };
//       } catch (error) {
//         return {
//           taskId,
//           success: false,
//           trackingData: null,
//           error: error.message,
//         };
//       }
//     });

//     const results = await Promise.all(trackingPromises);

//     res.json({
//       success: true,
//       results: results,
//       summary: {
//         total: results.length,
//         successful: results.filter((r) => r.success).length,
//         failed: results.filter((r) => !r.success).length,
//       },
//     });
//   } catch (error) {
//     console.error("[BulkTracking] Error:", error);
//     res.status(500).json({
//       success: false,
//       error: `Bulk tracking failed: ${error.message}`,
//     });
//   }
// });

// // Test endpoint to validate tracking setup
// app.get("/api/tracking/test/:taskId", async (req, res) => {
//   const { taskId } = req.params;

//   try {
//     // Test all tracking-related endpoints
//     const tests = {
//       geocoding: null,
//       directions: null,
//       tookanTracking: null,
//     };

//     // Test geocoding with a sample UK postcode
//     try {
//       const geocodeResponse = await fetch(
//         `${PUBLIC_BASE_URL}/api/geocode?postcode=SW1A 1AA`
//       );
//       tests.geocoding = {
//         success: geocodeResponse.ok,
//         status: geocodeResponse.status,
//         hasGoogleKey: !!process.env.GOOGLE_MAPS_API_KEY,
//       };
//     } catch (error) {
//       tests.geocoding = { success: false, error: error.message };
//     }

//     // Test directions between two London locations
//     try {
//       const directionsResponse = await fetch(
//         `${PUBLIC_BASE_URL}/api/directions?origin=51.5074,-0.1278&destination=51.5205,-0.0837`
//       );
//       tests.directions = {
//         success: directionsResponse.ok,
//         status: directionsResponse.status,
//       };
//     } catch (error) {
//       tests.directions = { success: false, error: error.message };
//     }

//     // Test Tookan tracking if task ID provided
//     if (taskId) {
//       try {
//         const trackingResponse = await fetch(
//           `${PUBLIC_BASE_URL}/api/tookan/tracking/${taskId}`
//         );
//         tests.tookanTracking = {
//           success: trackingResponse.ok,
//           status: trackingResponse.status,
//           hasTookanKey: !!process.env.TOOKAN_API_KEY,
//         };
//       } catch (error) {
//         tests.tookanTracking = { success: false, error: error.message };
//       }
//     }

//     res.json({
//       success: true,
//       message: "Tracking system test results",
//       tests: tests,
//       environment: {
//         hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
//         hasTookanKey: !!process.env.TOOKAN_API_KEY,
//         serverUrl: PUBLIC_BASE_URL,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: `Tracking test failed: ${error.message}`,
//     });
//   }
// });
// // Add these fixes to your backend server.js

// //-----------------------------------FIXED GEOCODING ENDPOINT----------------------------------
// app.get("/api/geocode", async (req, res) => {
//   const { postcode } = req.query;

//   if (!postcode) {
//     return res.status(400).json({
//       success: false,
//       error: "Postcode parameter is required",
//     });
//   }

//   try {
//     console.log("[Geocode] Processing postcode:", postcode);

//     // First try UK Government API (free, reliable for UK postcodes)
//     try {
//       const ukApiResponse = await getCoordinatesFromPostcodeUKGov(postcode);
//       console.log("[Geocode] UK Gov API success:", ukApiResponse);

//       return res.json({
//         success: true,
//         postcode: postcode.trim().toUpperCase(),
//         coordinates: {
//           lat: ukApiResponse.latitude,
//           lng: ukApiResponse.longitude,
//         },
//         source: "uk_gov_api",
//       });
//     } catch (ukError) {
//       console.log("[Geocode] UK Gov API failed:", ukError.message);
//     }

//     // Fallback to Google Maps API if available
//     const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
//     if (googleApiKey) {
//       try {
//         // Clean and format postcode for Google
//         const cleanPostcode = postcode
//           .trim()
//           .replace(/\s+/g, " ")
//           .toUpperCase();
//         const encodedPostcode = encodeURIComponent(`${cleanPostcode}, UK`);

//         const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}&region=uk&key=${googleApiKey}`;

//         console.log("[Geocode] Trying Google API for:", cleanPostcode);

//         const response = await fetch(geocodeUrl);

//         if (!response.ok) {
//           throw new Error(`Google Geocoding API error: ${response.status}`);
//         }

//         const data = await response.json();

//         if (data.status === "OK" && data.results && data.results.length > 0) {
//           const location = data.results[0].geometry.location;
//           const formattedAddress = data.results[0].formatted_address;

//           console.log("[Geocode] Google API success:", {
//             postcode: cleanPostcode,
//             coordinates: `${location.lat}, ${location.lng}`,
//           });

//           return res.json({
//             success: true,
//             postcode: cleanPostcode,
//             coordinates: {
//               lat: location.lat,
//               lng: location.lng,
//             },
//             formattedAddress,
//             placeId: data.results[0].place_id,
//             source: "google_api",
//           });
//         } else {
//           console.log("[Geocode] Google API returned:", data.status);
//         }
//       } catch (googleError) {
//         console.log("[Geocode] Google API error:", googleError.message);
//       }
//     }

//     // Final fallback to Mapbox if available
//     const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
//     if (mapboxToken) {
//       try {
//         const coords = await getCoordinatesFromPostcode(postcode);
//         console.log("[Geocode] Mapbox fallback success:", coords);

//         return res.json({
//           success: true,
//           postcode: postcode.trim().toUpperCase(),
//           coordinates: {
//             lat: coords.latitude,
//             lng: coords.longitude,
//           },
//           source: "mapbox_api",
//         });
//       } catch (mapboxError) {
//         console.log("[Geocode] Mapbox fallback failed:", mapboxError.message);
//       }
//     }

//     // If all methods fail
//     return res.status(404).json({
//       success: false,
//       error: `Unable to geocode postcode: ${postcode}. Please verify the postcode is correct.`,
//       postcode: postcode,
//       attempted: [
//         "uk_gov",
//         googleApiKey ? "google" : null,
//         mapboxToken ? "mapbox" : null,
//       ].filter(Boolean),
//     });
//   } catch (error) {
//     console.error("[Geocode] Unexpected error:", error);
//     res.status(500).json({
//       success: false,
//       error: `Geocoding service error: ${error.message}`,
//     });
//   }
// });

// // function getJobStatusText(jobStatus) {
// //   const statusMap = {
// //     0: "Confirmed",
// //     1: "Assigned to driver",
// //     2: "Driver started",
// //     3: "Delivered successfully",
// //     4: "Delivery failed",
// //     5: "Cancelled",
// //     6: "Cancelled by dispatcher",
// //     7: "Cancelled by customer",
// //     8: "Driver arrived at pickup",
// //     9: "Driver departed from pickup",
// //   };

// //   return statusMap[parseInt(jobStatus)] || `Status ${jobStatus}`;
// // }
// //-----------------------------------TEST ENDPOINTS----------------------------------
// // Add a test endpoint to verify your APIs
// app.get("/api/test/geocode/:postcode", async (req, res) => {
//   const { postcode } = req.params;

//   const tests = {
//     uk_gov: null,
//     google: null,
//     mapbox: null,
//   };

//   // Test UK Government API
//   try {
//     const ukResult = await getCoordinatesFromPostcodeUKGov(postcode);
//     tests.uk_gov = { success: true, coordinates: ukResult };
//   } catch (error) {
//     tests.uk_gov = { success: false, error: error.message };
//   }

//   // Test Google API
//   if (process.env.GOOGLE_MAPS_API_KEY) {
//     try {
//       const cleanPostcode = postcode.trim().replace(/\s+/g, " ").toUpperCase();
//       const encodedPostcode = encodeURIComponent(`${cleanPostcode}, UK`);
//       const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}&region=uk&key=${process.env.GOOGLE_MAPS_API_KEY}`;

//       const response = await fetch(geocodeUrl);
//       const data = await response.json();

//       if (data.status === "OK" && data.results?.length > 0) {
//         tests.google = {
//           success: true,
//           coordinates: {
//             lat: data.results[0].geometry.location.lat,
//             lng: data.results[0].geometry.location.lng,
//           },
//         };
//       } else {
//         tests.google = {
//           success: false,
//           error: `Google API status: ${data.status}`,
//         };
//       }
//     } catch (error) {
//       tests.google = { success: false, error: error.message };
//     }
//   }

//   // Test Mapbox API
//   if (process.env.MAPBOX_ACCESS_TOKEN) {
//     try {
//       const coords = await getCoordinatesFromPostcode(postcode);
//       tests.mapbox = { success: true, coordinates: coords };
//     } catch (error) {
//       tests.mapbox = { success: false, error: error.message };
//     }
//   }

//   res.json({
//     postcode,
//     tests,
//     environment: {
//       hasGoogleKey: !!process.env.GOOGLE_MAPS_API_KEY,
//       hasMapboxKey: !!process.env.MAPBOX_ACCESS_TOKEN,
//     },
//   });
// });

// app.get("/api/test/tracking/:taskId", async (req, res) => {
//   const { taskId } = req.params;

//   try {
//     const testPayload = {
//       api_key: process.env.TOOKAN_API_KEY,
//       job_id: parseInt(taskId),
//     };

//     console.log("[TrackingTest] Testing with payload:", {
//       job_id: testPayload.job_id,
//       has_api_key: !!testPayload.api_key,
//     });

//     const response = await fetch(
//       "https://api.tookanapp.com/v2/get_job_details",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(testPayload),
//       }
//     );

//     const data = await response.json();

//     res.json({
//       test: "tracking_api",
//       taskId,
//       httpStatus: response.status,
//       tookanResponse: {
//         status: data.status,
//         message: data.message,
//         hasData: !!data.data,
//         dataKeys: data.data ? Object.keys(data.data) : [],
//       },
//       environment: {
//         hasTookanKey: !!process.env.TOOKAN_API_KEY,
//         serverTime: new Date().toISOString(),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       test: "tracking_api",
//       taskId,
//       error: error.message,
//       environment: {
//         hasTookanKey: !!process.env.TOOKAN_API_KEY,
//       },
//     });
//   }
// });

// app.get("/api/google-pay-config", (req, res) => {
//   res.json({
//     environment: process.env.NODE_ENV === "production" ? "PRODUCTION" : "TEST",
//     merchantInfo: {
//       merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || "BCR2DN4T2LKGCFMW",
//       merchantName: "Rapid Delivery",
//     },
//     allowedPaymentMethods: [
//       {
//         type: "CARD",
//         parameters: {
//           allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
//           allowedCardNetworks: [
//             "AMEX",
//             "DISCOVER",
//             "INTERAC",
//             "JCB",
//             "MASTERCARD",
//             "VISA",
//           ],
//         },
//         tokenizationSpecification: {
//           type: "PAYMENT_GATEWAY",
//           parameters: {
//             gateway: "stripe",
//             "stripe:version": "2018-10-31",
//             "stripe:publishableKey": process.env.STRIPE_PUBLISHABLE_KEY,
//           },
//         },
//       },
//     ],
//   });
// });
// app.post("/api/process-google-pay", async (req, res) => {
//   const { paymentToken, totalAmount, shipmentDetails } = req.body || {};

//   if (!paymentToken || !totalAmount || !shipmentDetails) {
//     return res.status(400).json({
//       error: "Missing paymentToken, totalAmount, or shipmentDetails",
//     });
//   }

//   const missing = validateShipmentDetails(shipmentDetails);
//   if (missing.length) {
//     return res.status(400).json({
//       error: `Missing fields in shipmentDetails: ${missing.join(", ")}`,
//     });
//   }

//   try {
//     console.log("[GooglePay] Processing payment with Stripe token");

//     // Create PaymentIntent with Stripe
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(Number(totalAmount) * 100), // Convert to cents
//       currency: "gbp",
//       payment_method_data: {
//         type: "card",
//         token: paymentToken.id, // Stripe token from Google Pay
//       },
//       confirm: true,
//       metadata: {
//         ...Object.fromEntries(
//           Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
//         ),
//       },
//     });

//     if (paymentIntent.status === "succeeded") {
//       const deliveryId = `DEL-${Date.now()}-${Math.random()
//         .toString(36)
//         .substr(2, 9)}`;
//       const sessionId = `gpay_${paymentIntent.id}`;

//       sessionData.set(sessionId, {
//         sessionId,
//         status: "payment_completed",
//         shipmentDetails,
//         totalAmount,
//         paymentIntentId: paymentIntent.id,
//         deliveryId,
//         paymentMethod: "google_pay",
//         createdAt: new Date().toISOString(),
//         completedAt: new Date().toISOString(),
//       });

//       console.log("[GooglePay] Payment succeeded:", paymentIntent.id);

//       res.json({
//         success: true,
//         paymentIntentId: paymentIntent.id,
//         sessionId,
//         deliveryId,
//         message: "Google Pay payment processed successfully",
//       });
//     } else {
//       res.status(400).json({
//         success: false,
//         error: `Payment status: ${paymentIntent.status}`,
//       });
//     }
//   } catch (error) {
//     console.error("[GooglePay] Error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to process Google Pay payment",
//       details: error.message,
//     });
//   }
// });
// app.post("/api/create-google-pay-intent", async (req, res) => {
//   const { totalAmount, shipmentDetails } = req.body || {};

//   if (!totalAmount || !shipmentDetails) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing totalAmount or shipmentDetails",
//     });
//   }

//   const missing = validateShipmentDetails(shipmentDetails);
//   if (missing.length) {
//     return res.status(400).json({
//       success: false,
//       error: `Missing fields: ${missing.join(", ")}`,
//     });
//   }

//   try {
//     console.log("[GooglePay] Creating PaymentIntent for amount:", totalAmount);

//     // Create PaymentIntent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(Number(totalAmount) * 100),
//       currency: "gbp",
//       payment_method_types: ["card"], // Google Pay uses card underneath
//       metadata: {
//         ...Object.fromEntries(
//           Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
//         ),
//         payment_method: "google_pay",
//       },
//     });

//     console.log("[GooglePay] PaymentIntent created:", paymentIntent.id);

//     res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//     });
//   } catch (error) {
//     console.error("[GooglePay] Error creating PaymentIntent:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create payment intent",
//       details: error.message,
//     });
//   }
// });

// // Step 2: Confirm payment and create delivery (called after presentGooglePay succeeds)
// app.post("/api/confirm-google-pay", async (req, res) => {
//   const { paymentIntentId, shipmentDetails } = req.body || {};

//   if (!paymentIntentId || !shipmentDetails) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing paymentIntentId or shipmentDetails",
//     });
//   }

//   try {
//     console.log("[GooglePay] Confirming payment:", paymentIntentId);

//     // Retrieve the PaymentIntent to verify it succeeded
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     if (paymentIntent.status !== "succeeded") {
//       return res.status(400).json({
//         success: false,
//         error: `Payment not completed. Status: ${paymentIntent.status}`,
//         status: paymentIntent.status,
//       });
//     }

//     // Generate delivery ID
//     const deliveryId = `DEL-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`;
//     const sessionId = `gpay_${paymentIntentId}`;

//     // Store session data
//     const sessionEntry = {
//       sessionId,
//       status: "payment_completed",
//       shipmentDetails,
//       totalAmount: paymentIntent.amount / 100, // Convert from cents
//       paymentIntentId,
//       deliveryId,
//       paymentMethod: "google_pay",
//       createdAt: new Date().toISOString(),
//       completedAt: new Date().toISOString(),
//     };

//     sessionData.set(sessionId, sessionEntry);

//     console.log("[GooglePay] Payment confirmed successfully:", {
//       paymentIntentId,
//       deliveryId,
//       sessionId,
//       amount: sessionEntry.totalAmount,
//     });

//     res.json({
//       success: true,
//       sessionId,
//       deliveryId,
//       paymentIntentId,
//       message: "Google Pay payment confirmed successfully",
//     });
//   } catch (error) {
//     console.error("[GooglePay] Error confirming payment:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to confirm payment",
//       details: error.message,
//     });
//   }
// });

// // Add these new endpoints to your server.js file

// // 1. Create Payment Intent for Klarna (similar to Google Pay)
// app.post("/api/create-klarna-intent", async (req, res) => {
//   const { totalAmount, shipmentDetails } = req.body || {};

//   if (!totalAmount || !shipmentDetails) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing totalAmount or shipmentDetails",
//     });
//   }

//   const missing = validateShipmentDetails(shipmentDetails);
//   if (missing.length) {
//     return res.status(400).json({
//       success: false,
//       error: `Missing fields: ${missing.join(", ")}`,
//     });
//   }

//   try {
//     console.log("[Klarna] Creating PaymentIntent for amount:", totalAmount);

//     // Create PaymentIntent with Klarna
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(Number(totalAmount) * 100),
//       currency: "gbp",
//       payment_method_types: ["klarna"], // Klarna payment method
//       metadata: {
//         ...Object.fromEntries(
//           Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
//         ),
//         payment_method: "klarna",
//       },
//     });

//     console.log("[Klarna] PaymentIntent created:", paymentIntent.id);

//     res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//     });
//   } catch (error) {
//     console.error("[Klarna] Error creating PaymentIntent:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create payment intent",
//       details: error.message,
//     });
//   }
// });

// // 2. Confirm Klarna payment and create delivery
// app.post("/api/confirm-klarna", async (req, res) => {
//   const { paymentIntentId, shipmentDetails } = req.body || {};

//   if (!paymentIntentId || !shipmentDetails) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing paymentIntentId or shipmentDetails",
//     });
//   }

//   try {
//     console.log("[Klarna] Confirming payment:", paymentIntentId);

//     // Retrieve the PaymentIntent to verify it succeeded
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     if (paymentIntent.status !== "succeeded") {
//       return res.status(400).json({
//         success: false,
//         error: `Payment not completed. Status: ${paymentIntent.status}`,
//         status: paymentIntent.status,
//       });
//     }

//     // Generate delivery ID
//     const deliveryId = `DEL-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`;
//     const sessionId = `klarna_${paymentIntentId}`;

//     // Store session data
//     const sessionEntry = {
//       sessionId,
//       status: "payment_completed",
//       shipmentDetails,
//       totalAmount: paymentIntent.amount / 100,
//       paymentIntentId,
//       deliveryId,
//       paymentMethod: "klarna",
//       createdAt: new Date().toISOString(),
//       completedAt: new Date().toISOString(),
//     };

//     sessionData.set(sessionId, sessionEntry);

//     console.log("[Klarna] Payment confirmed successfully:", {
//       paymentIntentId,
//       deliveryId,
//       sessionId,
//       amount: sessionEntry.totalAmount,
//     });

//     res.json({
//       success: true,
//       sessionId,
//       deliveryId,
//       paymentIntentId,
//       message: "Klarna payment confirmed successfully",
//     });
//   } catch (error) {
//     console.error("[Klarna] Error confirming payment:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to confirm payment",
//       details: error.message,
//     });
//   }
// });

// app.post("/api/create-apple-pay-intent", async (req, res) => {
//   const { totalAmount, shipmentDetails } = req.body || {};

//   if (!totalAmount || !shipmentDetails) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing totalAmount or shipmentDetails",
//     });
//   }

//   const missing = validateShipmentDetails(shipmentDetails);
//   if (missing.length) {
//     return res.status(400).json({
//       success: false,
//       error: `Missing fields: ${missing.join(", ")}`,
//     });
//   }

//   try {
//     console.log("[ApplePay] Creating PaymentIntent for amount:", totalAmount);

//     // Create PaymentIntent - Apple Pay uses 'card' as the payment method type
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(Number(totalAmount) * 100),
//       currency: "gbp",
//       payment_method_types: ["card"], // Apple Pay uses card underneath
//       metadata: {
//         ...Object.fromEntries(
//           Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
//         ),
//         payment_method: "apple_pay",
//       },
//     });

//     console.log("[ApplePay] PaymentIntent created:", paymentIntent.id);

//     res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//     });
//   } catch (error) {
//     console.error("[ApplePay] Error creating PaymentIntent:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create payment intent",
//       details: error.message,
//     });
//   }
// });

// // 2. Confirm Apple Pay payment and create delivery
// app.post("/api/confirm-apple-pay", async (req, res) => {
//   const { paymentIntentId, shipmentDetails } = req.body || {};

//   if (!paymentIntentId || !shipmentDetails) {
//     return res.status(400).json({
//       success: false,
//       error: "Missing paymentIntentId or shipmentDetails",
//     });
//   }

//   try {
//     console.log("[ApplePay] Confirming payment:", paymentIntentId);

//     // Retrieve the PaymentIntent to verify it succeeded
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     if (paymentIntent.status !== "succeeded") {
//       return res.status(400).json({
//         success: false,
//         error: `Payment not completed. Status: ${paymentIntent.status}`,
//         status: paymentIntent.status,
//       });
//     }

//     // Generate delivery ID
//     const deliveryId = `DEL-${Date.now()}-${Math.random()
//       .toString(36)
//       .substr(2, 9)}`;
//     const sessionId = `applepay_${paymentIntentId}`;

//     // Store session data
//     const sessionEntry = {
//       sessionId,
//       status: "payment_completed",
//       shipmentDetails,
//       totalAmount: paymentIntent.amount / 100,
//       paymentIntentId,
//       deliveryId,
//       paymentMethod: "apple_pay",
//       createdAt: new Date().toISOString(),
//       completedAt: new Date().toISOString(),
//     };

//     sessionData.set(sessionId, sessionEntry);

//     console.log("[ApplePay] Payment confirmed successfully:", {
//       paymentIntentId,
//       deliveryId,
//       sessionId,
//       amount: sessionEntry.totalAmount,
//     });

//     res.json({
//       success: true,
//       sessionId,
//       deliveryId,
//       paymentIntentId,
//       message: "Apple Pay payment confirmed successfully",
//     });
//   } catch (error) {
//     console.error("[ApplePay] Error confirming payment:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to confirm payment",
//       details: error.message,
//     });
//   }
// });

// // ---------- Start Server ----------
// app.listen(port, "0.0.0.0", () => {
//   console.log(`Server running on ${PUBLIC_BASE_URL}`);
//   console.log(
//     "Remember to expose /webhook to Stripe when testing locally (e.g., via ngrok)."
//   );
//   console.log("Available endpoints:");
//   console.log("  GET  / - Health check");
//   console.log("  GET  /api/health - Service status");
//   console.log("  POST /api/tookan/delivery-cost - Calculate delivery cost");
//   console.log("  POST /api/create-checkout-session - Web checkout (PRIMARY)");
//   console.log("  GET  /api/session/:id/payment-status - Check payment status");
//   console.log(
//     "  GET  /api/session/:id/create-tookan-task - Create/get Tookan task"
//   );
//   console.log("  GET  /api/delivery/:id - Get delivery details");
//   console.log("  POST /webhook - Stripe webhook");
//   console.log("  POST /api/webhook/tookan - Tookan webhook");
//   console.log("  GET  /payment-success - Payment success page");
//   console.log("  GET  /payment-cancel - Payment cancel page");
// });
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import Stripe from "stripe";
import { readFileSync } from "fs";
import admin from "firebase-admin";
import {
  sendNotificationByExternalId,
  sendGlobalAnnouncement,
} from "./oneSignalService.js";

import { registerUserToken, sendPushNotification } from "./expoPushService.js";

dotenv.config();
try {
  let serviceAccount;

  // Check if running on Vercel
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("🔧 Running on Vercel - using environment variable");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Local development - read from JSON file
    console.log("🔧 Running locally - using JSON file");
    serviceAccount = JSON.parse(
      readFileSync(
        "./rapid-delivery-app-1d838-firebase-adminsdk-fbsvc-eb14176c94.json",
        "utf8"
      )
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized successfully");
  }
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  process.exit(1);
}
// let serviceAccount;

// try {
//   // ✅ Read from local JSON file (no .env needed)
//   serviceAccount = JSON.parse(
//     readFileSync(
//       "./rapid-delivery-app-1d838-firebase-adminsdk-fbsvc-eb14176c94.json",
//       "utf8"
//     )
//   );

//   if (!admin.apps.length) {
//     admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount),
//     });
//     console.log("✅ Firebase initialized successfully");
//   }
// } catch (error) {
//   console.error("❌ Firebase initialization failed:", error.message);
//   process.exit(1);
// }
// ---------- Configuration ----------
const app = express();
const port = 3000;
const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(stripeSecret);

// Keep this the same IP your mobile app is using
//const PUBLIC_BASE_URL = "http://192.168.43.176:3000";
const PUBLIC_BASE_URL = "https://rapid-fullstack.vercel.app";

const webhookDataStore = {};

// In-memory store (replace with Redis/Postgres in production)
const sessionData = new Map();
const deliveries = new Map();

// ---------- Sanity checks ----------
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY is not set.");
  process.exit(1);
}
if (!process.env.TOOKAN_API_KEY) {
  console.error("ERROR: TOOKAN_API_KEY is not set.");
  process.exit(1);
}
if (!process.env.MAPBOX_ACCESS_TOKEN) {
  console.error("ERROR: MAPBOX_ACCESS_TOKEN is not set.");
  process.exit(1);
}

console.log("✅ Env OK. Starting server…");

// ---------- Utility helpers ----------
// ADD THIS MAPPING FUNCTION at the TOP of your backend file (before all route handlers)

const mapTookanStatus = (tookanStatus) => {
  const statusCode = parseInt(tookanStatus);

  switch (statusCode) {
    case 0:
      return "created";
    case 1:
      return "assigned";
    case 2:
      return "started";
    case 3:
      return "successful";
    case 4:
      return "failed";
    case 5:
      return "cancelled";
    case 6:
      return "cancelled_dispatcher";
    case 7:
      return "acknowledged";
    case 8:
      return "arrived";
    case 9:
      return "started_delivery"; // ✅ ADDED
    case 10:
      return "unassigned";
    case 11:
      return "confirming_delivery";
    case 12:
      return "delivery_confirmed";
    default:
      return "unknown";
  }
};

function formatDateTime(date) {
  // Tookan expects datetime in format: "YYYY-MM-DD HH:MM:SS"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Add this helper function for geocoding
async function getCoordinates(address) {
  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!googleApiKey) {
      console.warn("[Geocode] Google Maps API key not available");
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=uk&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return [location.lng, location.lat]; // Returns [longitude, latitude]
    }

    return null;
  } catch (error) {
    console.warn("[Geocode] Error:", error.message);
    return null;
  }
}

function calculateDeliveryRate(distanceKm, weightRange) {
  const weightRates = {
    "1-5kg": 0.8,
    "5-10kg": 1.2,
    "10-20kg": 1.8,
    "20-30kg": 2.5,
  };
  const baseRate = weightRates[weightRange] || 1.0;
  const minimumCharge = 5.0;
  const calculatedCost = distanceKm * baseRate;
  return Math.max(calculatedCost, minimumCharge);
}

function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getCoordinatesFromPostcodeUKGov(postcode) {
  const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
  const url = `https://api.postcodes.io/postcodes/${cleanPostcode}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`UK Gov API ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data.status === 200 && data.result) {
    const { latitude, longitude } = data.result;
    return { latitude, longitude };
  }
  throw new Error(`Invalid UK postcode or no data for ${postcode}`);
}

async function getCoordinatesFromPostcode(postcode) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  try {
    return await getCoordinatesFromPostcodeUKGov(postcode);
  } catch (e) {
    console.log("[Geocode] UK Gov failed, trying Mapbox:", e.message);
  }

  const queries = [
    postcode.trim().toUpperCase(),
    postcode.replace(/\s+/g, "").toUpperCase(),
    `${postcode.trim().toUpperCase()}, UK`,
    `${postcode.trim().toUpperCase()}, United Kingdom`,
  ];

  for (const q of queries) {
    try {
      const encoded = encodeURIComponent(q);
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=GB&types=postcode&access_token=${mapboxToken}`;
      let res = await fetch(url);
      let data = await res.json();
      if (data.features?.length) {
        const [lon, lat] = data.features[0].center;
        return { latitude: lat, longitude: lon };
      }
      url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=GB&access_token=${mapboxToken}`;
      res = await fetch(url);
      data = await res.json();
      if (data.features?.length) {
        const [lon, lat] = data.features[0].center;
        return { latitude: lat, longitude: lon };
      }
    } catch (err) {
      console.log(`[Geocode] Mapbox query "${q}" error:`, err.message);
    }
  }

  throw new Error(`No coordinates found for postcode: ${postcode}`);
}

async function calculateDistance(pickupCoords, deliveryCoords) {
  console.log("[Distance] Using haversine estimate.");
  const straight = calculateStraightLineDistance(
    pickupCoords.latitude,
    pickupCoords.longitude,
    deliveryCoords.latitude,
    deliveryCoords.longitude
  );
  const estimatedDriving = straight * 1.3;
  const estimatedTimeSec = (estimatedDriving / 50) * 3600;
  return {
    distance: estimatedDriving,
    duration: estimatedTimeSec,
    estimated: true,
    fallback: true,
  };
}

function validateShipmentDetails(details) {
  const required = [
    "senderName",
    "senderPhone",
    "pickupAddress",
    "pickupPostcode",
    "date",
    "receiverName",
    "receiverNumber",
    "receiverAddress",
    "receiverPostcode",
    "itemType",
    "selectedWeight",
    "deliveryType",
    "basePrice",
    "deliveryCost",
    "vatAmount",
    "totalPrice",
  ];

  const missing = required.filter(
    (k) =>
      details[k] === undefined ||
      details[k] === null ||
      (typeof details[k] === "string" && !details[k].trim())
  );

  return missing;
}

function sanitize(obj, keys = []) {
  const copy = JSON.parse(JSON.stringify(obj || {}));
  for (const k of keys) {
    if (copy[k]) copy[k] = "***";
  }
  return copy;
}

// ---------- Middleware ----------
// Raw body for Stripe webhook ONLY
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    bodyParser.json({ limit: "1mb" })(req, res, next);
  }
});

// Simple CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Stripe-Signature"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// ---------- Health / Debug ----------
app.get("/", (req, res) => {
  res.json({
    message: "Delivery API running",
    status: "OK",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      test_notification: "POST /api/test-notification",
      test_firestore: "/api/test/firestore",
      test_onesignal: "POST /api/test/onesignal",
    },
  });
});
async function saveNotificationToFirestore(userId, notificationData) {
  try {
    const notification = {
      userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || "general",
      data: notificationData.data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      shipmentId: notificationData.shipmentId || null,
      icon: notificationData.icon || "📦",
    };

    const docRef = await db.collection("notifications").add(notification);

    console.log("✅ Notification saved to Firestore:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Error saving notification to Firestore:", error);
    return { success: false, error: error.message };
  }
}

app.post("/api/register-expo-token", async (req, res) => {
  try {
    const { userId, expoPushToken } = req.body;

    if (!userId || !expoPushToken) {
      return res.status(400).json({
        success: false,
        error: "userId and expoPushToken are required",
      });
    }

    registerUserToken(userId, expoPushToken);

    console.log(`✅ Registered Expo token for user ${userId}`);

    res.json({
      success: true,
      message: "Token registered successfully",
      userId,
    });
  } catch (error) {
    console.error("❌ Error registering token:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test notification endpoint

// Send shipment update notification
app.post("/api/shipment-update", async (req, res) => {
  try {
    const { userId, userName, itemName, quantity, shipmentId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const title = "📦 Shipment Update";
    const message = `Hi ${userName}! Your ${itemName} (${quantity}) is on its way!`;

    // 1. Send push notification via OneSignal
    const pushResult = await sendNotificationByExternalId(
      userId,
      title,
      message,
      {
        shipmentId,
        type: "shipment_update",
        screen: "TrackShipment",
      }
    );

    // 2. Save to Firestore for in-app notification list
    const firestoreResult = await saveNotificationToFirestore(userId, {
      title,
      message,
      type: "shipment_update",
      shipmentId,
      icon: "🚚",
      data: {
        shipmentId,
        itemName,
        quantity,
      },
    });

    console.log("✅ Shipment notification sent and saved");

    res.json({
      success: true,
      push: pushResult,
      firestore: firestoreResult,
    });
  } catch (error) {
    console.error("❌ Error sending shipment notification:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send delivery completed notification
app.post("/api/delivery-completed", async (req, res) => {
  try {
    const { userId, userName, shipmentId, itemName } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const title = "✅ Delivery Completed!";
    const message = `Great news ${userName}! Your ${
      itemName || "package"
    } has been delivered successfully.`;

    // 1. Send push notification
    const pushResult = await sendNotificationByExternalId(
      userId,
      title,
      message,
      {
        shipmentId,
        type: "delivery_completed",
        screen: "Home",
      }
    );

    // 2. Save to Firestore
    const firestoreResult = await saveNotificationToFirestore(userId, {
      title,
      message,
      type: "delivery_completed",
      shipmentId,
      icon: "✅",
      data: {
        shipmentId,
        itemName,
      },
    });

    console.log("✅ Delivery notification sent and saved");

    res.json({
      success: true,
      push: pushResult,
      firestore: firestoreResult,
    });
  } catch (error) {
    console.error("❌ Error sending delivery notification:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send payment success notification
app.post("/api/payment-success-notification", async (req, res) => {
  try {
    const { userId, userName, amount, shipmentId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const title = "💳 Payment Successful";
    const message = `Hi ${userName}! Your payment of ${amount} has been processed successfully.`;

    // Send push notification
    const pushResult = await sendNotificationByExternalId(
      userId,
      title,
      message,
      {
        shipmentId,
        type: "payment_success",
        screen: "Home",
      }
    );

    // Save to Firestore
    const firestoreResult = await saveNotificationToFirestore(userId, {
      title,
      message,
      type: "payment_success",
      shipmentId,
      icon: "💳",
      data: {
        shipmentId,
        amount,
      },
    });

    console.log("✅ Payment notification sent and saved");

    res.json({
      success: true,
      push: pushResult,
      firestore: firestoreResult,
    });
  } catch (error) {
    console.error("❌ Error sending payment notification:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.post("/api/test-notification", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    console.log("🧪 Testing notification system...");
    console.log(`   User ID: ${userId}`);

    // Check OneSignal credentials
    if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "OneSignal credentials not configured",
        details: {
          hasAppId: !!process.env.ONESIGNAL_APP_ID,
          hasApiKey: !!process.env.ONESIGNAL_REST_API_KEY,
        },
      });
    }

    // Check Firebase
    let firebaseStatus = "OK";
    try {
      await db.collection("notifications").limit(1).get();
    } catch (error) {
      firebaseStatus = error.message;
    }

    const title = "🧪 Test Notification";
    const message = "This is a test notification from your Rapid Delivery App!";

    // 1. Send push notification via OneSignal
    console.log("📤 Sending OneSignal push notification...");
    const pushResult = await sendNotificationByExternalId(
      userId,
      title,
      message,
      { type: "test", timestamp: Date.now() }
    );

    console.log("OneSignal Result:", pushResult);

    // 2. Save to Firestore for in-app notifications
    console.log("💾 Saving to Firestore...");
    const firestoreResult = await saveNotificationToFirestore(userId, {
      title,
      message,
      type: "test",
      icon: "🧪",
      data: { testId: Date.now() },
    });

    console.log("Firestore Result:", firestoreResult);

    // Detailed response
    const response = {
      success: pushResult.success || firestoreResult.success,
      timestamp: new Date().toISOString(),
      userId,
      checks: {
        oneSignal: {
          configured: true,
          appId: process.env.ONESIGNAL_APP_ID,
          result: pushResult,
        },
        firestore: {
          configured: firebaseStatus === "OK",
          status: firebaseStatus,
          result: firestoreResult,
        },
      },
      push: pushResult,
      firestore: firestoreResult,
    };

    console.log("✅ Test notification completed");
    console.log("Response:", JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error) {
    console.error("❌ Test notification error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});
// Send promotion notification
app.post("/api/send-promotion", async (req, res) => {
  try {
    const { userId, userName, discount, code } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const title = "🎉 Special Offer!";
    const message = `Hi ${userName}! Get ${discount}% off your next delivery. Use code: ${code}`;

    // Send push notification
    const pushResult = await sendNotificationByExternalId(
      userId,
      title,
      message,
      {
        type: "promotion",
        screen: "Send",
      }
    );

    // Save to Firestore
    const firestoreResult = await saveNotificationToFirestore(userId, {
      title,
      message,
      type: "promotion",
      icon: "🎉",
      data: {
        discount,
        code,
      },
    });

    console.log("✅ Promotion notification sent and saved");

    res.json({
      success: true,
      push: pushResult,
      firestore: firestoreResult,
    });
  } catch (error) {
    console.error("❌ Error sending promotion notification:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send global announcement (to all users)
app.post("/api/send-announcement", async (req, res) => {
  try {
    const { title, message, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: "title and message are required",
      });
    }

    // Send push notification to all users via OneSignal
    const pushResult = await sendGlobalAnnouncement(title, message, data);

    // Get all user IDs from Firestore
    const usersSnapshot = await db.collection("users").get();
    const userIds = usersSnapshot.docs.map((doc) => doc.id);

    // Save to Firestore for each user
    const firestorePromises = userIds.map((userId) =>
      saveNotificationToFirestore(userId, {
        title,
        message,
        type: "announcement",
        icon: "📢",
        data: data || {},
      })
    );

    await Promise.all(firestorePromises);

    console.log(`✅ Announcement sent to ${userIds.length} users`);

    res.json({
      success: true,
      push: pushResult,
      userCount: userIds.length,
    });
  } catch (error) {
    console.error("❌ Error sending announcement:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test notification endpoint

// app.get("/api/health", (req, res) => {
//   res.json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     services: {
//       stripe: !!process.env.STRIPE_SECRET_KEY,
//       tookan: !!process.env.TOOKAN_API_KEY,
//       googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
//       mapbox: !!process.env.MAPBOX_ACCESS_TOKEN,
//     },
//     api_endpoints: {
//       distance_matrix: !!process.env.GOOGLE_MAPS_API_KEY,
//       geocoding: !!process.env.GOOGLE_MAPS_API_KEY,
//       tookan_fare: !!process.env.TOOKAN_API_KEY,
//     },
//   });
// });
// Add this endpoint to your server.js to debug Firebase issues

app.get("/api/debug/firebase-status", async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: {
        hasFirebaseEnvVar: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        envVarLength: process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0,
        nodeEnv: process.env.NODE_ENV || "development",
      },
      firebase: {
        adminAppsCount: admin.apps.length,
        adminInitialized: admin.apps.length > 0,
      },
    };

    // Try to parse the service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        status.serviceAccount = {
          canParse: true,
          projectId: parsed.project_id || null,
          clientEmail: parsed.client_email || null,
          hasPrivateKey: !!parsed.private_key,
          privateKeyLength: parsed.private_key?.length || 0,
          privateKeyStartsWith: parsed.private_key?.substring(0, 30) || null,
          hasBackslashN: parsed.private_key?.includes("\\n") || false,
          hasActualNewline: parsed.private_key?.includes("\n") || false,
        };

        // Try to fix the private key
        if (parsed.private_key && parsed.private_key.includes("\\n")) {
          const fixedKey = parsed.private_key.replace(/\\n/g, "\n");
          status.privateKeyFix = {
            needed: true,
            fixedLength: fixedKey.length,
            fixedStartsWith: fixedKey.substring(0, 30),
          };
        }
      } catch (e) {
        status.serviceAccount = {
          canParse: false,
          error: e.message,
        };
      }
    }

    // Try to test Firestore
    if (admin.apps.length > 0) {
      try {
        status.firebase.projectId = admin.app().options.projectId;

        // Attempt a Firestore operation
        const testRef = admin.firestore().collection("_debug_test").doc("test");
        await testRef.set({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          test: true,
        });

        const doc = await testRef.get();

        status.firestore = {
          canWrite: true,
          canRead: doc.exists,
          testPassed: doc.exists,
        };

        // Clean up
        await testRef.delete();
      } catch (e) {
        status.firestore = {
          canWrite: false,
          error: e.message,
          errorCode: e.code,
        };
      }
    } else {
      status.firestore = {
        error: "Firebase Admin not initialized",
      };
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
});

// Also add a simple re-initialization endpoint
app.post("/api/debug/reinit-firebase", async (req, res) => {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      return res.status(400).json({
        success: false,
        error: "FIREBASE_SERVICE_ACCOUNT not set",
      });
    }

    // Parse and fix the service account
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(
        /\\n/g,
        "\n"
      );
    }

    // Try to initialize (will fail if already initialized)
    let result = {};

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      result.action = "initialized";
    } else {
      result.action = "already_initialized";
      result.projectId = admin.app().options.projectId;
    }

    // Test Firestore
    const testRef = admin.firestore().collection("_reinit_test").doc("test");
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const doc = await testRef.get();
    await testRef.delete();

    result.firestoreTest = {
      success: doc.exists,
      timestamp: doc.data()?.timestamp?.toDate().toISOString(),
    };

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
  }
});
app.get("/api/test/firestore", async (req, res) => {
  try {
    const testDoc = {
      message: "Test connection",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      environment: process.env.FIREBASE_SERVICE_ACCOUNT ? "Vercel" : "Local",
    };

    // Try to write
    const docRef = await db.collection("test-connection").add(testDoc);
    console.log("✅ Write successful:", docRef.id);

    // Try to read back
    const doc = await docRef.get();
    const data = doc.data();
    console.log("✅ Read successful:", data);

    // Clean up
    await docRef.delete();
    console.log("✅ Cleanup successful");

    res.json({
      success: true,
      message: "Firestore connection successful",
      operations: {
        write: "✅ Success",
        read: "✅ Success",
        delete: "✅ Success",
      },
      data: {
        ...data,
        timestamp: data.timestamp?.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Firestore test failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      hint: error.message.includes("UNAUTHENTICATED")
        ? "Check FIREBASE_SERVICE_ACCOUNT environment variable"
        : "Check Firebase configuration",
    });
  }
});

app.get("/api/health", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.FIREBASE_SERVICE_ACCOUNT ? "Vercel" : "Local",
    services: {
      oneSignal: {
        configured: !!(
          process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY
        ),
        appId: process.env.ONESIGNAL_APP_ID || "NOT_SET",
        hasApiKey: !!process.env.ONESIGNAL_REST_API_KEY,
      },
      firebase: {
        configured: false,
        status: "Unknown",
        projectId: null,
      },
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        mode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
          ? "Test"
          : "Live",
      },
      tookan: {
        configured: !!process.env.TOOKAN_API_KEY,
      },
      mapbox: {
        configured: !!process.env.MAPBOX_ACCESS_TOKEN,
      },
    },
  };

  // Test Firebase connection
  try {
    // Try to write to Firestore
    const testRef = db.collection("health-check").doc("test");
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      environment: health.environment,
    });

    // Try to read back
    const doc = await testRef.get();

    if (doc.exists) {
      health.services.firebase.configured = true;
      health.services.firebase.status = "Connected ✅";
      health.services.firebase.projectId = admin.app().options.projectId;
    } else {
      health.services.firebase.status = "Write successful but read failed ⚠️";
      health.status = "DEGRADED";
    }
  } catch (error) {
    health.services.firebase.status = `Error: ${error.message}`;
    health.services.firebase.error = error.code || error.message;
    health.status = "DEGRADED";

    // Check if it's an authentication error
    if (error.message.includes("UNAUTHENTICATED")) {
      health.services.firebase.hint =
        "Firebase credentials may be incorrect or missing";
    }
  }

  const statusCode = health.status === "OK" ? 200 : 503;
  res.status(statusCode).json(health);
});
/////////////////

app.post("/api/tookan/delivery-cost", async (req, res) => {
  const { pickup_postcode, delivery_postcode, weight_range } = req.body || {};

  if (!pickup_postcode || !delivery_postcode || !weight_range) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  try {
    console.log(
      `[HybridFare] Getting distance from Matrix API and fare from Tookan: ${pickup_postcode} → ${delivery_postcode} (${weight_range})`
    );

    // Step 1: Get accurate coordinates and distance from Google Distance Matrix API
    const { distanceData, coordinates } =
      await getDistanceAndCoordinatesFromMatrix(
        pickup_postcode,
        delivery_postcode
      );

    // Step 2: Call Tookan API to get delivery fare using coordinates (Tookan's preferred method)
    const tookanFare = await getTookanFareEstimate(
      coordinates.pickup,
      coordinates.delivery,
      distanceData
    );

    // Step 3: Use Tookan's fare if available, otherwise fallback to your weight-based pricing
    let finalCost;
    let source = "tookan";

    if (tookanFare.fare && parseFloat(tookanFare.fare) > 0) {
      finalCost = parseFloat(tookanFare.fare);
      console.log("[HybridFare] Using Tookan calculated fare:", finalCost);
    } else {
      // Fallback to your weight-based calculation using Matrix distance
      finalCost = calculateDeliveryRate(distanceData.distance, weight_range);
      source = "weight_based";
      console.log(
        "[HybridFare] Using weight-based fare with Matrix distance:",
        finalCost
      );
    }

    res.status(200).json({
      success: true,
      cost: parseFloat(finalCost.toFixed(2)),
      distance_km: parseFloat(distanceData.distance.toFixed(2)),
      duration_minutes: distanceData.durationMinutes,
      note: `Cost calculated using Google Distance Matrix API + ${
        source === "tookan" ? "Tookan fare estimation" : "weight-based pricing"
      }`,
      calculation_method: {
        distance_source: "google_matrix",
        fare_source: source,
        tookan_original_fare: tookanFare.fare || null,
        tookan_response: tookanFare.debug || null,
      },
    });
  } catch (error) {
    console.error("[HybridFare] Error:", error);

    // Ultimate fallback to your existing geocoding + straight-line method
    try {
      console.log("[HybridFare] Falling back to existing method");
      const pickupCoords = await getCoordinatesFromPostcode(pickup_postcode);
      const deliveryCoords = await getCoordinatesFromPostcode(
        delivery_postcode
      );
      const distanceData = await calculateDistance(
        pickupCoords,
        deliveryCoords
      );
      const distanceKm = parseFloat(distanceData.distance.toFixed(2));
      const deliveryRate = calculateDeliveryRate(distanceKm, weight_range);

      res.status(200).json({
        success: true,
        cost: parseFloat(deliveryRate.toFixed(2)),
        distance_km: distanceKm,
        duration_minutes: Math.round(distanceData.duration / 60),
        note: "Cost calculated using fallback method (APIs unavailable)",
        calculation_method: {
          distance_source: "fallback_geocoding",
          fare_source: "weight_based",
        },
        fallback: true,
      });
    } catch (fallbackError) {
      console.error("[HybridFare] All methods failed:", fallbackError);
      res.status(500).json({
        success: false,
        error: `Failed to calculate delivery cost: ${error.message}`,
      });
    }
  }
});

// Function to get distance and coordinates from Google Distance Matrix API
async function getDistanceAndCoordinatesFromMatrix(
  pickupPostcode,
  deliveryPostcode
) {
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!googleApiKey) {
    throw new Error("Google Maps API key not configured");
  }

  const origins = encodeURIComponent(pickupPostcode.trim().toUpperCase());
  const destinations = encodeURIComponent(
    deliveryPostcode.trim().toUpperCase()
  );

  // Get distance matrix data
  const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&region=uk&key=${googleApiKey}`;
  const distanceResponse = await fetch(distanceUrl);

  if (!distanceResponse.ok) {
    throw new Error(
      `Distance Matrix API HTTP error: ${distanceResponse.status}`
    );
  }

  const distanceData = await distanceResponse.json();

  if (distanceData.status !== "OK") {
    throw new Error(`Distance Matrix API error: ${distanceData.status}`);
  }

  const element = distanceData.rows?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    throw new Error(
      `Route calculation failed: ${element?.status || "No data"}`
    );
  }

  // Get coordinates using Geocoding API
  const pickupGeoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${origins}&region=uk&key=${googleApiKey}`;
  const deliveryGeoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${destinations}&region=uk&key=${googleApiKey}`;

  const [pickupGeoResponse, deliveryGeoResponse] = await Promise.all([
    fetch(pickupGeoUrl),
    fetch(deliveryGeoUrl),
  ]);

  const [pickupGeoData, deliveryGeoData] = await Promise.all([
    pickupGeoResponse.json(),
    deliveryGeoResponse.json(),
  ]);

  if (pickupGeoData.status !== "OK" || deliveryGeoData.status !== "OK") {
    throw new Error("Failed to get coordinates from geocoding API");
  }

  const pickupLocation = pickupGeoData.results?.[0]?.geometry?.location;
  const deliveryLocation = deliveryGeoData.results?.[0]?.geometry?.location;

  if (!pickupLocation || !deliveryLocation) {
    throw new Error("Invalid coordinates from geocoding API");
  }

  const distanceMeters = element.distance?.value;
  const durationSeconds = element.duration?.value;

  if (!distanceMeters || !durationSeconds) {
    throw new Error("Invalid distance or duration data from Matrix API");
  }

  const distanceKm = distanceMeters / 1000;
  const durationMinutes = Math.round(durationSeconds / 60);

  console.log(
    `[DistanceMatrix] ${pickupPostcode} → ${deliveryPostcode}: ${distanceKm}km, ${durationMinutes}min`
  );

  return {
    distanceData: {
      distance: distanceKm,
      duration: durationSeconds,
      durationMinutes: durationMinutes,
      distanceText: element.distance.text,
      durationText: element.duration.text,
    },
    coordinates: {
      pickup: {
        latitude: pickupLocation.lat,
        longitude: pickupLocation.lng,
      },
      delivery: {
        latitude: deliveryLocation.lat,
        longitude: deliveryLocation.lng,
      },
    },
  };
}

// Function to get fare estimate from Tookan API using their naming conventions
async function getTookanFareEstimate(
  pickupCoords,
  deliveryCoords,
  distanceData
) {
  try {
    // Using Tookan's exact naming conventions as specified
    const tookanPayload = {
      api_key: process.env.TOOKAN_API_KEY,
      template_name: "Delivery",
      pickup_latitude: pickupCoords.latitude,
      pickup_longitude: pickupCoords.longitude,
      delivery_latitude: deliveryCoords.latitude,
      delivery_longitude: deliveryCoords.longitude,
    };

    console.log("[TookanFare] Requesting fare with coordinates:", {
      pickup: `${pickupCoords.latitude}, ${pickupCoords.longitude}`,
      delivery: `${deliveryCoords.latitude}, ${deliveryCoords.longitude}`,
      distance: `${distanceData.distance}km`,
    });

    const response = await fetch(
      "https://api.tookanapp.com/v2/get_fare_estimate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tookanPayload),
      }
    );

    if (!response.ok) {
      throw new Error(`Tookan API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[TookanFare] API Response:", JSON.stringify(data, null, 2));

    if (data.status === 200 || data.status === "200") {
      return {
        fare: data.data?.fare || data.data?.total_fare || data.data?.cost,
        debug: data.data,
      };
    } else {
      console.warn("[TookanFare] Tookan fare estimation failed:", data.message);
      return { debug: data }; // Return debug info to help troubleshoot
    }
  } catch (error) {
    console.warn("[TookanFare] Tookan API error:", error.message);
    return { debug: { error: error.message } };
  }
}

// Add environment variable checks
if (!process.env.GOOGLE_MAPS_API_KEY) {
  console.warn(
    "WARNING: GOOGLE_MAPS_API_KEY is not set. Distance Matrix API will not work."
  );
}

if (!process.env.TOOKAN_API_KEY) {
  console.warn(
    "WARNING: TOOKAN_API_KEY is not set. Tookan fare estimation will not work."
  );
}

// Optional: Add a test endpoint to verify the hybrid system
app.get("/api/test-hybrid-fare/:pickup/:delivery", async (req, res) => {
  const { pickup, delivery } = req.params;
  const weight = "1-5kg"; // Default weight for testing

  try {
    const { distanceData, coordinates } =
      await getDistanceAndCoordinatesFromMatrix(pickup, delivery);
    const tookanFare = await getTookanFareEstimate(
      coordinates.pickup,
      coordinates.delivery,
      distanceData
    );
    const fallbackFare = calculateDeliveryRate(distanceData.distance, weight);

    res.json({
      test: "hybrid-fare-system",
      pickup_postcode: pickup,
      delivery_postcode: delivery,
      distance_data: distanceData,
      coordinates: coordinates,
      tookan_fare: tookanFare,
      fallback_fare: fallbackFare,
      final_recommendation: tookanFare.fare || fallbackFare,
    });
  } catch (error) {
    res.status(500).json({
      test: "hybrid-fare-system",
      error: error.message,
      pickup_postcode: pickup,
      delivery_postcode: delivery,
    });
  }
});

// ---------- Web Checkout Session (PRIMARY PAYMENT METHOD) ----------

// Updated Stripe Checkout Session Creation with correct success URL
// Complete the checkout session creation with proper success/cancel URLs
app.post("/api/create-checkout-session", async (req, res) => {
  const { totalAmount, shipmentDetails } = req.body || {};

  if (!totalAmount || !shipmentDetails) {
    return res
      .status(400)
      .json({ error: "Missing totalAmount or shipmentDetails" });
  }

  // Validate fields
  const missing = validateShipmentDetails(shipmentDetails);
  if (missing.length) {
    return res.status(400).json({
      error: `Missing fields in shipmentDetails: ${missing.join(", ")}`,
    });
  }

  try {
    // Stripe metadata must be strings
    const metadata = {};
    for (const k in shipmentDetails) {
      metadata[k] = String(shipmentDetails[k]);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Delivery Service",
              description: `Weight: ${
                shipmentDetails.selectedWeight
              }, Distance: ${
                shipmentDetails?.distanceInfo?.distance ?? "n/a"
              } km`,
            },
            unit_amount: Math.round(Number(totalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Add the missing success and cancel URLs
      success_url: `${PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_BASE_URL}/payment-cancel`,

      metadata: metadata,
    });

    // Store session data
    sessionData.set(session.id, {
      sessionId: session.id,
      status: "payment_pending",
      shipmentDetails,
      totalAmount,
      createdAt: new Date().toISOString(),
    });

    console.log("[Checkout] Created session", session.id);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[Checkout] Error creating session:", error);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

app.get("/payment-success", async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.send("Payment was successful but no session ID found.");
  }

  try {
    // Retrieve the session from Stripe to verify it's actually paid
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Update our session data
      const storedData = sessionData.get(session_id);
      if (storedData) {
        storedData.status = "payment_completed";
        storedData.completedAt = new Date().toISOString();
        sessionData.set(session_id, storedData);
      }
    }

    // HTML page that redirects back to the app with proper deep linking
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
          let redirectAttempts = 0;
          const maxAttempts = 3;
          
          function redirectToApp() {
            redirectAttempts++;
            const sessionId = '${session_id}';
            
            // Primary deep link URLs to try
            const appUrls = [
              'rapiddelivery://payment-success?session_id=' + sessionId,
              'com.yourcompany.rapiddelivery://payment-success?session_id=' + sessionId,
              // Also try the web URL as a fallback for universal links
              'https://rapid-fullstack.vercel.app/payment-success?session_id=' + sessionId,
              'https://rapid-fullstack.vercel.app/payment-success?session_id=' + sessionId 
              // 'https://192.168.43.176:3000/payment-success?session_id=' + sessionId,
              // 'http://192.168.43.176:3000/payment-success?session_id=' + sessionId
            ];
            
            console.log('Attempt', redirectAttempts, '- Trying to redirect to app with session:', sessionId);
            
            // Try each URL in sequence
            appUrls.forEach((url, index) => {
              setTimeout(() => {
                console.log('Trying URL:', url);
                window.location.href = url;
              }, index * 1000);
            });
          }

          // Try redirect immediately when page loads
          document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, starting redirect process');
            redirectToApp();
          });

          // Also try on page load as fallback
          window.addEventListener('load', function() {
            if (redirectAttempts === 0) {
              console.log('Window loaded, starting redirect process');
              redirectToApp();
            }
          });

          // Update UI after attempts
          setTimeout(function() {
            const statusElement = document.getElementById('status');
            if (statusElement) {
              statusElement.innerHTML = 
                '<h2>✅ Payment Successful!</h2>' +
                '<p>Your delivery order has been confirmed.</p>' +
                '<div style="margin: 20px 0;">' +
                  '<button onclick="redirectToApp()" style="background: #8328FA; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; margin: 5px;">Open App</button>' +
                  '<br>' +
                  '<button onclick="window.close()" style="background: #6B7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; margin: 5px;">Close Window</button>' +
                '</div>' +
                '<p style="margin-top: 20px; font-size: 12px; color: #666;">If the app doesn\\'t open automatically, please tap "Open App" above.</p>' +
                '<details style="margin-top: 15px; font-size: 10px; color: #999;">' +
                  '<summary style="cursor: pointer;">Debug Info</summary>' +
                  '<p>Session ID: ${session_id}</p>' +
                  '<p>Payment Status: ${session.payment_status}</p>' +
                  '<p>Redirect Attempts: ' + redirectAttempts + '</p>' +
                '</details>';
            }
          }, 5000);

          // Prevent navigation away from the success page too quickly
          window.addEventListener('beforeunload', function(e) {
            if (redirectAttempts < maxAttempts) {
              const message = 'Redirecting to app...';
              e.returnValue = message;
              return message;
            }
          });
        </script>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; margin: 0;">
        <div id="status" style="background: rgba(255,255,255,0.95); color: #333; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
          <h2>🎉 Payment Successful!</h2>
          <p>Processing your order and redirecting to the app...</p>
          <div style="margin: 30px 0;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #8328FA; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Please wait while we redirect you to the app...
          </p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fee2e2;">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Error Processing Payment</h2>
          <p style="color: #666;">There was an error verifying your payment. Please contact support if you believe this is an error.</p>
          <button onclick="window.close()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
      </body>
      </html>
    `);
  }
});

// Payment cancel page
app.get("/payment-cancel", (req, res) => {
  const { session_id } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script>
        function redirectToApp() {
          const appUrl = 'com.yourcompany.rapiddelivery://payment-cancel?session_id=${
            session_id || ""
          }';
          console.log('Attempting to redirect to:', appUrl);
          window.location.href = appUrl;

          // Fallback
          setTimeout(function() {
            window.location.href = 'rapiddelivery://payment-cancel?session_id=${
              session_id || ""
            }';
          }, 1000);
        }

        // Auto redirect after 3 seconds
        setTimeout(redirectToApp, 3000);
      </script>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #ff7e7e 0%, #ff6b6b 100%); color: white; min-height: 100vh; margin: 0;">
      <div style="background: rgba(255,255,255,0.95); color: #333; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
        <h2>❌ Payment Cancelled</h2>
        <p>Your payment was cancelled. You can try again anytime.</p>
        <p><button onclick="redirectToApp()" style="background: #ff6b6b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer;">Return to App</button></p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Redirecting automatically in 3 seconds...</p>
      </div>
    </body>
    </html>
  `);
});

// app.get("/api/payment-status/:sessionId", async (req, res) => {
//   const { sessionId } = req.params;

//   try {
//     // Get session from Stripe
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     // Get our stored data
//     const storedData = sessionData.get(sessionId);

//     res.json({
//       sessionId,
//       paymentStatus: session.payment_status,
//       sessionStatus: session.status,
//       shipmentDetails: storedData?.shipmentDetails || null,
//       totalAmount: storedData?.totalAmount || null,
//       createdAt: storedData?.createdAt || null,
//       completedAt: storedData?.completedAt || null,
//     });
//   } catch (error) {
//     console.error("Error checking payment status:", error);
//     res.status(500).json({ error: "Failed to check payment status" });
//   }
// });
app.get("/api/payment-status/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Check if this is a Google Pay or Klarna session
    if (
      sessionId.startsWith("gpay_") ||
      sessionId.startsWith("applepay_") ||
      sessionId.startsWith("klarna_")
    ) {
      // Try to get from in-memory store first
      const storedData = sessionData.get(sessionId);

      if (storedData) {
        return res.json({
          sessionId,
          paymentStatus: "paid",
          sessionStatus: "complete",
          shipmentDetails: storedData.shipmentDetails || null,
          totalAmount: storedData.totalAmount || null,
          createdAt: storedData.createdAt || null,
          completedAt: storedData.completedAt || null,
        });
      }

      // If not in memory, try to retrieve the PaymentIntent from Stripe
      try {
        const paymentIntentId = sessionId
          .replace("gpay_", "")
          .replace("applepay_", "")
          .replace("klarna_", "");
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId
        );

        if (paymentIntent.status === "succeeded") {
          const shipmentDetails = paymentIntent.metadata || {};

          return res.json({
            sessionId,
            paymentStatus: "paid",
            sessionStatus: "complete",
            shipmentDetails: shipmentDetails,
            totalAmount: paymentIntent.amount / 100,
            createdAt: new Date(paymentIntent.created * 1000).toISOString(),
            completedAt: new Date().toISOString(),
            reconstructed: true,
          });
        } else {
          return res.status(400).json({
            error: `Payment not completed. Status: ${paymentIntent.status}`,
            sessionId,
          });
        }
      } catch (stripeError) {
        console.error("Error retrieving PaymentIntent:", stripeError);
        return res.status(404).json({
          error: "Session not found in memory or Stripe",
          sessionId,
        });
      }
    }

    // For regular Stripe Checkout Sessions
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const storedData = sessionData.get(sessionId);

    res.json({
      sessionId,
      paymentStatus: session.payment_status,
      sessionStatus: session.status,
      shipmentDetails: storedData?.shipmentDetails || null,
      totalAmount: storedData?.totalAmount || null,
      createdAt: storedData?.createdAt || null,
      completedAt: storedData?.completedAt || null,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

app.post("/api/tookan/create-task", async (req, res) => {
  try {
    const { sessionId, shipmentDetails } = req.body;

    if (!sessionId || !shipmentDetails) {
      return res.status(400).json({
        success: false,
        error: "Missing sessionId or shipmentDetails",
      });
    }

    const missing = validateShipmentDetails(shipmentDetails);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Missing fields: ${missing.join(", ")}`,
      });
    }

    const sessionEntry = sessionData.get(sessionId);
    if (!sessionEntry) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    if (sessionEntry.status !== "payment_completed") {
      return res.status(400).json({
        success: false,
        error: "Payment not completed",
      });
    }

    if (sessionEntry.tookanTaskId) {
      return res.json({
        success: true,
        taskId: sessionEntry.tookanTaskId,
        trackingUrl: sessionEntry.trackingUrl || null,
        deliveryId: sessionEntry.deliveryId,
        message: "Task already exists",
      });
    }

    console.log("[Tookan] Creating task for session:", sessionId);

    const deliveryId =
      sessionEntry.deliveryId ||
      `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get coordinates
    let pickupCoords = null;
    let deliveryCoords = null;

    try {
      const pickupAddress = `${shipmentDetails.pickupAddress}, ${shipmentDetails.pickupPostcode}`;
      const deliveryAddress = `${shipmentDetails.receiverAddress}, ${shipmentDetails.receiverPostcode}`;

      console.log("[Tookan] Geocoding:", { pickupAddress, deliveryAddress });

      pickupCoords = await getCoordinates(pickupAddress);
      deliveryCoords = await getCoordinates(deliveryAddress);

      console.log("[Tookan] Coords result:", { pickupCoords, deliveryCoords });

      if (!pickupCoords || !deliveryCoords) {
        console.error("[Tookan] ❌ Geocoding failed - missing coordinates");
        return res.status(400).json({
          success: false,
          error: "Could not geocode addresses",
          details: {
            pickupCoords: pickupCoords ? "✓" : "✗",
            deliveryCoords: deliveryCoords ? "✓" : "✗",
            pickupPostcode: shipmentDetails.pickupPostcode,
            deliveryPostcode: shipmentDetails.receiverPostcode,
          },
        });
      }
    } catch (geocodeError) {
      console.error("[Tookan] Geocoding error:", geocodeError);
      return res.status(500).json({
        success: false,
        error: "Geocoding service error",
        details: geocodeError.message,
      });
    }

    // Time setup - MATCHING YOUR WORKING PROJECT
    const now = new Date();
    const pickupTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
    const deliveryTime = new Date(pickupTime.getTime() + 6 * 60 * 60 * 1000); // 6 hours after pickup

    const formatDateTime = (date) =>
      date.toISOString().slice(0, 19).replace("T", " ");

    // PAYLOAD - EXACTLY MATCHING YOUR WORKING PROJECT
    const payload = {
      api_key: process.env.TOOKAN_API_KEY,
      order_id: deliveryId,
      job_description: "Delivery Order",

      // Pickup
      job_pickup_name: (shipmentDetails.senderName || "Pickup").trim(),
      job_pickup_phone: (shipmentDetails.senderPhone || "0000000000")
        .replace(/\s+/g, "")
        .substring(0, 15),
      job_pickup_email: shipmentDetails.senderEmail || "",
      job_pickup_address:
        `${shipmentDetails.pickupAddress}, ${shipmentDetails.pickupPostcode}`.trim(),
      job_pickup_datetime: formatDateTime(pickupTime),

      // Pickup coordinates
      job_pickup_latitude: pickupCoords[1].toString(),
      job_pickup_longitude: pickupCoords[0].toString(),

      // Delivery/Customer
      customer_email: shipmentDetails.receiverEmail || "",
      customer_username: (shipmentDetails.receiverName || "Delivery").trim(),
      customer_phone: (shipmentDetails.receiverNumber || "0000000000")
        .replace(/\s+/g, "")
        .substring(0, 15),
      customer_address:
        `${shipmentDetails.receiverAddress}, ${shipmentDetails.receiverPostcode}`.trim(),
      job_delivery_datetime: formatDateTime(deliveryTime),

      // ⚠️ CRITICAL: Use 'latitude' and 'longitude' NOT 'job_latitude'/'job_longitude'
      latitude: deliveryCoords[1].toString(),
      longitude: deliveryCoords[0].toString(),

      // Settings - EXACTLY as in working project
      auto_assignment: 1,
      has_pickup: "1",
      has_delivery: "1",
      layout_type: "0",
      tracking_link: 1,
      timezone: "0",
    };

    console.log("[Tookan] Final Payload:", {
      order_id: payload.order_id,
      auto_assignment: payload.auto_assignment,
      job_pickup_latitude: payload.job_pickup_latitude,
      job_pickup_longitude: payload.job_pickup_longitude,
      latitude: payload.latitude,
      longitude: payload.longitude,
      job_pickup_name: payload.job_pickup_name,
      customer_username: payload.customer_username,
    });

    const response = await fetch("https://api.tookanapp.com/v2/create_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("[Tookan] Response:", {
      status: response.status,
      tookanStatus: data.status,
      message: data.message,
      job_id: data.data?.job_id,
    });

    if (data.status !== 200 || !data.data?.job_id) {
      console.error("[Tookan] Task creation failed:", data);
      return res.status(response.status || 502).json({
        success: false,
        error: data.message || "Failed to create Tookan task",
        tookanResponse: data,
      });
    }

    const taskId = data.data.job_id;
    const trackingUrl =
      data.data.pickup_tracking_link || data.data.delivery_tracing_link;

    // Update session
    sessionEntry.tookanTaskId = String(taskId);
    sessionEntry.trackingUrl = trackingUrl ? String(trackingUrl) : null;
    sessionEntry.deliveryId = deliveryId;
    sessionEntry.updatedAt = new Date().toISOString();
    sessionData.set(sessionId, sessionEntry);

    // Store in deliveries map
    deliveries.set(deliveryId, {
      deliveryId,
      sessionId,
      jobId: taskId,
      trackingUrl,
      status: "confirmed",
      shipmentDetails,
      stripeSessionId: sessionId,
      createdAt: sessionEntry.createdAt,
      updatedAt: new Date().toISOString(),
    });

    console.log("[Tookan] ✅ Task created successfully:", taskId);

    res.json({
      success: true,
      tookanTaskId: String(taskId),
      trackingUrl: trackingUrl ? String(trackingUrl) : null,
      deliveryId,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("[Tookan] Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

app.get("/api/session/:sessionId/create-tookan-task", async (req, res) => {
  const { sessionId } = req.params;

  let entry = sessionData.get(sessionId);

  if (!entry) {
    try {
      console.log(
        `[Tookan] Session ${sessionId} not in memory, checking Stripe...`
      );
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== "paid") {
        return res.status(400).json({
          success: false,
          error: "Payment not completed yet.",
          status: session.payment_status,
        });
      }

      const shipmentDetails = {};
      for (const [key, value] of Object.entries(session.metadata)) {
        if (
          ["basePrice", "deliveryCost", "vatAmount", "totalPrice"].includes(key)
        ) {
          shipmentDetails[key] = parseFloat(value);
        } else if (key === "isFragile") {
          shipmentDetails[key] = value === "true";
        } else {
          shipmentDetails[key] = value;
        }
      }

      entry = {
        sessionId,
        status: "payment_completed",
        shipmentDetails,
        totalAmount: session.amount_total / 100,
        createdAt: new Date(session.created * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        reconstructed: true,
      };

      sessionData.set(sessionId, entry);
      console.log(`[Tookan] ✅ Reconstructed session from Stripe`);
    } catch (stripeError) {
      console.error("[Stripe] Error:", stripeError);
      return res.status(404).json({
        success: false,
        error: "Session not found",
        sessionId,
      });
    }
  }

  if (entry.tookanTaskId && entry.trackingUrl && entry.deliveryId) {
    return res.status(200).json({
      success: true,
      message: "Task already created.",
      tookanTaskId: entry.tookanTaskId,
      trackingUrl: entry.trackingUrl,
      deliveryId: entry.deliveryId,
    });
  }

  const details = entry.shipmentDetails || {};
  const missing = validateShipmentDetails(details);
  if (missing.length) {
    console.error("[Tookan] Missing fields:", missing);
    return res.status(400).json({
      success: false,
      error: `Missing fields: ${missing.join(", ")}`,
    });
  }

  if (!entry.deliveryId) {
    entry.deliveryId = `DEL-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    sessionData.set(sessionId, entry);
  }

  // ✅ GEOCODE FIRST - BEFORE CREATING PAYLOAD
  let pickupCoords = null;
  let deliveryCoords = null;

  try {
    const pickupAddress = `${details.pickupAddress}, ${details.pickupPostcode}`;
    const deliveryAddress = `${details.receiverAddress}, ${details.receiverPostcode}`;

    console.log("[Tookan] Geocoding addresses...");
    [pickupCoords, deliveryCoords] = await Promise.all([
      getCoordinates(pickupAddress),
      getCoordinates(deliveryAddress),
    ]);

    if (!pickupCoords || !deliveryCoords) {
      console.error("[Tookan] ❌ Geocoding failed:", {
        pickup: pickupCoords ? "✓" : "✗",
        delivery: deliveryCoords ? "✓" : "✗",
      });
      return res.status(400).json({
        success: false,
        error: "Could not geocode addresses",
        details: {
          pickupCoords: pickupCoords ? "✓" : "✗",
          deliveryCoords: deliveryCoords ? "✓" : "✗",
        },
      });
    }

    console.log("[Tookan] ✅ Geocoding successful:", {
      pickup: pickupCoords,
      delivery: deliveryCoords,
    });
  } catch (geocodeError) {
    console.error("[Tookan] Geocoding error:", geocodeError);
    return res.status(500).json({
      success: false,
      error: "Geocoding service error",
      details: geocodeError.message,
    });
  }

  const now = new Date();
  const pickupTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const deliveryTime = new Date(pickupTime.getTime() + 6 * 60 * 60 * 1000);

  const formatDateTime = (date) =>
    date.toISOString().slice(0, 19).replace("T", " ");

  // ✅ COMPLETE PAYLOAD WITH COORDINATES - MATCHING YOUR WORKING PROJECT
  const tookanPayload = {
    api_key: process.env.TOOKAN_API_KEY,
    order_id: entry.deliveryId,
    job_description: "Delivery Order",

    // Pickup details
    job_pickup_name: (details.senderName || "Pickup").trim(),
    job_pickup_phone: (details.senderPhone || "0000000000")
      .replace(/\s+/g, "")
      .substring(0, 15),
    job_pickup_email: details.senderEmail || "",
    job_pickup_address:
      `${details.pickupAddress}, ${details.pickupPostcode}`.trim(),
    job_pickup_datetime: formatDateTime(pickupTime),

    // ✅ PICKUP COORDINATES
    job_pickup_latitude: pickupCoords[1].toString(),
    job_pickup_longitude: pickupCoords[0].toString(),

    // Delivery details
    customer_username: (details.receiverName || "Delivery").trim(),
    customer_phone: (details.receiverNumber || "0000000000")
      .replace(/\s+/g, "")
      .substring(0, 15),
    customer_email: details.receiverEmail || "",
    customer_address:
      `${details.receiverAddress}, ${details.receiverPostcode}`.trim(),
    job_delivery_datetime: formatDateTime(deliveryTime),

    // ✅ DELIVERY COORDINATES - CRITICAL
    latitude: deliveryCoords[1].toString(),
    longitude: deliveryCoords[0].toString(),

    // Settings - EXACTLY AS WORKING PROJECT
    auto_assignment: 1,
    has_pickup: "1",
    has_delivery: "1",
    layout_type: "0",
    tracking_link: 1,
    timezone: "0",
  };

  console.log("[Tookan] Final Payload:", {
    order_id: tookanPayload.order_id,
    auto_assignment: tookanPayload.auto_assignment,
    job_pickup_latitude: tookanPayload.job_pickup_latitude,
    job_pickup_longitude: tookanPayload.job_pickup_longitude,
    latitude: tookanPayload.latitude,
    longitude: tookanPayload.longitude,
    has_pickup: tookanPayload.has_pickup,
    has_delivery: tookanPayload.has_delivery,
  });

  try {
    const response = await fetch("https://api.tookanapp.com/v2/create_task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tookanPayload),
    });

    const data = await response.json();
    console.log("[Tookan] Response:", {
      status: response.status,
      tookanStatus: data.status,
      message: data.message,
      job_id: data.data?.job_id,
    });

    if (data.status !== 200 || !data.data?.job_id) {
      console.error("[Tookan] Task creation failed:", data);
      return res.status(200).json({
        success: true,
        message: "Delivery created but Tookan unavailable",
        deliveryId: entry.deliveryId,
        tookanTaskId: null,
        trackingUrl: null,
        tookanError: data.message,
      });
    }

    const taskId = data.data.job_id;
    const trackingUrl =
      data.data.pickup_tracking_link || data.data.delivery_tracking_link;

    entry.tookanTaskId = String(taskId);
    entry.trackingUrl = trackingUrl ? String(trackingUrl) : null;
    entry.updatedAt = new Date().toISOString();
    sessionData.set(sessionId, entry);

    deliveries.set(entry.deliveryId, {
      deliveryId: entry.deliveryId,
      sessionId,
      jobId: taskId,
      trackingUrl,
      status: "confirmed",
      shipmentDetails: details,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("[Tookan] ✅ Task created successfully:", taskId);

    return res.status(200).json({
      success: true,
      tookanTaskId: entry.tookanTaskId,
      trackingUrl: entry.trackingUrl,
      deliveryId: entry.deliveryId,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("[Tookan] Error:", error);
    return res.status(200).json({
      success: true,
      message: "Delivery created but Tookan unavailable",
      deliveryId: entry.deliveryId,
      tookanTaskId: null,
      trackingUrl: null,
      error: error.message,
    });
  }
});

// ---------- Delivery Status (for LocationScreen) ----------
app.get("/api/delivery/:deliveryId", async (req, res) => {
  const { deliveryId } = req.params;
  const delivery = deliveries.get(deliveryId);

  if (!delivery) {
    return res.status(404).json({ error: "Delivery not found" });
  }

  // Try to get updated status from Tookan if we have a job ID
  if (delivery.jobId) {
    try {
      const tookanResponse = await fetch(
        "https://api.tookanapp.com/v2/get_job_details",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TOOKAN_API_KEY,
            job_id: delivery.jobId,
          }),
        }
      );

      const tookanData = await tookanResponse.json().catch(() => ({}));
      if (tookanResponse.ok && tookanData.data) {
        const tookanStatus = tookanData.data.job_status;
        const mappedStatus = mapTookanStatus(tookanStatus); // ✅ Use the mapping function

        delivery.status = mappedStatus;
        delivery.tookanData = tookanData.data;
        delivery.updatedAt = new Date().toISOString();
        deliveries.set(deliveryId, delivery);

        console.log(
          `[Delivery] Status updated to: ${mappedStatus} (code: ${tookanStatus})`
        );
      }
    } catch (error) {
      console.error("[Tookan] Error fetching job status:", error);
    }
  }
  //     if (tookanResponse.ok && tookanData.data) {
  //       // Update delivery status based on Tookan response
  //       const tookanStatus = tookanData.data.job_status;
  //       let mappedStatus = "confirmed";

  //       switch (tookanStatus) {
  //         case 0:
  //           mappedStatus = "confirmed";
  //           break;
  //         case 1:
  //           mappedStatus = "assigned";
  //           break;
  //         case 2:
  //           mappedStatus = "started";
  //           break;
  //         case 3:
  //           mappedStatus = "successful";
  //           break;
  //         case 4:
  //           mappedStatus = "failed";
  //           break;
  //         default:
  //           mappedStatus = "confirmed";
  //       }

  //       delivery.status = mappedStatus;
  //       delivery.tookanData = tookanData.data;
  //       delivery.updatedAt = new Date().toISOString();
  //       deliveries.set(deliveryId, delivery);
  //     }
  //   } catch (error) {
  //     console.error("[Tookan] Error fetching job status:", error);
  //     // Continue with existing data
  //   }
  // }

  // Format response for LocationScreen
  res.json({
    deliveryId: delivery.deliveryId,
    status: delivery.status,
    trackingUrl: delivery.trackingUrl,
    jobId: delivery.jobId,
    deliveryDetails: {
      sender: {
        name: delivery.shipmentDetails.senderName,
        phone: delivery.shipmentDetails.senderPhone,
        address: delivery.shipmentDetails.pickupAddress,
        postcode: delivery.shipmentDetails.pickupPostcode,
      },
      receiver: {
        name: delivery.shipmentDetails.receiverName,
        phone: delivery.shipmentDetails.receiverNumber,
        address: delivery.shipmentDetails.receiverAddress,
        postcode: delivery.shipmentDetails.receiverPostcode,
      },
      weight: delivery.shipmentDetails.selectedWeight,
      itemType: delivery.shipmentDetails.itemType,
      isFragile: delivery.shipmentDetails.isFragile,
      deliveryType: delivery.shipmentDetails.deliveryType,
    },
    cost: {
      itemCost: delivery.shipmentDetails.basePrice,
      deliveryCost: delivery.shipmentDetails.deliveryCost,
      vat: delivery.shipmentDetails.vatAmount,
      total: delivery.shipmentDetails.totalPrice,
    },
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  });
});

// ---------- Stripe Webhook ----------
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error("[Webhook] Missing STRIPE_WEBHOOK_SECRET");
      return res.status(500).send("Webhook secret not configured.");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const id = session.id;
        const existing = sessionData.get(id) || {};
        const customerEmail = session.customer_details?.email;

        // Generate delivery ID if payment completed via web checkout
        if (!existing.deliveryId) {
          existing.deliveryId = `DEL-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }

        sessionData.set(id, {
          ...existing,
          sessionId: id,
          status: "payment_completed",
          customerEmail,
          shipmentDetails: {
            ...existing.shipmentDetails,
            ...session.metadata,
            customerEmail,
          },
          updatedAt: new Date().toISOString(),
        });

        console.log(`[Webhook] Session ${id} -> payment_completed`);
        ////////////////////////////////////////////
        try {
          const shipmentsRef = admin.firestore().collection("shipments");
          const q = shipmentsRef.where("sessionId", "==", id);
          const querySnapshot = await q.get();

          if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;

            await docRef.update({
              status: "completed",
              paymentStatus: "paid",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              paymentCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(
              `✅ Firestore updated: Session ${id} status -> completed`
            );
          } else {
            console.log(`⚠️ No Firestore document found for session: ${id}`);
          }
        } catch (firestoreError) {
          console.error("❌ Firestore update failed:", firestoreError);
          // Don't fail the webhook - payment still succeeded
        }
      } else {
        console.log("[Webhook] Ignored event type:", event.type);
      }

      res.json({ received: true });
    } catch (e) {
      console.error("[Webhook] Handler error:", e);
      res.status(500).send("Webhook handler error");
    }
  }
);

// Get task details from Tookan
app.get("/api/tookan/task/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ error: "Task ID is required" });
    }

    console.log("[Tookan] Fetching task details for:", taskId);

    const response = await fetch(
      "https://api.tookanapp.com/v2/get_job_details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TOOKAN_API_KEY,
          job_id: taskId,
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    console.log("[Tookan] Task details response:", sanitize(data, ["api_key"]));

    if (!response.ok || (data.status !== 200 && data.status !== "200")) {
      return res.status(response.status || 502).json({
        error: data.message || "Failed to fetch task details",
        tookanResponse: data,
      });
    }

    const taskData = data.data || data;
    res.json(taskData);
  } catch (error) {
    console.error("[Tookan] Error fetching task details:", error);
    res.status(500).json({
      error: "Internal server error while fetching task details",
    });
  }
});

// ---------- Success/Cancel pages (fallback for web) ----------
app.get("/payment-success", (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.send("Payment was successful but no session ID found.");
  }

  // HTML page that redirects back to the app
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script>
        // Try to redirect back to the app
        setTimeout(function() {
          window.location.href = 'rapiddelivery://payment-success?session_id=${session_id}';
        }, 1000);
        
        // Fallback message after 3 seconds
        setTimeout(function() {
          document.getElementById('status').innerHTML = 
            '<h2>Payment Successful!</h2>' +
            '<p>You can now close this window and return to the app.</p>' +
            '<p><a href="rapiddelivery://payment-success?session_id=${session_id}">Click here</a> if not redirected automatically.</p>';
        }, 3000);
      </script>
    </head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
      <div id="status">
        <h2>Payment Successful!</h2>
        <p>Redirecting back to the app...</p>
        <div style="margin: 20px 0;">
          <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 2s linear infinite;"></div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </body>
    </html>
  `);
});

app.get("/payment-cancel", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script>
        // Try to redirect back to the app
        setTimeout(function() {
          window.location.href = 'rapiddelivery://payment-cancel';
        }, 1000);
      </script>
    </head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
      <h2>Payment Cancelled</h2>
      <p>Your payment was cancelled. Redirecting back to the app...</p>
      <p><a href="rapiddelivery://payment-cancel">Click here</a> if not redirected automatically.</p>
    </body>
    </html>
  `);
});

// ---------- Debug endpoints ----------
app.get("/api/debug/sessions", (req, res) => {
  const sessions = Array.from(sessionData.entries()).map(([id, data]) => ({
    sessionId: id,
    status: data.status,
    deliveryId: data.deliveryId,
    hasShipmentDetails: !!data.shipmentDetails,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }));
  res.json({ sessions, count: sessions.length });
});

app.get("/api/debug/deliveries", (req, res) => {
  const deliveryList = Array.from(deliveries.entries()).map(([id, data]) => ({
    deliveryId: id,
    status: data.status,
    jobId: data.jobId,
    hasTrackingUrl: !!data.trackingUrl,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }));
  res.json({ deliveries: deliveryList, count: deliveryList.length });
});
//-----------------------------------live tracking----------------------------------
app.get("/api/geocode", async (req, res) => {
  const { postcode } = req.query;

  if (!postcode) {
    return res.status(400).json({
      success: false,
      error: "Postcode parameter is required",
    });
  }

  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!googleApiKey) {
      return res.status(503).json({
        success: false,
        error: "Google Maps API not configured",
      });
    }

    // Clean and format postcode
    const cleanPostcode = postcode.trim().replace(/\s+/g, " ").toUpperCase();
    const encodedPostcode = encodeURIComponent(`${cleanPostcode}, UK`);

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}&region=uk&key=${googleApiKey}`;

    console.log("[Geocode] Geocoding postcode:", cleanPostcode);

    const response = await fetch(geocodeUrl);

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No location found for postcode: ${cleanPostcode}`,
        googleStatus: data.status,
      });
    }

    const location = data.results[0].geometry.location;
    const formattedAddress = data.results[0].formatted_address;

    console.log("[Geocode] Success:", {
      postcode: cleanPostcode,
      coordinates: `${location.lat}, ${location.lng}`,
      address: formattedAddress,
    });

    res.json({
      success: true,
      postcode: cleanPostcode,
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      formattedAddress,
      placeId: data.results[0].place_id,
    });
  } catch (error) {
    console.error("[Geocode] Error:", error);
    res.status(500).json({
      success: false,
      error: `Geocoding failed: ${error.message}`,
    });
  }
});

// Directions endpoint using Google Directions API
app.get("/api/directions", async (req, res) => {
  const { origin, destination } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({
      success: false,
      error: "Origin and destination parameters are required",
    });
  }

  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!googleApiKey) {
      return res.status(503).json({
        success: false,
        error: "Google Maps API not configured",
      });
    }

    const encodedOrigin = encodeURIComponent(origin);
    const encodedDestination = encodeURIComponent(destination);

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodedOrigin}&destination=${encodedDestination}&key=${googleApiKey}`;

    console.log("[Directions] Getting route:", { origin, destination });

    const response = await fetch(directionsUrl);

    if (!response.ok) {
      throw new Error(`Google Directions API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No route found between the specified locations",
        googleStatus: data.status,
      });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Decode the polyline to get route coordinates
    const polylinePoints = decodePolyline(route.overview_polyline.points);

    console.log("[Directions] Route found:", {
      distance: leg.distance.text,
      duration: leg.duration.text,
      pointsCount: polylinePoints.length,
    });

    res.json({
      success: true,
      route: polylinePoints,
      distance: {
        text: leg.distance.text,
        value: leg.distance.value, // in meters
      },
      duration: {
        text: leg.duration.text,
        value: leg.duration.value, // in seconds
      },
      startAddress: leg.start_address,
      endAddress: leg.end_address,
    });
  } catch (error) {
    console.error("[Directions] Error:", error);
    res.status(500).json({
      success: false,
      error: `Directions failed: ${error.message}`,
    });
  }
});

// Polyline decoder utility function
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charAt(index++).charCodeAt(0) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

function getJobStatusText(jobStatus) {
  const statusCode = parseInt(jobStatus);

  const statusMap = {
    0: "Task created",
    1: "Assigned to driver",
    2: "Driver started / En route",
    3: "Delivered successfully",
    4: "Delivery failed",
    5: "Cancelled",
    6: "Cancelled by dispatcher",
    7: "Accepted by driver",
    8: "Driver arrived at pickup",
    9: "Started delivery",
    10: "Unassigned",
  };

  const statusText = statusMap[statusCode];

  if (statusText) {
    console.log(`[Status] Mapped ${statusCode} to: ${statusText}`);
    return statusText;
  }

  console.warn(`[Status] Unknown status code: ${statusCode}`);
  return `Status ${statusCode}`;
}

// ============================================
// BACKEND FIX: Replace your tracking endpoint with this enhanced version
// This checks task_history to detect actual status changes
// ============================================

app.get("/api/tookan/tracking/:taskId", async (req, res) => {
  const { taskId } = req.params;

  if (!taskId) {
    return res.status(400).json({
      success: false,
      error: "Task ID is required",
    });
  }

  try {
    console.log("[TookanTracking] ========================================");
    console.log("[TookanTracking] Fetching live data for task:", taskId);

    const jobPayload = {
      api_key: process.env.TOOKAN_API_KEY,
      job_ids: [parseInt(taskId)],
      include_task_history: 1,
    };

    const jobResponse = await fetch(
      "https://api.tookanapp.com/v2/get_job_details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobPayload),
      }
    );

    if (!jobResponse.ok) {
      throw new Error(`Tookan job API error: ${jobResponse.status}`);
    }

    const jobData = await jobResponse.json();

    if (jobData.status !== 200 && jobData.status !== "200") {
      return res.status(404).json({
        success: false,
        error: `Task not found: ${jobData.message}`,
      });
    }

    const job = Array.isArray(jobData.data) ? jobData.data[0] : jobData.data;

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job data not found",
      });
    }

    console.log("[TookanTracking] Raw job data:", {
      job_id: job.job_id,
      job_status: job.job_status,
      arrived_datetime: job.arrived_datetime,
      started_datetime: job.started_datetime,
      completed_datetime: job.completed_datetime,
    });

    // ✅ CRITICAL FIX: Use task_history to determine REAL status
    let actualStatus = parseInt(job.job_status);
    let statusSource = "job_status";

    if (job.task_history && job.task_history.length > 0) {
      // Sort by most recent first
      const sortedHistory = [...job.task_history].sort(
        (a, b) => new Date(b.creation_datetime) - new Date(a.creation_datetime)
      );

      // Check most recent state change
      const latestStateChange = sortedHistory.find(
        (task) => task.type === "state_changed"
      );

      if (latestStateChange) {
        console.log("[TookanTracking] Latest state change:", {
          description: latestStateChange.description,
          label: latestStateChange.label_description,
          datetime: latestStateChange.creation_datetime,
        });

        // ✅ Detect ACTUAL status from task_history labels
        const label = (latestStateChange.label_description || "").toLowerCase();
        const desc = (latestStateChange.description || "").toLowerCase();

        if (label.includes("arrived") || desc.includes("arrived")) {
          actualStatus = 8; // Arrived
          statusSource = "task_history_arrived";
          console.log("[TookanTracking] ✅ Detected ARRIVED from task_history");
        } else if (label.includes("started") || desc.includes("started")) {
          actualStatus = 2; // Started
          statusSource = "task_history_started";
          console.log("[TookanTracking] ✅ Detected STARTED from task_history");
        } else if (label.includes("accepted") || desc.includes("accepted")) {
          actualStatus = 7; // Accepted
          statusSource = "task_history_accepted";
          console.log(
            "[TookanTracking] ✅ Detected ACCEPTED from task_history"
          );
        } else if (
          label.includes("successful") ||
          label.includes("delivered")
        ) {
          actualStatus = 3; // Completed
          statusSource = "task_history_completed";
          console.log(
            "[TookanTracking] ✅ Detected COMPLETED from task_history"
          );
        }
      }
    }

    console.log("[TookanTracking] Final status:", {
      original_job_status: job.job_status,
      actual_status: actualStatus,
      status_source: statusSource,
    });

    // Extract completed_datetime
    let completedDatetime = null;

    if (actualStatus === 3) {
      if (
        job.completed_datetime &&
        job.completed_datetime !== "0000-00-00 00:00:00"
      ) {
        completedDatetime = job.completed_datetime;
      } else if (job.task_history) {
        const completionEvent = job.task_history
          .filter((task) => task.type === "state_changed")
          .sort(
            (a, b) =>
              new Date(b.creation_datetime) - new Date(a.creation_datetime)
          )[0];

        if (completionEvent) {
          completedDatetime = completionEvent.creation_datetime;
        }
      }

      if (!completedDatetime) {
        completedDatetime = new Date().toISOString();
      }
    } else if ([4, 5, 6].includes(actualStatus)) {
      if (
        job.arrived_datetime &&
        job.arrived_datetime !== "0000-00-00 00:00:00"
      ) {
        completedDatetime = job.arrived_datetime;
      } else if (
        job.started_datetime &&
        job.started_datetime !== "0000-00-00 00:00:00"
      ) {
        completedDatetime = job.started_datetime;
      }
    }

    // Get fleet/driver location
    let fleetData = null;
    let agentLat = null;
    let agentLng = null;
    let agentName = "Not assigned";
    let agentPhone = null;

    if (job.fleet_id && parseInt(job.fleet_id) > 0) {
      try {
        console.log(
          "[TookanTracking] Fetching fleet location for:",
          job.fleet_id
        );

        const fleetPayload = {
          api_key: process.env.TOOKAN_API_KEY,
          user_id: parseInt(job.fleet_id),
        };

        const fleetResponse = await fetch(
          "https://api.tookanapp.com/v2/get_available_agents",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fleetPayload),
          }
        );

        if (fleetResponse.ok) {
          const fleetResult = await fleetResponse.json();

          if (fleetResult.status === 200 && fleetResult.data) {
            const agents = Array.isArray(fleetResult.data)
              ? fleetResult.data
              : [fleetResult.data];

            fleetData = agents.find(
              (agent) =>
                parseInt(agent.fleet_id) === parseInt(job.fleet_id) ||
                parseInt(agent.user_id) === parseInt(job.fleet_id)
            );

            if (fleetData) {
              agentLat = parseFloat(
                fleetData.latitude || fleetData.fleet_latitude
              );
              agentLng = parseFloat(
                fleetData.longitude || fleetData.fleet_longitude
              );
              agentName =
                fleetData.fleet_name || fleetData.username || "Driver";
              agentPhone = fleetData.phone || fleetData.fleet_phone;

              console.log("[TookanTracking] ✅ Fleet location found:", {
                name: agentName,
                coordinates: `${agentLat}, ${agentLng}`,
              });
            }
          }
        }
      } catch (fleetError) {
        console.log("[TookanTracking] Fleet lookup error:", fleetError.message);
      }
    }

    const hasValidAgentLocation = !!(
      agentLat &&
      agentLng &&
      !isNaN(agentLat) &&
      !isNaN(agentLng) &&
      Math.abs(agentLat) > 0.001 &&
      Math.abs(agentLng) > 0.001
    );

    // ✅ Build response with CORRECTED status
    const trackingData = {
      job_id: parseInt(job.job_id),
      job_status: actualStatus, // Use corrected status
      original_job_status: parseInt(job.job_status), // Keep original for debugging
      status_source: statusSource, // How we determined the status
      order_id: job.order_id || null,

      agent_id: job.fleet_id || null,
      agent_name: agentName,
      agent_phone: agentPhone,
      agent_location: {
        latitude: hasValidAgentLocation ? agentLat : null,
        longitude: hasValidAgentLocation ? agentLng : null,
        timestamp: fleetData?.updated_time || new Date().toISOString(),
        accuracy: fleetData?.accuracy || null,
      },

      created_datetime: job.creation_datetime || job.created_datetime,
      started_datetime: job.started_datetime,
      completed_datetime: completedDatetime,
      acknowledged_datetime: job.acknowledged_datetime,
      arrived_datetime: job.arrived_datetime,
      updated_datetime: job.updated_datetime,

      pickup_location: {
        latitude: job.job_pickup_latitude
          ? parseFloat(job.job_pickup_latitude)
          : null,
        longitude: job.job_pickup_longitude
          ? parseFloat(job.job_pickup_longitude)
          : null,
        address: job.job_pickup_address || "",
        name: job.job_pickup_name || "",
        phone: job.job_pickup_phone || "",
      },

      delivery_location: {
        latitude:
          job.job_latitude || job.latitude
            ? parseFloat(job.job_latitude || job.latitude)
            : null,
        longitude:
          job.job_longitude || job.longitude
            ? parseFloat(job.job_longitude || job.longitude)
            : null,
        address: job.job_address || "",
        name: job.customer_username || "",
        phone: job.customer_phone || "",
      },

      tracking_url: job.tracking_link || null,
      distance_travelled: job.total_distance_travelled || null,
      job_description: job.job_description || "",
      task_history: job.task_history || [],
    };

    console.log("[TookanTracking] ✅ Final response:", {
      job_id: trackingData.job_id,
      actual_status: trackingData.job_status,
      original_status: trackingData.original_job_status,
      status_source: trackingData.status_source,
    });
    console.log("[TookanTracking] ========================================");

    res.json({
      success: true,
      trackingData: trackingData,
      lastUpdate: new Date().toISOString(),
      locationData: {
        hasAgentLocation: hasValidAgentLocation,
        hasPickupLocation: !!trackingData.pickup_location.latitude,
        hasDeliveryLocation: !!trackingData.delivery_location.latitude,
      },
    });
  } catch (error) {
    console.error("[TookanTracking] ❌ ERROR:", error);
    res.status(500).json({
      success: false,
      error: `Tracking failed: ${error.message}`,
    });
  }
});

app.get("/api/delivery/:deliveryId/status", async (req, res) => {
  const { deliveryId } = req.params;
  const delivery = deliveries.get(deliveryId);

  if (!delivery) {
    return res.status(404).json({
      success: false,
      error: "Delivery not found",
    });
  }

  try {
    let trackingData = null;
    let updatedStatus = delivery.status;

    // Fetch live tracking data if we have a Tookan job ID
    if (delivery.jobId) {
      const trackingResponse = await fetch(
        `${PUBLIC_BASE_URL}/api/tookan/tracking/${delivery.jobId}`
      );

      if (trackingResponse.ok) {
        const trackingResult = await trackingResponse.json();

        if (trackingResult.success) {
          trackingData = trackingResult.trackingData;

          // Update status based on Tookan job status
          const statusMap = {
            0: "confirmed",
            1: "assigned",
            2: "started",
            3: "completed",
            4: "failed",
            6: "cancelled",
          };

          updatedStatus = statusMap[trackingData.job_status] || "confirmed";

          // Update stored delivery data
          delivery.status = updatedStatus;
          delivery.lastTracked = new Date().toISOString();
          deliveries.set(deliveryId, delivery);
        }
      }
    }

    res.json({
      success: true,
      deliveryId: delivery.deliveryId,
      status: updatedStatus,
      jobId: delivery.jobId,
      trackingUrl: delivery.trackingUrl,
      trackingData: trackingData,
      deliveryDetails: {
        sender: {
          name: delivery.shipmentDetails.senderName,
          phone: delivery.shipmentDetails.senderPhone,
          address: delivery.shipmentDetails.pickupAddress,
          postcode: delivery.shipmentDetails.pickupPostcode,
        },
        receiver: {
          name: delivery.shipmentDetails.receiverName,
          phone: delivery.shipmentDetails.receiverNumber,
          address: delivery.shipmentDetails.receiverAddress,
          postcode: delivery.shipmentDetails.receiverPostcode,
        },
        package: {
          weight: delivery.shipmentDetails.selectedWeight,
          itemType: delivery.shipmentDetails.itemType,
          isFragile: delivery.shipmentDetails.isFragile,
          deliveryType: delivery.shipmentDetails.deliveryType,
        },
      },
      cost: {
        itemCost: delivery.shipmentDetails.basePrice,
        deliveryCost: delivery.shipmentDetails.deliveryCost,
        vat: delivery.shipmentDetails.vatAmount,
        total: delivery.shipmentDetails.totalPrice,
      },
      timestamps: {
        created: delivery.createdAt,
        updated: delivery.updatedAt,
        lastTracked: delivery.lastTracked,
      },
    });
  } catch (error) {
    console.error("[DeliveryStatus] Error fetching tracking data:", error);

    // Return delivery info without tracking data if tracking fails
    res.json({
      success: true,
      deliveryId: delivery.deliveryId,
      status: delivery.status,
      jobId: delivery.jobId,
      trackingUrl: delivery.trackingUrl,
      trackingData: null,
      trackingError: error.message,
      deliveryDetails: {
        sender: {
          name: delivery.shipmentDetails.senderName,
          phone: delivery.shipmentDetails.senderPhone,
          address: delivery.shipmentDetails.pickupAddress,
          postcode: delivery.shipmentDetails.pickupPostcode,
        },
        receiver: {
          name: delivery.shipmentDetails.receiverName,
          phone: delivery.shipmentDetails.receiverNumber,
          address: delivery.shipmentDetails.receiverAddress,
          postcode: delivery.shipmentDetails.receiverPostcode,
        },
        package: {
          weight: delivery.shipmentDetails.selectedWeight,
          itemType: delivery.shipmentDetails.itemType,
          isFragile: delivery.shipmentDetails.isFragile,
          deliveryType: delivery.shipmentDetails.deliveryType,
        },
      },
      cost: {
        itemCost: delivery.shipmentDetails.basePrice,
        deliveryCost: delivery.shipmentDetails.deliveryCost,
        vat: delivery.shipmentDetails.vatAmount,
        total: delivery.shipmentDetails.totalPrice,
      },
      timestamps: {
        created: delivery.createdAt,
        updated: delivery.updatedAt,
      },
    });
  }
});

// Bulk tracking status for multiple deliveries (useful for dashboard)
app.post("/api/tracking/bulk-status", async (req, res) => {
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Task IDs array is required",
    });
  }

  try {
    const trackingPromises = taskIds.map(async (taskId) => {
      try {
        const response = await fetch(
          `${PUBLIC_BASE_URL}/api/tookan/tracking/${taskId}`
        );
        const data = await response.json();

        return {
          taskId,
          success: data.success,
          trackingData: data.success ? data.trackingData : null,
          error: data.success ? null : data.error,
        };
      } catch (error) {
        return {
          taskId,
          success: false,
          trackingData: null,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(trackingPromises);

    res.json({
      success: true,
      results: results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error("[BulkTracking] Error:", error);
    res.status(500).json({
      success: false,
      error: `Bulk tracking failed: ${error.message}`,
    });
  }
});

// Test endpoint to validate tracking setup
app.get("/api/tracking/test/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    // Test all tracking-related endpoints
    const tests = {
      geocoding: null,
      directions: null,
      tookanTracking: null,
    };

    // Test geocoding with a sample UK postcode
    try {
      const geocodeResponse = await fetch(
        `${PUBLIC_BASE_URL}/api/geocode?postcode=SW1A 1AA`
      );
      tests.geocoding = {
        success: geocodeResponse.ok,
        status: geocodeResponse.status,
        hasGoogleKey: !!process.env.GOOGLE_MAPS_API_KEY,
      };
    } catch (error) {
      tests.geocoding = { success: false, error: error.message };
    }

    // Test directions between two London locations
    try {
      const directionsResponse = await fetch(
        `${PUBLIC_BASE_URL}/api/directions?origin=51.5074,-0.1278&destination=51.5205,-0.0837`
      );
      tests.directions = {
        success: directionsResponse.ok,
        status: directionsResponse.status,
      };
    } catch (error) {
      tests.directions = { success: false, error: error.message };
    }

    // Test Tookan tracking if task ID provided
    if (taskId) {
      try {
        const trackingResponse = await fetch(
          `${PUBLIC_BASE_URL}/api/tookan/tracking/${taskId}`
        );
        tests.tookanTracking = {
          success: trackingResponse.ok,
          status: trackingResponse.status,
          hasTookanKey: !!process.env.TOOKAN_API_KEY,
        };
      } catch (error) {
        tests.tookanTracking = { success: false, error: error.message };
      }
    }

    res.json({
      success: true,
      message: "Tracking system test results",
      tests: tests,
      environment: {
        hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
        hasTookanKey: !!process.env.TOOKAN_API_KEY,
        serverUrl: PUBLIC_BASE_URL,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Tracking test failed: ${error.message}`,
    });
  }
});
// Add these fixes to your backend server.js

//-----------------------------------FIXED GEOCODING ENDPOINT----------------------------------
app.get("/api/geocode", async (req, res) => {
  const { postcode } = req.query;

  if (!postcode) {
    return res.status(400).json({
      success: false,
      error: "Postcode parameter is required",
    });
  }

  try {
    console.log("[Geocode] Processing postcode:", postcode);

    // First try UK Government API (free, reliable for UK postcodes)
    try {
      const ukApiResponse = await getCoordinatesFromPostcodeUKGov(postcode);
      console.log("[Geocode] UK Gov API success:", ukApiResponse);

      return res.json({
        success: true,
        postcode: postcode.trim().toUpperCase(),
        coordinates: {
          lat: ukApiResponse.latitude,
          lng: ukApiResponse.longitude,
        },
        source: "uk_gov_api",
      });
    } catch (ukError) {
      console.log("[Geocode] UK Gov API failed:", ukError.message);
    }

    // Fallback to Google Maps API if available
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        // Clean and format postcode for Google
        const cleanPostcode = postcode
          .trim()
          .replace(/\s+/g, " ")
          .toUpperCase();
        const encodedPostcode = encodeURIComponent(`${cleanPostcode}, UK`);

        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}&region=uk&key=${googleApiKey}`;

        console.log("[Geocode] Trying Google API for:", cleanPostcode);

        const response = await fetch(geocodeUrl);

        if (!response.ok) {
          throw new Error(`Google Geocoding API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          const formattedAddress = data.results[0].formatted_address;

          console.log("[Geocode] Google API success:", {
            postcode: cleanPostcode,
            coordinates: `${location.lat}, ${location.lng}`,
          });

          return res.json({
            success: true,
            postcode: cleanPostcode,
            coordinates: {
              lat: location.lat,
              lng: location.lng,
            },
            formattedAddress,
            placeId: data.results[0].place_id,
            source: "google_api",
          });
        } else {
          console.log("[Geocode] Google API returned:", data.status);
        }
      } catch (googleError) {
        console.log("[Geocode] Google API error:", googleError.message);
      }
    }

    // Final fallback to Mapbox if available
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      try {
        const coords = await getCoordinatesFromPostcode(postcode);
        console.log("[Geocode] Mapbox fallback success:", coords);

        return res.json({
          success: true,
          postcode: postcode.trim().toUpperCase(),
          coordinates: {
            lat: coords.latitude,
            lng: coords.longitude,
          },
          source: "mapbox_api",
        });
      } catch (mapboxError) {
        console.log("[Geocode] Mapbox fallback failed:", mapboxError.message);
      }
    }

    // If all methods fail
    return res.status(404).json({
      success: false,
      error: `Unable to geocode postcode: ${postcode}. Please verify the postcode is correct.`,
      postcode: postcode,
      attempted: [
        "uk_gov",
        googleApiKey ? "google" : null,
        mapboxToken ? "mapbox" : null,
      ].filter(Boolean),
    });
  } catch (error) {
    console.error("[Geocode] Unexpected error:", error);
    res.status(500).json({
      success: false,
      error: `Geocoding service error: ${error.message}`,
    });
  }
});

// function getJobStatusText(jobStatus) {
//   const statusMap = {
//     0: "Confirmed",
//     1: "Assigned to driver",
//     2: "Driver started",
//     3: "Delivered successfully",
//     4: "Delivery failed",
//     5: "Cancelled",
//     6: "Cancelled by dispatcher",
//     7: "Cancelled by customer",
//     8: "Driver arrived at pickup",
//     9: "Driver departed from pickup",
//   };

//   return statusMap[parseInt(jobStatus)] || `Status ${jobStatus}`;
// }
//-----------------------------------TEST ENDPOINTS----------------------------------
// Add a test endpoint to verify your APIs
app.get("/api/test/geocode/:postcode", async (req, res) => {
  const { postcode } = req.params;

  const tests = {
    uk_gov: null,
    google: null,
    mapbox: null,
  };

  // Test UK Government API
  try {
    const ukResult = await getCoordinatesFromPostcodeUKGov(postcode);
    tests.uk_gov = { success: true, coordinates: ukResult };
  } catch (error) {
    tests.uk_gov = { success: false, error: error.message };
  }

  // Test Google API
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const cleanPostcode = postcode.trim().replace(/\s+/g, " ").toUpperCase();
      const encodedPostcode = encodeURIComponent(`${cleanPostcode}, UK`);
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}&region=uk&key=${process.env.GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === "OK" && data.results?.length > 0) {
        tests.google = {
          success: true,
          coordinates: {
            lat: data.results[0].geometry.location.lat,
            lng: data.results[0].geometry.location.lng,
          },
        };
      } else {
        tests.google = {
          success: false,
          error: `Google API status: ${data.status}`,
        };
      }
    } catch (error) {
      tests.google = { success: false, error: error.message };
    }
  }

  // Test Mapbox API
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    try {
      const coords = await getCoordinatesFromPostcode(postcode);
      tests.mapbox = { success: true, coordinates: coords };
    } catch (error) {
      tests.mapbox = { success: false, error: error.message };
    }
  }

  res.json({
    postcode,
    tests,
    environment: {
      hasGoogleKey: !!process.env.GOOGLE_MAPS_API_KEY,
      hasMapboxKey: !!process.env.MAPBOX_ACCESS_TOKEN,
    },
  });
});

app.get("/api/test/tracking/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    const testPayload = {
      api_key: process.env.TOOKAN_API_KEY,
      job_id: parseInt(taskId),
    };

    console.log("[TrackingTest] Testing with payload:", {
      job_id: testPayload.job_id,
      has_api_key: !!testPayload.api_key,
    });

    const response = await fetch(
      "https://api.tookanapp.com/v2/get_job_details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      }
    );

    const data = await response.json();

    res.json({
      test: "tracking_api",
      taskId,
      httpStatus: response.status,
      tookanResponse: {
        status: data.status,
        message: data.message,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
      },
      environment: {
        hasTookanKey: !!process.env.TOOKAN_API_KEY,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      test: "tracking_api",
      taskId,
      error: error.message,
      environment: {
        hasTookanKey: !!process.env.TOOKAN_API_KEY,
      },
    });
  }
});

app.get("/api/google-pay-config", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV === "production" ? "PRODUCTION" : "TEST",
    merchantInfo: {
      merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || "BCR2DN4T2LKGCFMW",
      merchantName: "Rapid Delivery",
    },
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: [
            "AMEX",
            "DISCOVER",
            "INTERAC",
            "JCB",
            "MASTERCARD",
            "VISA",
          ],
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "stripe",
            "stripe:version": "2018-10-31",
            "stripe:publishableKey": process.env.STRIPE_PUBLISHABLE_KEY,
          },
        },
      },
    ],
  });
});
app.post("/api/process-google-pay", async (req, res) => {
  const { paymentToken, totalAmount, shipmentDetails } = req.body || {};

  if (!paymentToken || !totalAmount || !shipmentDetails) {
    return res.status(400).json({
      error: "Missing paymentToken, totalAmount, or shipmentDetails",
    });
  }

  const missing = validateShipmentDetails(shipmentDetails);
  if (missing.length) {
    return res.status(400).json({
      error: `Missing fields in shipmentDetails: ${missing.join(", ")}`,
    });
  }

  try {
    console.log("[GooglePay] Processing payment with Stripe token");

    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(totalAmount) * 100), // Convert to cents
      currency: "gbp",
      payment_method_data: {
        type: "card",
        token: paymentToken.id, // Stripe token from Google Pay
      },
      confirm: true,
      metadata: {
        ...Object.fromEntries(
          Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
        ),
      },
    });

    if (paymentIntent.status === "succeeded") {
      const deliveryId = `DEL-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const sessionId = `gpay_${paymentIntent.id}`;

      sessionData.set(sessionId, {
        sessionId,
        status: "payment_completed",
        shipmentDetails,
        totalAmount,
        paymentIntentId: paymentIntent.id,
        deliveryId,
        paymentMethod: "google_pay",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });

      console.log("[GooglePay] Payment succeeded:", paymentIntent.id);

      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        sessionId,
        deliveryId,
        message: "Google Pay payment processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
      });
    }
  } catch (error) {
    console.error("[GooglePay] Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process Google Pay payment",
      details: error.message,
    });
  }
});
app.post("/api/create-google-pay-intent", async (req, res) => {
  const { totalAmount, shipmentDetails } = req.body || {};

  if (!totalAmount || !shipmentDetails) {
    return res.status(400).json({
      success: false,
      error: "Missing totalAmount or shipmentDetails",
    });
  }

  const missing = validateShipmentDetails(shipmentDetails);
  if (missing.length) {
    return res.status(400).json({
      success: false,
      error: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    console.log("[GooglePay] Creating PaymentIntent for amount:", totalAmount);

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(totalAmount) * 100),
      currency: "gbp",
      payment_method_types: ["card"], // Google Pay uses card underneath
      metadata: {
        ...Object.fromEntries(
          Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
        ),
        payment_method: "google_pay",
      },
    });

    console.log("[GooglePay] PaymentIntent created:", paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[GooglePay] Error creating PaymentIntent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
});

// Step 2: Confirm payment and create delivery (called after presentGooglePay succeeds)
app.post("/api/confirm-google-pay", async (req, res) => {
  const { paymentIntentId, shipmentDetails } = req.body || {};

  if (!paymentIntentId || !shipmentDetails) {
    return res.status(400).json({
      success: false,
      error: "Missing paymentIntentId or shipmentDetails",
    });
  }

  try {
    console.log("[GooglePay] Confirming payment:", paymentIntentId);

    // Retrieve the PaymentIntent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }

    // Generate delivery ID
    const deliveryId = `DEL-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const sessionId = `gpay_${paymentIntentId}`;

    // Store session data
    const sessionEntry = {
      sessionId,
      status: "payment_completed",
      shipmentDetails,
      totalAmount: paymentIntent.amount / 100, // Convert from cents
      paymentIntentId,
      deliveryId,
      paymentMethod: "google_pay",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    sessionData.set(sessionId, sessionEntry);

    console.log("[GooglePay] Payment confirmed successfully:", {
      paymentIntentId,
      deliveryId,
      sessionId,
      amount: sessionEntry.totalAmount,
    });

    res.json({
      success: true,
      sessionId,
      deliveryId,
      paymentIntentId,
      message: "Google Pay payment confirmed successfully",
    });
  } catch (error) {
    console.error("[GooglePay] Error confirming payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to confirm payment",
      details: error.message,
    });
  }
});

// Add these new endpoints to your server.js file

// 1. Create Payment Intent for Klarna (similar to Google Pay)
app.post("/api/create-klarna-intent", async (req, res) => {
  const { totalAmount, shipmentDetails } = req.body || {};

  if (!totalAmount || !shipmentDetails) {
    return res.status(400).json({
      success: false,
      error: "Missing totalAmount or shipmentDetails",
    });
  }

  const missing = validateShipmentDetails(shipmentDetails);
  if (missing.length) {
    return res.status(400).json({
      success: false,
      error: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    console.log("[Klarna] Creating PaymentIntent for amount:", totalAmount);

    // Create PaymentIntent with Klarna
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(totalAmount) * 100),
      currency: "gbp",
      payment_method_types: ["klarna"], // Klarna payment method
      metadata: {
        ...Object.fromEntries(
          Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
        ),
        payment_method: "klarna",
      },
    });

    console.log("[Klarna] PaymentIntent created:", paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[Klarna] Error creating PaymentIntent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
});

// 2. Confirm Klarna payment and create delivery
app.post("/api/confirm-klarna", async (req, res) => {
  const { paymentIntentId, shipmentDetails } = req.body || {};

  if (!paymentIntentId || !shipmentDetails) {
    return res.status(400).json({
      success: false,
      error: "Missing paymentIntentId or shipmentDetails",
    });
  }

  try {
    console.log("[Klarna] Confirming payment:", paymentIntentId);

    // Retrieve the PaymentIntent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }

    // Generate delivery ID
    const deliveryId = `DEL-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const sessionId = `klarna_${paymentIntentId}`;

    // Store session data
    const sessionEntry = {
      sessionId,
      status: "payment_completed",
      shipmentDetails,
      totalAmount: paymentIntent.amount / 100,
      paymentIntentId,
      deliveryId,
      paymentMethod: "klarna",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    sessionData.set(sessionId, sessionEntry);

    console.log("[Klarna] Payment confirmed successfully:", {
      paymentIntentId,
      deliveryId,
      sessionId,
      amount: sessionEntry.totalAmount,
    });

    res.json({
      success: true,
      sessionId,
      deliveryId,
      paymentIntentId,
      message: "Klarna payment confirmed successfully",
    });
  } catch (error) {
    console.error("[Klarna] Error confirming payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to confirm payment",
      details: error.message,
    });
  }
});

app.post("/api/create-apple-pay-intent", async (req, res) => {
  const { totalAmount, shipmentDetails } = req.body || {};

  if (!totalAmount || !shipmentDetails) {
    return res.status(400).json({
      success: false,
      error: "Missing totalAmount or shipmentDetails",
    });
  }

  const missing = validateShipmentDetails(shipmentDetails);
  if (missing.length) {
    return res.status(400).json({
      success: false,
      error: `Missing fields: ${missing.join(", ")}`,
    });
  }

  try {
    console.log("[ApplePay] Creating PaymentIntent for amount:", totalAmount);

    // Create PaymentIntent - Apple Pay uses 'card' as the payment method type
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(totalAmount) * 100),
      currency: "gbp",
      payment_method_types: ["card"], // Apple Pay uses card underneath
      metadata: {
        ...Object.fromEntries(
          Object.entries(shipmentDetails).map(([k, v]) => [k, String(v)])
        ),
        payment_method: "apple_pay",
      },
    });

    console.log("[ApplePay] PaymentIntent created:", paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[ApplePay] Error creating PaymentIntent:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment intent",
      details: error.message,
    });
  }
});

// 2. Confirm Apple Pay payment and create delivery
app.post("/api/confirm-apple-pay", async (req, res) => {
  const { paymentIntentId, shipmentDetails } = req.body || {};

  if (!paymentIntentId || !shipmentDetails) {
    return res.status(400).json({
      success: false,
      error: "Missing paymentIntentId or shipmentDetails",
    });
  }

  try {
    console.log("[ApplePay] Confirming payment:", paymentIntentId);

    // Retrieve the PaymentIntent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        status: paymentIntent.status,
      });
    }

    // Generate delivery ID
    const deliveryId = `DEL-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const sessionId = `applepay_${paymentIntentId}`;

    // Store session data
    const sessionEntry = {
      sessionId,
      status: "payment_completed",
      shipmentDetails,
      totalAmount: paymentIntent.amount / 100,
      paymentIntentId,
      deliveryId,
      paymentMethod: "apple_pay",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    sessionData.set(sessionId, sessionEntry);

    console.log("[ApplePay] Payment confirmed successfully:", {
      paymentIntentId,
      deliveryId,
      sessionId,
      amount: sessionEntry.totalAmount,
    });

    res.json({
      success: true,
      sessionId,
      deliveryId,
      paymentIntentId,
      message: "Apple Pay payment confirmed successfully",
    });
  } catch (error) {
    console.error("[ApplePay] Error confirming payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to confirm payment",
      details: error.message,
    });
  }
});

app.post("/api/webhook/tookan", (req, res) => {
  try {
    const eventData = req.body;

    console.log("[Webhook] Received Tookan event:", {
      eventType: eventData.event_type,
      taskId: eventData.task_id,
      jobStatus: eventData.job_status,
      timestamp: new Date().toISOString(),
    });

    const {
      event_type,
      task_id,
      job_status,
      agent_location,
      agent_name,
      agent_id,
      latitude,
      longitude,
      eta,
    } = eventData;

    // Map job status codes
    const getStatusInfo = (status) => {
      const statusCode = parseInt(status);

      const statusMap = {
        0: { key: "created", text: "Task created", color: "#6B7280" },
        1: { key: "assigned", text: "Driver assigned", color: "#3B82F6" },
        2: { key: "started", text: "Driver started 🚗", color: "#F59E0B" },
        3: {
          key: "completed",
          text: "Delivered successfully ✓",
          color: "#10B981",
        },
        4: { key: "failed", text: "Delivery failed ✗", color: "#EF4444" },
        5: { key: "cancelled", text: "Cancelled", color: "#6B7280" },
        6: {
          key: "cancelled_dispatcher",
          text: "Cancelled by dispatcher",
          color: "#6B7280",
        },
        7: { key: "acknowledged", text: "Driver accepted", color: "#3B82F6" },
        8: { key: "arrived", text: "Driver arrived 📍", color: "#F59E0B" },
        9: {
          key: "started_delivery",
          text: "En route to delivery 🚗",
          color: "#F59E0B",
        },
        10: { key: "unassigned", text: "Unassigned", color: "#6B7280" },
        11: {
          key: "confirming_delivery",
          text: "Driver confirming delivery 📸",
          color: "#F59E0B",
        },
        12: {
          key: "delivery_confirmed",
          text: "Delivery confirmed ✓",
          color: "#10B981",
        },
      };

      return (
        statusMap[statusCode] || {
          key: "unknown",
          text: `Status ${statusCode}`,
          color: "#6B7280",
        }
      );
    };

    const statusInfo = getStatusInfo(job_status);

    // Store webhook data with task ID as key
    webhookDataStore[task_id] = {
      job_status: job_status,
      agent_location: agent_location
        ? {
            latitude: parseFloat(agent_location.latitude || latitude),
            longitude: parseFloat(agent_location.longitude || longitude),
          }
        : {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
      agent_name: agent_name,
      agent_id: agent_id,
      eta: eta,
      statusKey: statusInfo.key,
      statusText: statusInfo.text,
      statusColor: statusInfo.color,
      receivedAt: new Date().toISOString(),
    };

    console.log("[Webhook] Data stored for task:", task_id);
    console.log("[Webhook] Stored data:", webhookDataStore[task_id]);

    // Send success response
    res.json({
      success: true,
      message: "Webhook received and processed",
      taskId: task_id,
      status: statusInfo.key,
    });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get latest tracking data for a task
app.get("/api/webhook/tookan/latest/:taskId", (req, res) => {
  try {
    const { taskId } = req.params;

    console.log("[Webhook GET] Fetching data for task:", taskId);
    console.log(
      "[Webhook GET] Available tasks in store:",
      Object.keys(webhookDataStore)
    );

    const data = webhookDataStore[taskId];

    if (!data) {
      console.log("[Webhook GET] No data found for task:", taskId);
      return res.status(404).json({
        success: false,
        error: "No tracking data available for this task yet",
      });
    }

    console.log("[Webhook GET] Returning data for task:", taskId);

    res.json({
      success: true,
      trackingData: data,
    });
  } catch (error) {
    console.error("[Webhook GET] Error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
app.get("/", (req, res) => res.send("Backend is running on Vercel!"));
// ---------- Start Server ----------
// app.listen(port, "0.0.0.0", () => {
//   console.log(`Server running on ${PUBLIC_BASE_URL}`);
//   console.log(
//     "Remember to expose /webhook to Stripe when testing locally (e.g., via ngrok)."
//   );
//   console.log("Available endpoints:");
//   console.log("  GET  / - Health check");
//   console.log("  GET  /api/health - Service status");
//   console.log("  POST /api/tookan/delivery-cost - Calculate delivery cost");
//   console.log("  POST /api/create-checkout-session - Web checkout (PRIMARY)");
//   console.log("  GET  /api/session/:id/payment-status - Check payment status");
//   console.log(
//     "  GET  /api/session/:id/create-tookan-task - Create/get Tookan task"
//   );
//   console.log("  GET  /api/delivery/:id - Get delivery details");
//   console.log("  POST /webhook - Stripe webhook");
//   console.log("  POST /api/webhook/tookan - Tookan webhook");
//   console.log("  GET  /payment-success - Payment success page");

//   console.log("  GET  /payment-cancel - Payment cancel page");
// });

if (process.env.VERCEL === undefined) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on ${PUBLIC_BASE_URL}`);
    console.log(
      "Remember to expose /webhook to Stripe when testing locally (e.g., via ngrok)."
    );
    console.log("Available endpoints:");
    console.log("  GET  / - Health check");
    console.log("  GET  /api/health - Service status");
    console.log("  POST /api/tookan/delivery-cost - Calculate delivery cost");
    console.log("  POST /api/create-checkout-session - Web checkout (PRIMARY)");
    console.log(
      "  GET  /api/session/:id/payment-status - Check payment status"
    );
    console.log(
      "  GET  /api/session/:id/create-tookan-task - Create/get Tookan task"
    );
    console.log("  GET  /api/delivery/:id - Get delivery details");
    console.log("  POST /webhook - Stripe webhook");
    console.log("  POST /api/webhook/tookan - Tookan webhook");
    console.log("  GET  /payment-success - Payment success page");

    console.log("  GET  /payment-cancel - Payment cancel page");
  });
}

export default app;
