import { useCallback, useRef, useEffect, useMemo } from "react";
import { useModalPersistence } from "@/contexts/ModalPersistenceContext";

/**
 * Hook that persists form draft values in sessionStorage while a modal is open.
 * - saveDraft: debounced save (300ms) for typed fields
 * - saveDraftNow: immediate save for critical state (selections, tab switches)
 * - getDraft: restore previously saved values
 * - clearDraft: clear on explicit close/save
 *
 * Flushes pending debounced draft on unmount to prevent data loss.
 */
export function usePersistentFormDraft(persistKey: string) {
  const { saveDraft, getDraft, clearDraft } = useModalPersistence();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Record<string, any> | null>(null);

  // Flush any pending debounced draft immediately
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current) {
      saveDraft(persistKey, pendingRef.current);
      pendingRef.current = null;
    }
  }, [persistKey, saveDraft]);

  // Debounced save — good for text input changes
  const save = useCallback((draft: Record<string, any>) => {
    pendingRef.current = draft;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraft(persistKey, draft);
      pendingRef.current = null;
    }, 300);
  }, [persistKey, saveDraft]);

  // Immediate save — use for critical state like checkbox selections
  const saveNow = useCallback((draft: Record<string, any>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
    saveDraft(persistKey, draft);
  }, [persistKey, saveDraft]);

  const get = useCallback((): Record<string, any> | null => {
    return getDraft(persistKey);
  }, [persistKey, getDraft]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
    clearDraft(persistKey);
  }, [persistKey, clearDraft]);

  // Flush on unmount so pending draft is never lost
  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        saveDraft(persistKey, pendingRef.current);
      }
    };
  }, [persistKey, saveDraft]);

  return useMemo(() => ({ saveDraft: save, saveDraftNow: saveNow, getDraft: get, clearDraft: clear, flush }), [save, saveNow, get, clear, flush]);
}
