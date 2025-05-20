import axios from 'axios';

// Base MockAPI URL - you would replace this with your actual MockAPI endpoint
const API_BASE_URL = 'https://6483558df2e76ae1b95c51f5.mockapi.io/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
const endpoints = {
  residents: '/residents',
  staff: '/staff',
  activities: '/activities',
  schedules: '/schedules',
  medications: '/medications',
  careNotes: '/care-notes',
  appointments: '/appointments',
};

// Resident API
export const residentAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.residents);
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
      const response = await apiClient.put(`${endpoints.residents}/${id}`, resident);
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
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.staff);
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
};

// Activities API
export const activitiesAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.activities);
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
      const response = await apiClient.put(`${endpoints.activities}/${id}`, activity);
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
};

// Medication API
export const medicationAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.medications);
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
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.careNotes);
      return response.data;
    } catch (error) {
      console.error('Error fetching care notes:', error);
      throw error;
    }
  },

  getByResidentId: async (residentId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.residents}/${residentId}/care-notes`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching care notes for resident with ID ${residentId}:`, error);
      throw error;
    }
  },

  create: async (careNote: any) => {
    try {
      const response = await apiClient.post(endpoints.careNotes, careNote);
      return response.data;
    } catch (error) {
      console.error('Error creating care note:', error);
      throw error;
    }
  },

  update: async (id: string, careNote: any) => {
    try {
      const response = await apiClient.put(`${endpoints.careNotes}/${id}`, careNote);
      return response.data;
    } catch (error) {
      console.error(`Error updating care note with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.careNotes}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting care note with ID ${id}:`, error);
      throw error;
    }
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.appointments);
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

// Schedules API
export const schedulesAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get(endpoints.schedules);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  },

  getByStaffId: async (staffId: string) => {
    try {
      const response = await apiClient.get(`${endpoints.staff}/${staffId}/schedules`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching schedules for staff with ID ${staffId}:`, error);
      throw error;
    }
  },

  create: async (schedule: any) => {
    try {
      const response = await apiClient.post(endpoints.schedules, schedule);
      return response.data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  update: async (id: string, schedule: any) => {
    try {
      const response = await apiClient.put(`${endpoints.schedules}/${id}`, schedule);
      return response.data;
    } catch (error) {
      console.error(`Error updating schedule with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`${endpoints.schedules}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting schedule with ID ${id}:`, error);
      throw error;
    }
  },
};