// Performance optimization utilities

/**
 * Debounce function để giảm số lần gọi API
 */
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

/**
 * Throttle function để giới hạn tần suất gọi function
 */
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

/**
 * Kiểm tra kết nối mạng
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Lazy load images với intersection observer
 */
export function lazyLoadImages() {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;

  const criticalResources = [
    '/api/auth/me',
    '/api/users',
    '/api/residents'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = resource;
    document.head.appendChild(link);
  });
}

/**
 * Optimize scroll performance
 */
export function optimizeScroll() {
  if (typeof window === 'undefined') return;

  let ticking = false;
  
  function updateScrollPosition() {
    // Thực hiện các tác vụ liên quan đến scroll
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
}

/**
 * Memory cleanup utility
 */
export function cleanupMemory() {
  if (typeof window === 'undefined') return;

  // Clear unused caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('old-') || name.includes('temp-')) {
          caches.delete(name);
        }
      });
    });
  }

  // Force garbage collection if available
  if ('gc' in window) {
    (window as any).gc();
  }
}

/**
 * Performance monitoring
 */
export function monitorPerformance() {
  if (typeof window === 'undefined') return;

  // Monitor Core Web Vitals (simplified version)
  if (typeof window !== 'undefined') {
    // Basic performance monitoring without external dependencies
    console.log('Performance monitoring enabled');
  }

  // Monitor memory usage
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}

/**
 * Performance monitor class for React components
 */
export class PerformanceMonitor {
  private metrics: any = {};
  private observers: any[] = [];

  startMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor FPS
    this.observeFPS();
    
    // Monitor memory
    this.observeMemory();
    
    // Monitor load time
    this.observeLoadTime();
  }

  private observeFPS() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private observeMemory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576);
    }
  }

  private observeLoadTime() {
    if (document.readyState === 'complete') {
      this.metrics.loadTime = performance.now();
    } else {
      window.addEventListener('load', () => {
        this.metrics.loadTime = performance.now();
      });
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export instance
export const performanceMonitor = new PerformanceMonitor();