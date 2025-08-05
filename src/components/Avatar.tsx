import React from 'react';

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
    // Nếu không có avatar hoặc avatar rỗng, trả về avatar mặc định
    if (!avatarPath || avatarPath.trim() === '' || avatarPath === 'null' || avatarPath === 'undefined') {
      return fallbackSrc;
    }
    
    // Nếu là URL hoặc data URL, trả về nguyên bản
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
      return avatarPath;
    }
    
    // Nếu là đường dẫn local, làm sạch và trả về
    const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
    return cleanPath;
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const hasValidAvatar = src && src.trim() !== '' && src !== 'null' && src !== 'undefined';

  // Nếu không có avatar và muốn hiển thị chữ cái đầu
  if (!hasValidAvatar && showInitials && name) {
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

  return (
    <img
      src={getAvatarUrl(src)}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 shadow-sm ${className}`}
      onError={(e) => {
        e.currentTarget.src = fallbackSrc;
      }}
    />
  );
};

export default Avatar; 