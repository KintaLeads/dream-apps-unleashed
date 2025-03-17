import { serve } from "https://deno.land/std/http/server.ts";
import { TelegramClient } from "https://deno.land/x/gramjs@1.5.4/mod.ts";
import { StringSession } from "https://deno.land/x/gramjs@1.5.4/sessions/StringSession.ts";
import "https://deno.land/std@0.168.0/dotenv/load.ts"; // Load environment variables

const apiId = Number(Deno.env.get("TELEGRAM_API_ID"));
const apiHash = Deno.env.get("TELEGRAM_API_HASH");

// Load session from local storage or use empty string
let sessionString = Deno.env.get("TELEGRAM_SESSION") || "";
const stringSession = new StringSession(sessionString);

// Initialize Telegram Client
const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

await client.connect();
console.log("✅ Telegram Client Connected!");

// Create a Fly.io-compatible HTTP server
serve(async (req) => {
  const url = new URL(req.url);

  // Send a Telegram Message
  if (url.pathname === "/sendMessage" && req.method === "POST") {
    try {
      const { chatId, message } = await req.json();
      await client.sendMessage(chatId, { message });

      return new Response(JSON.stringify({ success: true, message: "Message Sent!" }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("❌ Error Sending Message:", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Fly.io Telegram API Running 🚀", { status: 200 });
});
