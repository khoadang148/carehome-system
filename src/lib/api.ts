import axios from 'axios';
import { clientStorage } from './utils/clientStorage';
import { isTokenValid } from './utils/tokenUtils';

const API_BASE_URL = 'http://localhost:8000';

// Tạo client riêng cho login với timeout hợp lý
const loginClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // Tăng timeout lên 10 giây cho login
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

const logoutClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => {
    return Promise.reject(error);
  }
);

export const isAuthenticated = () => {
  const token = clientStorage.getItem('access_token');
  return !!token;
};

const handleApiError = (error: any, context: string) => {
  if (error.response) {
    const { status, data } = error.response;
    console.error(`${context} - Status: ${status}`, data);
    
    if (data && data.detail) {
      return data.detail;
    } else if (data && data.message) {
      return data.message;
    } else {
      return `Lỗi ${status}: ${status === 401 ? 'Không có quyền truy cập' : 
              status === 403 ? 'Bị từ chối truy cập' : 
              status === 404 ? 'Không tìm thấy' : 
              status === 500 ? 'Lỗi máy chủ' : 'Có lỗi xảy ra'}`;
    }
  } else if (error.request) {
    console.error(`${context} - Network error:`, error.request);
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  } else {
    console.error(`${context} - Error:`, error.message);
    return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const token = clientStorage.getItem('access_token');
    
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Request with token:', config.url, token.substring(0, 20) + '...');
    } else {
      console.warn('No token found for request:', config.url);
    }
    
    // Don't override Content-Type for FormData uploads
    if (config.data instanceof FormData) {
      console.log('FormData detected, removing Content-Type header to let browser set it');
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Nếu gặp 401 thì chỉ logout, không thử refresh
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Redirecting to login');
      clientStorage.removeItem('access_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
    
    // Xử lý lỗi 403 Forbidden
    if (error.response?.status === 403) {
      console.error('403 Forbidden - Access denied:', {
        url: error.config?.url,
        method: error.config?.method,
              hasToken: !!clientStorage.getItem('access_token'),
      tokenPreview: clientStorage.getItem('access_token')?.substring(0, 20) + '...'
      });
    }

    return Promise.reject(error);
  }
);

const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  // User management
  users: '/users',
  // Resident management
  residents: '/residents',
  // Staff management (handled through users endpoint with role filtering)
  staff: '/users',
  // Activity management
  activities: '/activities',
  // Activity participations
  activityParticipations: '/activity-participations',
  // Medication management
  medications: '/medications',
  // Care notes
  careNotes: '/assessments',
  // Appointments
  appointments: '/appointments',
  // Family members
  familyMembers: '/family-members',
  // Rooms
  rooms: '/rooms',
  // Financial transactions
  transactions: '/transactions',
  // Reports
  reports: '/reports',
  // Notifications
  notifications: '/notifications',
  // Permissions
  permissions: '/permissions',
  // Services
  services: '/services',
  // Inventory
  inventory: '/inventory',
  // Vital signs
  vitalSigns: '/vital-signs',
  // Photos
  photos: '/photos',
  // Visits
  visits: '/visits',
  // Care plans
  carePlans: '/care-plans',
  // Beds
  beds: '/beds',
  // Room types
  roomTypes: '/room-types',
};

export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      console.log('🔄 Login attempt starting...');
      
      const response = await loginClient.post('/auth/login', {
        email,
        password,
      });
      
      const { access_token } = response.data;
      console.log('✅ Login successful, setting token');
      
      // Lưu token vào localStorage ngay lập tức
      if (typeof window !== 'undefined') {
        clientStorage.setItem('access_token', access_token);
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      // Xử lý lỗi cụ thể để trả về thông báo chính xác
      if (error.response?.status === 401) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
      } else {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
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
      // Kiểm tra token validity trước khi gọi API
      if (!isTokenValid()) {
        console.log('Token invalid or expired, skipping logout API call');
        return { message: 'No valid session to logout', success: true };
      }

      // Use AbortController to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout for faster logout
      
      const response = await logoutClient.post(endpoints.auth.logout, {}, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.data;
    } catch (error: any) {
      // Don't throw error to avoid blocking logout process
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, continuing with local logout');
      } else {
        console.warn('Logout API call failed:', error);
      }
      return { message: 'Logged out locally', success: true };
    }
  },

  // Test authentication và lấy thông tin user hiện tại
  me: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to get current user info');
      throw new Error(errorMessage);
    }
  },
};

// User API
export const userAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
      return [];
    }
  },
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  getAuthProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching auth profile:', error);
      throw error;
    }
  },

  updateProfile: async (userData: any) => {
    try {
      const response = await apiClient.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  changePassword: async (passwordData: any) => {
    try {
      const response = await apiClient.patch('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.users}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  update: async (id: string, data: any) => {
    try {
      console.log('userAPI.update - Input:', { id, data });
      const response = await apiClient.patch(`/users/${id}`, data);
      console.log('userAPI.update - Success:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  updateAvatar: async (id: string, avatarData: FormData) => {
    try {
      // Debug: Log FormData content
      console.log('API - FormData entries:');
      for (let [key, value] of avatarData.entries()) {
        console.log(key, value);
      }
      
      // Ưu tiên endpoint /users/{id}/avatar
      const response = await apiClient.patch(`/users/${id}/avatar`, avatarData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  },
  getAvatarUrl: (avatarPath: string) => {
    if (!avatarPath) return '';
    if (avatarPath.startsWith('http')) return avatarPath;
    const cleanPath = avatarPath.replace(/^\\+|^\/+/g, '').replace(/\\/g, '/');
    const fullUrl = `${API_BASE_URL}/${cleanPath}`;
    console.log('Avatar URL:', { original: avatarPath, cleaned: cleanPath, full: fullUrl });
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
      console.error('Error activating user:', error);
      throw error;
    }
  },
  deactivate: async (id: string) => {
    try {
      const response = await apiClient.patch(`/users/${id}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating user:', error);
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
      console.error('Error creating user:', error);
      throw error;
    }
  },
  // Thêm hàm resetPassword
  resetPassword: async (id: string, newPassword: string) => {
    try {
      const response = await apiClient.patch(`/users/${id}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  },
};

// Resident API
export const residentAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.residents, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching residents:', error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resident with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (resident: any) => {
    try {
      const response = await apiClient.post(endpoints.residents, resident);
      return response.data;
    } catch (error) {
      console.error('Error creating resident:', error);
      throw error;
    }
  },

  update: async (id: string, resident: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.residents}/${id}`, resident);
      return response.data;
    } catch (error) {
      console.error(`Error updating resident with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.residents}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting resident with ID ${id}:`, error);
      throw error;
    }
  },

  getVitalSigns: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${id}/vital-signs`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vital signs for resident ${id}:`, error);
      throw error;
    }
  },

  getPhotos: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${id}/photos`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching photos for resident ${id}:`, error);
      throw error;
    }
  },

  uploadPhoto: async (id: string, photoData: FormData) => {
    try {
      const response = await apiClient.post(`${endpoints.residents}/${id}/photos`, photoData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error uploading photo for resident ${id}:`, error);
      throw error;
    }
  },

  getByFamilyMemberId: async (familyMemberId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/family-member/${familyMemberId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching resident by family member ID ${familyMemberId}:`, error);
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

// Staff API
export const staffAPI = {
  getAll: async (params?: any) => {
    try {
      // Kiểm tra authentication
      if (!isAuthenticated()) {
        console.warn('User not authenticated, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return [];
      }
      
      // Kiểm tra role của user
      const user = JSON.parse(clientStorage.getItem('user') || '{}');
      if (user.role === 'family') {
        // Family sử dụng endpoint /users và filter ở frontend
        console.log('Family user - fetching all users');
        const response = await apiClient.get('/users', { params });
        // Filter chỉ lấy staff ở frontend
        const allUsers = response.data;
        const staffUsers = allUsers.filter((user: any) => user.role === 'staff');
        console.log('Filtered staff users:', staffUsers);
        return staffUsers;
      }
      
      // Admin và Staff sử dụng endpoint /users/by-role
      console.log('Admin/Staff user - fetching staff with params:', { role: 'staff', ...params });
      const response = await apiClient.get('/users/by-role', { 
        params: { 
          role: 'staff',
          ...params 
        } 
      });
      console.log('Staff API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching staff with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (staff: any) => {
    try {
      let response;
      
      // Check if there's an avatar file to upload
      if (staff.avatar && staff.avatar instanceof File) {
        // Use FormData for file upload
        const formData = new FormData();
        
        // Add file
        formData.append('avatar', staff.avatar);
        
        // Add other fields
        Object.keys(staff).forEach(key => {
          if (key !== 'avatar' && staff[key] !== undefined && staff[key] !== null) {
            formData.append(key, staff[key]);
          }
        });
        
        // Set content type for multipart/form-data
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
        
        response = await apiClient.post(endpoints.staff, formData, config);
      } else {
        // Regular JSON request
        response = await apiClient.post(endpoints.staff, staff);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  update: async (id: string, staff: any) => {
    try {
      let response;
      
      // Check if there's an avatar file to upload
      if (staff.avatar && staff.avatar instanceof File) {
        // Use FormData for file upload
        const formData = new FormData();
        
        // Add file
        formData.append('avatar', staff.avatar);
        
        // Add other fields
        Object.keys(staff).forEach(key => {
          if (key !== 'avatar' && staff[key] !== undefined && staff[key] !== null) {
            formData.append(key, staff[key]);
          }
        });
        
        // Set content type for multipart/form-data
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
        
        response = await apiClient.patch(`${endpoints.staff}/${id}`, formData, config);
      } else {
        // Regular JSON request
        response = await apiClient.patch(`${endpoints.staff}/${id}`, staff);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error updating staff with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.staff}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting staff with ID ${id}:`, error);
      throw error;
    }
  },

  getAttendance: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${id}/attendance`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching attendance for staff ${id}:`, error);
      throw error;
    }
  },

  getPerformance: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${id}/performance`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching performance for staff ${id}:`, error);
      throw error;
    }
  },
};

// Staff Assignments API
export const staffAssignmentsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/staff-assignments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching staff assignments:', error);
      throw error;
    }
  },

  getAllIncludingExpired: async (params?: any) => {
    try {
      const response = await apiClient.get('/staff-assignments/all-including-expired', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all staff assignments including expired:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching staff assignment with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (assignment: any) => {
    try {
      const response = await apiClient.post('/staff-assignments', assignment);
      return response.data;
    } catch (error) {
      console.error('Error creating staff assignment:', error);
      throw error;
    }
  },

  update: async (id: string, assignment: any) => {
    try {
      const response = await apiClient.patch(`/staff-assignments/${id}`, assignment);
      return response.data;
    } catch (error) {
      console.error(`Error updating staff assignment with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/staff-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting staff assignment with ID ${id}:`, error);
      throw error;
    }
  },

  getByStaff: async (staffId: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/by-staff/${staffId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching staff assignments for staff ${staffId}:`, error);
      throw error;
    }
  },

  getByResident: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/staff-assignments/by-resident/${residentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching staff assignments for resident ${residentId}:`, error);
      throw error;
    }
  },

  getMyAssignments: async () => {
    try {
      const response = await apiClient.get('/staff-assignments/my-assignments');
      return response.data;
    } catch (error) {
      console.error('Error fetching my staff assignments:', error);
      throw error;
    }
  },
};

// Activities API
export const activitiesAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activities, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
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
      console.error(`Error fetching activity with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (activity: any) => {
    try {
      const response = await apiClient.post(endpoints.activities, activity);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  update: async (id: string, activity: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.activities}/${id}`, activity);
      return response.data;
    } catch (error) {
      console.error(`Error updating activity with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.activities}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting activity with ID ${id}:`, error);
      throw error;
    }
  },

  getParticipants: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.activities}/${id}/participants`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching participants for activity with ID ${id}:`, error);
      throw error;
    }
  },

  addParticipant: async (activityId: string, residentId: string) => {
    try {
      const response = await apiClient.post(`${endpoints.activities}/${activityId}/participants`, { residentId });
      return response.data;
    } catch (error) {
      console.error(`Error adding participant to activity with ID ${activityId}:`, error);
      throw error;
    }
  },

  removeParticipant: async (activityId: string, residentId: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.activities}/${activityId}/participants/${residentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing participant from activity with ID ${activityId}:`, error);
      throw error;
    }
  },

  // AI Recommendation endpoint
  getAIRecommendation: async (residentIds: string[], schedule_time?: string) => {
    try {
      const payload: any = {
        resident_ids: residentIds
      };
      
      if (schedule_time) {
        payload.schedule_time = schedule_time;
      }
      
      // Tăng timeout cho AI recommendation API vì có thể cần nhiều thời gian xử lý
      const response = await apiClient.post(`${endpoints.activities}/recommendation/ai`, payload, {
        timeout: 30000 // 30 giây cho AI processing
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting AI recommendation for resident(s)`, error);
      throw error;
    }
  },

  // Check schedule conflict endpoint
  checkScheduleConflict: async (residentId: string, scheduleTime: string, duration: number) => {
    try {
      const response = await apiClient.post(`${endpoints.activities}/check-schedule-conflict`, {
        residentId,
        scheduleTime,
        duration
      });
      return response.data;
    } catch (error) {
      console.error('Error checking schedule conflict:', error);
      throw error;
    }
  },
};

// Activity Participations API
export const activityParticipationsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activityParticipations, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity participations:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity participation with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (participation: any) => {
    try {
      const response = await apiClient.post(endpoints.activityParticipations, participation);
      return response.data;
    } catch (error) {
      console.error('Error creating activity participation:', error);
      throw error;
    }
  },

  update: async (id: string, participation: any) => {
    try {
      const response = await apiClient.patch(`${endpoints.activityParticipations}/${id}`, participation);
      return response.data;
    } catch (error) {
      console.error(`Error updating activity participation with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.activityParticipations}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting activity participation with ID ${id}:`, error);
      throw error;
    }
  },

  approve: async (id: string) => {
    try {
      const response = await apiClient.patch(`${endpoints.activityParticipations}/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving activity participation with ID ${id}:`, error);
      throw error;
    }
  },

  reject: async (id: string) => {
    try {
      const response = await apiClient.patch(`${endpoints.activityParticipations}/${id}/reject`);
      return response.data;
    } catch (error) {
      console.error(`Error rejecting activity participation with ID ${id}:`, error);
      throw error;
    }
  },

  getFamilyToday: async () => {
    try {
      const response = await apiClient.get(`${endpoints.activityParticipations}/family-today`);
      return response.data;
    } catch (error) {
      console.error('Error fetching family today activities:', error);
      throw error;
    }
  },

  getByResidentId: async (residentId: string, params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activityParticipations, { 
        params: { 
          resident_id: residentId,
          ...params 
        } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity participations for resident ${residentId}:`, error);
      throw error;
    }
  },

  getByStaffId: async (staffId: string, params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activityParticipations, { 
        params: { 
          staff_id: staffId,
          ...params 
        } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching activity participations for staff ${staffId}:`, error);
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
      console.error(`Error fetching activity participations for activity ${activityId}:`, error);
      throw error;
    }
  },
};

// Medication API
export const medicationAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.medications, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${residentId}/medications`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching medications for resident with ID ${residentId}:`, error);
      throw error;
    }
  },

  create: async (medication: any) => {
    try {
      const response = await apiClient.post(endpoints.medications, medication);
      return response.data;
    } catch (error) {
      console.error('Error creating medication:', error);
      throw error;
    }
  },

  update: async (id: string, medication: any) => {
    try {
      const response = await apiClient.put(`${endpoints.medications}/${id}`, medication);
      return response.data;
    } catch (error) {
      console.error(`Error updating medication with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.medications}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting medication with ID ${id}:`, error);
      throw error;
    }
  },
};

// Care Notes API
export const careNotesAPI = {
  getAll: async (params?: any) => {
    try {
      // GET /assessments?residentId=...
      const response = await apiClient.get(endpoints.careNotes, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching care notes:', error);
      throw error;
    }
  },
  create: async (assessment: any) => {
    try {
      // POST /assessments
      const response = await apiClient.post(endpoints.careNotes, assessment);
      return response.data;
    } catch (error) {
      console.error('Error creating assessment:', error);
      throw error;
    }
  },
  update: async (id: string, assessment: any) => {
    try {
      // PUT /assessments/{id}
      const response = await apiClient.put(`${endpoints.careNotes}/${id}`, assessment);
      return response.data;
    } catch (error) {
      console.error(`Error updating assessment with ID ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      // DELETE /assessments/{id}
      const response = await apiClient.delete(`${endpoints.careNotes}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting assessment with ID ${id}:`, error);
      throw error;
    }
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.appointments, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${residentId}/appointments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointments for resident with ID ${residentId}:`, error);
      throw error;
    }
  },

  create: async (appointment: any) => {
    try {
      const response = await apiClient.post(endpoints.appointments, appointment);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  update: async (id: string, appointment: any) => {
    try {
      const response = await apiClient.put(`${endpoints.appointments}/${id}`, appointment);
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.appointments}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting appointment with ID ${id}:`, error);
      throw error;
    }
  },
};

// Family Members API
export const familyMembersAPI = {
  // getAll: async (params?: any) => {
  //   try {
  //     const response = await apiClient.get(endpoints.familyMembers, { params });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error fetching family members:', error);
  //     throw error;
  //   }
  // },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.familyMembers}/${id}`);
      const familyMember = response.data;
      
      // Nếu family member có avatar, tạo URL đầy đủ
      if (familyMember && familyMember.avatar) {
        familyMember.avatar = `${API_BASE_URL}/family-members/${id}/avatar`;
      }
      
      return familyMember;
    } catch (error) {
      console.error(`Error fetching family member with ID ${id}:`, error);
      throw error;
    }
  },
  create: async (familyMember: any) => {
    try {
      const response = await apiClient.post(endpoints.familyMembers, familyMember);
      return response.data;
    } catch (error) {
      console.error('Error creating family member:', error);
      throw error;
    }
  },
  update: async (id: string, familyMember: any) => {
    try {
      const response = await apiClient.put(`${endpoints.familyMembers}/${id}`, familyMember);
      return response.data;
    } catch (error) {
      console.error(`Error updating family member with ID ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.familyMembers}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting family member with ID ${id}:`, error);
      throw error;
    }
  },

  getAvatarUrl: (id: string) => {
    if (!id) return '';
    return `${API_BASE_URL}/users/${id}/avatar`;
  },
};

// Rooms API
export const roomsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.rooms, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.rooms}/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching room with ID ${id}:`, error);
      // Handle 400 Bad Request (invalid ID) and 404 Not Found gracefully
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn(`Room with ID ${id} not found or invalid`);
        return null;
      }
      // For other errors, still return null but log the error
      return null;
    }
  },

  create: async (room: any) => {
    try {
      const response = await apiClient.post(endpoints.rooms, room);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  update: async (id: string, room: any) => {
    try {
      const response = await apiClient.put(`${endpoints.rooms}/${id}`, room);
      return response.data;
    } catch (error) {
      console.error(`Error updating room with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.rooms}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting room with ID ${id}:`, error);
      throw error;
    }
  },
};

// Financial Transactions API
export const transactionsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.transactions, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.transactions}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching transaction with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (transaction: any) => {
    try {
      const response = await apiClient.post(endpoints.transactions, transaction);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  update: async (id: string, transaction: any) => {
    try {
      const response = await apiClient.put(`${endpoints.transactions}/${id}`, transaction);
      return response.data;
    } catch (error) {
      console.error(`Error updating transaction with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.transactions}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting transaction with ID ${id}:`, error);
      throw error;
    }
  },
};

// Reports API
export const reportsAPI = {
  getFinancialReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/financial`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial report:', error);
      throw error;
    }
  },

  getOccupancyReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/occupancy`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching occupancy report:', error);
      throw error;
    }
  },

  getStaffPerformanceReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/staff-performance`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching staff performance report:', error);
      throw error;
    }
  },

  getResidentHealthReport: async (params?: any) => {
    try {
      const response = await apiClient.get(`${endpoints.reports}/resident-health`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resident health report:', error);
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
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.notifications}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching notification with ID ${id}:`, error);
      throw error;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await apiClient.put(`${endpoints.notifications}/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put(`${endpoints.notifications}/read-all`);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.notifications}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification with ID ${id}:`, error);
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
      console.error('Error fetching permissions:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.permissions}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching permission with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (permission: any) => {
    try {
      const response = await apiClient.post(endpoints.permissions, permission);
      return response.data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  },

  update: async (id: string, permission: any) => {
    try {
      const response = await apiClient.put(`${endpoints.permissions}/${id}`, permission);
      return response.data;
    } catch (error) {
      console.error(`Error updating permission with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.permissions}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting permission with ID ${id}:`, error);
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
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.services}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching service with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (service: any) => {
    try {
      const response = await apiClient.post(endpoints.services, service);
      return response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  update: async (id: string, service: any) => {
    try {
      const response = await apiClient.put(`${endpoints.services}/${id}`, service);
      return response.data;
    } catch (error) {
      console.error(`Error updating service with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.services}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting service with ID ${id}:`, error);
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
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.inventory}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory item with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (item: any) => {
    try {
      const response = await apiClient.post(endpoints.inventory, item);
      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  update: async (id: string, item: any) => {
    try {
      const response = await apiClient.put(`${endpoints.inventory}/${id}`, item);
      return response.data;
    } catch (error) {
      console.error(`Error updating inventory item with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.inventory}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting inventory item with ID ${id}:`, error);
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
      console.error('Error fetching vital signs:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.vitalSigns}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vital signs with ID ${id}:`, error);
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.vitalSigns}/resident/${residentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vital signs by residentId ${residentId}:`, error);
      throw error;
    }
  },

  create: async (vitalSigns: any) => {
    try {
      const response = await apiClient.post(endpoints.vitalSigns, vitalSigns);
      return response.data;
    } catch (error) {
      console.error('Error creating vital signs:', error);
      throw error;
    }
  },

  update: async (id: string, vitalSigns: any) => {
    try {
      const response = await apiClient.put(`${endpoints.vitalSigns}/${id}`, vitalSigns);
      return response.data;
    } catch (error) {
      console.error(`Error updating vital signs with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.vitalSigns}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting vital signs with ID ${id}:`, error);
      throw error;
    }
  },
};

export const photosAPI = {
  getAll: async (params?: any) => {
    try {
      // Kiểm tra authentication trước khi gọi API
      if (!isAuthenticated()) {
        console.warn('User not authenticated, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return [];
      }
      
      console.log('Fetching photos with params:', params);
      
      // Kiểm tra role của user
      const user = JSON.parse(clientStorage.getItem('user') || '{}');
      
      // Nếu có family_member_id và user là family, sử dụng endpoint chính
      if (params?.family_member_id && user.role === 'family') {
        console.log('Family user - using main endpoint with family_member_id');
        const response = await apiClient.get('/resident-photos', { 
          params: { family_member_id: params.family_member_id } 
        });
        console.log('Photos API response (family):', response.data);
        return response.data;
      }
      
      // Nếu có family_member_id nhưng không phải family, thử lấy photos theo resident
      if (params?.family_member_id) {
        try {
          // Đầu tiên lấy danh sách residents của family member
          const residents = await residentAPI.getByFamilyMemberId(params.family_member_id);
          const residentIds = Array.isArray(residents) ? residents.map(r => r._id) : [residents._id];
          
          // Lấy photos cho từng resident
          const allPhotos: any[] = [];
          for (const residentId of residentIds) {
            try {
              const response = await apiClient.get(`/resident-photos/by-resident/${residentId}`);
              if (response.data && Array.isArray(response.data)) {
                allPhotos.push(...response.data);
              }
            } catch (residentError) {
              console.warn(`Error fetching photos for resident ${residentId}:`, residentError);
            }
          }
          
          console.log('Photos API response (by resident):', allPhotos);
          return allPhotos;
        } catch (residentError) {
          console.warn('Error fetching photos by resident, falling back to general endpoint:', residentError);
        }
      }
      
      // Fallback: gọi endpoint chung
      const response = await apiClient.get('/resident-photos', { params });
      console.log('Photos API response (general):', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching photos:', error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      // Kiểm tra authentication trước khi gọi API
      if (!isAuthenticated()) {
        console.warn('User not authenticated, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return null;
      }
      
      const response = await apiClient.get(`/resident-photos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching photo with ID ${id}:`, error);
      // Trả về null thay vì throw error để tránh crash app
      return null;
    }
  },

  upload: async (photoData: FormData) => {
    try {
      // Debug: Log FormData content to ensure proper structure
      console.log('Photo upload - FormData entries:');
      for (let [key, value] of photoData.entries()) {
        console.log(key, value);
      }
      
      // Validate FormData contains file
      const file = photoData.get('file');
      console.log('File in FormData before API call:', file);
      console.log('File instanceof File:', file instanceof File);
      
      if (!file || !(file instanceof File)) {
        throw new Error('No valid file found in FormData');
      }
      
      // Don't set Content-Type manually for FormData - let the browser set it with boundary
      const response = await apiClient.post('/resident-photos', photoData, {
        timeout: 30000, // 30 second timeout for file uploads
      });
      
      console.log('Photo upload successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 500) {
        throw new Error('Lỗi máy chủ khi tải ảnh. Vui lòng thử lại sau.');
      } else if (error.response?.status === 413) {
        throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn.');
      } else if (error.response?.status === 400) {
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Kết nối chậm. Vui lòng thử lại.');
      } else {
        throw new Error('Không thể tải ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/resident-photos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting photo with ID ${id}:`, error);
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
      // Kiểm tra authentication trước khi gọi API
      if (!isAuthenticated()) {
        console.warn('User not authenticated, redirecting to login');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return [];
      }
      
      const response = await apiClient.get(`/resident-photos/by-resident/${residentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching photos for resident ${residentId}:`, error);
      // Trả về mảng rỗng thay vì throw error để tránh crash app
      return [];
    }
  },
};


export const visitsAPI = {
  getAll: async (params?: any) => {
    try {
      // Thêm populate để lấy thông tin đầy đủ của family member
      const response = await apiClient.get(endpoints.visits, { 
        params: { 
          ...params,
          populate: 'family_member_id' // Yêu cầu backend populate thông tin family member
        } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching visits:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.visits}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching visit with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (visit: any) => {
    try {
      const response = await apiClient.post(endpoints.visits, visit);
      return response.data;
    } catch (error) {
      console.error('Error creating visit:', error);
      throw error;
    }
  },

  // Tạo nhiều lịch cho nhiều cư dân trong một lần gọi
  createMultiple: async (data: {
    resident_ids: string[];
    visit_date: string; // ISO string
    visit_time: string; // HH:mm
    purpose: string;
    duration?: number;
    numberOfVisitors?: number;
  }) => {
    try {
      const response = await apiClient.post(`${endpoints.visits}/multiple`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating multiple visits:', error);
      throw error;
    }
  },

  update: async (id: string, visit: any) => {
    try {
      const response = await apiClient.put(`${endpoints.visits}/${id}`, visit);
      return response.data;
    } catch (error) {
      console.error(`Error updating visit with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.visits}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting visit with ID ${id}:`, error);
      throw error;
    }
  },

  approve: async (id: string) => {
    try {
      const response = await apiClient.put(`${endpoints.visits}/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Error approving visit ${id}:`, error);
      throw error;
    }
  },

  reject: async (id: string, reason?: string) => {
    try {
      const response = await apiClient.put(`${endpoints.visits}/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting visit ${id}:`, error);
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
      console.error('Error fetching care plans:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/care-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care plan with ID ${id}:`, error);
      throw error;
    }
  },
 
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/by-resident/${residentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care plans by residentId ${residentId}:`, error);
      throw error;
    }
  },
  register: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plans/register', data);
      return response.data;
    } catch (error) {
      console.error('Error registering care plan:', error);
      throw error;
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plans', data);
      return response.data;
    } catch (error) {
      console.error('Error creating care plan:', error);
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/care-plans/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating care plan with ID ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/care-plans/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting care plan with ID ${id}:`, error);
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
      console.error('Error fetching bed assignments:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/bed-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bed assignment with ID ${id}:`, error);
      throw error;
    }
  },
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/bed-assignments/by-resident`, { params: { resident_id: residentId } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching bed assignments by residentId ${residentId}:`, error);
      // Return empty array instead of throwing error when no bed assignments found
      return [];
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/bed-assignments', data);
      return response.data;
    } catch (error) {
      console.error('Error creating bed assignment:', error);
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      // Backend chỉ có endpoint /unassign, không có endpoint update chung
      // Nếu có unassigned_date thì dùng /unassign, ngược lại dùng /update
      if (data.unassigned_date) {
        const response = await apiClient.patch(`/bed-assignments/${id}/unassign`, data);
        return response.data;
      } else {
        // Nếu không có endpoint update chung, throw error
        throw new Error('Backend does not support general bed assignment updates. Use /unassign endpoint for unassigning.');
      }
    } catch (error) {
      console.error(`Error updating bed assignment with ID ${id}:`, error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/bed-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting bed assignment with ID ${id}:`, error);
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
      console.error('Error fetching care plan assignments:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care plan assignment with ID ${id}:`, error);
      throw error;
    }
  },
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/by-resident/${residentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care plan assignments by residentId ${residentId}:`, error);
      // Return empty array instead of throwing error when no care plan assignments found
      return [];
    }
  },
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plan-assignments', data);
      return response.data;
    } catch (error) {
      console.error('Error creating care plan assignment:', error);
      throw error;
    }
  },
  renew: async (data: any) => {
    try {
      const response = await apiClient.post('/care-plan-assignments', data);
      return response.data;
    } catch (error) {
      console.error('Error renewing care plan assignment:', error);
      throw error;
    }
  },
  removePackage: async (assignmentId: string) => {
    try {
      const response = await apiClient.delete(`/care-plan-assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing care plan assignment:', error);
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating care plan assignment with ID ${id}:`, error);
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
      console.error('Error fetching bills:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/bills/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bill with ID ${id}:`, error);
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/bills/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },
  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/bills/by-resident`, { params: { resident_id: residentId } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching bills by residentId ${residentId}:`, error);
      throw error;
    }
  },
  create: async (bill: any) => {
    try {
      const response = await apiClient.post('/bills', bill);
      return response.data;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  },
  calculateTotal: async (residentId: string) => {
    try {
      const response = await apiClient.get(`/bills/calculate-total/${residentId}`);
      return response.data;
    } catch (error) {
      console.error('Error calculating total:', error);
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
      console.error('Error fetching beds:', error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/beds/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bed with ID ${id}:`, error);
      // Trả về null thay vì throw error
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
      console.error('Error fetching room types:', error);
      // Trả về mảng rỗng thay vì throw error
      return [];
    }
  }
};

export const paymentAPI = {
  createPayment: async (billId: string) => {
    try {
      const response = await apiClient.post('/payment', { bill_id: billId });
      // Trả về response.data.data để lấy thông tin thanh toán
      return response.data.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Tạo mã thanh toán');
      throw new Error(errorMessage);
    }
  },
};

export { apiClient };
export { API_BASE_URL };

// Messages API
export const messagesAPI = {
  // Send a message
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
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get user conversations
  getConversations: async () => {
    try {
      const response = await apiClient.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get conversation with specific user
  getConversation: async (partnerId: string) => {
    try {
      const response = await apiClient.get(`/messages/conversation/${partnerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  // Get message by ID
  getMessage: async (id: string) => {
    try {
      const response = await apiClient.get(`/messages/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching message with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete message
  deleteMessage: async (id: string) => {
    try {
      const response = await apiClient.delete(`/messages/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting message with ID ${id}:`, error);
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (id: string) => {
    try {
      const response = await apiClient.post(`/messages/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking message as read with ID ${id}:`, error);
      throw error;
    }
  },
};


