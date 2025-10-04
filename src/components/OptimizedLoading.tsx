"use client";

import React from 'react';

interface OptimizedLoadingProps {
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function OptimizedLoading({
  type = 'spinner',
  size = 'md',
  text,
  className = '',
}: OptimizedLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const renderSpinner = () => (
    <div className={`${sizeClasses[size]} border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin`} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const renderSkeleton = () => (
    <div className="animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`} />
  );

  const renderLoading = () => {
    switch (type) {
      case 'skeleton':
        return renderSkeleton();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      {renderLoading()}
      {text && (
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
}

// Skeleton components for specific use cases
export function ResidentCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function StaffCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-3 bg-gray-300 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading states for different components
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <OptimizedLoading type="spinner" size="lg" text="Đang tải..." />
    </div>
  );
}

export function DataLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <OptimizedLoading type="dots" text="Đang tải dữ liệu..." />
    </div>
  );
}

export function ButtonLoading() {
  return (
    <div className="flex items-center space-x-2">
      <OptimizedLoading type="spinner" size="sm" />
      <span>Đang xử lý...</span>
    </div>
  );
}
