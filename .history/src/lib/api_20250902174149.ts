import axios from 'axios';
import { clientStorage } from './utils/clientStorage';
import { isTokenValid } from './utils/tokenUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sep490-be-xniz.onrender.com';

const loginClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 3000, 
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 10000, 
});

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
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    return `Lỗi ${status}: ${status === 401 ? 'Không có quyền truy cập' : 
            status === 403 ? 'Bị từ chối truy cập' : 
            status === 404 ? 'Không tìm thấy' : 
            status === 500 ? 'Lỗi máy chủ' : 'Có lỗi xảy ra'}`;
  }
  if (error.request) return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
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
    if (error.response?.status === 401) {
      clientStorage.removeItem('access_token');
      clientStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      const token = clientStorage.getItem('access_token');
      if (token && !isTokenValid()) {
        clientStorage.removeItem('access_token');
        clientStorage.removeItem('user');
        if (typeof window !== 'undefined') {
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
      const response = await loginClient.post('/auth/login', { email, password });
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
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
      }
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  sendOtp: async (phone: string) => {
    try {
      const response = await loginClient.post('/auth/send-otp', { phone });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Có lỗi xảy ra khi gửi OTP');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
      }
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
  },

  verifyOtp: async (phone: string, otp: string) => {
    try {
      const response = await loginClient.post('/auth/verify-otp', { phone, otp });
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
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
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
      const response = await loginClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.response?.status === 400) {
        throw new Error('Email không tồn tại trong hệ thống hoặc tài khoản đã bị khóa');
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
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
      const response = await apiClient.get('/users', { params });
      return response.data;
    } catch (error) {
      return [];
    }
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

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.users}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
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
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    return fullUrl;
  },
  getAvatarUrlById: (id: string) => {
    if (!id) return '';
    return `${API_BASE_URL}/users/${id}/avatar`;
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
      const response = await apiClient.get(endpoints.residents, { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (resident: any) => {
    try {
      const response = await apiClient.post(endpoints.residents, resident);
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
      const response = await apiClient.get(`${endpoints.residents}/family-member/${familyMemberId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getAvatarUrl: (id: string) => {
    if (!id) return '';
    return `${API_BASE_URL}/residents/${id}/avatar`;
  },
  fetchAvatar: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/residents/${id}/avatar`);
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
        const response = await apiClient.get('/users', { params });
        const allUsers = response.data;
        const staffUsers = allUsers.filter((user: any) => user.role === 'staff');
        return staffUsers;
      }
      
      const response = await apiClient.get('/users/by-role', { 
        params: { role: 'staff', ...params } 
      });
      return response.data;
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
      const response = await apiClient.get('/staff-assignments', { params });
      return response.data;
    } catch (error) {
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

  getByResident: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/by-resident/${residentId}`);
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
      const response = await apiClient.get(endpoints.activities, { params });
      return response.data;
    } catch (error) {
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
      const response = await apiClient.get(endpoints.activityParticipations, { 
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
};

export const medicationAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.medications, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.careNotes, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.appointments, { params });
      return response.data;
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
        familyMember.avatar = `${API_BASE_URL}/family-members/${id}/avatar`;
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
    return `${API_BASE_URL}/users/${id}/avatar`;
  },
};

export const roomsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.rooms, { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.rooms}/${id}`);
      return response.data;
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
      const response = await apiClient.get(endpoints.transactions, { params });
      return response.data;
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
      const response = await apiClient.get(`${endpoints.reports}/financial`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getOccupancyReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/occupancy`, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.notifications, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.permissions, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.services, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.inventory, { params });
      return response.data;
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
      const response = await apiClient.get(endpoints.vitalSigns, { params });
      return response.data;
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
        const response = await apiClient.get('/resident-photos', { 
          params: { family_member_id: params.family_member_id } 
        });
        return response.data;
      }
      
      if (params?.family_member_id) {
        try {
          const residents = await residentAPI.getByFamilyMemberId(params.family_member_id);
          const residentIds = Array.isArray(residents) ? residents.map(r => r._id) : [residents._id];
          
          const allPhotos: any[] = [];
          for (const residentId of residentIds) {
            try {
              const response = await apiClient.get(`/resident-photos/by-resident/${residentId}`);
              if (response.data && Array.isArray(response.data)) {
                allPhotos.push(...response.data);
              }
            } catch (residentError) {
            }
          }
          return allPhotos;
        } catch (residentError) {
        }
      }

      const response = await apiClient.get('/resident-photos', { params });
      return response.data;
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
    const cleanPath = file_path.replace(/\\/g, '/').replace(/"/g, '');
    return `${API_BASE_URL}/${cleanPath}`;
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
    } catch (error) {
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
      const response = await apiClient.get('/beds', { params });
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

  getConversation: async (partnerId: string) => {
    try {
      const response = await apiClient.get(`/messages/conversation/${partnerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      throw error;
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


