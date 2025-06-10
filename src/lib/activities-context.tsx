"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Activity {
  id: number;
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
}

interface ActivitiesContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'participants' | 'createdAt'>) => void;
  updateActivity: (id: number, activity: Partial<Activity>) => void;
  deleteActivity: (id: number) => void;
  getActivityById: (id: number) => Activity | undefined;
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

// Initial mock data
const INITIAL_ACTIVITIES: Activity[] = [
  { 
    id: 1, 
    name: 'Tập thể dục buổi sáng', 
    description: 'Các bài tập kéo giãn và vận động nhẹ nhàng để cải thiện khả năng vận động',
    category: 'physical', 
    location: 'Phòng sinh hoạt chung',
    startTime: '08:00',
    endTime: '08:45',
    duration: 45,
    capacity: 20,
    participants: 18,
    facilitator: 'David Wilson',
    date: '2024-01-15',
    status: 'Đã lên lịch',
    level: 'Dễ',
    recurring: 'daily',
    createdAt: '2024-01-10T08:00:00Z'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    description: 'Hoạt động vẽ tranh và làm đồ thủ công sáng tạo',
    category: 'creative', 
    location: 'Phòng hoạt động',
    startTime: '10:30',
    endTime: '11:30',
    duration: 60,
    capacity: 15,
    participants: 12,
    facilitator: 'Emily Parker',
    date: '2024-01-15',
    status: 'Đang diễn ra',
    level: 'Trung bình',
    recurring: 'weekly',
    createdAt: '2024-01-10T10:00:00Z'
  },
  { 
    id: 3, 
    name: 'Trò chơi bài cùng bạn', 
    description: 'Trò chơi bài và cờ để giao lưu giữa các cư dân',
    category: 'social', 
    location: 'Phòng giải trí',
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    capacity: 20,
    participants: 15,
    facilitator: 'Sarah Thompson',
    date: '2024-01-16',
    status: 'Đã lên lịch',
    level: 'Dễ',
    recurring: 'weekly',
    createdAt: '2024-01-10T12:00:00Z'
  },
  { 
    id: 4, 
    name: 'Trị liệu âm nhạc', 
    description: 'Buổi âm nhạc trị liệu với các hoạt động hát theo và chơi nhạc cụ',
    category: 'therapy', 
    location: 'Khu vườn',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    capacity: 30,
    participants: 25,
    facilitator: 'Robert Johnson',
    date: '2024-01-17',
    status: 'Đã lên lịch',
    level: 'Dễ',
    recurring: 'weekly',
    createdAt: '2024-01-10T14:00:00Z'
  },
  { 
    id: 5, 
    name: 'Trò chơi trí nhớ', 
    description: 'Các trò chơi nhận thức để cải thiện trí nhớ và sự nhanh nhạy tinh thần',
    category: 'cognitive', 
    location: 'Phòng hoạt động',
    startTime: '11:00',
    endTime: '11:45',
    duration: 45,
    capacity: 12,
    participants: 10,
    facilitator: 'David Wilson',
    date: '2024-01-18',
    status: 'Đã lên lịch',
    level: 'Trung bình',
    recurring: 'biweekly',
    createdAt: '2024-01-10T16:00:00Z'
  },
  { 
    id: 6, 
    name: 'Yoga buổi chiều', 
    description: 'Lớp yoga nhẹ nhàng cho người cao tuổi',
    category: 'physical', 
    location: 'Khu vườn',
    startTime: '16:00',
    endTime: '17:00',
    duration: 60,
    capacity: 15,
    participants: 12,
    facilitator: 'Emily Parker',
    date: '2024-01-19',
    status: 'Đã lên lịch',
    level: 'Dễ',
    recurring: 'weekly',
    createdAt: '2024-01-10T18:00:00Z'
  }
];

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load activities from localStorage on mount
  useEffect(() => {
    const savedActivities = localStorage.getItem('activities');
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities));
      } catch (error) {
        console.error('Error loading activities from localStorage:', error);
        setActivities(INITIAL_ACTIVITIES);
      }
    } else {
      setActivities(INITIAL_ACTIVITIES);
    }
  }, []);

  // Save activities to localStorage whenever activities change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('activities', JSON.stringify(activities));
    }
  }, [activities]);

  const addActivity = (activityData: Omit<Activity, 'id' | 'participants' | 'createdAt'>) => {
    const newActivity: Activity = {
      ...activityData,
      id: Date.now(), // Simple ID generation
      participants: 0, // Start with 0 participants
      createdAt: new Date().toISOString()
    };
    
    setActivities(prev => [newActivity, ...prev]); // Add to beginning of array
  };

  const updateActivity = (id: number, updates: Partial<Activity>) => {
    setActivities(prev => 
      prev.map(activity => 
        activity.id === id ? { ...activity, ...updates } : activity
      )
    );
  };

  const deleteActivity = (id: number) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
  };

  const getActivityById = (id: number) => {
    return activities.find(activity => activity.id === id);
  };

  const value: ActivitiesContextType = {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivityById
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