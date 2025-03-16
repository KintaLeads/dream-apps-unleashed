import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Use the GramJS library from a working CDN with correct path
import { TelegramClient } from "https://esm.sh/telegram@2.15.5";
import { StringSession } from "https://esm.sh/telegram@2.15.5/sessions/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("telegram-verify function called", new Date().toISOString());
  
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
    
    const { apiId, apiHash, phoneNumber, phoneCodeHash, verificationCode, sessionString } = body;
    
    console.log("Starting verification process for phone:", phoneNumber ? phoneNumber.substring(0, 4) + "..." : "Unknown");
    
    // Validate inputs
    if (!apiId || !apiHash || !phoneNumber || !phoneCodeHash || !verificationCode) {
      console.error("Missing required verification parameters", { 
        hasApiId: !!apiId, 
        hasApiHash: !!apiHash, 
        hasPhoneNumber: !!phoneNumber,
        hasPhoneCodeHash: !!phoneCodeHash,
        hasVerificationCode: !!verificationCode
      });
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
    
    try {
      console.log("Connecting to Telegram...");
      await client.connect();
      console.log("Connected to Telegram API");
      
      // Sign in with the verification code
      console.log("Attempting to sign in with verification code...");
      const user = await client.signIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode: verificationCode,
      });
      
      console.log("Sign in successful for user:", user.firstName || "Unknown");
      
      // Get the new session string to save
      const newSessionString = client.session.save();
      console.log("New session string saved (length):", newSessionString ? newSessionString.length : 0);
      
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
    } catch (clientError) {
      console.error("Telegram client error during verification:", clientError.message);
      
      // Handle specific Telegram verification errors
      const errorMessage = clientError.message || "An unknown error occurred";
      
      if (errorMessage.includes("PHONE_CODE_INVALID")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "The verification code you entered is invalid. Please try again with the correct code.",
            errorCode: "PHONE_CODE_INVALID"
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
      
      if (errorMessage.includes("PHONE_CODE_EXPIRED")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "The verification code has expired. Please request a new code.",
            errorCode: "PHONE_CODE_EXPIRED"
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
    console.error("Error in telegram-verify function:", error);
    
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
