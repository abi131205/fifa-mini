/**
 * @fileoverview Unit tests for the MemoryCache and key generation utilities.
 */
import { MemoryCache, generateDensityCacheKey } from '../utils/cache.js';

describe('In-Memory TTL Caching Mechanism', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache(1); // 1 second TTL
  });

  test('6. Should store and retrieve cached items', () => {
    cache.set('test_key', { text: 'Gemini prediction result' });
    const fetched = cache.get('test_key');
    expect(fetched).toBeDefined();
    expect(fetched.text).toBe('Gemini prediction result');
  });

  test('7. Should return null and clear expired entries after TTL', async () => {
    cache.set('expire_key', 'some response', 0.1); // 100ms TTL
    
    // Retrieve immediately
    expect(cache.get('expire_key')).toBe('some response');

    // Wait 150ms
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(cache.get('expire_key')).toBeNull();
  });

  test('8. Should normalize density states to the nearest 5% to avoid cache misses', () => {
    const stateA = [
      { id: 'gate_1', name: 'Gate 1', density: 31 },
      { id: 'gate_2', name: 'Gate 2', density: 54 }
    ];

    const stateB = [
      { id: 'gate_1', name: 'Gate 1', density: 29 }, // Rounds to 30, same as 31 rounds to 30
      { id: 'gate_2', name: 'Gate 2', density: 56 }  // Rounds to 55, same as 54 rounds to 55
    ];

    const keyA = generateDensityCacheKey(stateA);
    const keyB = generateDensityCacheKey(stateB);
    
    expect(keyA).toBe('gate_1:30|gate_2:55');
    expect(keyA).toBe(keyB); // Identical normalized key avoids redundant Gemini API hits
  });
});
