
# Telegram API Backend (Railway.app)

This is a sample backend implementation for the Telegram Content Processor app. It's designed to be deployed on Railway.app and serves as the backend for Telegram MTProto operations.

## Setup Instructions

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `JWT_SECRET`: Secret for JWT authentication
   - `PORT`: (Optional) Port for the server to listen on

4. Run the server with `npm start`

## Environment Variables

Create a `.env` file with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
PORT=3001
```

## API Endpoints

### POST /telegram/auth
Authenticates with Telegram and requests a verification code.

### POST /telegram/verify
Verifies the code received from Telegram.

### POST /telegram/channels
Fetches channels from Telegram.

### POST /telegram/sendMessage
Sends a message to a Telegram channel.

## Authentication

All endpoints require a valid JWT token in the Authorization header.
The token should be in the format: `Bearer <token>`.

## Security

This backend uses:
1. JWT authentication to secure API endpoints
2. Connects to Supabase using the service role key for database operations
3. Stores Telegram session data securely in Supabase

## Dependencies

- Express - Web server
- Telegram (gramjs) - Telegram client library
- Supabase - Database operations
- JWT - Authentication
