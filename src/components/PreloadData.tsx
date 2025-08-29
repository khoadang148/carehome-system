import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { residentAPI, activitiesAPI } from '@/lib/api';

interface PreloadDataProps {
  enabled?: boolean;
}

export default function PreloadData({ enabled = true }: PreloadDataProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const preloadCriticalData = async () => {
      try {
        await residentAPI.getAll();
        
        // Preload activities data
        await activitiesAPI.getAll();
        
        console.log('Critical data preloaded successfully');
      } catch (error) {
        console.warn('Preload failed:', error);
      }
    };

    const timer = setTimeout(preloadCriticalData, 1000);
    
    return () => clearTimeout(timer);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const preloadRouteData = () => {
      const routes = ['/family', '/admin', '/staff'];
      
      routes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    };

    preloadRouteData();
  }, [enabled]);

  return null;
}
