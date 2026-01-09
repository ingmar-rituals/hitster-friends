import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    const devices = await getAvailableDevices(accessToken);
    console.log('GET /api/player - Available devices:', devices);
    
    return NextResponse.json({ devices });
  } catch (error) {
    console.error('GET /api/player error:', error);
    return NextResponse.json(
      { error: 'Failed to get devices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, trackUri, accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    const devices = await getAvailableDevices(accessToken);

    console.log('Device check - found devices:', devices);
    console.log('Number of devices:', devices?.length || 0);

    // Use active device or first available
    let targetDeviceId = devices.find((d: any) => d.is_active)?.id || devices[0]?.id;
    
    if (devices.length > 0) {
      console.log('Available devices:', devices.map((d: any) => ({ name: d.name, id: d.id, active: d.is_active })));
    }
    console.log('Using device:', targetDeviceId);

    let response;

    if (action === 'play') {
      // If trackUri is provided, play that specific track
      // If no trackUri, resume current playback
      const playBody = trackUri 
        ? { uris: [trackUri] }
        : {};
      
      // Use targetDeviceId if available
      const playUrl = targetDeviceId 
        ? `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`
        : `https://api.spotify.com/v1/me/player/play`;
        
      response = await fetch(playUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playBody),
      });
    } else if (action === 'pause') {
      const pauseUrl = targetDeviceId
        ? `https://api.spotify.com/v1/me/player/pause?device_id=${targetDeviceId}`
        : `https://api.spotify.com/v1/me/player/pause`;
        
      response = await fetch(pauseUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } else if (action === 'next') {
      const nextUrl = targetDeviceId
        ? `https://api.spotify.com/v1/me/player/next?device_id=${targetDeviceId}`
        : `https://api.spotify.com/v1/me/player/next`;
        
      response = await fetch(nextUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    if (!response || !response.ok) {
      const errorText = await response?.text();
      console.error('Playback API error:', errorText);
      console.error('Response status:', response?.status);
      
      // If it's a 404, it means no active device - provide helpful message
      if (response?.status === 404) {
        return NextResponse.json(
          { error: 'No active device. Open Spotify and play any song, then try again.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to control playback: ${errorText || 'Unknown error'}` },
        { status: response?.status || 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Playback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAvailableDevices(accessToken: string) {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to get devices');
      return [];
    }

    const data = await response.json();
    return data.devices || [];
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
}
