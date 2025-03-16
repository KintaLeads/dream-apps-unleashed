
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TelegramClient } from "npm:telegram";
import { StringSession } from "npm:telegram/sessions";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiId, apiHash, phoneNumber, phoneCodeHash, verificationCode, sessionString } = await req.json();
    
    console.log("Starting verification process");
    
    // Validate inputs
    if (!apiId || !apiHash || !phoneNumber || !phoneCodeHash || !verificationCode) {
      throw new Error("Missing required verification parameters");
    }
    
    // Initialize session from string or create new
    const stringSession = new StringSession(sessionString || "");
    
    // Initialize the client
    const client = new TelegramClient(
      stringSession,
      parseInt(apiId),
      apiHash,
      { 
        connectionRetries: 5,
        useWSS: true,
      }
    );
    
    console.log("Connecting to Telegram...");
    await client.connect();
    
    // Sign in with the verification code
    console.log("Attempting to sign in with code...");
    const user = await client.signIn({
      phoneNumber,
      phoneCodeHash,
      phoneCode: verificationCode,
    });
    
    console.log("Sign in successful");
    
    // Get the new session string to save
    const newSessionString = client.session.save();
    
    return new Response(
      JSON.stringify({
        success: true,
        user: user,
        sessionString: newSessionString,
        message: "Successfully authenticated with Telegram"
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in telegram-verify function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred during verification"
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
