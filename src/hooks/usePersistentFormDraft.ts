import { useCallback, useRef } from "react";
import { useModalPersistence } from "@/contexts/ModalPersistenceContext";

/**
 * Hook that persists form draft values in sessionStorage while a modal is open.
 * - saveDraft: call on every form change to persist current values
 * - getDraft: call on mount to restore previously typed values
 * - clearDraft: call on save success or explicit cancel
 * 
 * Uses a debounce to avoid excessive writes.
 */
export function usePersistentFormDraft(persistKey: string) {
  const { saveDraft, getDraft, clearDraft } = useModalPersistence();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((draft: Record<string, any>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft(persistKey, draft);
    }, 300);
  }, [persistKey, saveDraft]);

  const get = useCallback((): Record<string, any> | null => {
    return getDraft(persistKey);
  }, [persistKey, getDraft]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearDraft(persistKey);
  }, [persistKey, clearDraft]);

  return { saveDraft: save, getDraft: get, clearDraft: clear };
}
