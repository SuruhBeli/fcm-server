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
  const { token, title, body } = req.body;

  try {
    await sendFCM(token, title, body);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server jalan di port 3000");
});