
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Use Deno-compatible gramjs library
import { TelegramClient } from "https://deno.land/x/gramjs@v2.2.1/mod.ts";
import { StringSession } from "https://deno.land/x/gramjs@v2.2.1/sessions/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("telegram-auth function called", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json().catch(err => {
      console.error("Error parsing request body:", err);
      throw new Error("Invalid request format: " + err.message);
    });
    
    const { apiId, apiHash, phoneNumber, sessionString } = body;
    
    console.log("Starting Telegram client initialization for phone:", phoneNumber ? phoneNumber.substring(0, 4) + "..." : "using existing session");
    
    // Validate inputs
    if (!apiId || !apiHash) {
      console.error("Missing required parameters: apiId or apiHash");
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
    
    try {
      // If we don't have a session string, start the login process
      if (!sessionString) {
        if (!phoneNumber) {
          console.error("Phone number missing for initial login");
          throw new Error("Phone number is required for first-time login");
        }
        
        console.log("Starting connection...");
        await client.connect();
        console.log("Connected to Telegram API");
        
        // Start the phone login process
        console.log("Sending verification code to phone number...");
        const result = await client.sendCode(
          {
            apiId: parseInt(apiId),
            apiHash: apiHash,
          }, 
          phoneNumber
        );
        
        console.log("Verification code sent successfully");
        
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
        console.log("Session validated for user:", user.firstName || "Unknown");
        
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
    } catch (clientError) {
      console.error("Telegram client error:", clientError.message);
      
      // Handle specific telegram errors
      const errorMessage = clientError.message || "An unknown error occurred";
      
      if (errorMessage.includes("AUTH_KEY_UNREGISTERED")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Session expired or invalid. Please reconnect your Telegram account."
          }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            } 
          }
        );
      }
      
      if (errorMessage.includes("PHONE_NUMBER_INVALID")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "The phone number format is invalid. Please use international format (e.g., +123456789)."
          }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            } 
          }
        );
      }
      
      throw clientError;
    }
  } catch (error) {
    console.error("Error in telegram-auth function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred",
        errorDetail: error.stack || null
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
