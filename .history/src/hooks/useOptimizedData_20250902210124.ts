"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  carePlansAPI,
  residentAPI,
  roomsAPI,
  bedsAPI,
  roomTypesAPI,
  carePlanAssignmentsAPI
} from '@/lib/api';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface UseOptimizedDataOptions {
  ttl?: number; // Time to live in milliseconds
  prefetch?: boolean;
  prefetchDelay?: number;
}

const cache = new Map<string, CacheItem<any>>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useOptimizedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseOptimizedDataOptions = {}
) {
  const { ttl = DEFAULT_TTL, prefetch = false, prefetchDelay = 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isCacheValid = useCallback((item: CacheItem<T>) => {
    return Date.now() - item.timestamp < item.ttl;
  }, []);

  const getCachedData = useCallback((key: string): T | null => {
    const cached = cache.get(key);
    if (cached && isCacheValid(cached)) {
      return cached.data;
    }
    if (cached) {
      cache.delete(key);
    }
    return null;
  }, [isCacheValid]);

  const setCachedData = useCallback((key: string, data: T, ttl: number) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }, []);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFn();
      
      if (!signal?.aborted) {
        setData(result);
        setCachedData(key, result, ttl);
      }
    } catch (err) {
      if (!signal?.aborted) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [fetchFn, key, setCachedData, ttl]);

  const refetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    return fetchData(abortControllerRef.current.signal);
  }, [fetchData]);

  useEffect(() => {
    // Check cache first
    const cachedData = getCachedData(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    // Fetch data if not cached
    refetch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key, getCachedData, refetch]);

  // Prefetch data after delay
  useEffect(() => {
    if (!prefetch) return;

    const timer = setTimeout(() => {
      const cachedData = getCachedData(key);
      if (!cachedData) {
        fetchData();
      }
    }, prefetchDelay);

    return () => clearTimeout(timer);
  }, [key, prefetch, prefetchDelay, getCachedData, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Specific hooks using the optimized data system
export function useOptimizedCarePlansAll() {
  return useOptimizedData('care-plans-all', () => carePlansAPI.getAll());
}

export function useOptimizedResidentsByRole(role?: string, userId?: string) {
  const key = `residents-${role}-${userId}`;
  
  return useOptimizedData(key, async () => {
    if (role === 'family' && userId) {
      try {
        const res = await residentAPI.getByFamilyMemberId(userId);
        return Array.isArray(res) ? res : (res ? [res] : []);
      } catch (error) {
        return [];
      }
    }
    
    if (role === 'admin' || role === 'staff') {
      try {
        const res = await residentAPI.getAll?.({});
        return Array.isArray(res) ? res : [];
      } catch (error) {
        return [];
      }
    }
    
    return [];
  });
}

export function useOptimizedRoomTypes() {
  return useOptimizedData('room-types', () => roomTypesAPI.getAll());
}

export function useOptimizedRooms() {
  return useOptimizedData('rooms', () => roomsAPI.getAll());
}

export function useOptimizedBeds() {
  return useOptimizedData('beds', () => bedsAPI.getAll());
}

export function useResidentsAssignmentStatus(residents: any[]) {
  const key = `assignments-${residents.map(r => r._id || r.id).join('-')}`;
  
  return useOptimizedData(key, async () => {
    const entries = await Promise.all(
      (residents || []).map(async (r) => {
        const residentId = r._id || r.id;
        if (!residentId) {
          return [null, { hasAssignment: false, isExpired: false }] as const;
        }
        
        try {
          const assignments = await carePlanAssignmentsAPI.getByResidentId(residentId);
          const allAssignments = Array.isArray(assignments) ? assignments : [];
          
          if (allAssignments.length === 0) {
            return [residentId, { hasAssignment: false, isExpired: false }] as const;
          }
          // Prefer active and most recent assignment; treat pending as not blocking
          const normalizeDate = (d: any) => (d ? new Date(d) : null);
          const activeStatuses = new Set(['active', 'room_assigned', 'payment_completed']);
          const cancelledStatuses = new Set(['cancelled', 'canceled', 'rejected', 'void', 'deleted']);

          const valid = allAssignments.filter((a: any) => !cancelledStatuses.has(String(a?.status || '').toLowerCase()));
          const activeList = valid.filter((a: any) => activeStatuses.has(String(a?.status || '').toLowerCase()));
          const chooseFrom = activeList.length ? activeList : valid;

          chooseFrom.sort((a: any, b: any) => {
            const ae = normalizeDate(a?.end_date || a?.endDate)?.getTime() || 0;
            const be = normalizeDate(b?.end_date || b?.endDate)?.getTime() || 0;
            if (be !== ae) return be - ae;
            const as = normalizeDate(a?.start_date || a?.startDate)?.getTime() || 0;
            const bs = normalizeDate(b?.start_date || b?.startDate)?.getTime() || 0;
            return bs - as;
          });

          const chosen = chooseFrom[0];
          const endDate = chosen?.end_date || chosen?.endDate;
          const startDate = chosen?.start_date || chosen?.startDate;
          const status = String(chosen?.status || '').toLowerCase();

          const now = new Date();
          const end = normalizeDate(endDate);
          const start = normalizeDate(startDate);
          const hasActiveStatus = activeStatuses.has(status);
          const inWindow = (!start || start <= now) && (!end || end >= now);

          const isCurrentlyActive = hasActiveStatus && inWindow;
          const isExpired = Boolean(end) && (end as Date) < now;

          if (isCurrentlyActive) {
            return [residentId, { hasAssignment: true, isExpired: false, endDate }] as const;
          }
          if (isExpired) {
            return [residentId, { hasAssignment: true, isExpired: true, endDate }] as const;
          }

          // pending/scheduled -> allow appearing as eligible
          return [residentId, { hasAssignment: false, isExpired: false, endDate }] as const;
        } catch (error) {
          return [residentId, { hasAssignment: false, isExpired: false }] as const;
        }
      })
    );

    const map: Record<string, { hasAssignment: boolean; isExpired: boolean; endDate?: string }> = {};
    for (const [id, status] of entries) {
      if (id) map[id] = status;
    }
    
    return map;
  }, { ttl: 2 * 60 * 1000 }); // 2 minutes cache for assignments
}

// Utility function to clear cache
export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};

// Utility function to get cache stats
export const getCacheStats = () => {
  const now = Date.now();
  const stats = {
    total: cache.size,
    valid: 0,
    expired: 0,
  };

  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp < item.ttl) {
      stats.valid++;
    } else {
      stats.expired++;
      cache.delete(key);
    }
  }

  return stats;
};


