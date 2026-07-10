/**
 * @fileoverview TTL Cache utility to store Gemini API responses based on crowd state keys.
 */

/**
 * In-memory TTL Cache implementation.
 */
export class MemoryCache {
  /**
   * @param {number} defaultTtlSeconds Default Time-to-Live in seconds.
   */
  constructor(defaultTtlSeconds = 30) {
    /**
     * @private
     * @type {Map<string, {value: *, expiresAt: number}>}
     */
    this.cache = new Map();
    /**
     * @private
     * @type {number}
     */
    this.defaultTtl = defaultTtlSeconds * 1000;
  }

  /**
   * Stores a value in the cache with a specified TTL.
   * @param {string} key The unique cache key.
   * @param {*} value The data to cache.
   * @param {number|null} [ttlSeconds=null] TTL override in seconds.
   */
  set(key, value, ttlSeconds = null) {
    const ttl = ttlSeconds !== null ? ttlSeconds * 1000 : this.defaultTtl;
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieves a cached value if it exists and has not expired.
   * @param {string} key The unique cache key.
   * @returns {*|null} The cached value, or null if expired/missing.
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Clears all items from the cache.
   */
  clear() {
    this.cache.clear();
  }
}

/**
 * Generates a normalized cache key from current gates data.
 * It rounds each density percentage to the nearest 5% to avoid cache misses
 * caused by negligible numerical fluctuations.
 * @param {Array<{id: string, name: string, density: number}>} gates Gates list with current densities.
 * @returns {string} Normalized cache key.
 */
export function generateDensityCacheKey(gates) {
  if (!Array.isArray(gates)) return '';
  return gates
    .map(g => {
      const roundedDensity = Math.round((g.density || 0) / 5) * 5;
      return `${g.id || g.name}:${roundedDensity}`;
    })
    .sort()
    .join('|');
}

export const geminiCache = new MemoryCache(30);
