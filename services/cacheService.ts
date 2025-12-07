
// Simple in-memory cache to mimic SaaS instant-loading behavior
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 Minutes Default TTL

export const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key); // Expired
    return null;
  }

  // console.log(`[Cache Hit] ${key}`);
  return entry.data as T;
};

export const setCache = (key: string, data: any) => {
  // console.log(`[Cache Set] ${key}`);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearCache = () => {
  console.log('[Cache] Cleared all data');
  cache.clear();
};

// Helper to generate consistent keys for complex objects
export const generateKey = (prefix: string, ...args: any[]) => {
  return `${prefix}:${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join('|')}`;
};
