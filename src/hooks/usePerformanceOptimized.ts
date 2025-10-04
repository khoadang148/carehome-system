"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { swrConfigs } from '@/lib/swr-config';

interface PerformanceOptimizedOptions {
  prefetch?: boolean;
  priority?: 'high' | 'medium' | 'low';
  fallbackData?: any;
  onError?: (error: any) => void;
}

/**
 * Hook tối ưu hiệu suất cho data fetching
 * - Prefetch data khi cần thiết
 * - Sử dụng cache thông minh
 * - Giảm thiểu re-renders
 */
export function usePerformanceOptimized<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: PerformanceOptimizedOptions = {}
) {
  const { prefetch = false, priority = 'medium', fallbackData, onError } = options;
  const [isPrefetched, setIsPrefetched] = useState(false);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chọn config dựa trên priority
  const getConfig = useCallback(() => {
    switch (priority) {
      case 'high':
        return swrConfigs.frequent;
      case 'medium':
        return swrConfigs.user;
      case 'low':
        return swrConfigs.stable;
      default:
        return swrConfigs.user;
    }
  }, [priority]);

  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    {
      ...getConfig(),
      fallbackData,
      onError: (error) => {
        console.error(`Performance optimized hook error for key ${key}:`, error);
        onError?.(error);
      },
    }
  );

  // Prefetch logic
  useEffect(() => {
    if (prefetch && key && !isPrefetched) {
      // Delay prefetch để không block initial render
      prefetchTimeoutRef.current = setTimeout(() => {
        mutate();
        setIsPrefetched(true);
      }, 100);
    }

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [prefetch, key, isPrefetched, mutate]);

  return {
    data,
    error,
    isLoading,
    mutate,
    isPrefetched,
  };
}

/**
 * Hook để prefetch multiple data cùng lúc
 */
export function usePrefetchData(keys: Array<{ key: string; fetcher: () => Promise<any> }>) {
  const [prefetchedKeys, setPrefetchedKeys] = useState<Set<string>>(new Set());
  const prefetchPromises = useRef<Map<string, Promise<any>>>(new Map());

  const prefetch = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    if (prefetchedKeys.has(key) || prefetchPromises.current.has(key)) {
      return;
    }

    const promise = fetcher().catch((error) => {
      console.warn(`Prefetch failed for key ${key}:`, error);
      return null;
    });

    prefetchPromises.current.set(key, promise);
    
    try {
      await promise;
      setPrefetchedKeys(prev => new Set([...prev, key]));
    } finally {
      prefetchPromises.current.delete(key);
    }
  }, [prefetchedKeys]);

  useEffect(() => {
    // Prefetch tất cả keys với delay nhỏ giữa các requests
    keys.forEach(({ key, fetcher }, index) => {
      setTimeout(() => {
        prefetch(key, fetcher);
      }, index * 100); // 100ms delay giữa các requests
    });
  }, [keys, prefetch]);

  return {
    prefetchedKeys: Array.from(prefetchedKeys),
    isPrefetched: (key: string) => prefetchedKeys.has(key),
  };
}

/**
 * Hook để debounce API calls
 */
export function useDebouncedAPI<T>(
  key: string | null,
  fetcher: (params: any) => Promise<T>,
  params: any,
  delay: number = 500
) {
  const [debouncedParams, setDebouncedParams] = useState(params);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedParams(params);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [params, delay]);

  return usePerformanceOptimized(
    key && debouncedParams ? `${key}-${JSON.stringify(debouncedParams)}` : null,
    () => fetcher(debouncedParams),
    { priority: 'low' }
  );
}

/**
 * Hook để lazy load data khi component visible
 */
export function useLazyLoad<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '50px',
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  const { data, error, isLoading } = usePerformanceOptimized(
    isVisible ? key : null,
    fetcher,
    { priority: 'low' }
  );

  return {
    data,
    error,
    isLoading,
    elementRef,
    isVisible,
  };
}
