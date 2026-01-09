import { SpotifyTokenResponse } from '@/types';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || '';

export const generateAuthUrl = (): string => {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-read-playback-position',
  ];

  // Use the environment variable redirect URI
  // It should be set to your ngrok URL
  const redirectUri = REDIRECT_URI;

  if (!CLIENT_ID || !redirectUri) {
    throw new Error('Spotify credentials not configured. Please check your .env.local file.');
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (
  code: string
): Promise<SpotifyTokenResponse> => {
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
};

export const loadSongIdMapping = async () => {
  const response = await import('@/data/song-id-mapping.json');
  return response.default;
};
