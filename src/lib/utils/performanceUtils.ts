/**
 * Performance utilities for the application
 */

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoize function
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Batch function calls
export function batch<T>(fn: () => T): T {
  return fn();
}

// Request batching
export class RequestBatcher<T, R> {
  private batch: Array<{ params: T; resolve: (result: R) => void; reject: (error: any) => void }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private delay: number;
  private processor: (params: T[]) => Promise<R[]>;

  constructor(
    processor: (params: T[]) => Promise<R[]>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  async add(params: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push({ params, resolve, reject });
      
      if (this.batch.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  private async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      const params = currentBatch.map(item => item.params);
      const results = await this.processor(params);
      
      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error);
      });
    }
  }
}

// Image optimization utilities
export function getOptimizedImageUrl(
  src: string,
  width: number,
  height: number,
  quality: number = 75
): string {
  if (!src) return '';
  
  // If it's already a full URL, return as is
  if (src.startsWith('http')) return src;
  
  // For local images, add Next.js optimization parameters
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: quality.toString(),
  });
  
  return `${src}?${params.toString()}`;
}

// Lazy loading utilities
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    if (!endTime) {
      console.warn(`End mark "${endMark}" not found`);
      return 0;
    }

    const duration = endTime - startTime;
    this.measures.set(name, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance measure "${name}": ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return { used: 0, total: 0, percentage: 0 };
  }

  const memory = (performance as any).memory;
  const used = memory.usedJSHeapSize;
  const total = memory.totalJSHeapSize;
  const percentage = (used / total) * 100;

  return { used, total, percentage };
}

// Bundle size optimization
export function createChunkLoader<T>(
  importFn: () => Promise<{ default: T }>
): () => Promise<T> {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = importFn().then(module => module.default);
    }
    return promise;
  };
}

// Cache utilities
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const imageCache = new LRUCache<string, string>(50);
export const apiCache = new LRUCache<string, any>(100);
