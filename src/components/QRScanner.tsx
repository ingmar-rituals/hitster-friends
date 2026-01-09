'use client';

import { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export default function QRScannerComponent({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);



  const handleStopScanning = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      console.log('Scanner stopped');
    } catch (error) {
      console.error('Failed to stop scanner:', error);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (result && result.data) {
          console.log('QR code scanned:', result.data);
          onScan(result.data);
        }
      },
      {
        onDecodeError: () => {
          // Silently ignore
        },
        maxScansPerSecond: 5,
        preferredCamera: 'environment',
      }
    );
    const handleStartScanning = async () => {
      if (!scanner) return;
      try {
        await scanner.start();
        console.log('Scanner started');
      } catch (error) {
        console.error('Failed to start scanner:', error);
        if (onError) onError('Failed to start camera');
      }
    };

    // Auto-start scanning on mount
    handleStartScanning();

    return () => {
      if (scanner) {
        try {
          scanner.stop();
          scanner.destroy();
        } catch (e) {
          console.warn('Error cleaning up scanner:', e);
        }
      }
      scannerRef.current = null;
    };
  }, [onScan, onError]);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <div className="w-full max-w-md bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1' }}
          playsInline
          muted
        />
      </div>

      <button
        onClick={handleStopScanning}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
      >
        Stop Scanning
      </button>
    </div>
  );
}
