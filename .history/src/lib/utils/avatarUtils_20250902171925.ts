// Utility function to handle avatar URL processing
// Supports multiple avatar formats:
// 1. Server paths: "uploads\\1753200895289-500278468.jpg"
// 2. Mobile app paths: "file:///var/mobile/Containers/..."
// 3. Full URLs: "http://example.com/image.jpg"

const API_BASE_URL = 'https://sep490-be-xniz.onrender.com';

export const processAvatarUrl = (avatarPath: string): string => {
  if (!avatarPath) return '/default-avatar.svg';
  
  // Nếu đã là URL đầy đủ (http/https), trả về nguyên bản
  if (avatarPath.startsWith('http')) return avatarPath;
  
  // Nếu là file:// URL (từ mobile app), trả về default avatar
  if (avatarPath.startsWith('file://')) {
    return '/default-avatar.svg';
  }
  
  // Nếu là data URL, trả về nguyên bản
  if (avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  
  // Xử lý path từ server (uploads\filename.jpg)
  const cleanPath = avatarPath.replace(/^\\+|^\/+/g, '').replace(/\\/g, '/');
  
  // Kiểm tra xem path đã có 'uploads/' chưa
  const finalPath = cleanPath.includes('uploads/') ? cleanPath : `uploads/${cleanPath}`;
  
  return `${API_BASE_URL}/${finalPath}`;
};

// Helper function để kiểm tra xem avatar có phải là mobile app path không
export const isMobileAppPath = (avatarPath: string): boolean => {
  return Boolean(avatarPath && avatarPath.startsWith('file://'));
};

// Helper function để kiểm tra xem avatar có phải là server path không
export const isServerPath = (avatarPath: string): boolean => {
  return Boolean(avatarPath && !avatarPath.startsWith('http') && !avatarPath.startsWith('file://') && !avatarPath.startsWith('data:'));
};

// Helper function để lấy default avatar URL
export const getDefaultAvatarUrl = (): string => {
  return '/default-avatar.svg';
};

// Helper function để kiểm tra xem avatar có hợp lệ không
export const isValidAvatar = (avatarPath: string): boolean => {
  return Boolean(avatarPath && 
         avatarPath.trim() !== '' && 
         avatarPath !== 'null' && 
         avatarPath !== 'undefined');
};

// Helper function để lấy avatar URL với fallback
export const getAvatarUrlWithFallback = (avatarPath: string, fallback?: string): string => {
  const defaultFallback = '/default-avatar.svg';
  const finalFallback = fallback || defaultFallback;
  
  if (!isValidAvatar(avatarPath)) return finalFallback;
  
  // Nếu là mobile app path, trả về fallback
  if (isMobileAppPath(avatarPath)) {
    return finalFallback;
  }
  
  // Xử lý các trường hợp khác
  try {
    const processedUrl = processAvatarUrl(avatarPath);
    return processedUrl || finalFallback;
  } catch (error) {
    console.error('Error processing avatar URL:', error);
    return finalFallback;
  }
}; 