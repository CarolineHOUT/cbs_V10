import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Connexion Google (on remplira après)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

app.post("/api/crisis/create-meeting", async (req, res) => {
  try {
    const { crisis, participants, convocationText } = req.body;

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const emails = participants.map((p) => p.email).filter(Boolean);

    const start = new Date(`${crisis.scheduledDate}T${crisis.scheduledTime}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    // 📅 Création événement Agenda
    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all",
      requestBody: {
        summary: crisis.title,
        location: crisis.location,
        description: convocationText,
        start: {
          dateTime: start.toISOString(),
          timeZone: "Europe/Paris",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "Europe/Paris",
        },
        attendees: emails.map((email) => ({ email })),
      },
    });

    // 📧 Envoi Gmail
    const message = [
      `To: ${emails.join(", ")}`,
      `Subject: ${crisis.title}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      convocationText,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const mail = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    res.json({
      calendarEventId: event.data.id,
      gmailMessageId: mail.data.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 🚀 lancement serveur
app.listen(3001, () => {
  console.log("Backend lancé sur http://localhost:3001");
});