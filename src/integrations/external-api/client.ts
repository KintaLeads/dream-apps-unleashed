
// API client for external backend (Railway.app)
import { supabase } from "@/integrations/supabase/client";

// Base URL for your external API
const API_BASE_URL = import.meta.env.VITE_EXTERNAL_API_URL || "https://your-railway-app-url.up.railway.app";

/**
 * Headers factory function that generates auth headers for each request
 * This ensures we always use the latest auth token
 */
const getAuthHeaders = async () => {
  // Get current session from Supabase
  const { data } = await supabase.auth.getSession();
  
  return {
    "Content-Type": "application/json",
    // Pass Supabase JWT token to authenticate requests to your external API
    "Authorization": `Bearer ${data.session?.access_token || ''}`,
  };
};

/**
 * External API client for Telegram operations
 */
export const telegramApi = {
  /**
   * Authenticate with Telegram
   * Replaces the telegram-auth Edge Function
   */
  authenticate: async (params: {
    apiId: string;
    apiHash: string;
    phoneNumber: string;
    sessionString?: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/auth`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Telegram auth error:", error);
      throw error;
    }
  },
  
  /**
   * Verify Telegram code
   * Replaces the telegram-verify Edge Function
   */
  verifyCode: async (params: {
    apiId: string;
    apiHash: string;
    phoneNumber: string;
    phoneCodeHash: string;
    verificationCode: string;
    sessionString?: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/verify`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Verification error:", error);
      throw error;
    }
  },
  
  /**
   * Fetch Telegram channels
   * Replaces the telegram-fetch-channels Edge Function
   */
  fetchChannels: async (params: {
    apiId: string;
    apiHash: string;
    sessionString: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/channels`, {
        method: 'POST',
        headers: await getAuthHeaders(), 
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Fetch channels error:", error);
      throw error;
    }
  },
  
  /**
   * Send a message to a Telegram channel
   * New functionality for your external API
   */
  sendMessage: async (params: {
    apiId: string;
    apiHash: string;
    sessionString: string;
    channelId: string;
    message: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/sendMessage`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  },
  
  // Add more API methods as needed
};
