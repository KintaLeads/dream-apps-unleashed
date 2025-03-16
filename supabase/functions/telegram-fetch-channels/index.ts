
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Use the correct import path for StringSession
import { TelegramClient } from "https://esm.sh/telegram@2.15.5";
import { StringSession } from "https://esm.sh/telegram@2.15.5/sessions";
import { Api } from "https://esm.sh/telegram@2.15.5/tl";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("telegram-fetch-channels function called", new Date().toISOString());
  
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
    
    const { apiId, apiHash, sessionString } = body;
    
    console.log("Starting channel fetch process");
    
    // Validate inputs
    if (!apiId || !apiHash || !sessionString) {
      console.error("Missing required parameters", { 
        hasApiId: !!apiId, 
        hasApiHash: !!apiHash, 
        hasSessionString: !!sessionString 
      });
      throw new Error("API ID, API Hash, and valid session are required");
    }
    
    // Initialize session from string
    const stringSession = new StringSession(sessionString);
    
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
      
      console.log("Fetching dialogs...");
      const dialogs = await client.getDialogs({
        limit: 50, // Fetch up to 50 dialogs
      });
      
      // Filter for channels and groups
      const channels = dialogs
        .filter(dialog => 
          dialog.entity instanceof Api.Channel ||
          dialog.entity instanceof Api.Chat
        )
        .map(dialog => ({
          id: dialog.entity.id.toString(),
          name: dialog.entity.title,
          type: dialog.entity instanceof Api.Channel ? 
            dialog.entity.megagroup ? 'supergroup' : 'channel' 
            : 'group',
          username: dialog.entity instanceof Api.Channel ? dialog.entity.username || null : null,
          participants_count: dialog.entity instanceof Api.Channel ? dialog.entity.participantsCount || null : null
        }));
      
      console.log(`Found ${channels.length} channels/groups`);
      
      return new Response(
        JSON.stringify({
          success: true,
          channels: channels,
          sessionString: client.session.save(),
          message: "Successfully fetched channels"
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    } catch (clientError) {
      console.error("Telegram client error during channel fetch:", clientError.message);
      
      // Handle specific telegram errors
      const errorMessage = clientError.message || "An unknown error occurred";
      
      if (errorMessage.includes("AUTH_KEY_UNREGISTERED") || errorMessage.includes("SESSION_REVOKED")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Your Telegram session has expired. Please reconnect your account in Settings.",
            errorCode: "SESSION_EXPIRED"
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
      
      throw clientError;
    }
  } catch (error) {
    console.error("Error in telegram-fetch-channels function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred while fetching channels",
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
