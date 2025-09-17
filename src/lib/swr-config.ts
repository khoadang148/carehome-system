import { SWRConfiguration } from 'swr';
import { fetcher } from './api';

// SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  refreshInterval: 0, // Disable automatic refresh, use manual triggers
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  loadingTimeout: 10000,
  onError: (error) => {
    console.error('SWR Error:', error);
  },
  // Disable verbose success logging to avoid console spam and potential perf issues
  // onSuccess: (data, key) => {
  //   console.log('SWR Success:', key, data);
  // },
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Don't retry on 404 or 403
    if (error.status === 404 || error.status === 403) return;
    
    // Retry up to 3 times
    if (retryCount >= 3) return;
    
    // Retry after 5 seconds
    setTimeout(() => revalidate({ retryCount }), 5000);
  },
};

// SWR keys factory
export const swrKeys = {
  // Residents
  residents: () => 'residents',
  resident: (id: string) => `resident-${id}`,
  
  // Vital Signs
  vitalSigns: (residentId: string) => `vital-signs-${residentId}`,
  vitalSignsHistory: (residentId: string) => `vital-signs-history-${residentId}`,
  
  // Care Notes
  careNotes: (residentId: string) => `care-notes-${residentId}`,
  
  // Staff
  staff: () => 'staff',
  staffAssignments: (residentId: string) => `staff-assignments-${residentId}`,
  
  // Activities
  activities: (residentId: string) => `activities-${residentId}`,
  activityParticipations: (residentId: string) => `activity-participations-${residentId}`,
  
  // Rooms
  room: (roomId: string) => `room-${roomId}`,
  
  // Bed Assignments
  bedAssignments: (residentId: string) => `bed-assignments-${residentId}`,
  
  // Server date
  serverDate: () => 'server-date',
} as const;
