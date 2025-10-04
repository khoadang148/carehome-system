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
  dedupingInterval: 30000, // 30 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5 seconds
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
    console.log('SWR Success:', key, data);
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
    dedupingInterval: 10000, // 10 seconds
  },
  
  // For data that changes rarely
  stable: {
    ...swrConfig,
    dedupingInterval: 300000, // 5 minutes
  },
  
  // For real-time data
  realtime: {
    ...swrConfig,
    dedupingInterval: 5000, // 5 seconds
    refreshInterval: 10000, // 10 seconds
  },
  
  // For user-specific data
  user: {
    ...swrConfig,
    dedupingInterval: 60000, // 1 minute
  },
};