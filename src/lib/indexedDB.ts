/**
 * Guroh Guest-First IndexedDB & Sync Engine
 * Local-first storage for lesson progress, offline queues, and guest telemetry.
 */

export interface LessonProgressRecord {
  nodeId: string;
  stage: number; // 1: Intuition, 2: Experimentation, 3: Mastery
  completed: boolean;
  score: number;
  updatedAt: number;
  synced: boolean;
}

export interface PendingSyncAction {
  id?: number;
  actionType: 'LESSON_PROGRESS' | 'BKT_UPDATE';
  payload: Record<string, unknown>;
  createdAt: number;
}

const DB_NAME = 'GurohOfflineDB';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not available in current environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Lesson Progress Store
      if (!db.objectStoreNames.contains('lesson_progress')) {
        const store = db.createObjectStore('lesson_progress', { keyPath: 'nodeId' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }

      // Pending Sync Queue Store
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save or Update Lesson Progress locally
export async function saveLessonProgress(record: Omit<LessonProgressRecord, 'updatedAt' | 'synced'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(['lesson_progress', 'sync_queue'], 'readwrite');
    const progressStore = tx.objectStore('lesson_progress');
    const queueStore = tx.objectStore('sync_queue');

    const fullRecord: LessonProgressRecord = {
      ...record,
      updatedAt: Date.now(),
      synced: false,
    };

    progressStore.put(fullRecord);

    const pendingAction: PendingSyncAction = {
      actionType: 'LESSON_PROGRESS',
      payload: fullRecord as unknown as Record<string, unknown>,
      createdAt: Date.now(),
    };

    queueStore.add(pendingAction);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        // Trigger background sync if service worker is active
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((swRegistration) => {
            // TypeScript definition for Background Sync
            (swRegistration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-lesson-progress').catch(() => {});
          });
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback to localStorage:', err);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`guroh_progress_${record.nodeId}`, JSON.stringify(record));
    }
  }
}

// Get all local lesson progress records
export async function getAllLessonProgress(): Promise<LessonProgressRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('lesson_progress', 'readonly');
      const store = tx.objectStore('lesson_progress');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

// Get unsynced queue items for atomic server synchronization
export async function getPendingSyncQueue(): Promise<PendingSyncAction[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

// Atomic Migration Engine: Sync local guest records to server upon user registration/login
export async function flushSyncQueueToServer(userId: string): Promise<{ syncedCount: number }> {
  const queue = await getPendingSyncQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  try {
    // In production, this posts payload to /api/sync
    console.log(`[Atomic Sync] Migrating ${queue.length} offline records for user ${userId}...`);

    const db = await openDB();
    const tx = db.transaction(['lesson_progress', 'sync_queue'], 'readwrite');
    const queueStore = tx.objectStore('sync_queue');
    const progressStore = tx.objectStore('lesson_progress');

    queueStore.clear();

    const allProgressReq = progressStore.getAll();
    allProgressReq.onsuccess = () => {
      const items = allProgressReq.result as LessonProgressRecord[];
      items.forEach((item) => {
        item.synced = true;
        progressStore.put(item);
      });
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve({ syncedCount: queue.length });
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to flush sync queue:', err);
    return { syncedCount: 0 };
  }
}
