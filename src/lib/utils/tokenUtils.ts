import { clientStorage } from './clientStorage';

// Kiểm tra token có hợp lệ không
export const isTokenValid = (): boolean => {
  const token = clientStorage.getItem('access_token');
  if (!token) {
    return false;
  }

  try {
    // Decode JWT token để kiểm tra expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Kiểm tra token có expired chưa
    if (payload.exp && payload.exp < currentTime) {
      console.log('Token has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error parsing token:', error);
    return false;
  }
};

// Lấy thông tin từ token
export const getTokenInfo = () => {
  const token = clientStorage.getItem('access_token');
  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat
    };
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

// Kiểm tra token sắp hết hạn (trong vòng 5 phút)
export const isTokenExpiringSoon = (): boolean => {
  const token = clientStorage.getItem('access_token');
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60; // 5 phút
    
    return payload.exp && (payload.exp - currentTime) < fiveMinutes;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};
