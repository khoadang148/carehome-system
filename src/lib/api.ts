import axios from 'axios';
import { clientStorage } from './utils/clientStorage';
import { isTokenValid } from './utils/tokenUtils';
import { buildCacheKey, getCached, setCached } from './utils/apiCache';

// Retry mechanism helper
export const retryRequest = async (requestFn: () => Promise<any>, maxRetries: number = 3, delay: number = 1000): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error: any) {
      const isLastAttempt = i === maxRetries - 1;

      const status: number | undefined = error?.response?.status;
      const networkish = error?.code === 'ECONNABORTED' ||
        (typeof error?.message === 'string' && (
          error.message.includes('timeout') ||
          error.message.includes('Network Error')
        )) ||
        !error?.response;

      // Retry on transient HTTP errors
      const transientHttp = typeof status === 'number' && (status >= 500 || status === 429);

      const isRetryableError = networkish || transientHttp;

      if (isLastAttempt || !isRetryableError) {
        throw error;
      }

      const retryDelay = delay * Math.pow(2, i);
      // Light log to aid debugging without spamming
      console.warn(`Retrying request due to ${status || error?.code || 'network error'} in ${retryDelay}ms (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Timeout wrapper for API calls
const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number = 30000,
  context: string = 'API call'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${context} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

// Prefer NEXT_PUBLIC_API_URL for consistency with next.config.js, fallback to legacy var
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://sep490-be-xniz.onrender.com'
    : '/api');

// Base URL for static files (uploads) - always use the deployed backend URL
const STATIC_BASE_URL = process.env.NEXT_PUBLIC_STATIC_BASE_URL || 'https://sep490-be-xniz.onrender.com';

const loginClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // Tăng timeout lên 30s để tránh socket hang up
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000, // Tăng timeout lên 30s để tránh socket hang up
});

// Transparent GET cache helper for list-like endpoints with retry
async function getWithCache<T = any>(url: string, params?: any, ttlMs: number = 30_000): Promise<T> {
  const key = buildCacheKey(API_BASE_URL, url, params);
  const cached = typeof window !== 'undefined' ? getCached<T>(key) : null;
  if (cached) return cached.data;
  
  try {
    const res = await retryRequest(
      () => apiClient.get<T>(url, { params }),
      2, // max retries for cached requests
      1000 // initial delay
    );
    
    if (typeof window !== 'undefined') {
      setCached<T>(key, { data: res.data as any, status: res.status, statusText: res.statusText }, ttlMs);
    }
    return res.data as any;
  } catch (error: any) {
    console.error(`Error fetching ${url}:`, error);
    // Return empty array for list endpoints to prevent UI crashes
    if (url.includes('/activities') || url.includes('/residents') || url.includes('/users')) {
      return [] as any;
    }
    throw error;
  }
}

const logoutClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 3000,
});

logoutClient.interceptors.request.use(
  (config) => {
    const token = clientStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const isAuthenticated = () => {
  const token = clientStorage.getItem('access_token');
  return !!token && isTokenValid();
};

const handleApiError = (error: any, context: string) => {
  if (error.response) {
    const { status, data } = error.response;
    
    // Ưu tiên hiển thị message từ backend
    if (data?.message) return data.message;
    if (data?.detail) return data.detail;
    
    // Xử lý các status code cụ thể
    switch (status) {
      case 400:
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      case 401:
        return 'Không có quyền truy cập. Vui lòng đăng nhập lại.';
      case 403:
        return 'Bị từ chối truy cập. Bạn không có quyền thực hiện thao tác này.';
      case 404:
        return 'Không tìm thấy dữ liệu yêu cầu.';
      case 409:
        return 'Dữ liệu đã tồn tại trong hệ thống.';
      case 422:
        return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      case 500:
        // Xử lý đặc biệt cho database error
        if (data?.error === 'Database Error') {
          return 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
        }
        return 'Lỗi máy chủ. Vui lòng thử lại sau.';
      case 502:
        return 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 503:
        return 'Dịch vụ đang bảo trì. Vui lòng thử lại sau.';
      default:
        return `Lỗi ${status}: Có lỗi xảy ra. Vui lòng thử lại.`;
    }
  }
  
  if (error.request) {
    if (error.code === 'ECONNABORTED') {
      return 'Yêu cầu hết thời gian chờ. Máy chủ phản hồi chậm, vui lòng thử lại sau.';
    }
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }
  
  return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
};

apiClient.interceptors.request.use(
  (config) => {
    const token = clientStorage.getItem('access_token');
    if (token && isTokenValid()) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Smart handling for 401/403 to avoid hard redirects and flakes
    const status = error.response?.status;
    const config: any = error.config || {};
    const isBrowser = typeof window !== 'undefined';
    const pathname = isBrowser ? window.location.pathname : '';
    const isPublicPath = ['/login', '/register', '/pending-approval', '/', '/offline'].some(p => pathname.startsWith(p));

    // Attempt silent refresh once on 401 if token seems valid
    if (status === 401 && !config._retry) {
      const token = clientStorage.getItem('access_token');
      if (token && isTokenValid()) {
        try {
          config._retry = true;
          const refreshRes = await loginClient.post(endpoints.auth.refresh);
          if (refreshRes?.data?.access_token) {
            clientStorage.setItem('access_token', refreshRes.data.access_token);
            // update header and retry original request
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${refreshRes.data.access_token}`;
            return apiClient.request(config);
          }
        } catch (_) {
          // fall through to redirect logic
        }
      }
    }

    // For 401/403: only redirect if not on public path
    if ((status === 401 || status === 403) && !isPublicPath) {
      const token = clientStorage.getItem('access_token');
      if (!token || !isTokenValid()) {
        clientStorage.removeItem('access_token');
        clientStorage.removeItem('user');
        if (isBrowser) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  users: '/users',
  residents: '/residents',
  staff: '/users',
  activities: '/activities',
  activityParticipations: '/activity-participations',
  medications: '/medications',
  careNotes: '/assessments',
  appointments: '/appointments',
  familyMembers: '/family-members',
  rooms: '/rooms',
  transactions: '/transactions',
  reports: '/reports',
  notifications: '/notifications',
  permissions: '/permissions',
  services: '/services',
  inventory: '/inventory',
  vitalSigns: '/vital-signs',
  photos: '/photos',
  visits: '/visits',
  carePlans: '/care-plans',
  beds: '/beds',
  roomTypes: '/room-types',
};

export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await retryRequest(
        () => loginClient.post('/auth/login', { email, password }),
        3, // max retries
        1000 // initial delay
      );
      const { access_token } = response.data;
      if (typeof window !== 'undefined') {
        clientStorage.setItem('access_token', access_token);
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng kiểm tra mạng và thử lại.');
      }
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  sendOtp: async (phone: string) => {
    try {
      const response = await retryRequest(
        () => loginClient.post('/auth/send-otp', { phone }),
        2, // max retries
        1000 // initial delay
      );
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Có lỗi xảy ra khi gửi OTP');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng kiểm tra mạng và thử lại.');
      }
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    try {
      const response = await retryRequest(
        () => loginClient.post('/auth/verify-otp', { phone, otp }),
        2, // max retries
        1000 // initial delay
      );
      if (response.data.success) {
        const { access_token } = response.data;
        if (typeof window !== 'undefined') {
          clientStorage.setItem('access_token', access_token);
        }
        return response.data;
      }
      throw new Error(response.data.message || 'Có lỗi xảy ra khi xác thực OTP');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng kiểm tra mạng và thử lại.');
      }
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  register: async (userData: any) => {
    try {
      const response = await apiClient.post(endpoints.auth.register, userData);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Registration');
      throw new Error(errorMessage);
    }
  },

  registerWithCccd: async (userData: any, cccdData?: { cccd_id: string; cccd_front?: File | null; cccd_back?: File | null }) => {
    try {
      // Create FormData to send all data including CCCD files in one request
      const formData = new FormData();
      
      // Add user data fields
      formData.append('full_name', userData.full_name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('confirmPassword', userData.confirmPassword);
      formData.append('phone', userData.phone);
      if (userData.address) {
        formData.append('address', userData.address);
      }
      
      // Add CCCD data if provided
      if (cccdData) {
        formData.append('cccd_id', cccdData.cccd_id);
        if (cccdData.cccd_front) {
          formData.append('cccd_front', cccdData.cccd_front);
        }
        if (cccdData.cccd_back) {
          formData.append('cccd_back', cccdData.cccd_back);
        }
      }
      
      // Send registration request with multipart/form-data
      const registerResponse = await apiClient.post(endpoints.auth.register, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return registerResponse.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Registration');
      throw new Error(errorMessage);
    }
  },

  refresh: async () => {
    try {
      const response = await apiClient.post(endpoints.auth.refresh);
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Token refresh');
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      if (!isTokenValid()) {
        return { message: 'No valid session to logout', success: true };
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const response = await logoutClient.post(endpoints.auth.logout, {}, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.data;
    } catch (error: any) {
      return { message: 'Logged out locally', success: true };
    }
  },

  me: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to get current user info');
      throw new Error(errorMessage);
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await retryRequest(
        () => loginClient.post('/auth/forgot-password', { email }),
        2, // max retries
        1000 // initial delay
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.status === 400) {
        throw new Error('Email không tồn tại trong hệ thống hoặc tài khoản đã bị khóa');
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng kiểm tra mạng và thử lại.');
      }
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },
};

export const userAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>('/users', params, 60_000); // Tăng cache time lên 1 phút
      return data as any[];
    } catch (error) {
      return [];
    }
  },
  getById: async (id: string) => {
    try {
      if (!id || id === 'null' || id === 'undefined') {
        throw new Error(`Invalid user ID: ${id}`);
      }
      const response = await apiClient.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`User with ID ${id} not found`);
      }
      throw error;
    }
  },
  getByRoleWithStatus: async (role: string, status?: string) => {
    try {
      // Backend supports /users/by-role?role=...
      const url = `/users/by-role?role=${encodeURIComponent(role)}`;
      const response = await apiClient.get(url);
      const arr = Array.isArray(response.data) ? response.data : [];
      if (!status) return arr;
      return arr.filter((u: any) => String(u.status || '').toLowerCase() === String(status).toLowerCase());
    } catch (error) {
      return [];
    }
  },
  approveUser: async (id: string) => {
    const response = await apiClient.patch(`/users/${id}/approve`);
    return response.data;
  },
  deactivateUser: async (id: string, reason?: string) => {
    const response = await apiClient.patch(`/users/${id}/deactivate`, reason ? { reason } : {});
    return response.data;
  },
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getAuthProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (passwordData: any) => {
    try {
      const response = await apiClient.patch('/auth/change-password', passwordData);
      return response.data;
    } catch (error: any) {
      let errorMessage = '';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.response?.status === 400) {
        const lowerMessage = errorMessage.toLowerCase();
        if (
          lowerMessage.includes('current password') ||
          lowerMessage.includes('mật khẩu hiện tại') ||
          lowerMessage.includes('old password') ||
          lowerMessage.includes('incorrect password') ||
          lowerMessage.includes('wrong password') ||
          lowerMessage.includes('invalid password') ||
          lowerMessage.includes('password mismatch') ||
          lowerMessage.includes('mật khẩu không đúng') ||
          lowerMessage.includes('mật khẩu sai') ||
          lowerMessage.includes('400') ||
          lowerMessage.includes('bad request')
        ) {
          throw new Error('Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.');
        }
        throw new Error('Thông tin không hợp lệ. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
      
      if (error.message && error.message.includes('400')) {
        throw new Error('Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền thực hiện thao tác này.');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
      }
      
      throw new Error('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateAvatar: async (id: string, avatarData: FormData) => {
    try {
      const response = await apiClient.patch(`/users/${id}/avatar`, avatarData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getAvatarUrl: (avatarPath: string) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    const cleanPath = avatarPath.replace(/^\\+|^\/+/g, '').replace(/\\/g, '/');
    const fullUrl = `${STATIC_BASE_URL}/${cleanPath}`;
    return fullUrl;
  },
  getAvatarUrlById: (id: string) => {
    if (!id) return '';
    return `${STATIC_BASE_URL}/users/${id}/avatar`;
  },
  activate: async (id: string) => {
    try {
      const response = await apiClient.patch(`/users/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deactivate: async (id: string) => {
    try {
      const response = await apiClient.patch(`/users/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (userData: any) => {
    try {
      const response = await apiClient.post('/users', userData, {
        headers: userData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  uploadMyCccd: async (params: { cccd_id: string; cccd_front?: File | null; cccd_back?: File | null }) => {
    try {
      const formData = new FormData();
      formData.append('cccd_id', params.cccd_id);
      if (params.cccd_front) formData.append('cccd_front', params.cccd_front);
      if (params.cccd_back) formData.append('cccd_back', params.cccd_back);
      const response = await apiClient.post('/users/upload-cccd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  resetPassword: async (id: string, newPassword: string) => {
    try {
      const response = await apiClient.patch(`/users/${id}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const residentAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.residents, params, 60_000); // Tăng cache time lên 1 phút
      return data as any[];
    } catch (error) {
      return [];
    }
  },

  // Fast lists by status
  getAdmitted: async () => {
    try {
      const data = await getWithCache<any[]>(`${endpoints.residents}/admitted`, undefined, 60_000);
      return Array.isArray(data) ? data : [];
    } catch {
      return [] as any[];
    }
  },
  getActive: async () => {
    try {
      const data = await getWithCache<any[]>(`${endpoints.residents}/active`, undefined, 60_000);
      return Array.isArray(data) ? data : [];
    } catch {
      return [] as any[];
    }
  },

  // Get admitted residents by room ID (backend: /residents/by-room/{roomId}/admitted)
  getAdmittedByRoom: async (roomId: string) => {
    try {
      if (!roomId || !roomId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`Invalid room ID: ${roomId}`);
      }
      const data = await getWithCache<any[]>(`/residents/by-room/${roomId}/admitted`, undefined, 60_000);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Gracefully degrade with empty list
      return [] as any[];
    }
  },

  // Mark resident attendance -> transition to admitted
  markAttendance: async (id: string) => {
    try {
      const response = await apiClient.post(`${endpoints.residents}/${id}/attendance`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      if (!id || id === 'null' || id === 'undefined') {
        throw new Error(`Invalid resident ID: ${id}`);
      }
      const response = await apiClient.get(`${endpoints.residents}/${id}`);
      return response.data;
    } catch (error: any) {
      // Handle 404 errors gracefully
      if (error.response?.status === 404) {
        throw new Error(`Resident with ID ${id} not found`);
      }
      throw error;
    }
  },

  getPendingResidents: async () => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/admin/pending`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  approveResident: async (id: string) => {
    try {
      const response = await apiClient.patch(`${endpoints.residents}/admin/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  rejectResident: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.patch(`${endpoints.residents}/admin/${id}/reject`, reason ? { reason } : {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (resident: any) => {
    try {
      if (resident instanceof FormData) {
        const response = await apiClient.post(endpoints.residents, resident, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      const response = await apiClient.post(endpoints.residents, resident);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createMy: async (resident: any) => {
    try {
      if (resident instanceof FormData) {
        const response = await apiClient.post(`${endpoints.residents}/my-resident`, resident, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      const response = await apiClient.post(`${endpoints.residents}/my-resident`, resident);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, resident: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.residents}/${id}`, resident);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.residents}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getVitalSigns: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${id}/vital-signs`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPhotos: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${id}/photos`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  uploadPhoto: async (id: string, photoData: FormData) => {
    try {
      const response = await apiClient.post(`${endpoints.residents}/${id}/photos`, photoData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByFamilyMemberId: async (familyMemberId: string) => {
    try {
      const response = await retryRequest(
        () => apiClient.get(`${endpoints.residents}/family-member/${familyMemberId}`),
        3, // max retries
        1000 // initial delay
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching residents by family member ID:', error);
      throw error;
    }
  },

  // Discharge resident (discharged or deceased)
  discharge: async (id: string, dischargeData: { status: 'discharged' | 'deceased'; reason: string }) => {
    try {
      // Create a custom axios instance with longer timeout for discharge
      const dischargeClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
        timeout: 300000, // 5 minutes timeout for discharge (backend can be slow)
      });

      // Add request interceptor for auth
      dischargeClient.interceptors.request.use(
        (config) => {
          const token = typeof window !== 'undefined' ? clientStorage.getItem('access_token') : null;
          if (token && isTokenValid()) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Add retry mechanism with exponential backoff
      const maxRetries = 3;
      let lastError: any = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await dischargeClient.patch(`${endpoints.residents}/${id}/discharge`, dischargeData);
          return response.data;
        } catch (error: any) {
          lastError = error;
          console.warn(`Discharge API attempt ${attempt} failed:`, error);
          
          // Don't retry on client errors (4xx)
          if (error.response?.status >= 400 && error.response?.status < 500) {
            throw error;
          }
          
          // Retry on server errors or network issues
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
            console.log(`Retrying discharge in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      throw error;
    }
  },
  getAvatarUrl: (id: string) => {
    if (!id) return '';
    return `${STATIC_BASE_URL}/uploads/residents/${id}/avatar`;
  },
  fetchAvatar: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/uploads/residents/${id}/avatar`);
    if (!response.ok) throw new Error('Không lấy được avatar');
    return await response.blob();
  },
};


export const staffAPI = {
  getAll: async (params?: any) => {
    try {
      if (!isAuthenticated()) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return [];
      }
      const user = JSON.parse(clientStorage.getItem('user') || '{}');
      if (user.role === 'family') {
        const data = await getWithCache<any[]>('/users', params, 30_000);
        const allUsers = data;
        const staffUsers = allUsers.filter((user: any) => user.role === 'staff');
        return staffUsers;
      }
      const data = await getWithCache<any[]>('/users/by-role', { role: 'staff', ...params }, 30_000);
      return data as any[];
    } catch (error) {
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (staff: any) => {
    try {
      let response;
      if (staff.avatar && staff.avatar instanceof File) {
        const formData = new FormData();
        formData.append('avatar', staff.avatar);
        Object.keys(staff).forEach(key => {
          if (key !== 'avatar' && staff[key] !== undefined && staff[key] !== null) {
            formData.append(key, staff[key]);
          }
        });
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        response = await apiClient.post(endpoints.staff, formData, config);
      } else {
        response = await apiClient.post(endpoints.staff, staff);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, staff: any) => {
    try {
      let response;
      if (staff.avatar && staff.avatar instanceof File) {
        const formData = new FormData();
        formData.append('avatar', staff.avatar);
        Object.keys(staff).forEach(key => {
          if (key !== 'avatar' && staff[key] !== undefined && staff[key] !== null) {
            formData.append(key, staff[key]);
          }
        });
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        response = await apiClient.patch(`${endpoints.staff}/${id}`, formData, config);
      } else {
        response = await apiClient.patch(`${endpoints.staff}/${id}`, staff);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.staff}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAttendance: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${id}/attendance`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPerformance: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${id}/performance`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};


export const staffAssignmentsAPI = {
  getAll: async (params?: any) => {
    try {
      console.log('Fetching all staff assignments with params:', params);
      const response = await apiClient.get('/staff-assignments', { params });
      console.log('Staff assignments response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching staff assignments:', error);
      throw error;
    }
  },

  getAllIncludingExpired: async (params?: any) => {
    try {
      const response = await apiClient.get('/staff-assignments/all-including-expired', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByResident: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/by-resident/${residentId}/staff`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (assignment: any) => {
    try {
      const response = await apiClient.post('/staff-assignments', assignment);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, assignment: any) => {
    try {
      const response = await apiClient.patch(`/staff-assignments/${id}`, assignment);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/staff-assignments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByStaff: async (staffId: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/by-staff/${staffId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByRoom: async (roomId: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/by-room/${roomId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  getMyAssignments: async () => {
    try {
      const response = await apiClient.get('/staff-assignments/my-assignments');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const activitiesAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.activities, params, 30_000); // Tăng cache time lên 30s
      return data as any[];
    } catch (error: any) {
      console.error('Activities API error:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      if (!id || id === 'null' || id === 'undefined') {
        throw new Error(`Invalid activity ID: ${id}`);
      }
      const response = await apiClient.get(`${endpoints.activities}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (activity: any) => {
    try {
      const response = await apiClient.post(endpoints.activities, activity);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, activity: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.activities}/${id}`, activity);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.activities}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getParticipants: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.activities}/${id}/participants`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addParticipant: async (activityId: string, residentId: string) => {
    try {
      const response = await apiClient.post(`${endpoints.activities}/${activityId}/participants`, { residentId });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeParticipant: async (activityId: string, residentId: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.activities}/${activityId}/participants/${residentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAIRecommendation: async (residentIds: string[], schedule_time?: string) => {
    try {
      const payload: any = { resident_ids: residentIds };
      if (schedule_time) {
        payload.schedule_time = schedule_time;
      }
      const response = await apiClient.post(`${endpoints.activities}/recommendation/ai`, payload, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkScheduleConflict: async (residentId: string, scheduleTime: string, duration: number) => {
    try {
      const response = await apiClient.post(`${endpoints.activities}/check-schedule-conflict`, {
        residentId,
        scheduleTime,
        duration
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const activityParticipationsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activityParticipations, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Stats: distinct activities per staff across system
  getAllStaffStats: async () => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/stats/all-staff`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (participation: any) => {
    try {
      const response = await apiClient.post(endpoints.activityParticipations, participation);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, participation: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.activityParticipations}/${id}`, participation);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.activityParticipations}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approve: async (id: string) => {
    try {
      const response = await apiClient.patch(`${endpoints.activityParticipations}/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  reject: async (id: string) => {
    try {
      const response = await apiClient.patch(`${endpoints.activityParticipations}/${id}/reject`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getFamilyToday: async () => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/family-today`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByResidentId: async (residentId: string, params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/by-resident`, {
        params: { resident_id: residentId, ...params }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByStaffId: async (staffId: string, params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activityParticipations, { 
        params: { staff_id: staffId, ...params } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByActivityId: async (activityId: string, date?: string) => {
    try {
      const params: any = { activity_id: activityId };
      if (date) {
        params.date = date;
      }
      const response = await apiClient.get(`${endpoints.activityParticipations}/by-activity`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Fetch one participation by resident and activity
  getByResidentAndActivity: async (residentId: string, activityId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/by-resident-activity`, {
        params: { resident_id: residentId, activity_id: activityId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const medicationAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.medications, params, 30_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${residentId}/medications`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (medication: any) => {
    try {
      const response = await apiClient.post(endpoints.medications, medication);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, medication: any) => {
    try {
      const response = await apiClient.put(`${endpoints.medications}/${id}`, medication);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.medications}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const careNotesAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.careNotes, params, 20_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },
  create: async (assessment: any) => {
    try {
      const response = await apiClient.post(endpoints.careNotes, assessment);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: string, assessment: any) => {
    try {
      const response = await apiClient.put(`${endpoints.careNotes}/${id}`, assessment);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.careNotes}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const appointmentsAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.appointments, params, 20_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${residentId}/appointments`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (appointment: any) => {
    try {
      const response = await apiClient.post(endpoints.appointments, appointment);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, appointment: any) => {
    try {
      const response = await apiClient.put(`${endpoints.appointments}/${id}`, appointment);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.appointments}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const familyMembersAPI = {
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.familyMembers}/${id}`);
      const familyMember = response.data;
      if (familyMember && familyMember.avatar) {
        familyMember.avatar = `${API_BASE_URL}/users/${id}/avatar`;
      }
      return familyMember;
    } catch (error) {
      throw error;
    }
  },
  create: async (familyMember: any) => {
    try {
      const response = await apiClient.post(endpoints.familyMembers, familyMember);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: string, familyMember: any) => {
    try {
      const response = await apiClient.put(`${endpoints.familyMembers}/${id}`, familyMember);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.familyMembers}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAvatarUrl: (id: string) => {
    if (!id) return '';
    return `${STATIC_BASE_URL}/users/${id}/avatar`;
  },
};

export const roomsAPI = {
  getAll: async (params?: any) => {
    try {
      console.log('Calling rooms API with params:', params);
      
      // Sử dụng retry mechanism với timeout wrapper
      const response = await retryRequest(
        () => withTimeout(
          apiClient.get(endpoints.rooms, { params }),
          25000, // 25s timeout
          'Rooms API'
        ),
        3, // max retries
        2000 // initial delay
      );
      
      console.log('Rooms API response:', response.data);
      return response.data as any[];
    } catch (error: any) {
      console.error('Rooms API error:', error);
      
      // Xử lý timeout error cụ thể
      if (error.code === 'ECONNABORTED' || 
          error.message.includes('timeout') || 
          error.message.includes('Rooms API timeout')) {
        console.warn('Rooms API timeout - returning empty array');
        return [];
      }
      
      // Xử lý các lỗi khác
      if (error.response?.status >= 500) {
        console.warn('Rooms API server error - returning empty array');
        return [];
      }
      
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const data = await getWithCache<any>(`${endpoints.rooms}/${id}`, undefined, 60_000);
      return data;
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        return null;
      }
      return null;
    }
  },

  create: async (room: any) => {
    try {
      const response = await apiClient.post(endpoints.rooms, room);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, room: any) => {
    try {
      const response = await apiClient.put(`${endpoints.rooms}/${id}`, room);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.rooms}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const transactionsAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.transactions, params, 20_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.transactions}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (transaction: any) => {
    try {
      const response = await apiClient.post(endpoints.transactions, transaction);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, transaction: any) => {
    try {
      const response = await apiClient.put(`${endpoints.transactions}/${id}`, transaction);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.transactions}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const reportsAPI = {
  getFinancialReport: async (params?: any) => {
    try {
      const data = await getWithCache<any>(`${endpoints.reports}/financial`, params, 20_000);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getOccupancyReport: async (params?: any) => {
    try {
      const data = await getWithCache<any>(`${endpoints.reports}/occupancy`, params, 20_000);
      return data;
    } catch (error) {
      throw error;
    }
  },

  getStaffPerformanceReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/staff-performance`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getResidentHealthReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/resident-health`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const notificationsAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.notifications, params, 15_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.notifications}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await apiClient.put(`${endpoints.notifications}/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put(`${endpoints.notifications}/read-all`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.notifications}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const permissionsAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.permissions, params, 60_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.permissions}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (permission: any) => {
    try {
      const response = await apiClient.post(endpoints.permissions, permission);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, permission: any) => {
    try {
      const response = await apiClient.put(`${endpoints.permissions}/${id}`, permission);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.permissions}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const servicesAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.services, params, 60_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.services}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (service: any) => {
    try {
      const response = await apiClient.post(endpoints.services, service);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, service: any) => {
    try {
      const response = await apiClient.put(`${endpoints.services}/${id}`, service);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.services}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const inventoryAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.inventory, params, 60_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.inventory}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (item: any) => {
    try {
      const response = await apiClient.post(endpoints.inventory, item);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, item: any) => {
    try {
      const response = await apiClient.put(`${endpoints.inventory}/${id}`, item);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.inventory}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const vitalSignsAPI = {
  getAll: async (params?: any) => {
    try {
      const data = await getWithCache<any[]>(endpoints.vitalSigns, params, 15_000);
      return data as any[];
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.vitalSigns}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.vitalSigns}/resident/${residentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (vitalSigns: any) => {
    try {
      const response = await apiClient.post(endpoints.vitalSigns, vitalSigns);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, vitalSigns: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.vitalSigns}/${id}`, vitalSigns);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.vitalSigns}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const photosAPI = {
  getAll: async (params?: any) => {
    try {
      if (!isAuthenticated()) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return [];
      }
      const user = JSON.parse(clientStorage.getItem('user') || '{}');
      if (params?.family_member_id && user.role === 'family') {
        const data = await getWithCache<any[]>('/resident-photos', { family_member_id: params.family_member_id }, 30_000);
        return data as any[];
      }
      if (params?.family_member_id) {
        try {
          const residents = await residentAPI.getByFamilyMemberId(params.family_member_id);
          const residentIds = Array.isArray(residents) ? residents.map(r => r._id) : [residents._id];
          const allPhotos: any[] = [];
          for (const residentId of residentIds) {
            try {
              const data = await getWithCache<any[]>(`/resident-photos/by-resident/${residentId}`, undefined, 30_000);
              if (data && Array.isArray(data)) {
                allPhotos.push(...data);
              }
            } catch {}
          }
          return allPhotos;
        } catch {}
      }
      const data = await getWithCache<any[]>('/resident-photos', params, 30_000);
      return data as any[];
    } catch (error) {
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      if (!isAuthenticated()) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return null;
      }
      
      const response = await apiClient.get(`/resident-photos/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  upload: async (photoData: FormData) => {
    try {
      const file = photoData.get('file');
      if (!file || !(file instanceof File)) {
        throw new Error('No valid file found in FormData');
      }
      
      const response = await apiClient.post('/resident-photos', photoData, {
        timeout: 30000,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ khi tải ảnh. Vui lòng thử lại sau.');
      }
      if (error.response?.status === 413) {
        throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn.');
      }
      if (error.response?.status === 400) {
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
      }
      throw new Error('Không thể tải ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/resident-photos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getPhotoUrl: (file_path: string) => {
    if (!file_path) return '';
    const cleanPath = file_path.replace(/\\/g, '/').replace(/"/g, '').replace(/^\/+/, '');
    if (cleanPath.startsWith('http')) return cleanPath;
    
    // Backend serves static files at /uploads/ prefix
    // Remove uploads/ from path if it exists to avoid double prefix
    const pathWithoutUploads = cleanPath.replace(/^uploads\//, '');
    
    // In development we proxy through Next.js: /api -> backend
    if (API_BASE_URL.startsWith('/')) {
      return `${API_BASE_URL}/uploads/${pathWithoutUploads}`;
    }
    // In production use static host with uploads prefix
    return `${STATIC_BASE_URL}/uploads/${pathWithoutUploads}`;
  },

  getByResidentId: async (residentId: string) => {
    try {
      if (!isAuthenticated()) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return [];
      }
      
      const response = await apiClient.get(`/resident-photos/by-resident/${residentId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },
};


export const visitsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.visits, { 
        params: { ...params, populate: 'family_member_id' } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getByFamily: async (familyMemberId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.visits}/family`, {
        params: { family_member_id: familyMemberId }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.visits}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (visit: any) => {
    try {
      const response = await apiClient.post(endpoints.visits, visit);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createMultiple: async (data: {
    resident_ids: string[];
    visit_date: string;
    visit_time: string;
    purpose: string;
    duration?: number;
    numberOfVisitors?: number;
  }) => {
    try {
      const response = await apiClient.post(`${endpoints.visits}/multiple`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: string, visit: any) => {
    try {
      const response = await apiClient.put(`${endpoints.visits}/${id}`, visit);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.visits}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approve: async (id: string) => {
    try {
      const response = await apiClient.put(`${endpoints.visits}/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  reject: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.put(`${endpoints.visits}/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const carePlansAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/care-plans', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/care-plans/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
 
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/by-resident/${residentId}`);
      return response.data;
    } catch (error: any) {
      // If 404, return empty array instead of throwing
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
  register: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plans/register', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plans', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/care-plans/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/care-plans/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const bedAssignmentsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/bed-assignments', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/bed-assignments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/bed-assignments/by-resident`, { params: { resident_id: residentId } });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  getPendingAssignments: async () => {
    try {
      const response = await apiClient.get('/bed-assignments/admin/pending');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  approveAssignment: async (id: string) => {
    try {
      const response = await apiClient.patch(`/bed-assignments/admin/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  rejectAssignment: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.patch(`/bed-assignments/admin/${id}/reject`, reason ? { reason } : {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  activateAssignment: async (id: string) => {
    try {
      const response = await apiClient.patch(`/bed-assignments/admin/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/bed-assignments', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      if (data.unassigned_date) {
        const response = await apiClient.patch(`/bed-assignments/${id}/unassign`, data);
        return response.data;
      } else {
        throw new Error('Backend does not support general bed assignment updates. Use /unassign endpoint for unassigning.');
      }
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/bed-assignments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const carePlanAssignmentsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/care-plan-assignments', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/by-resident/${residentId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },
  getPendingAssignments: async () => {
    try {
      const response = await apiClient.get('/care-plan-assignments/admin/pending');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  approveAssignment: async (id: string) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/admin/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  rejectAssignment: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/admin/${id}/reject`, reason ? { reason } : {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  activateAssignment: async (id: string) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/admin/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plan-assignments', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  renew: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plan-assignments', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  removePackage: async (assignmentId: string) => {
    try {
      const response = await apiClient.delete(`/care-plan-assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const billsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/bills', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/bills/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/bills/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/bills/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/bills/by-resident`, { params: { resident_id: residentId } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  create: async (bill: any) => {
    try {
      const response = await apiClient.post('/bills', bill);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  calculateTotal: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/bills/calculate-total/${residentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const bedsAPI = {
  getAll: async (params?: any) => {
    try {
      console.log('Calling beds API with params:', params);
      // Temporarily bypass cache to debug
      const response = await apiClient.get('/beds', { params });
      console.log('Beds API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Beds API error:', error);
      return [];
    }
  },
  getByRoom: async (roomId: string, status?: 'available' | 'occupied') => {
    try {
      const response = await apiClient.get(`/beds/by-room/${roomId}`, {
        params: status ? { status } : undefined,
      });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/beds/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/beds', data);
      return response.data;
    } catch (error) {
      console.error('Error creating bed:', error);
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/beds/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating bed:', error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/beds/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bed:', error);
      throw error;
    }
  },
};

export const roomTypesAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/room-types');
      return response.data;
    } catch (error) {
      return [];
    }
  }
};

export const paymentAPI = {
  createPayment: async (billId: string) => {
    try {
      const response = await apiClient.post('/payment', { bill_id: billId });
      return response.data.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Tạo mã thanh toán');
      throw new Error(errorMessage);
    }
  },
};

export { apiClient };
export { API_BASE_URL };

export const serviceRequestsAPI = {
  create: async (data: {
    resident_id: string;
    family_member_id: string;
    request_type: 'care_plan_change' | 'service_date_change' | 'room_change';
    target_service_package_id?: string;
    target_room_id?: string;
    target_bed_id?: string;
    new_start_date?: string;
    new_end_date?: string;
    note?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    medicalNote?: string;
  }) => {
    try {
      const response = await apiClient.post('/service-requests', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAll: async (status?: string) => {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get('/service-requests', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPending: async () => {
    try {
      const response = await apiClient.get('/service-requests?status=pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  approve: async (id: string) => {
    try {
      const response = await apiClient.patch(`/service-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  reject: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.patch(`/service-requests/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/service-requests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMyRequests: async () => {
    try {
      const response = await apiClient.get('/service-requests/my');
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getByFamilyMember: async (familyMemberId: string) => {
    try {
      const response = await apiClient.get('/service-requests/my');
      return response.data;
    } catch (error) {
      return [];
    }
  }
};

// Cache cho unread count để tránh gọi API quá thường xuyên
let unreadCountCache: { count: number; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 giây

export const messagesAPI = {
  sendMessage: async (messageData: {
    receiver_id: string;
    content: string;
    resident_id?: string;
    attachment?: string;
  }) => {
    try {
      const response = await apiClient.post('/messages', messageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getConversations: async () => {
    try {
      const response = await apiClient.get('/messages/conversations');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getConversation: async (partnerId: string, residentId?: string) => {
    try {
      const params = residentId ? { residentId } : {};
      const response = await apiClient.get(`/messages/conversation/${partnerId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUnreadCount: async () => {
    // Kiểm tra cache trước
    const now = Date.now();
    if (unreadCountCache && (now - unreadCountCache.timestamp) < CACHE_DURATION) {
      return { unreadCount: unreadCountCache.count };
    }

    try {
      const response = await retryRequest(
        () =>
          withTimeout(
            apiClient.get('/messages/unread-count', {
              headers: { 'Cache-Control': 'no-cache' },
            }),
            10000, // Giảm timeout xuống 10s
            'messagesAPI.getUnreadCount'
          ),
        1, // Chỉ retry 1 lần
        1000
      );
      
      const count = response.data?.unreadCount || 0;
      // Cập nhật cache
      unreadCountCache = { count, timestamp: now };
      
      return { unreadCount: count };
    } catch (error) {
      console.warn('Failed to fetch unread count, using cached value or default:', error instanceof Error ? error.message : String(error));
      
      // Nếu có cache cũ, sử dụng nó
      if (unreadCountCache) {
        return { unreadCount: unreadCountCache.count };
      }
      
      // Trả về giá trị mặc định
      return { unreadCount: 0 };
    }
  },

  getMessage: async (id: string) => {
    try {
      const response = await apiClient.get(`/messages/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteMessage: async (id: string) => {
    try {
      const response = await apiClient.delete(`/messages/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
      
  markAsRead: async (id: string) => {
    try {
      const response = await apiClient.post(`/messages/${id}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// SWR Fetcher function
export const fetcher = async (url: string): Promise<any> => {
  try {
    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    // Transform axios error to a format SWR can understand
    const swrError = new Error(error?.response?.data?.message || error?.message || 'An error occurred');
    (swrError as any).status = error?.response?.status;
    (swrError as any).info = error?.response?.data;
    throw swrError;
  }
};

// Custom fetcher for POST requests
export const postFetcher = async (url: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.post(url, data);
    return response.data;
  } catch (error: any) {
    const swrError = new Error(error?.response?.data?.message || error?.message || 'An error occurred');
    (swrError as any).status = error?.response?.status;
    (swrError as any).info = error?.response?.data;
    throw swrError;
  }
};

// Custom fetcher for PUT requests
export const putFetcher = async (url: string, data: any): Promise<any> => {
  try {
    const response = await apiClient.put(url, data);
    return response.data;
  } catch (error: any) {
    const swrError = new Error(error?.response?.data?.message || error?.message || 'An error occurred');
    (swrError as any).status = error?.response?.status;
    (swrError as any).info = error?.response?.data;
    throw swrError;
  }
};

// Custom fetcher for DELETE requests
export const deleteFetcher = async (url: string): Promise<any> => {
  try {
    const response = await apiClient.delete(url);
    return response.data;
  } catch (error: any) {
    const swrError = new Error(error?.response?.data?.message || error?.message || 'An error occurred');
    (swrError as any).status = error?.response?.status;
    (swrError as any).info = error?.response?.data;
    throw swrError;
  }
};


