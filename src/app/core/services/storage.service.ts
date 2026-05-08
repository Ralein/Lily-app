import { Injectable } from '@angular/core';

const STORAGE_PREFIX = 'lily_';
const STORAGE_VERSION_KEY = 'lily_version';
const CURRENT_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class StorageService {
  constructor() {
    this.checkMigration();
  }

  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`[Lily Storage] Failed to save "${key}":`, e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }

  has(key: string): boolean {
    return localStorage.getItem(STORAGE_PREFIX + key) !== null;
  }

  exportAll(): string {
    const data: Record<string, unknown> = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => {
      try {
        data[k.replace(STORAGE_PREFIX, '')] = JSON.parse(localStorage.getItem(k)!);
      } catch {
        data[k.replace(STORAGE_PREFIX, '')] = localStorage.getItem(k);
      }
    });
    return JSON.stringify(data, null, 2);
  }

  importAll(json: string): boolean {
    try {
      const data = JSON.parse(json) as Record<string, unknown>;
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });
      return true;
    } catch {
      return false;
    }
  }

  private checkMigration(): void {
    const version = this.get<number>('version', 0);
    if (version < CURRENT_VERSION) {
      // Future migration logic goes here
      this.set('version', CURRENT_VERSION);
    }
  }
}
