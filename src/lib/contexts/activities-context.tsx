"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { activitiesAPI } from '@/lib/api';
import { getCookie } from 'cookies-next';

interface ResidentEvaluation {
  residentId: string;
  participated: boolean;
  reason?: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  duration: number;
  capacity: number;
  participants: number;
  facilitator: string;
  date: string;
  status: string;
  level: string;
  recurring: string;
  materials?: string;
  specialNotes?: string;
  ageGroupSuitability?: string[];
  healthRequirements?: string[];
  createdAt: string;
  residentEvaluations?: ResidentEvaluation[];
}

interface ActivitiesContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'participants' | 'createdAt'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivityById: (id: string) => Activity | undefined;
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

// Map API activity to UI activity
function mapApiActivity(api: any): Activity {
  // Calculate duration if possible
  let duration = 0;
  if (typeof api.duration === 'number') {
    duration = api.duration;
  } else if (api.scheduleTime && api.endTime) {
    // If both scheduleTime and endTime are ISO strings, calculate duration in minutes
    const start = new Date(api.scheduleTime);
    const end = new Date(api.endTime);
    duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  // Tính endTime nếu chưa có, dựa vào scheduleTime và duration
  let endTime = '';
  if (api.endTime) {
    endTime = api.endTime;
  } else if (api.scheduleTime && duration) {
    const start = new Date(api.scheduleTime);
    const end = new Date(start.getTime() + duration * 60000);
    endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Ensure we have a valid id - try _id first, then id, then generate a temporary one
  const activityId = api._id || api.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: activityId,
    name: api.activityName || api.name || '',
    description: api.description || '',
    startTime: api.scheduleTime ? new Date(api.scheduleTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : (api.startTime || ''),
    endTime,
    date: api.scheduleTime ? new Date(api.scheduleTime).toISOString().split('T')[0] : (api.date || ''),
    category: api.category || '',
    location: api.location || '',
    capacity: api.capacity || 0,
    participants: api.participants || 0,
    facilitator: api.facilitator || '',
    status: api.status || '',
    level: api.level || '',
    recurring: api.recurring || '',
    materials: api.materials || '',
    specialNotes: api.specialNotes || '',
    ageGroupSuitability: api.ageGroupSuitability || [],
    healthRequirements: api.healthRequirements || [],
    createdAt: api.created_at || api.createdAt || '',
    residentEvaluations: api.residentEvaluations || [],
    duration,
  };
}

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load activities from API on mount
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getCookie('access_token');
        if (!token) {
          setLoading(false);
          setError('Chưa đăng nhập');
          return;
        }
        const data = await activitiesAPI.getAll();
        setActivities(Array.isArray(data) ? data.map(mapApiActivity) : []);
      } catch (err: any) {
        setError(err.message || 'Lỗi khi tải danh sách hoạt động');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const addActivity = async (activityData: Omit<Activity, 'id' | 'participants' | 'createdAt'>) => {
    setError(null);
    try {
      const newActivity = await activitiesAPI.create(activityData);
      setActivities(prev => [mapApiActivity(newActivity), ...prev]);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo hoạt động');
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    setError(null);
    try {
      const updated = await activitiesAPI.update(id, updates);
      setActivities(prev => prev.map(activity => activity.id === id ? { ...activity, ...mapApiActivity(updated) } : activity));
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật hoạt động');
    }
  };

  const deleteActivity = async (id: string) => {
    setError(null);
    try {
      await activitiesAPI.delete(id);
      setActivities(prev => prev.filter(activity => activity.id !== id));
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa hoạt động');
    }
  };

  const getActivityById = (id: string) => {
    return activities.find(activity => activity.id === id);
  };

  const value: ActivitiesContextType & { loading: boolean; error: string | null } = {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivityById,
    loading,
    error
  };

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivities() {
  const context = useContext(ActivitiesContext);
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivitiesProvider');
  }
  return context;
} 
