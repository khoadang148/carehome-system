"use client";

import { useState, useEffect } from 'react';
import { getMultiplierInfo, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CurrencyMultiplierDebugProps {
  show?: boolean;
  onClose?: () => void;
}

export default function CurrencyMultiplierDebug({ show = false, onClose }: CurrencyMultiplierDebugProps) {
  const [info, setInfo] = useState(getMultiplierInfo());
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  useEffect(() => {
    setInfo(getMultiplierInfo());
  }, []);

  if (!isDisplayMultiplierEnabled() || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-amber-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-gray-900">Currency Multiplier Debug</h3>
          </div>
          {onClose && (
            <button
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Multiplier:</span>
            <span className="font-mono font-semibold text-blue-600">{info.multiplier}x</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Actual Amount:</span>
            <span className="font-mono">{info.example.actual.toLocaleString()} VND</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Display Amount:</span>
            <span className="font-mono">{info.example.display.toLocaleString()} VND</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Formatted:</span>
            <span className="font-mono text-green-600">{info.example.formatted}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            💡 Chế độ test đang được bật. Số tiền hiển thị đã được nhân với {info.multiplier}.
          </p>
        </div>
      </div>
    </div>
  );
}
