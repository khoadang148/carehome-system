interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

class APICache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; 
  private maxSize = 100;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    
    this.cleanup();

    
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}


export const apiCache = new APICache();


export const generateCacheKey = (endpoint: string, params?: any): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramString}`;
};


export const withCache = async <T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  
  const data = await apiCall();
  
  
  apiCache.set(key, data, ttl);
  
  return data;
};


export const prefetch = async <T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
): Promise<void> => {
  if (!apiCache.has(key)) {
    try {
      const data = await apiCall();
      apiCache.set(key, data, ttl);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }
};


export const invalidateCache = (pattern?: string): void => {
  if (!pattern) {
    apiCache.clear();
    return;
  }

  const keys = Array.from(apiCache.getStats().keys);
  keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  });
};


export const cacheMiddleware = {
  before: (key: string) => {
    return apiCache.get(key);
  },
  
  after: (key: string, data: any, ttl?: number) => {
    apiCache.set(key, data, ttl);
  },
  
  error: (key: string) => {
    
    console.warn(`Cache error for key: ${key}`);
  }
};
