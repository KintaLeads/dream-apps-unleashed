
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Return mock data for frontend development
  return new Response(
    JSON.stringify({
      success: true,
      channels: [
        {
          id: "mock-channel-1",
          name: "Mock Channel 1",
          type: "channel",
          username: "mock_channel_1"
        },
        {
          id: "mock-channel-2",
          name: "Mock Channel 2",
          type: "supergroup",
          username: "mock_channel_2"
        }
      ],
      message: "Frontend-only version - Mock data provided"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
