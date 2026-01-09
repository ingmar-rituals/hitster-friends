import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || '';

// Simple in-memory token store (in production, use a database or Redis)
const tokenStore: Record<string, { token: string; timestamp: number }> = {};

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Handle GET requests from Spotify redirect
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      const redirectUrl = new URL('/', request.nextUrl.origin);
      redirectUrl.searchParams.set('error', error);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      const redirectUrl = new URL('/', request.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'no_code');
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
          'base64'
        )}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Spotify token error:', error);
      const redirectUrl = new URL('/', request.nextUrl.origin);
      redirectUrl.searchParams.set('error', 'token_failed');
      return NextResponse.redirect(redirectUrl);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate a short session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Store token in memory with expiration (24 hours)
    tokenStore[sessionId] = {
      token: accessToken,
      timestamp: Date.now() + 24 * 60 * 60 * 1000,
    };

    console.log('Token stored with session ID:', sessionId);

    // Return HTML that redirects and stores the session
    // This avoids issues with URL encoding/length
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loading...</title>
        <script>
          // Store session ID and redirect
          localStorage.setItem('auth_session', '${sessionId}');
          window.location.href = '/';
        </script>
      </head>
      <body>
        <p>Authenticating...</p>
      </body>
      </html>
    `, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Callback error:', error);
    const redirectUrl = new URL('/', request.nextUrl.origin);
    redirectUrl.searchParams.set('error', 'callback_error');
    return NextResponse.redirect(redirectUrl);
  }
}

// Handle POST requests from frontend to retrieve token
export async function POST(request: NextRequest) {
  try {
    const { sessionId, code } = await request.json();

    // If sessionId provided, retrieve stored token
    if (sessionId) {
      const stored = tokenStore[sessionId];
      if (stored && stored.timestamp > Date.now()) {
        const token = stored.token;
        delete tokenStore[sessionId]; // Clean up
        return NextResponse.json({ access_token: token }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      return NextResponse.json(
        { error: 'Session expired or not found' },
        { status: 401 }
      );
    }

    // Legacy: handle code exchange via POST
    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code or session provided' },
        { status: 400 }
      );
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
          'base64'
        )}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Spotify token error:', error);
      return NextResponse.json(
        { error: 'Failed to get access token from Spotify' },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json(tokenData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
