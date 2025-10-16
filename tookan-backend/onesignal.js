import axios from "axios";

// Send push notification to all users via OneSignal

export async function sendGlobalAnnouncement(title, message) {
  try {
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: process.env.ONESIGNAL_APP_ID, // from your OneSignal dashboard
        included_segments: ["All"], // sends to everyone
        headings: { en: title }, // notification title
        contents: { en: message }, // notification message
      },
      {
        headers: {
          Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Notification sent:", response.data.id);
  } catch (err) {
    console.error(
      "❌ Error sending notification:",
      err.response?.data || err.message
    );
  }
}
