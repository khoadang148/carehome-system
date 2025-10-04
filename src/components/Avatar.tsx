import React from 'react';
import { getAvatarUrlWithFallback } from '@/lib/utils/avatarUtils';
import ImageWithFallback from './ImageWithFallback';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  fallbackSrc?: string;
  showInitials?: boolean;
  name?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = 'Avatar', 
  size = 'medium',
  className = '',
  fallbackSrc = '/default-avatar.svg',
  showInitials = false,
  name
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-30 h-30'
  };

  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    return getAvatarUrlWithFallback(avatarPath || '', fallbackSrc);
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const hasValidAvatar = (avatarPath: string | null | undefined) => {
    return avatarPath && 
           avatarPath.trim() !== '' && 
           avatarPath !== 'null' && 
           avatarPath !== 'undefined';
  };

  const isValidSrc = hasValidAvatar(src);

  if (!isValidSrc && showInitials && name) {
    const initials = getInitials(name);
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200 shadow-sm ${className}`}
        style={{ fontSize: size === 'small' ? '0.75rem' : size === 'medium' ? '1rem' : size === 'large' ? '1.25rem' : '1.5rem' }}
      >
        {initials || '?'}
      </div>
    );
  }

  if (!isValidSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 shadow-sm ${className}`}
      />
    );
  }

  return (
    <ImageWithFallback
      src={getAvatarUrl(src)}
      fallbackSrc={fallbackSrc}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 shadow-sm ${className}`}
      placeholder={
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-200 shadow-sm`}>
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      }
    />
  );
};

export default Avatar; 