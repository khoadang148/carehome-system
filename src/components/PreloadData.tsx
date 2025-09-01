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
      if (userRole === 'family' && userId) {
        residentAPI.getByFamilyMemberId(userId).catch(() => {});
      } else if (userRole === 'admin' || userRole === 'staff') {
        residentAPI.getAll().catch(() => {});
      }
      
      activitiesAPI.getAll().catch(() => {});
    }, 100);

    return () => clearTimeout(prefetchTimer);
  }, [shouldPrefetchData, userRole, userId]);

  useEffect(() => {
    if (!shouldPrefetchData) return;

    const routePrefetchTimer = setTimeout(() => {
      prefetchRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 200);

    return () => clearTimeout(routePrefetchTimer);
  }, [shouldPrefetchData, prefetchRoutes]);

  return null;
}
