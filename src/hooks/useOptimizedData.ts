"use client";

import { useCallback, useState } from 'react';
import { 
  carePlansAPI,
  residentAPI,
  roomsAPI,
  bedsAPI,
  roomTypesAPI,
  carePlanAssignmentsAPI
} from '@/lib/api';

type FetchResult<T> = {
  data: T | null;
  fetch: () => Promise<T | null>;
};

export function useOptimizedCarePlansAll(): FetchResult<any[]> {
  const [data, setData] = useState<any[] | null>(null);

  const fetch = useCallback(async () => {
    try {
      const result = await carePlansAPI.getAll();
      setData(Array.isArray(result) ? result : []);
      return Array.isArray(result) ? result : [];
    } catch (e) {
      setData([]);
      return [];
    }
  }, []);

  return { data, fetch };
}

export function useOptimizedResidentsByRole(role?: string, userId?: string): FetchResult<any[]> {
  const [data, setData] = useState<any[] | null>(null);

  const fetch = useCallback(async () => {
    try {
      let result: any[] = [];
      if (role === 'family' && userId) {
        const res = await residentAPI.getByFamilyMemberId(userId);
        result = Array.isArray(res) ? res : (res ? [res] : []);
      } else {
        const res = await residentAPI.getAll?.({});
        result = Array.isArray(res) ? res : [];
      }
      setData(result);
      return result;
    } catch (e) {
      setData([]);
      return [];
    }
  }, [role, userId]);

  return { data, fetch };
}

export function useOptimizedRoomTypes(): FetchResult<any[]> {
  const [data, setData] = useState<any[] | null>(null);
  const fetch = useCallback(async () => {
    try {
      const result = await roomTypesAPI.getAll();
      setData(Array.isArray(result) ? result : []);
      return Array.isArray(result) ? result : [];
    } catch {
      setData([]);
      return [];
    }
  }, []);
  return { data, fetch };
}

export function useOptimizedRooms(): FetchResult<any[]> {
  const [data, setData] = useState<any[] | null>(null);
  const fetch = useCallback(async () => {
    try {
      const result = await roomsAPI.getAll();
      setData(Array.isArray(result) ? result : []);
      return Array.isArray(result) ? result : [];
    } catch {
      setData([]);
      return [];
    }
  }, []);
  return { data, fetch };
}

export function useOptimizedBeds(): FetchResult<any[]> {
  const [data, setData] = useState<any[] | null>(null);
  const fetch = useCallback(async () => {
    try {
      const result = await bedsAPI.getAll();
      setData(Array.isArray(result) ? result : []);
      return Array.isArray(result) ? result : [];
    } catch {
      setData([]);
      return [];
    }
  }, []);
  return { data, fetch };
}

export function useResidentsAssignmentStatus(residents: any[]): FetchResult<Record<string, { hasAssignment: boolean; isExpired: boolean; endDate?: string }>> {
  const [data, setData] = useState<Record<string, { hasAssignment: boolean; isExpired: boolean; endDate?: string }> | null>(null);

  const fetch = useCallback(async () => {
    console.log('🔄 Starting to fetch assignment status for', residents.length, 'residents');
    console.log('🔐 Authentication check - localStorage token:', typeof window !== 'undefined' ? localStorage.getItem('access_token')?.substring(0, 20) + '...' : 'no window');
    
    try {
      try {
        const allAssignments = await carePlanAssignmentsAPI.getAll();
        console.log('🧪 TEST: All care plan assignments:', allAssignments);
        console.log('🧪 TEST: Total assignments in system:', Array.isArray(allAssignments) ? allAssignments.length : 'not an array');
        if (Array.isArray(allAssignments) && allAssignments.length > 0) {
          console.log('🧪 TEST: Sample assignment:', allAssignments[0]);
          console.log('🧪 TEST: Sample assignment end_date:', allAssignments[0]?.end_date);
        }
      } catch (error: any) {
        console.error('🧪 TEST: Error getting all assignments:', error);
      }
      
      const entries = await Promise.all(
        (residents || []).map(async (r) => {
          const residentId = r._id || r.id;
          if (!residentId) {
            console.log('❌ No resident ID found for resident:', r);
            return [null, { hasAssignment: false, isExpired: false }] as const;
          }
          
          console.log(`🔍 Checking assignments for resident: ${r.full_name || r.name} (${residentId})`);
          
          try {
            const assignments = await carePlanAssignmentsAPI.getByResidentId(residentId);
            console.log(`📋 Raw assignments for ${r.full_name || r.name}:`, assignments);
            console.log(`📋 Raw assignments type:`, typeof assignments);
            console.log(`📋 Raw assignments length:`, Array.isArray(assignments) ? assignments.length : 'not an array');
            
            const activeAssignments = Array.isArray(assignments) ? assignments : [];
            console.log(`📊 Active assignments count for ${r.full_name || r.name}:`, activeAssignments.length);
            
            if (activeAssignments.length === 0) {
              console.log(`✅ ${r.full_name || r.name} - No assignments found`);
              return [residentId, { hasAssignment: false, isExpired: false }] as const;
            }
            
            const latestAssignment = activeAssignments[0]; 
            console.log(`📅 Latest assignment for ${r.full_name || r.name}:`, latestAssignment);
            console.log(`📅 Latest assignment keys:`, Object.keys(latestAssignment || {}));
            console.log(`📅 Latest assignment end_date field:`, latestAssignment?.end_date);
            console.log(`📅 Latest assignment endDate field:`, latestAssignment?.endDate);
            
            const endDate = latestAssignment?.end_date || latestAssignment?.endDate;
            console.log(`📅 End date for ${r.full_name || r.name}:`, endDate);
            console.log(`📅 End date type:`, typeof endDate);
            console.log(`📅 End date value:`, endDate);
            
            if (!endDate) {
              console.log(`⚠️ ${r.full_name || r.name} - No end date found, treating as active`);
              return [residentId, { hasAssignment: true, isExpired: false, endDate }] as const;
            }
            
            const now = new Date();
            const end = new Date(endDate);
            const isExpired = end < now;
            
            console.log(`📅 Date parsing debug for ${r.full_name || r.name}:`, {
              originalEndDate: endDate,
              parsedEnd: end,
              parsedEndISO: end.toISOString(),
              now: now,
              nowISO: now.toISOString(),
              isExpired: isExpired,
              isValidEnd: !isNaN(end.getTime()),
              isValidNow: !isNaN(now.getTime())
            });
            
            if (residentId === 'test-expired') {
              const testEndDate = '2024-01-01'; 
              const testEnd = new Date(testEndDate);
              const testIsExpired = testEnd < now;
              console.log('🧪 TEST: Hardcoded expired date test:', {
                testEndDate,
                testEnd: testEnd.toISOString(),
                now: now.toISOString(),
                testIsExpired
              });
            }
            
            console.log(`⏰ Date comparison for ${r.full_name || r.name}:`, {
              now: now.toISOString(),
              end: end.toISOString(),
              endDate: endDate,
              isExpired: isExpired
            });
            
            if (isExpired) {
              console.log(`🔴 ${r.full_name || r.name} - EXPIRED on ${endDate}`);
            } else {
              console.log(`🟢 ${r.full_name || r.name} - ACTIVE until ${endDate}`);
            }
            
            return [residentId, { hasAssignment: true, isExpired, endDate }] as const;
          } catch (error: any) {
            console.error(`❌ Error checking assignments for ${r.full_name || r.name}:`, error);
            console.error(`❌ Error details:`, {
              message: error.message,
              status: error.response?.status,
              data: error.response?.data,
              url: error.config?.url
            });
            return [residentId, { hasAssignment: false, isExpired: false }] as const;
          }
        })
      );

      const map: Record<string, { hasAssignment: boolean; isExpired: boolean; endDate?: string }> = {};
      for (const [id, status] of entries) {
        if (id) map[id] = status;
      }
      
      
      const totalResidents = residents.length;
      const residentsWithAssignments = Object.values(map).filter(s => s.hasAssignment).length;
      const expiredResidents = Object.values(map).filter(s => s.hasAssignment && s.isExpired).length;
      const residentsWithoutAssignments = Object.values(map).filter(s => !s.hasAssignment).length;
      
      console.log('📊 Assignment Status Summary:', {
        totalResidents,
        residentsWithAssignments,
        expiredResidents,
        residentsWithoutAssignments,
        expiredResidentIds: Object.entries(map)
          .filter(([_, status]) => status.hasAssignment && status.isExpired)
          .map(([id, status]) => ({ id, endDate: status.endDate }))
      });
      
      console.log('📊 Final assignment status map:', map);
      setData(map);
      return map;
    } catch (e) {
      console.error('❌ Error in useResidentsAssignmentStatus:', e);
      setData({});
      return {};
    }
  }, [residents]);

  return { data, fetch };
}


