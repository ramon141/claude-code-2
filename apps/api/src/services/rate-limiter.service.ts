import {BindingKey} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';

export const RATE_LIMITER_BINDING = BindingKey.create<RateLimiterService>('services.RateLimiter');

const MAX_STORE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

type AttemptEntry = {count: number; resetAt: number};

export class RateLimiterService {
  private readonly store = new Map<string, AttemptEntry>();

  constructor() {
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS).unref();
  }

  check(key: string, maxAttempts: number, windowMs: number): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      this.evictIfFull();
      this.store.set(key, {count: 1, resetAt: now + windowMs});
      return;
    }

    entry.count++;
    if (entry.count > maxAttempts) {
      throw new HttpErrors.TooManyRequests('Too many attempts. Try again later.');
    }
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) this.store.delete(key);
    }
  }

  private evictIfFull(): void {
    if (this.store.size < MAX_STORE_SIZE) return;
    const now = Date.now();
    // Tenta remover uma entrada já expirada
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) {
        this.store.delete(key);
        return;
      }
    }
    // Se não há expiradas, remove a mais antiga (primeira da inserção)
    const firstKey = this.store.keys().next().value;
    if (firstKey !== undefined) this.store.delete(firstKey);
  }
}
