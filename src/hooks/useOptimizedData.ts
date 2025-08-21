"use client";

import { useCallback, useState } from 'react';
import { 
  carePlansAPI,
  residentAPI,
  roomsAPI,
  bedsAPI,
  roomTypesAPI,
  bedAssignmentsAPI
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
        // Admin/Staff: lấy toàn bộ residents
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

// Trả về map residentId -> boolean (đã có assignment)
export function useResidentsAssignmentStatus(residents: any[]): FetchResult<Record<string, boolean>> {
  const [data, setData] = useState<Record<string, boolean> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const entries = await Promise.all(
        (residents || []).map(async (r) => {
          const residentId = r._id || r.id;
          if (!residentId) return [null, false] as const;
          try {
            const assignments = await bedAssignmentsAPI.getByResidentId(residentId);
            const has = Array.isArray(assignments) ? assignments.length > 0 : !!assignments?.length;
            return [residentId, has] as const;
          } catch {
            return [residentId, false] as const;
          }
        })
      );

      const map: Record<string, boolean> = {};
      for (const [id, has] of entries) {
        if (id) map[id] = has;
      }
      setData(map);
      return map;
    } catch (e) {
      setData({});
      return {};
    }
  }, [residents]);

  return { data, fetch };
}


