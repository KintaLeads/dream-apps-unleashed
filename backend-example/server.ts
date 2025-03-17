
// This is just an example to illustrate how your Railway backend might be structured
// NOT to be included in your frontend project - this is just for reference

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to verify JWT token
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Telegram authentication endpoint
app.post('/telegram/auth', verifyToken, async (req, res) => {
  const { apiId, apiHash, phoneNumber, sessionString } = req.body;
  
  try {
    // Create StringSession from existing session string or create a new one
    const stringSession = new StringSession(sessionString || '');
    
    // Create TelegramClient
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });
    
    // Start the client and send the code
    await client.start({
      phoneNumber,
      phoneCode: async () => {
        return ''; // This will cause the client to wait for the code
      },
      onError: (err) => {
        console.error('Telegram client error:', err);
      },
    });
    
    // Get the session as string to save it
    const newSessionString = client.session.save() as string;
    
    // Check if the client is authorized
    if (await client.isUserAuthorized()) {
      await client.disconnect();
      return res.json({ 
        success: true, 
        action: 'session_valid', 
        sessionString: newSessionString 
      });
    } else {
      await client.disconnect();
      return res.json({ 
        success: true, 
        action: 'code_requested', 
        phoneCodeHash: '', // This would be returned by gramjs
        sessionString: newSessionString 
      });
    }
  } catch (error: any) {
    console.error('Telegram auth error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error during authentication' 
    });
  }
});

// Telegram verification endpoint
app.post('/telegram/verify', verifyToken, async (req, res) => {
  const { 
    apiId, apiHash, phoneNumber, phoneCodeHash, verificationCode, sessionString 
  } = req.body;
  
  try {
    // Create StringSession from the session string
    const stringSession = new StringSession(sessionString || '');
    
    // Create TelegramClient
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });
    
    // Connect the client and verify the code
    await client.connect();
    await client.sendCode({
      apiId: parseInt(apiId),
      apiHash: apiHash,
    }, phoneNumber);
    
    await client.signIn({
      phoneNumber,
      phoneCode: verificationCode,
      phoneCodeHash,
    });
    
    // Get the session as string to save it
    const newSessionString = client.session.save() as string;
    
    // Disconnect the client
    await client.disconnect();
    
    return res.json({ 
      success: true, 
      sessionString: newSessionString 
    });
  } catch (error: any) {
    console.error('Telegram verification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error during verification' 
    });
  }
});

// Telegram fetch channels endpoint
app.post('/telegram/channels', verifyToken, async (req, res) => {
  const { apiId, apiHash, sessionString } = req.body;
  
  try {
    // Create StringSession from the session string
    const stringSession = new StringSession(sessionString || '');
    
    // Create TelegramClient
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });
    
    // Connect the client
    await client.connect();
    
    // Fetch dialogs (chats and channels)
    const dialogs = await client.getDialogs();
    
    // Filter channels and groups
    const channels = dialogs
      .filter(dialog => dialog.isChannel || dialog.isGroup)
      .map(dialog => ({
        id: dialog.id.toString(),
        name: dialog.title,
        type: dialog.isChannel ? 'channel' : 'group',
        username: dialog.entity.username || null,
      }));
    
    // Get the session as string to save it
    const newSessionString = client.session.save() as string;
    
    // Disconnect the client
    await client.disconnect();
    
    return res.json({
      success: true,
      channels,
      sessionString: newSessionString,
    });
  } catch (error: any) {
    console.error('Telegram fetch channels error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error fetching channels',
    });
  }
});

// Telegram send message endpoint
app.post('/telegram/sendMessage', verifyToken, async (req, res) => {
  const { apiId, apiHash, sessionString, channelId, message } = req.body;
  
  try {
    // Create StringSession from the session string
    const stringSession = new StringSession(sessionString || '');
    
    // Create TelegramClient
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });
    
    // Connect the client
    await client.connect();
    
    // Send the message
    const result = await client.sendMessage(channelId, { message });
    
    // Get the session as string to save it
    const newSessionString = client.session.save() as string;
    
    // Disconnect the client
    await client.disconnect();
    
    return res.json({
      success: true,
      messageId: result.id.toString(),
      sessionString: newSessionString,
    });
  } catch (error: any) {
    console.error('Telegram send message error:', error);
    return res.status(500).json({
      success: false, 
      error: error.message || 'Unknown error sending message',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
