import express from "express";
import cors from "cors";
import { GoogleAuth } from "google-auth-library";

const app = express();

app.use(cors()); // 🔥 INI WAJIB
app.use(express.json());

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

async function sendFCM(token, title, body) {
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
        message: {
          token,
          notification: { title, body },
        },
      }),
    }
  );

  const data = await res.json();
  console.log("FCM response:", data);
}

app.post("/send-notif", async (req, res) => {
  try {
    const { token, title, body, notification, android, data } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token wajib ada" });
    }

    // 🔥 FIX: pastikan notification SELALU valid
    let finalNotification = null;

    if (notification && notification.title) {
      finalNotification = notification;
    } else if (title) {
      finalNotification = { title, body: body || "" };
    } else {
      // fallback terakhir (ANTI GAGAL TOTAL)
      finalNotification = {
        title: "Notifikasi",
        body: body || ""
      };
    }

    const payload = {
      token,
      notification: finalNotification,

      android: {
        notification: {
          sound: "default",
          channelId: "default",
          priority: "high",
          ...(android?.notification || {})
        }
      },

      data: data || {}
    };

    console.log("🔥 FINAL PAYLOAD:", payload);

    await sendFCM(payload);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server jalan di port 3000");
});