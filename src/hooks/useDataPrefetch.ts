"use client";

import { useEffect, useRef, useCallback } from 'react';
import { mutate } from 'swr';
import { swrKeys } from '@/lib/swr-config';
import { 
  residentAPI, 
  staffAPI, 
  roomsAPI, 
  activitiesAPI,
  carePlansAPI,
  roomTypesAPI 
} from '@/lib/api';

interface PrefetchConfig {
  enabled: boolean;
  delay: number;
  priority: 'high' | 'medium' | 'low';
}

const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  delay: 1000,
  priority: 'medium',
};

/**
 * Hook để prefetch data dựa trên user role và current page
 */
export function useDataPrefetch(userRole: string, currentPath: string) {
  const prefetchedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    if (prefetchedRef.current.has(key)) return;
    
    try {
      await fetcher();
      prefetchedRef.current.add(key);
    } catch (error) {
      console.warn(`Prefetch failed for ${key}:`, error);
    }
  }, []);

  const prefetchByRole = useCallback((role: string) => {
    const prefetchTasks: Array<{ key: string; fetcher: () => Promise<any> }> = [];

    // Common data for all roles
    prefetchTasks.push(
      { key: 'server-date', fetcher: () => fetch('/api/current-date').then(r => r.json()) }
    );

    // Role-specific prefetch
    switch (role) {
      case 'admin':
        prefetchTasks.push(
          { key: 'residents', fetcher: () => residentAPI.getAll() },
          { key: 'staff', fetcher: () => staffAPI.getAll() },
          { key: 'rooms', fetcher: () => roomsAPI.getAll() },
          { key: 'activities', fetcher: () => activitiesAPI.getAll() },
          { key: 'care-plans', fetcher: () => carePlansAPI.getAll() },
          { key: 'room-types', fetcher: () => roomTypesAPI.getAll() }
        );
        break;
      
      case 'staff':
        prefetchTasks.push(
          { key: 'residents', fetcher: () => residentAPI.getAll() },
          { key: 'activities', fetcher: () => activitiesAPI.getAll() }
        );
        break;
      
      case 'family':
        prefetchTasks.push(
          { key: 'activities', fetcher: () => activitiesAPI.getAll() }
        );
        break;
    }

    return prefetchTasks;
  }, []);

  const prefetchByPath = useCallback((path: string) => {
    const prefetchTasks: Array<{ key: string; fetcher: () => Promise<any> }> = [];

    if (path.includes('/residents')) {
      prefetchTasks.push(
        { key: 'residents', fetcher: () => residentAPI.getAll() }
      );
    }

    if (path.includes('/staff')) {
      prefetchTasks.push(
        { key: 'staff', fetcher: () => staffAPI.getAll() }
      );
    }

    if (path.includes('/rooms')) {
      prefetchTasks.push(
        { key: 'rooms', fetcher: () => roomsAPI.getAll() },
        { key: 'room-types', fetcher: () => roomTypesAPI.getAll() }
      );
    }

    if (path.includes('/activities')) {
      prefetchTasks.push(
        { key: 'activities', fetcher: () => activitiesAPI.getAll() }
      );
    }

    return prefetchTasks;
  }, []);

  useEffect(() => {
    if (!userRole) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Prefetch data after delay
    timeoutRef.current = setTimeout(() => {
      const roleTasks = prefetchByRole(userRole);
      const pathTasks = prefetchByPath(currentPath);
      
      // Combine and deduplicate tasks
      const allTasks = [...roleTasks, ...pathTasks];
      const uniqueTasks = allTasks.filter((task, index, self) => 
        index === self.findIndex(t => t.key === task.key)
      );

      // Execute prefetch tasks with staggered delays
      uniqueTasks.forEach((task, index) => {
        setTimeout(() => {
          prefetchData(task.key, task.fetcher);
        }, index * 200); // 200ms delay between tasks
      });
    }, DEFAULT_CONFIG.delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userRole, currentPath, prefetchByRole, prefetchByPath, prefetchData]);

  return {
    prefetchedKeys: Array.from(prefetchedRef.current),
    isPrefetched: (key: string) => prefetchedRef.current.has(key),
  };
}

/**
 * Hook để prefetch data khi hover vào link
 */
export function useHoverPrefetch() {
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchOnHover = useCallback((href: string) => {
    if (prefetchedRef.current.has(href)) return;

    // Map href to data that should be prefetched
    const prefetchMap: Record<string, Array<{ key: string; fetcher: () => Promise<any> }>> = {
      '/admin/residents': [
        { key: 'residents', fetcher: () => residentAPI.getAll() }
      ],
      '/admin/staff': [
        { key: 'staff', fetcher: () => staffAPI.getAll() }
      ],
      '/admin/rooms': [
        { key: 'rooms', fetcher: () => roomsAPI.getAll() },
        { key: 'room-types', fetcher: () => roomTypesAPI.getAll() }
      ],
      '/admin/activities': [
        { key: 'activities', fetcher: () => activitiesAPI.getAll() }
      ],
    };

    const tasks = prefetchMap[href] || [];
    tasks.forEach(({ key, fetcher }) => {
      prefetchData(key, fetcher);
    });

    prefetchedRef.current.add(href);
  }, []);

  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    if (prefetchedRef.current.has(key)) return;
    
    try {
      await fetcher();
      prefetchedRef.current.add(key);
    } catch (error) {
      console.warn(`Hover prefetch failed for ${key}:`, error);
    }
  }, []);

  return { prefetchOnHover };
}

/**
 * Hook để prefetch data khi component sắp được mount
 */
export function useComponentPrefetch(componentName: string, dependencies: any[] = []) {
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (prefetchedRef.current.has(componentName)) return;

    const prefetchMap: Record<string, Array<{ key: string; fetcher: () => Promise<any> }>> = {
      'ResidentList': [
        { key: 'residents', fetcher: () => residentAPI.getAll() }
      ],
      'StaffList': [
        { key: 'staff', fetcher: () => staffAPI.getAll() }
      ],
      'RoomList': [
        { key: 'rooms', fetcher: () => roomsAPI.getAll() },
        { key: 'room-types', fetcher: () => roomTypesAPI.getAll() }
      ],
      'ActivityList': [
        { key: 'activities', fetcher: () => activitiesAPI.getAll() }
      ],
    };

    const tasks = prefetchMap[componentName] || [];
    tasks.forEach(({ key, fetcher }) => {
      prefetchData(key, fetcher);
    });

    prefetchedRef.current.add(componentName);
  }, [componentName, ...dependencies]);

  const prefetchData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    if (prefetchedRef.current.has(key)) return;
    
    try {
      await fetcher();
      prefetchedRef.current.add(key);
    } catch (error) {
      console.warn(`Component prefetch failed for ${key}:`, error);
    }
  }, []);

  return { isPrefetched: (key: string) => prefetchedRef.current.has(key) };
}
