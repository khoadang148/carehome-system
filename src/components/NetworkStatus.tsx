"use client";

import { useState, useEffect } from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NetworkStatusProps {
  className?: string;
}

export default function NetworkStatus({ className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    // Check initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
          isOnline
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}
      >
        {isOnline ? (
          <WifiIcon className="w-5 h-5" />
        ) : (
          <ExclamationTriangleIcon className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Kết nối mạng đã khôi phục' : 'Mất kết nối mạng'}
        </span>
      </div>
    </div>
  );
}
