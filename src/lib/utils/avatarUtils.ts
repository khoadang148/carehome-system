// Utility function to handle avatar URL processing
// Supports multiple avatar formats:
// 1. Server paths: "uploads\\1753200895289-500278468.jpg"
// 2. Mobile app paths: "file:///var/mobile/Containers/..."
// 3. Full URLs: "http://example.com/image.jpg"

const API_BASE_URL = 'http://localhost:8000';

export const processAvatarUrl = (avatarPath: string): string => {
  if (!avatarPath) return '';
  
  // Nếu đã là URL đầy đủ (http/https), trả về nguyên bản
  if (avatarPath.startsWith('http')) return avatarPath;
  
  // Nếu là file:// URL (từ mobile app), trả về default avatar
  if (avatarPath.startsWith('file://')) {
    return '/default-avatar.svg';
  }
  
  // Xử lý path từ server (uploads\filename.jpg)
  const cleanPath = avatarPath.replace(/^\\+|^\/+/g, '').replace(/\\/g, '/');
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper function để kiểm tra xem avatar có phải là mobile app path không
export const isMobileAppPath = (avatarPath: string): boolean => {
  return Boolean(avatarPath && avatarPath.startsWith('file://'));
};

// Helper function để kiểm tra xem avatar có phải là server path không
export const isServerPath = (avatarPath: string): boolean => {
  return Boolean(avatarPath && !avatarPath.startsWith('http') && !avatarPath.startsWith('file://'));
};

// Helper function để lấy default avatar URL
export const getDefaultAvatarUrl = (): string => {
  return '/default-avatar.svg';
};

// Helper function để kiểm tra xem avatar có hợp lệ không
export const isValidAvatar = (avatarPath: string): boolean => {
  if (!avatarPath) return false;
  
  // Nếu là URL đầy đủ hoặc server path thì hợp lệ
  if (avatarPath.startsWith('http') || isServerPath(avatarPath)) {
    return true;
  }
  
  // Nếu là mobile app path thì không hợp lệ cho web
  if (isMobileAppPath(avatarPath)) {
    return false;
  }
  
  return false;
};

// Helper function để lấy avatar URL với fallback
export const getAvatarUrlWithFallback = (avatarPath: string, fallback?: string): string => {
  const defaultFallback = '/default-avatar.svg';
  const finalFallback = fallback || defaultFallback;
  
  if (!avatarPath) return finalFallback;
  
  // Nếu là mobile app path, trả về fallback
  if (isMobileAppPath(avatarPath)) {
    return finalFallback;
  }
  
  // Xử lý các trường hợp khác
  return processAvatarUrl(avatarPath) || finalFallback;
}; 