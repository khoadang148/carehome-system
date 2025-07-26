import axios from 'axios';
// XÓA: import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// Base API URL for local Swagger backend
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Utility function to handle API errors
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

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    // Log để debug
    console.log('Current token:', token);
    
    if (token) {
      // Đảm bảo headers object tồn tại
      config.headers = config.headers || {};
      
      // Thêm token vào header
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Log để debug
      console.log('Request headers:', config.headers);
    } else {
      console.warn('No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Log để debug
    console.log('Response error:', error.response?.status);
    console.log('Original request:', originalRequest);

    // Tắt hoàn toàn logic refresh token để tránh vòng lặp login
    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true;
    //   console.log('Attempting token refresh...');
    //   try {
    //     const response = await apiClient.post('/auth/refresh');
    //     const { access_token } = response.data;
    //     console.log('Got new token:', access_token);
    //     if (typeof window !== 'undefined') {
    //       localStorage.setItem('access_token', access_token);
    //     }
    //     originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
    //     return apiClient(originalRequest);
    //   } catch (refreshError) {
    //     console.error('Token refresh failed:', refreshError);
    //     if (typeof window !== 'undefined') {
    //       localStorage.removeItem('access_token');
    //     }
    //     window.location.href = '/login';
    //     return Promise.reject(refreshError);
    //   }
    // }

    // Nếu gặp 401 thì chỉ logout, không thử refresh
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// API endpoints based on Swagger documentation
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
  // Staff management
  staff: '/staff',
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

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });
      
      const { access_token } = response.data;
      console.log('Login successful, setting token:', access_token);
      
      // Lưu token vào localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access_token);
      }
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = handleApiError(error, 'Login');
      throw new Error(errorMessage);
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
      const response = await apiClient.post(endpoints.auth.logout);
      // Xóa token khỏi cookie
      // XÓA: deleteCookie('access_token');
      return response.data;
    } catch (error) {
      const errorMessage = handleApiError(error, 'Logout');
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
      throw error;
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
      const response = await apiClient.patch(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  updateAvatar: async (id: string, avatarData: FormData) => {
    try {
      // Ưu tiên endpoint /users/{id}/avatar
      const response = await apiClient.patch(`/users/${id}/avatar`, avatarData, {
        headers: {
          // KHÔNG set 'Content-Type' để browser tự động set boundary
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
    return `${API_BASE_URL}/${cleanPath}`;
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
      throw error;
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
      const accessToken = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      // Sử dụng endpoint /users?role=staff để lấy danh sách staff
      const response = await apiClient.get('/users', { params: { ...params, role: 'staff' }, headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
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
      const response = await apiClient.post(endpoints.staff, staff);
      return response.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  update: async (id: string, staff: any) => {
    try {
      const response = await apiClient.put(`${endpoints.staff}/${id}`, staff);
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

// Activities API
export const activitiesAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.activities, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
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
      
      const response = await apiClient.post(`${endpoints.activities}/recommendation/ai`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error getting AI recommendation for resident(s)`, error);
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
      return response.data;
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
};

// Rooms API
export const roomsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.rooms, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`${endpoints.rooms}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching room with ID ${id}:`, error);
      throw error;
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
      const response = await apiClient.get('/resident-photos', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching photos:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/resident-photos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching photo with ID ${id}:`, error);
      throw error;
    }
  },

  upload: async (photoData: FormData) => {
    try {
      const response = await apiClient.post('/resident-photos', photoData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
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
};


export const visitsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get(endpoints.visits, { params });
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
};

// Care Plan Assignments API
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
      throw error;
    }
  },

  getByFamilyMemberId: async (familyMemberId: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/by-family-member/${familyMemberId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care plan assignments by familyMemberId ${familyMemberId}:`, error);
      throw error;
    }
  },

  getByStatus: async (status: string) => {
    try {
      const response = await apiClient.get(`/care-plan-assignments/by-status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care plan assignments by status ${status}:`, error);
      throw error;
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

  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating care plan assignment with ID ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      const response = await apiClient.patch(`/care-plan-assignments/${id}/status?status=${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error updating care plan assignment status with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/care-plan-assignments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting care plan assignment with ID ${id}:`, error);
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
};

export const bedsAPI = {
  getAll: async (params?: any) => {
    try {
      const response = await apiClient.get('/beds', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching beds:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/beds/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bed with ID ${id}:`, error);
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
      console.error('Error fetching room types:', error);
      throw error;
    }
  }
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


