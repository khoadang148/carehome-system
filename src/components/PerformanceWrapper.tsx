"use client";

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDataPrefetch } from '@/hooks/useDataPrefetch';
import { performanceMonitor } from '@/lib/utils/performanceUtils';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  userRole?: string;
  componentName?: string;
  enablePrefetch?: boolean;
  enableMonitoring?: boolean;
}

export default function PerformanceWrapper({
  children,
  userRole,
  componentName,
  enablePrefetch = true,
  enableMonitoring = process.env.NODE_ENV === 'development',
}: PerformanceWrapperProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  // Performance monitoring
  useEffect(() => {
    if (enableMonitoring) {
      startTimeRef.current = performance.now();
      performanceMonitor.mark(`${componentName || 'component'}-mount-start`);
    }
  }, [componentName, enableMonitoring]);

  // Intersection observer for visibility tracking
  useEffect(() => {
    if (!wrapperRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          if (enableMonitoring) {
            performanceMonitor.mark(`${componentName || 'component'}-visible`);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, [isVisible, componentName, enableMonitoring]);

  // Data prefetching
  useDataPrefetch(userRole || '', pathname);

  // Performance measurement on unmount
  useEffect(() => {
    return () => {
      if (enableMonitoring && startTimeRef.current > 0) {
        performanceMonitor.measure(
          `${componentName || 'component'}-lifetime`,
          `${componentName || 'component'}-mount-start`
        );
      }
    };
  }, [componentName, enableMonitoring]);

  return (
    <div ref={wrapperRef} className="performance-wrapper">
      {children}
    </div>
  );
}

// Higher-order component for performance optimization
export function withPerformanceOptimization<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    componentName?: string;
    enablePrefetch?: boolean;
    enableMonitoring?: boolean;
  } = {}
) {
  const OptimizedComponent = (props: P & { userRole?: string }) => {
    const { userRole, ...restProps } = props;
    
    return (
      <PerformanceWrapper
        userRole={userRole}
        componentName={options.componentName || WrappedComponent.displayName || WrappedComponent.name}
        enablePrefetch={options.enablePrefetch}
        enableMonitoring={options.enableMonitoring}
      >
        <WrappedComponent {...(restProps as P)} />
      </PerformanceWrapper>
    );
  };

  OptimizedComponent.displayName = `withPerformanceOptimization(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return OptimizedComponent;
}

// Hook for performance monitoring
export function usePerformanceMonitoring(componentName: string) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      const allMeasures = performanceMonitor.getAllMeasures();
      setMetrics(allMeasures);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const mark = (name: string) => {
    performanceMonitor.mark(`${componentName}-${name}`);
  };

  const measure = (name: string, startMark: string, endMark?: string) => {
    return performanceMonitor.measure(
      `${componentName}-${name}`,
      `${componentName}-${startMark}`,
      endMark ? `${componentName}-${endMark}` : undefined
    );
  };

  return { metrics, mark, measure };
}
