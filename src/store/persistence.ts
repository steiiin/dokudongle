import { Storage } from '@ionic/storage'

// ############################################################################

export const DOKU_STORAGE_KEY = 'doku_state';
export const DOKU_AUDIT_STORAGE_KEY = 'doku_protocol_audit';
export const DOKU_TEMPORARY_PROTOCOL_STORAGE_KEY = 'doku_temporary_protocol';
export const DOKU_SCHEMA_VERSION = 1;

// ############################################################################

export interface PersistedDokuState {
  schemaVersion?: number
  updatedAt?: string
  lastProtocolResetAt?: string
  lastAutoProtocolResetPromptAt?: string
  doku?: any
}

export interface ProtocolAuditEntry {
  schemaVersion: number
  resetAt: string
  protocolText: string
  [freeformBlock: string]: unknown
}

export interface TemporaryProtocolState {
  schemaVersion: number
  savedAt: string
  doku: unknown
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

export async function loadStoredValue<T>(key: string): Promise<T | null> {
  const storage = await getStorage()
  const value = await storage.get(key)
  return value == null ? null : value as T
}

export async function saveStoredValue<T>(key: string, value: T): Promise<void> {
  const storage = await getStorage()
  await storage.set(key, value)
}

// ############################################################################

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

export async function loadTemporaryProtocolState(): Promise<TemporaryProtocolState | null> {
  const storage = await getStorage()
  const raw = await storage.get(DOKU_TEMPORARY_PROTOCOL_STORAGE_KEY)
  if (!raw || typeof raw !== 'object') {
    return null
  }
  return raw as TemporaryProtocolState
}

export async function saveTemporaryProtocolState(payload: TemporaryProtocolState): Promise<void> {
  const storage = await getStorage()
  await storage.set(DOKU_TEMPORARY_PROTOCOL_STORAGE_KEY, payload)
}

export async function removeTemporaryProtocolState(): Promise<void> {
  const storage = await getStorage()
  await storage.remove(DOKU_TEMPORARY_PROTOCOL_STORAGE_KEY)
}

export async function loadProtocolAuditEntries(): Promise<ProtocolAuditEntry[]> {
  const storage = await getStorage();
  const raw = await storage.get(DOKU_AUDIT_STORAGE_KEY);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(entry => entry && typeof entry === 'object') as ProtocolAuditEntry[];
}

export async function appendProtocolAuditEntry(entry: ProtocolAuditEntry): Promise<void> {
  const storage = await getStorage();
  const entries = await loadProtocolAuditEntries();
  entries.push(entry);
  await storage.set(DOKU_AUDIT_STORAGE_KEY, entries);
}
