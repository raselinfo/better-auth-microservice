import dotenv from 'dotenv';

dotenv.config();

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

export const getAccessToken = async (): Promise<string> => {
  const now = Date.now();

  // Return cached token if valid (with 30s buffer)
  if (cachedToken && tokenExpiresAt && now < tokenExpiresAt - 30000) {
    return cachedToken;
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET || process.env.CLIENT_SCRET; // Handle typo support
  const authUrl = process.env.AUTH_SERVER_URL || 'http://localhost:4000';
console.log("Express Server======",{clientId, clientSecret})
  if (!clientId || !clientSecret) {
    // For testing, fallback to hardcoded if env missing (or update .env)
    // clientId = "FvzxyafKvpStMEgiYwhMVlddaDLEOSjL";
    // clientSecret = "mysecret";
    if (!clientId) throw new Error('Missing CLIENT_ID');
    if (!clientSecret) throw new Error('Missing CLIENT_SECRET');
  }

  // Uses client_secret_post for client credentials
  
  try {
    // client_secret_post: send credentials in body
    const response = await fetch(`${authUrl}/api/auth/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch token: ${response.status} ${errorText}`);
    }

    const data = await response.json() as TokenResponse;
    cachedToken = data.access_token;
    // expires_in is in seconds
    tokenExpiresAt = now + (data.expires_in * 1000);

    return cachedToken;
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw error;
  }
};

export const updateUserInAuthService = async (userId: string, updates: any) => {
    const token = await getAccessToken();

    const authUrl = process.env.AUTH_SERVER_URL || 'http://localhost:4000';

    const response = await fetch(`${authUrl}/api/m2m/user/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Client-Id': process.env.CLIENT_ID || '', 
            'X-Client-Secret': process.env.CLIENT_SECRET || '',
        },
        body: JSON.stringify({
            userId,
            ...updates
        })
    });

    if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Failed to update user: ${response.status} ${errorText}`);
    }
    console.log(`Token: ${token}`)

    return await response.json();
}
