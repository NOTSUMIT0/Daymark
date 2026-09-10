// IndexedDB Native Driver for Daymark (Phase 1 & 2 Local-First Storage)
import { Task, Note, RoadmapMap, FileItem } from '../types';

const DB_NAME = 'DaymarkLocalDB';
const DB_VERSION = 1;

export interface StorageDataPayload {
  roadmaps: RoadmapMap[];
  tasks: Task[];
  notes: Note[];
  files: FileItem[];
  exportedAt?: string;
  checksum?: string;
}

class DaymarkDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('roadmaps')) {
          db.createObjectStore('roadmaps', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('kv_store')) {
          db.createObjectStore('kv_store', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async setAll<T extends { id: string }>(storeName: string, items: T[]): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();

      items.forEach((item) => store.put(item));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getKV<T>(key: string): Promise<T | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv_store', 'readonly');
      const store = tx.objectStore('kv_store');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? (result.value as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setKV<T>(key: string, value: T): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('kv_store', 'readwrite');
      const store = tx.objectStore('kv_store');
      store.put({ key, value });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async exportFullPayload(): Promise<StorageDataPayload> {
    const [roadmaps, tasks, notes, files] = await Promise.all([
      this.getAll<RoadmapMap>('roadmaps'),
      this.getAll<Task>('tasks'),
      this.getAll<Note>('notes'),
      this.getAll<FileItem>('files')
    ]);

    return {
      roadmaps,
      tasks,
      notes,
      files,
      exportedAt: new Date().toISOString()
    };
  }

  async clearAllDatabaseData(): Promise<void> {
    const db = await this.initDB();
    const storeNames = ['roadmaps', 'tasks', 'notes', 'files', 'kv_store'];
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      storeNames.forEach((name) => {
        if (db.objectStoreNames.contains(name)) {
          tx.objectStore(name).clear();
        }
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async importFullPayload(payload: StorageDataPayload): Promise<void> {
    if (payload.roadmaps && Array.isArray(payload.roadmaps)) {
      await this.setAll('roadmaps', payload.roadmaps);
    }
    if (payload.tasks && Array.isArray(payload.tasks)) {
      await this.setAll('tasks', payload.tasks);
    }
    if (payload.notes && Array.isArray(payload.notes)) {
      await this.setAll('notes', payload.notes);
    }
    if (payload.files && Array.isArray(payload.files)) {
      await this.setAll('files', payload.files);
    }
  }

  async checkStorageHealth(): Promise<{ isHealthy: boolean; recordCount: number; quotaMB?: number }> {
    try {
      const payload = await this.exportFullPayload();
      const totalRecords =
        (payload.roadmaps?.length || 0) +
        (payload.tasks?.length || 0) +
        (payload.notes?.length || 0) +
        (payload.files?.length || 0);

      let quotaMB: number | undefined;
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.usage) {
          quotaMB = Math.round((estimate.usage / (1024 * 1024)) * 100) / 100;
        }
      }

      return { isHealthy: true, recordCount: totalRecords, quotaMB };
    } catch {
      return { isHealthy: false, recordCount: 0 };
    }
  }
}

export const daymarkDB = new DaymarkDB();
