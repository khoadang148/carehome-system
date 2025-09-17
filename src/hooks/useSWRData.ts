import useSWR, { mutate } from 'swr';
import { swrKeys } from '@/lib/swr-config';
import { fetcher } from '@/lib/api';
import { 
  residentAPI, 
  vitalSignsAPI, 
  careNotesAPI, 
  staffAPI, 
  staffAssignmentsAPI, 
  activityParticipationsAPI, 
  activitiesAPI, 
  roomsAPI, 
  bedAssignmentsAPI 
} from '@/lib/api';

// Hook for residents data
export const useResidents = () => {
  const { data, error, isLoading, mutate: mutateResidents } = useSWR(
    swrKeys.residents(),
    () => residentAPI.getAll(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minute - residents don't change often
    }
  );

  return {
    residents: data || [],
    error,
    isLoading,
    mutate: mutateResidents,
  };
};

// Hook for single resident data
export const useResident = (residentId: string) => {
  const { data, error, isLoading, mutate: mutateResident } = useSWR(
    residentId ? swrKeys.resident(residentId) : null,
    () => residentAPI.getById(residentId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    resident: data,
    error,
    isLoading,
    mutate: mutateResident,
  };
};

// Hook for vital signs data
export const useVitalSigns = (residentId: string) => {
  const { data, error, isLoading, mutate: mutateVitalSigns } = useSWR(
    residentId ? swrKeys.vitalSigns(residentId) : null,
    () => vitalSignsAPI.getByResidentId(residentId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds for vital signs - more frequent updates
    }
  );

  const latestVitalSigns = data && Array.isArray(data) && data.length > 0 
    ? data.sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0]
    : null;

  const vitalSignsHistory = data && Array.isArray(data) 
    ? data.sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    : [];

  return {
    vitalSigns: latestVitalSigns,
    vitalSignsHistory,
    error,
    isLoading,
    mutate: mutateVitalSigns,
  };
};

// Hook for care notes data
export const useCareNotes = (residentId: string) => {
  const { data, error, isLoading, mutate: mutateCareNotes } = useSWR(
    residentId ? swrKeys.careNotes(residentId) : null,
    () => careNotesAPI.getAll({ resident_id: residentId }),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
    }
  );

  return {
    careNotes: data || [],
    error,
    isLoading,
    mutate: mutateCareNotes,
  };
};

// Hook for staff data
export const useStaff = () => {
  const { data, error, isLoading, mutate: mutateStaff } = useSWR(
    swrKeys.staff(),
    () => staffAPI.getAll(),
    {
      revalidateOnFocus: false, // Staff data doesn't change often
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutes
    }
  );

  return {
    staff: data || [],
    error,
    isLoading,
    mutate: mutateStaff,
  };
};

// Hook for staff assignments
export const useStaffAssignments = (residentId: string) => {
  const { data, error, isLoading, mutate: mutateStaffAssignments } = useSWR(
    residentId ? swrKeys.staffAssignments(residentId) : null,
    () => staffAssignmentsAPI.getByResident(residentId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
    }
  );

  const processedStaff = data && Array.isArray(data) && data.length > 0 
    ? data.map((item: any) => {
        const staff = item.staff || item;
        const assignment = item.assignment || {};
        
        return {
          staff_id: {
            _id: staff.id || staff._id,
            id: staff.id || staff._id,
            full_name: staff.full_name,
            fullName: staff.full_name,
            email: staff.email,
            phone: staff.phone,
            position: staff.position || 'Nhân viên chăm sóc',
            avatar: staff.avatar,
            role: staff.role
          },
          ...assignment
        };
      })
    : [];

  return {
    assignedStaff: processedStaff,
    error,
    isLoading,
    mutate: mutateStaffAssignments,
  };
};

// Hook for activities data
export const useActivities = (residentId: string, selectedDate?: string) => {
  const { data, error, isLoading, mutate: mutateActivities } = useSWR(
    residentId ? swrKeys.activityParticipations(residentId) : null,
    () => activityParticipationsAPI.getByResidentId(residentId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minute for activities
    }
  );

  const processActivities = (activitiesData: any[], date?: string) => {
    if (!activitiesData || !Array.isArray(activitiesData)) return [];
    
    const grouped: Record<string, any[]> = {};
    activitiesData.forEach((item) => {
      const itemDate = item.date?.slice(0, 10);
      if (!itemDate) return;
      if (!grouped[itemDate]) grouped[itemDate] = [];
      grouped[itemDate].push(item);
    });

    const targetDate = date || new Date().toISOString().slice(0, 10);
    const dateActivities = grouped[targetDate] || [];
    
    const uniqueActivities = dateActivities.reduce((acc: any[], current: any) => {
      const activityId = current.activity_id?._id || current.activity_id;
      const activityName = current.activity_id?.activity_name;
      
      if (!activityName || activityName === '---') {
        return acc;
      }
      
      const existingIndex = acc.findIndex(item =>
        (item.activity_id?._id || item.activity_id) === activityId
      );

      if (existingIndex === -1) {
        acc.push(current);
      } else {
        const existing = acc[existingIndex];
        const existingTime = new Date(existing.updated_at || existing.created_at || 0);
        const currentTime = new Date(current.updated_at || current.created_at || 0);

        if (currentTime > existingTime) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, []);

    return uniqueActivities;
  };

  const activities = processActivities(data || [], selectedDate);
  const activityHistoryDates = data && Array.isArray(data) 
    ? Object.keys(
        (data as any[]).reduce((grouped: Record<string, any[]>, item) => {
          const date = item.date?.slice(0, 10);
          if (!date) return grouped;
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(item);
          return grouped;
        }, {})
      ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    : [];

  return {
    activities,
    activityHistoryDates,
    error,
    isLoading,
    mutate: mutateActivities,
  };
};

// Hook for room data
export const useRoom = (roomId: string) => {
  const { data, error, isLoading, mutate: mutateRoom } = useSWR(
    roomId ? swrKeys.room(roomId) : null,
    () => roomsAPI.getById(roomId),
    {
      revalidateOnFocus: false, // Room data doesn't change often
      revalidateOnReconnect: true,
    }
  );

  return {
    room: data,
    roomNumber: data?.room_number || 'Chưa hoàn tất đăng kí',
    error,
    isLoading,
    mutate: mutateRoom,
  };
};

// Hook for bed assignments
export const useBedAssignments = (residentId: string) => {
  const { data, error, isLoading, mutate: mutateBedAssignments } = useSWR(
    residentId ? swrKeys.bedAssignments(residentId) : null,
    () => bedAssignmentsAPI.getByResidentId(residentId),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minute
    }
  );

  const bedAssignment = data && Array.isArray(data) 
    ? data.find((a: any) => a.bed_id?.room_id)
    : null;

  const roomId = bedAssignment?.bed_id?.room_id?._id || bedAssignment?.bed_id?.room_id;

  return {
    bedAssignments: data || [],
    bedAssignment,
    roomId,
    error,
    isLoading,
    mutate: mutateBedAssignments,
  };
};

// Hook for server date
export const useServerDate = () => {
  const { data, error, isLoading, mutate: mutateServerDate } = useSWR(
    swrKeys.serverDate(),
    async () => {
      const response = await fetch('/api/current-date', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return data.date;
      }
      return new Date().toISOString().slice(0, 10);
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000, // 1 minute
    }
  );

  return {
    serverDate: data || new Date().toISOString().slice(0, 10),
    error,
    isLoading,
    mutate: mutateServerDate,
  };
};

// Global mutate functions for cross-component updates
export const mutateAll = {
  residents: () => mutate(swrKeys.residents()),
  resident: (residentId: string) => mutate(swrKeys.resident(residentId)),
  vitalSigns: (residentId: string) => mutate(swrKeys.vitalSigns(residentId)),
  careNotes: (residentId: string) => mutate(swrKeys.careNotes(residentId)),
  staff: () => mutate(swrKeys.staff()),
  staffAssignments: (residentId: string) => mutate(swrKeys.staffAssignments(residentId)),
  activities: (residentId: string) => mutate(swrKeys.activityParticipations(residentId)),
  room: (roomId: string) => mutate(swrKeys.room(roomId)),
  bedAssignments: (residentId: string) => mutate(swrKeys.bedAssignments(residentId)),
  serverDate: () => mutate(swrKeys.serverDate()),
  
  // Mutate all data for a specific resident
  residentData: (residentId: string) => {
    mutate(swrKeys.resident(residentId));
    mutate(swrKeys.vitalSigns(residentId));
    mutate(swrKeys.careNotes(residentId));
    mutate(swrKeys.staffAssignments(residentId));
    mutate(swrKeys.activityParticipations(residentId));
    mutate(swrKeys.bedAssignments(residentId));
  },
  
  // Mutate all data
  all: () => {
    mutate(swrKeys.residents());
    mutate(swrKeys.staff());
    mutate(swrKeys.serverDate());
  },
};
