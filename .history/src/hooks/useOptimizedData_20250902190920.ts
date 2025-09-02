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
  enabled?: boolean; // control whether fetching is active
}

const cache = new Map<string, CacheItem<any>>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useOptimizedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseOptimizedDataOptions = {}
) {
  const { ttl = DEFAULT_TTL, prefetch = false, prefetchDelay = 1000, enabled = true } = options;
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
    if (!enabled) return;
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
  }, [key, getCachedData, refetch, enabled]);

  // Prefetch data after delay
  useEffect(() => {
    if (!prefetch || !enabled) return;

    const timer = setTimeout(() => {
      const cachedData = getCachedData(key);
      if (!cachedData) {
        fetchData();
      }
    }, prefetchDelay);

    return () => clearTimeout(timer);
  }, [key, prefetch, prefetchDelay, getCachedData, fetchData, enabled]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Specific hooks using the optimized data system
export function useOptimizedCarePlansAll(options?: UseOptimizedDataOptions) {
  return useOptimizedData('care-plans-all', () => carePlansAPI.getAll(), options);
}

export function useOptimizedResidentsByRole(role?: string, userId?: string, options?: UseOptimizedDataOptions) {
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
        const res = await residentAPI.getAll?.({ limit: 200, fields: 'full_name,name,gender,date_of_birth,avatar,phone,status' });
        return Array.isArray(res) ? res : [];
      } catch (error) {
        return [];
      }
    }
    
    return [];
  }, options);
}

export function useOptimizedRoomTypes(options?: UseOptimizedDataOptions) {
  return useOptimizedData('room-types', () => roomTypesAPI.getAll(), options);
}

export function useOptimizedRooms(options?: UseOptimizedDataOptions) {
  return useOptimizedData('rooms', () => roomsAPI.getAll(), options);
}

export function useOptimizedBeds(options?: UseOptimizedDataOptions) {
  return useOptimizedData('beds', () => bedsAPI.getAll(), options);
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
          const activeAssignments = Array.isArray(assignments) ? assignments : [];
          
          if (activeAssignments.length === 0) {
            return [residentId, { hasAssignment: false, isExpired: false }] as const;
          }
          
          const latestAssignment = activeAssignments[0];
          const endDate = latestAssignment?.end_date || latestAssignment?.endDate;
          
          if (!endDate) {
            return [residentId, { hasAssignment: true, isExpired: false, endDate }] as const;
          }
          
          const now = new Date();
          const end = new Date(endDate);
          const isExpired = end < now;
          
          return [residentId, { hasAssignment: true, isExpired, endDate }] as const;
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


