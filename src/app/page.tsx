'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QRScannerComponent from '@/components/QRScanner';
import ErrorModal from '@/components/ErrorModal';
import { PlayerState } from '@/types';
import { generateAuthUrl } from '@/lib/spotify';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [playerState, setPlayerState] = useState<PlayerState>({
    isLoggedIn: false,
    isPlayerReady: true, // Always ready since we use device API
    isPlaying: false,
    currentTrackId: null,
    accessToken: null,
    error: null,
  });
  const [showScanner, setShowScanner] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasSongLoaded, setHasSongLoaded] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const session = searchParams.get('session');
    const error = searchParams.get('error');

    console.log('OAuth params:', { code, token, session, error });

    if (error) {
      console.error('Auth error:', error);
      showError(`Authentication failed: ${error}`);
      router.replace('/');
      return;
    }

    if (session) {
      // Retrieve token from session
      console.log('Session received:', session);
      setIsAuthenticating(true);

      fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: session }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            console.log('Token retrieved from session');
            localStorage.setItem('spotify_access_token', data.access_token);
            setPlayerState((prev) => ({
              ...prev,
              isLoggedIn: true,
              accessToken: data.access_token,
            }));
            setIsAuthenticating(false);
            router.replace('/');
          } else {
            throw new Error(data.error || 'Failed to retrieve token');
          }
        })
        .catch((err) => {
          console.error('Session error:', err);
          setIsAuthenticating(false);
          showError('Failed to retrieve authentication token');
        });
      return;
    }

    if (token) {
      console.log('Token received directly from URL');
      // Token received from redirect (legacy)
      localStorage.setItem('spotify_access_token', token);
      setPlayerState((prev) => ({
        ...prev,
        isLoggedIn: true,
        accessToken: token,
      }));
      setIsAuthenticating(false);
      router.replace('/');
      return;
    }

    if (code) {
      console.log('Auth code received:', code);
      setIsAuthenticating(true);
      exchangeCodeForToken(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Check if token exists in localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('spotify_access_token');
    const authSession = localStorage.getItem('auth_session');

    console.log('Checking localStorage for token:', !!savedToken);
    console.log('Checking localStorage for session:', !!authSession);

    if (authSession) {
      // Exchange session ID for token
      console.log('Auth session found, exchanging for token');
      setIsAuthenticating(true);

      fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: authSession }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            console.log('Token retrieved from session');
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.removeItem('auth_session');
            setPlayerState((prev) => ({
              ...prev,
              isLoggedIn: true,
              accessToken: data.access_token,
            }));
            setIsAuthenticating(false);
          } else {
            throw new Error(data.error || 'Failed to retrieve token');
          }
        })
        .catch((err) => {
          console.error('Session error:', err);
          localStorage.removeItem('auth_session');
          setIsAuthenticating(false);
          showError('Failed to retrieve authentication token');
        });
      return;
    }

    if (savedToken) {
      setPlayerState((prev) => ({
        ...prev,
        isLoggedIn: true,
        accessToken: savedToken,
      }));
    }
  }, []);

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');
        } catch (err) {
          console.error(`${(err as Error).name}, ${(err as Error).message}`);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          console.log('Wake Lock released');
        });
      }
    };
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    try {
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

      const data = await response.json();
      const accessToken = data.access_token;

      localStorage.setItem('spotify_access_token', accessToken);
      setPlayerState((prev) => ({
        ...prev,
        isLoggedIn: true,
        accessToken,
      }));
      setIsAuthenticating(false);

      // Clear the URL
      router.replace('/');
    } catch (error) {
      console.error('Token exchange error:', error);
      setIsAuthenticating(false);
      showError('Failed to log in. Please try again.');
      setPlayerState((prev) => ({
        ...prev,
        error: 'Failed to log in. Please try again.',
      }));
    }
  };

  const handleLogin = () => {
    try {
      const authUrl = generateAuthUrl();
      console.log('Generated auth URL:', authUrl.substring(0, 100) + '...');
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error generating auth URL:', error);
      showError(`Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    setPlayerState({
      isLoggedIn: false,
      isPlayerReady: false,
      isPlaying: false,
      currentTrackId: null,
      accessToken: null,
      error: null,
    });
    setShowScanner(false);
  };

  const handleScan = async (decodedText: string) => {
    try {
      // Extract track ID from full URL (https://open.spotify.com/track/ID?si=...)
      // or from URI (spotify:track:ID) or handle raw ID
      const trackIdRegex = /(?:track\/|track:|^)([a-zA-Z0-9]{22})/;
      const match = decodedText.match(trackIdRegex);
      const trackId = match ? match[1] : decodedText;

      const trackUri = `spotify:track:${trackId}`;

      const response = await fetch('/api/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'play',
          trackUri,
          accessToken: playerState.accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to play track');
      }

      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      setHasSongLoaded(true);
      setShowScanner(false); // Hide scanner after successful play
    } catch (error) {
      console.error('Playback error:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to play track'
      );
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch('/api/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'pause',
          accessToken: playerState.accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Ignore 404 errors (nothing playing)
        if (response.status !== 404) {
          throw new Error(error.error || 'Failed to pause playback');
        }
      }

      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    } catch (error) {
      console.error('Pause error:', error);
      // Don't show error to user for pause failures
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch('/api/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'play',
          accessToken: playerState.accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume playback');
      }

      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Resume error:', error);
      showError('Failed to resume playback');
    }
  };



  const showError = (message: string) => {
    setErrorModal({ isOpen: true, message });
  };

  const closeError = () => {
    setErrorModal({ isOpen: false, message: '' });
  };



  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a5c23] to-[#0F4016] p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-white drop-shadow-md">
            Hitster4Friends
          </h1>
        </div>



        {/* Main Content */}
        <div className="bg-[#0F4016] bg-opacity-40 backdrop-blur-sm border border-green-700/30 rounded-lg shadow-2xl p-8">
          {isAuthenticating ? (
            // Authenticating View
            <div className="flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Authenticating with Spotify...
                </p>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            </div>
          ) : !playerState.isLoggedIn ? (
            // Login View
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={handleLogin}
                className="px-8 py-3 bg-[#1a5c23] hover:bg-[#0F4016] border border-green-600 text-white font-semibold rounded-lg transition text-lg shadow-lg"
              >
                Login with Spotify
              </button>
            </div>
          ) : !showScanner ? (
            // Main Controls View
            <div className="flex flex-col items-center gap-6">
              {/* Big Play/Pause Button */}
              <button
                onClick={
                  playerState.isPlaying
                    ? handlePause
                    : hasSongLoaded
                      ? handleResume
                      : () => setShowScanner(true)
                }
                className="w-48 h-48 bg-gradient-to-br from-[#1a5c23] to-[#0F4016] hover:from-[#225f2d] hover:to-[#133519] border-2 border-green-600 text-white rounded-full shadow-2xl transition flex items-center justify-center"
              >
                <span className="text-8xl">
                  {playerState.isPlaying ? '⏸️' : '▶️'}
                </span>
              </button>

              {/* Scan QR Code Button */}
              <button
                onClick={() => setShowScanner(true)}
                className="w-full px-6 py-3 bg-[#1a5c23] hover:bg-[#0F4016] border border-green-600 text-white font-semibold rounded-lg transition text-lg shadow-lg"
              >
                📱 Scan QR Code
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-[#0F4016] hover:bg-[#1a5c23] border border-green-700/50 text-white font-semibold rounded-lg transition shadow-lg"
              >
                Logout
              </button>

              {playerState.error && (
                <div className="w-full p-4 bg-red-500 text-white rounded-lg text-center">
                  {playerState.error}
                </div>
              )}
            </div>
          ) : (
            // QR Scanner View
            <div className="flex flex-col items-center gap-6">
              <QRScannerComponent
                onScan={handleScan}
                onError={showError}
              />
              <button
                onClick={() => setShowScanner(false)}
                className="w-full px-6 py-3 bg-[#0F4016] hover:bg-[#1a5c23] border border-green-700/50 text-white font-semibold rounded-lg transition shadow-lg"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={closeError}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
