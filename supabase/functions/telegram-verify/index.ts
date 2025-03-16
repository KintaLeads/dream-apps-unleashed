import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TelegramClient } from "https://esm.sh/telegram@2.15.5";
import { StringSession } from "https://esm.sh/telegram@2.15.5/sessions/index.js";

serve(async (req) => {
  console.log("telegram-verify function called", new Date().toISOString());

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { apiId, apiHash, phoneNumber, phoneCodeHash, verificationCode, sessionString } = body;

    console.log("Verifying session for phone:", phoneNumber);

    if (!apiId || !apiHash || !phoneNumber || !phoneCodeHash || !verificationCode) {
      throw new Error("Missing required verification parameters");
    }

    const stringSession = new StringSession(sessionString || "");
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });

    await client.connect();
    console.log("Connected to Telegram API");

    const user = await client.signIn({
      phoneNumber,
      phoneCodeHash,
      phoneCode: verificationCode,
    });

    console.log("Sign in successful for user:", user.firstName);

    return new Response(
      JSON.stringify({
        success: true,
        user: user,
        sessionString: client.session.save(),
        message: "Successfully authenticated with Telegram",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in telegram-verify function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
