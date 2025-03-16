import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TelegramClient } from "https://esm.sh/telegram@2.15.5";
import { StringSession } from "https://esm.sh/telegram@2.15.5/sessions/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("telegram-auth function called", new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch((err) => {
      console.error("Error parsing request body:", err);
      throw new Error("Invalid request format: " + err.message);
    });

    const { apiId, apiHash, phoneNumber, sessionString } = body;

    console.log("Starting Telegram client initialization");

    // Validate inputs
    if (!apiId || !apiHash) {
      console.error("Missing required parameters: apiId or apiHash");
      throw new Error("API ID and API Hash are required");
    }

    // Use existing session or create a new one
    const stringSession = new StringSession(sessionString || ""); // Ensure valid session format

    // Initialize the Telegram Client
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });

    try {
      await client.connect();
      console.log("Connected to Telegram API");

      if (!sessionString) {
        console.log("New login: Sending verification code...");
        const result = await client.sendCode({
          apiId: parseInt(apiId),
          apiHash: apiHash,
        }, phoneNumber);

        return new Response(
          JSON.stringify({
            success: true,
            action: "code_requested",
            phoneCodeHash: result.phoneCodeHash,
            sessionString: client.session.save(), // Save session immediately
            message: "Verification code has been sent to your phone",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log("Validating existing session...");
        const user = await client.getMe();
        console.log("Session validated for user:", user.firstName || "Unknown");

        return new Response(
          JSON.stringify({
            success: true,
            action: "session_valid",
            user: user,
            sessionString: client.session.save(),
            message: "Telegram session is valid",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (clientError) {
      console.error("Telegram client error:", clientError.message);
      throw clientError;
    }
  } catch (error) {
    console.error("Error in telegram-auth function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred",
        errorDetail: error.stack || null,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
