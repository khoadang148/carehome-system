'use client';

import { memo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

const TransitionLoading = memo(() => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setLoadingKey(prev => prev + 1);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div
      key={loadingKey}
      className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{
        animation: 'fadeIn 0.1s ease-out'
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center shadow-lg">
          <LoadingSpinner size="md" />
        </div>
        <p className="text-sm font-medium text-gray-700">Đang tải...</p>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
});

TransitionLoading.displayName = 'TransitionLoading';

export default TransitionLoading; 