import { Storage } from '@ionic/storage'

export const DOKU_STORAGE_KEY = 'doku_state';
export const DOKU_SCHEMA_VERSION = 1;

export interface PersistedDokuState {
  schemaVersion?: number
  updatedAt?: string
  doku?: any
}

let storageInstance: Storage | null = null;
let storageInitPromise: Promise<Storage> | null = null;

async function getStorage(): Promise<Storage> {
  if (storageInstance) {
    return storageInstance;
  }

  if (!storageInitPromise) {
    const storage = new Storage();
    storageInitPromise = storage.create();
  }

  storageInstance = await storageInitPromise;
  return storageInstance;
}

export async function initStorage(): Promise<void> {
  await getStorage();
}

export async function loadDokuState(): Promise<PersistedDokuState | null> {
  const storage = await getStorage();
  const raw = await storage.get(DOKU_STORAGE_KEY);
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as PersistedDokuState;
}

export async function saveDokuState(payload: PersistedDokuState): Promise<void> {
  const storage = await getStorage();
  await storage.set(DOKU_STORAGE_KEY, payload);
}
