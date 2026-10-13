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

export interface GuestProfileRecord {
  guestId: string;
  archetype: 'young_learner' | 'independent';
  learnerName?: string;
  dobMonth?: string;
  dobYear?: string;
  sessionLimitMinutes?: number;
  reportChannel?: 'email' | 'whatsapp' | 'telegram' | 'wechat';
  reportFrequency?: 'daily' | 'weekly' | 'monthly';
  reportTarget?: string;
  diagnosticCompleted?: boolean;
  diagnosticScore?: number;
  parentPin?: string;
  membershipTier?: 'free' | 'scholar_club';
  membershipActivatedAt?: number;
  totalTimeSpentSeconds?: number;
  createdAt: number;
  updatedAt: number;
}

export interface PendingSyncAction {
  id?: number;
  actionType: 'LESSON_PROGRESS' | 'BKT_UPDATE';
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface UserSession {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  token?: string;
  provider: 'magic_link' | 'password' | 'google';
  role?: 'student' | 'guardian' | 'creator';
  createdAt: number;
}

export interface ClientDAGNode {
  id: string;
  title: string;
  statement: string;
  domain: string;
  grade: string;
  subject: string;
  kc_types: string[];
  stage_hint: {
    shu: number;
    ha: number;
    ri: number;
  };
  primary_stage: 'SHU' | 'HA' | 'RI';
  color: string;
  x: number;
  y: number;
  prerequisites: string[];
  outgoing_edges: string[];
}

export interface ClientDAGEdge {
  from: string;
  to: string;
  kind: string;
  rule_id: string;
  rationale?: string;
}

export interface ClientCurriculumDAG {
  version: string;
  extracted_at: string;
  source_db: string;
  gateway_node_id: string;
  summary: {
    total_nodes: number;
    total_edges: number;
    root_nodes_count: number;
    is_acyclic: boolean;
  };
  nodes: ClientDAGNode[];
  edges: ClientDAGEdge[];
}

const DB_NAME = 'GurohOfflineDB';
const DB_VERSION = 3;

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

      // Guest User Profile Store
      if (!db.objectStoreNames.contains('guest_profile')) {
        db.createObjectStore('guest_profile', { keyPath: 'guestId' });
      }

      // Curriculum DAG Offline Cache Store (Flow 3 / Flow 6)
      if (!db.objectStoreNames.contains('curriculum_dag')) {
        db.createObjectStore('curriculum_dag', { keyPath: 'id' });
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

// Get or create ephemeral guest UUID
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest_ssr_placeholder';
  let guestId = localStorage.getItem('guroh_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('guroh_guest_id', guestId);
  }
  return guestId;
}

// Save or Update Guest Profile locally
export async function saveGuestProfile(profile: Partial<GuestProfileRecord>): Promise<GuestProfileRecord> {
  const guestId = profile.guestId || getOrCreateGuestId();
  const existing = await getGuestProfile(guestId);
  const updated: GuestProfileRecord = {
    guestId,
    archetype: profile.archetype || existing?.archetype || 'young_learner',
    learnerName: profile.learnerName ?? existing?.learnerName,
    dobMonth: profile.dobMonth ?? existing?.dobMonth,
    dobYear: profile.dobYear ?? existing?.dobYear,
    sessionLimitMinutes: profile.sessionLimitMinutes ?? existing?.sessionLimitMinutes ?? 45,
    reportChannel: profile.reportChannel ?? existing?.reportChannel ?? 'email',
    reportFrequency: profile.reportFrequency ?? existing?.reportFrequency ?? 'weekly',
    reportTarget: profile.reportTarget ?? existing?.reportTarget,
    diagnosticCompleted: profile.diagnosticCompleted ?? existing?.diagnosticCompleted ?? false,
    diagnosticScore: profile.diagnosticScore ?? existing?.diagnosticScore ?? 0,
    parentPin: profile.parentPin ?? existing?.parentPin ?? '1234',
    membershipTier: profile.membershipTier ?? existing?.membershipTier ?? 'free',
    membershipActivatedAt: profile.membershipActivatedAt ?? existing?.membershipActivatedAt,
    totalTimeSpentSeconds: profile.totalTimeSpentSeconds ?? existing?.totalTimeSpentSeconds ?? 1800,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction('guest_profile', 'readwrite');
    const store = tx.objectStore('guest_profile');
    store.put(updated);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Fallback saving guest profile to localStorage:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(`guroh_profile_${guestId}`, JSON.stringify(updated));
  }
  return updated;
}

// Retrieve Guest Profile locally
export async function getGuestProfile(guestId?: string): Promise<GuestProfileRecord | null> {
  const targetId = guestId || (typeof window !== 'undefined' ? localStorage.getItem('guroh_guest_id') || '' : '');
  if (!targetId) return null;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('guest_profile', 'readonly');
      const store = tx.objectStore('guest_profile');
      const req = store.get(targetId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`guroh_profile_${targetId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

// Atomic Migration Engine: Sync local guest records to server upon user registration/login
export async function flushSyncQueueToServer(
  userId: string,
  authToken?: string
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  const queue = await getPendingSyncQueue();
  const progressItems = await getAllLessonProgress();
  const guestId = getOrCreateGuestId();
  const profile = await getGuestProfile(guestId);

  // If there are no pending sync queue actions and no unsynced progress, exit cleanly
  const hasUnsyncedProgress = progressItems.some((p) => !p.synced);
  if (queue.length === 0 && !hasUnsyncedProgress) {
    return { success: true, syncedCount: 0 };
  }

  const payload = {
    guestId,
    userId,
    profile: profile || undefined,
    progressItems,
    syncQueue: queue,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = authToken || (typeof window !== "undefined" ? localStorage.getItem("vidya_auth_token") : null);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (userId) {
    headers["Authorization"] = `Bearer ${userId}`;
  }

  try {
    console.log(`[Atomic Sync] Dispatching ${queue.length} queue items & ${progressItems.length} progress nodes for user ${userId}...`);

    const response = await fetch("/api/sync/guest-to-user", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Atomic Sync] Server responded with status ${response.status}:`, errorText);
      // On network failure or 5xx/4xx: retain queue items for Flow 6 background sync retry
      return {
        success: false,
        syncedCount: 0,
        error: `Server rejected sync with status ${response.status}`,
      };
    }

    const data = await response.json();
    console.log("[Atomic Sync] Ingestion transaction confirmed by backend:", data);

    // On HTTP 200 / success confirmation: clear sync_queue and tag local lesson_progress as synced: true
    const db = await openDB();
    const tx = db.transaction(["lesson_progress", "sync_queue"], "readwrite");
    const queueStore = tx.objectStore("sync_queue");
    const progressStore = tx.objectStore("lesson_progress");

    // Clear committed sync queue items
    queueStore.clear();

    // Mark all existing progress records as synced: true
    const allProgressReq = progressStore.getAll();
    allProgressReq.onsuccess = () => {
      const items = allProgressReq.result as LessonProgressRecord[];
      items.forEach((item) => {
        item.synced = true;
        progressStore.put(item);
      });
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        const totalProcessed = queue.length > 0 ? queue.length : progressItems.length;
        resolve({ success: true, syncedCount: totalProcessed });
      };
      tx.onerror = () => {
        console.error("[Atomic Sync] IndexedDB commit failed after server 200:", tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("[Atomic Sync] Network unreachable or offline. Retaining queue for background retry:", err);
    return {
      success: false,
      syncedCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Flow 3: Curriculum DAG Ingestion & Offline IndexedDB Caching
// ---------------------------------------------------------------------------

/**
 * Cache complete curriculum DAG into IndexedDB.
 */
export async function cacheCurriculumDAG(dag: ClientCurriculumDAG): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('curriculum_dag', 'readwrite');
    const store = tx.objectStore('curriculum_dag');

    // Store entire DAG under master key
    store.put({ id: 'master_dag', ...dag, cachedAt: Date.now() });

    // Store individual nodes for indexed random access
    for (const node of dag.nodes) {
      store.put({ ...node, id: `node_${node.id}`, originalId: node.id, cachedAt: Date.now() });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] Successfully cached Curriculum DAG (${dag.nodes.length} nodes, ${dag.edges.length} edges)`);
        resolve();
      };
      tx.onerror = () => {
        console.error('[IndexedDB] Failed to cache Curriculum DAG:', tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Fallback storing DAG metadata to localStorage:', err);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vidya_dag_summary', JSON.stringify({
          gateway: dag.gateway_node_id,
          totalNodes: dag.summary.total_nodes,
          cachedAt: Date.now()
        }));
      } catch {}
    }
  }
}

/**
 * Retrieve cached curriculum DAG from IndexedDB.
 */
export async function getCachedCurriculumDAG(): Promise<ClientCurriculumDAG | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('curriculum_dag', 'readonly');
      const store = tx.objectStore('curriculum_dag');
      const req = store.get('master_dag');
      req.onsuccess = () => {
        if (req.result) {
          const { id, cachedAt, ...dag } = req.result;
          resolve(dag as ClientCurriculumDAG);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieve a specific node from the cached curriculum DAG.
 */
export async function getCachedDAGNode(nodeId: string): Promise<ClientDAGNode | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('curriculum_dag', 'readonly');
      const store = tx.objectStore('curriculum_dag');
      const req = store.get(`node_${nodeId}`);
      req.onsuccess = () => {
        if (req.result) {
          const { id, cachedAt, originalId, ...node } = req.result;
          resolve({ id: originalId || id.replace(/^node_/, ''), ...node } as ClientDAGNode);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
