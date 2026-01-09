'use client';

import { useEffect } from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function ErrorModal({
  isOpen,
  message,
  onClose,
}: ErrorModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
