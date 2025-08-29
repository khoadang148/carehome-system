import React, { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 'md',
  color = 'primary',
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-emerald-500',
    secondary: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-400'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          border-2 border-gray-200 rounded-full animate-spin
          ${colorClasses[color]} border-t-transparent
        `}
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-500 animate-pulse">
          {text}
        </p>
      )}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 