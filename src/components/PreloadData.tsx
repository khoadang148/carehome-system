'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { residentAPI, activitiesAPI } from '@/lib/api';

export default function PreloadData() {
  const { user } = useAuth();

  const userRole = user?.role;
  const userId = user?.id;

  const shouldPrefetchData = useMemo(() => {
    return user && userRole && userId;
  }, [user, userRole, userId]);

  const prefetchRoutes = useMemo(() => {
    if (!userRole) return [];
    
    const baseRoutes = ['/profile', '/settings'];
    
    switch (userRole) {
      case 'admin':
        return [...baseRoutes, '/admin', '/admin/residents', '/admin/staff-management', '/admin/financial-reports', '/admin/ai-recommendations'];
      case 'staff':
        return [...baseRoutes, '/staff', '/staff/residents', '/staff/assessments', '/staff/photos', '/staff/activities'];
      case 'family':
        return [...baseRoutes, '/family', '/family/photos', '/family/services', '/family/finance', '/family/messages', '/family/schedule-visit/history'];
      default:
        return baseRoutes;
    }
  }, [userRole]);

  useEffect(() => {
    if (!shouldPrefetchData) return;

    const prefetchTimer = setTimeout(() => {
      try {
        if (userRole === 'family' && userId) {
          residentAPI.getByFamilyMemberId(userId).catch((error) => {
            console.debug('Prefetch residents failed:', error);
          });
        } else if (userRole === 'admin' || userRole === 'staff') {
          residentAPI.getAll().catch((error) => {
            console.debug('Prefetch all residents failed:', error);
          });
        }
        
        activitiesAPI.getAll().catch((error) => {
          console.debug('Prefetch activities failed:', error);
        });
      } catch (error) {
        console.debug('Prefetch data error:', error);
      }
    }, 100);

    return () => clearTimeout(prefetchTimer);
  }, [shouldPrefetchData, userRole, userId]);

  useEffect(() => {
    if (!shouldPrefetchData) return;

    const routePrefetchTimer = setTimeout(() => {
      prefetchRoutes.forEach(route => {
        try {
          // Only prefetch if we're in the browser and route is valid
          if (typeof window !== 'undefined' && route && route.startsWith('/')) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = route;
            link.onerror = () => {
              // Silently handle prefetch errors
              console.debug(`Prefetch failed for route: ${route}`);
            };
            document.head.appendChild(link);
          }
        } catch (error) {
          // Silently handle any prefetch errors
          console.debug(`Prefetch error for route ${route}:`, error);
        }
      });
    }, 200);

    return () => clearTimeout(routePrefetchTimer);
  }, [shouldPrefetchData, prefetchRoutes]);

  return null;
}
