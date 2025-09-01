import { clientStorage } from './clientStorage';

export const isTokenValid = (): boolean => {
  const token = clientStorage.getItem('access_token');
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

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
    return null;
  }
};

export const isTokenExpiringSoon = (): boolean => {
  const token = clientStorage.getItem('access_token');
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;
    
    return payload.exp && (payload.exp - currentTime) < fiveMinutes;
  } catch (error) {
    return false;
  }
};
