import { useState, useCallback, useEffect } from "react";
import { useModalPersistence } from "@/contexts/ModalPersistenceContext";

/**
 * Hook that manages modal open/close state with sessionStorage persistence.
 * On mount, restores modal state if it was previously open (survives remounts).
 * Only explicit close (cancel/save/X) clears the persisted state.
 */
export function usePersistentModal(persistKey: string) {
  const { openModal, closeModal, getModal } = useModalPersistence();

  // Initialize from persisted state
  const [isOpen, setIsOpen] = useState(() => {
    const entry = getModal(persistKey);
    return !!entry;
  });

  const [entityId, setEntityId] = useState<string | null>(() => {
    const entry = getModal(persistKey);
    return entry?.entityId ?? null;
  });

  // Sync on mount (in case state changed between render and effect)
  useEffect(() => {
    const entry = getModal(persistKey);
    if (entry) {
      setIsOpen(true);
      setEntityId(entry.entityId ?? null);
    }
  }, [persistKey, getModal]);

  const open = useCallback((modalType: string, entId?: string | null) => {
    setEntityId(entId ?? null);
    setIsOpen(true);
    openModal(persistKey, modalType, entId);
  }, [persistKey, openModal]);

  const close = useCallback(() => {
    setIsOpen(false);
    setEntityId(null);
    closeModal(persistKey);
  }, [persistKey, closeModal]);

  // onOpenChange handler that only allows closing via explicit close()
  const guardedOnOpenChange = useCallback((v: boolean) => {
    if (v) return; // opening is handled by open()
    // Block automatic closes — only close() should close
  }, []);

  return { isOpen, entityId, open, close, guardedOnOpenChange };
}
