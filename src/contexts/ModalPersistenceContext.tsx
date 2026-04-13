import { createContext, useContext, useCallback, useRef, type ReactNode } from "react";

/**
 * Global modal persistence store.
 * Stores modal open state + entity IDs + form drafts in sessionStorage
 * so they survive component remounts caused by auth churn / tab switches.
 */

interface ModalEntry {
  modalType: string;
  entityId?: string | null;
  draft?: Record<string, any> | null;
  openedAt: number;
}

interface ModalPersistenceContextType {
  openModal: (key: string, modalType: string, entityId?: string | null) => void;
  closeModal: (key: string) => void;
  getModal: (key: string) => ModalEntry | null;
  isModalOpen: (key: string) => boolean;
  saveDraft: (key: string, draft: Record<string, any>) => void;
  getDraft: (key: string) => Record<string, any> | null;
  clearDraft: (key: string) => void;
}

const STORAGE_KEY = "modal_persistence";

function readStore(): Record<string, ModalEntry> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, ModalEntry>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // sessionStorage full or unavailable
  }
}

const ModalPersistenceContext = createContext<ModalPersistenceContextType | null>(null);

export function ModalPersistenceProvider({ children }: { children: ReactNode }) {
  // Use ref to avoid re-renders on every store change
  const storeRef = useRef<Record<string, ModalEntry>>(readStore());

  const openModal = useCallback((key: string, modalType: string, entityId?: string | null) => {
    const store = readStore();
    store[key] = { modalType, entityId, draft: store[key]?.draft ?? null, openedAt: Date.now() };
    writeStore(store);
    storeRef.current = store;
  }, []);

  const closeModal = useCallback((key: string) => {
    const store = readStore();
    delete store[key];
    writeStore(store);
    storeRef.current = store;
  }, []);

  const getModal = useCallback((key: string): ModalEntry | null => {
    const store = readStore();
    return store[key] ?? null;
  }, []);

  const isModalOpen = useCallback((key: string): boolean => {
    return !!readStore()[key];
  }, []);

  const saveDraft = useCallback((key: string, draft: Record<string, any>) => {
    const store = readStore();
    if (!store[key]) {
      store[key] = { modalType: "draft", openedAt: Date.now(), draft };
    } else {
      store[key].draft = draft;
    }
    writeStore(store);
    storeRef.current = store;
  }, []);

  const getDraft = useCallback((key: string): Record<string, any> | null => {
    return readStore()[key]?.draft ?? null;
  }, []);

  const clearDraft = useCallback((key: string) => {
    const store = readStore();
    if (store[key]) {
      store[key].draft = null;
      writeStore(store);
      storeRef.current = store;
    }
  }, []);

  return (
    <ModalPersistenceContext.Provider value={{ openModal, closeModal, getModal, isModalOpen, saveDraft, getDraft, clearDraft }}>
      {children}
    </ModalPersistenceContext.Provider>
  );
}

export function useModalPersistence() {
  const ctx = useContext(ModalPersistenceContext);
  if (!ctx) throw new Error("useModalPersistence must be used within ModalPersistenceProvider");
  return ctx;
}
