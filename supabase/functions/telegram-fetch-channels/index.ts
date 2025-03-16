
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TelegramClient } from "npm:telegram";
import { StringSession } from "npm:telegram/sessions";
import { Api } from "npm:telegram/tl";

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
    const { apiId, apiHash, sessionString } = await req.json();
    
    console.log("Starting channel fetch process");
    
    // Validate inputs
    if (!apiId || !apiHash || !sessionString) {
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
    
    console.log("Connecting to Telegram...");
    await client.connect();
    
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
  } catch (error) {
    console.error("Error in telegram-fetch-channels function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unknown error occurred while fetching channels"
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
