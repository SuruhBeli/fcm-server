import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { GoogleAuth } from "google-auth-library";

const app = express();

app.use(cors());
app.use(express.json());

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

// ====== SEND FCM (FLEXIBLE) ======
async function sendFCM(payload) {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  const projectId = await auth.getProjectId();

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: payload
      }),
    }
  );

  const data = await res.json();
  console.log("📨 FCM response:", data);
}

// ====== ENDPOINT ======
app.post("/send-notif", async (req, res) => {
  try {
    const {
      token,
      title,
      body,
      notification,
      android,
      data
    } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token wajib ada" });
    }

    // ===== PRIORITAS PAYLOAD =====
    let finalNotification = notification;

    // fallback kalau pakai simple mode (home.js)
    if (!finalNotification && title) {
      finalNotification = { title, body };
    }

    const payload = {
      token,
      notification: finalNotification,
      android: android || {
        notification: {
          sound: "default",
          channelId: "default",
          priority: "high"
        }
      },
      data: data || {}
    };

    await sendFCM(payload);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

// ====== START SERVER ======
app.listen(3000, () => {
  console.log("🚀 Server jalan di port 3000");
});