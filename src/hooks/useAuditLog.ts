import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAuditLog() {
  const logAction = useCallback(
    async (
      action: string,
      entityType: string,
      entityId?: string,
      details?: Record<string, unknown>
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("audit_logs").insert([{
        user_id: user.id,
        user_email: user.email ?? "",
        action,
        entity_type: entityType,
        entity_id: entityId ?? null,
        details: (details ?? {}) as Record<string, unknown>,
      }] as any);
    },
    []
  );

  return { logAction };
}
