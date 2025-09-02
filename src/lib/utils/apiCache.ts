export type CachedEntry<T = any> = {
  expiresAt: number;
  data: T;
  status: number;
  statusText: string;
  headers?: Record<string, string>;
};

const DEFAULT_TTL_MS = 60 * 1000; // 60s default

const memoryCache: Map<string, CachedEntry> = new Map();

const safeNow = () => Date.now();

export function buildCacheKey(baseUrl: string, url: string, params?: any): string {
  const p = params ? JSON.stringify(params) : '';
  return `${baseUrl}::${url}::${p}`;
}

export function getCached<T = any>(key: string): CachedEntry<T> | null {
  const inMem = memoryCache.get(key);
  if (inMem && inMem.expiresAt > safeNow()) return inMem as CachedEntry<T>;

  try {
    const raw = localStorage.getItem(`apiCache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (parsed.expiresAt > safeNow()) {
      // refresh memory
      memoryCache.set(key, parsed);
      return parsed;
    }
    localStorage.removeItem(`apiCache:${key}`);
  } catch {}
  return null;
}

export function setCached<T = any>(key: string, entry: Omit<CachedEntry<T>, 'expiresAt'>, ttlMs: number = DEFAULT_TTL_MS) {
  const final: CachedEntry<T> = { ...entry, expiresAt: safeNow() + ttlMs };
  memoryCache.set(key, final);
  try {
    localStorage.setItem(`apiCache:${key}`, JSON.stringify(final));
  } catch {}
}

export function clearCached(key?: string) {
  if (key) {
    memoryCache.delete(key);
    try { localStorage.removeItem(`apiCache:${key}`); } catch {}
    return;
  }
  memoryCache.clear();
  try {
    const prefix = 'apiCache:';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {}
}
