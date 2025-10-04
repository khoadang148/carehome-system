import { SWRConfiguration } from 'swr';

// SWR Keys for caching
export const swrKeys = {
  residents: () => 'residents',
  resident: (id: string) => `resident-${id}`,
  vitalSigns: (residentId: string) => `vital-signs-${residentId}`,
  careNotes: (residentId: string) => `care-notes-${residentId}`,
  staff: () => 'staff',
  staffAssignments: (residentId: string) => `staff-assignments-${residentId}`,
  activityParticipations: (residentId: string) => `activity-participations-${residentId}`,
  room: (roomId: string) => `room-${roomId}`,
  bedAssignments: (residentId: string) => `bed-assignments-${residentId}`,
  serverDate: () => 'server-date',
};

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute - tăng lên để giảm API calls
  errorRetryCount: 2, // Giảm retry để tránh spam
  errorRetryInterval: 10000, // 10 seconds - tăng interval
  shouldRetryOnError: (error) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    return true;
  },
  onError: (error) => {
    console.error('SWR Error:', error);
  },
  onSuccess: (data, key) => {
    // Chỉ log trong development
    if (process.env.NODE_ENV === 'development') {
      console.log('SWR Success:', key, data);
    }
  },
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    console.log(`SWR Retry ${retryCount} for key: ${key}`, error);
  },
};

// Specific configs for different data types
export const swrConfigs = {
  // For data that changes frequently
  frequent: {
    ...swrConfig,
    dedupingInterval: 30000, // 30 seconds - tăng lên
    refreshInterval: 60000, // 1 minute
  },
  
  // For data that changes rarely
  stable: {
    ...swrConfig,
    dedupingInterval: 600000, // 10 minutes - tăng lên
    refreshInterval: 1800000, // 30 minutes
  },
  
  // For real-time data
  realtime: {
    ...swrConfig,
    dedupingInterval: 10000, // 10 seconds
    refreshInterval: 30000, // 30 seconds - tăng lên
  },
  
  // For user-specific data
  user: {
    ...swrConfig,
    dedupingInterval: 120000, // 2 minutes - tăng lên
    refreshInterval: 300000, // 5 minutes
  },
  
  // For heavy data (residents, rooms, etc.)
  heavy: {
    ...swrConfig,
    dedupingInterval: 300000, // 5 minutes
    refreshInterval: 600000, // 10 minutes
    errorRetryCount: 1, // Chỉ retry 1 lần cho heavy data
  },
};