
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
    const { apiId, apiHash, phoneNumber, sessionString } = await req.json();
    
    console.log("Starting Telegram client initialization");
    
    // Validate inputs
    if (!apiId || !apiHash) {
      throw new Error("API ID and API Hash are required");
    }
    
    // Use existing session or create a new one
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
    
    // If we don't have a session string, start the login process
    if (!sessionString) {
      if (!phoneNumber) {
        throw new Error("Phone number is required for first-time login");
      }
      
      console.log("Starting connection...");
      await client.connect();
      console.log("Connected");
      
      // Start the phone login process
      const result = await client.sendCode(
        {
          apiId: parseInt(apiId),
          apiHash: apiHash,
        }, 
        phoneNumber
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          action: "code_requested",
          phoneCodeHash: result.phoneCodeHash,
          sessionString: client.session.save(),
          message: "Verification code has been sent to your phone"
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    } else {
      // If we have a session string, just validate it
      console.log("Validating existing session...");
      await client.connect();
      
      const user = await client.getMe();
      console.log("Session validated for user:", user);
      
      return new Response(
        JSON.stringify({
          success: true,
          action: "session_valid",
          user: user,
          sessionString: client.session.save(),
          message: "Telegram session is valid"
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }
  } catch (error) {
    console.error("Error in telegram-auth function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred"
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
