"use client";

import { useState, useEffect } from 'react';
import LoadingSpinner from './shared/LoadingSpinner';

interface DataLoadingIndicatorProps {
  isLoading: boolean;
  error?: string;
  data?: any[];
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
}

export default function DataLoadingIndicator({
  isLoading,
  error,
  data,
  emptyMessage = "Không có dữ liệu",
  loadingMessage = "Đang tải dữ liệu...",
  className = ""
}: DataLoadingIndicatorProps) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setShowRetry(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 ${className}`}>
        <LoadingSpinner size="lg" text={loadingMessage} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 bg-red-50 rounded-xl border border-red-200 ${className}`}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-red-700 mb-2">
          Lỗi tải dữ liệu
        </h4>
        <p className="text-sm text-red-600 mb-4 text-center max-w-xs">
          {error}
        </p>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-gray-200 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">
          {emptyMessage}
        </h4>
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Hiện tại chưa có dữ liệu nào được hiển thị.
        </p>
      </div>
    );
  }

  return null;
}
