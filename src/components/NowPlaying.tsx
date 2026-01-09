'use client';

import { useEffect, useState } from 'react';

interface NowPlayingProps {
  accessToken: string | null;
}

export default function NowPlaying({ accessToken }: NowPlayingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackDuration, setTrackDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    const pollPlaybackState = async () => {
      try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data?.item) {
              setIsPlaying(data.is_playing);
              setTrackDuration(data.item.duration_ms);
              setProgress(data.progress_ms);
            }
          }
        } else if (response.status === 204) {
          // 204 No Content - nothing is playing
          setIsPlaying(false);
          setTrackDuration(0);
          setProgress(0);
        }
      } catch (error) {
        console.error('Error fetching playback state:', error);
      }
    };

    // Poll every second
    const interval = setInterval(pollPlaybackState, 1000);
    pollPlaybackState(); // Initial call

    return () => clearInterval(interval);
  }, [accessToken]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = trackDuration > 0 ? (progress / trackDuration) * 100 : 0;

  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            {isPlaying ? '▶️ Now Playing' : '⏸️ Paused'}
          </p>
        </div>

        {trackDuration > 0 && (
          <>
            <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(trackDuration)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
