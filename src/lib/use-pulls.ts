"use client";

import { useEffect, useState } from "react";
import { getSupabase, SUPABASE_TABLE } from "./supabase";
import {
  type ConveneStore,
  emptyStore,
  PULL_PROFILE_KEY,
} from "./convene-types";
import { summarize, type ConveneSummary } from "./convene-analytics";

export type PullStatus = "loading" | "ready" | "empty" | "error";

/**
 * Read-only loader for the convene pull history (`andres-wuwa-pulls` row).
 * Pull data is written by the `npm run convene` CLI, never edited in-browser,
 * so this just fetches once on mount. Separate from useData() by design — the
 * pull blob is its own Supabase row and shouldn't ride the roster's auto-save.
 */
export function usePulls() {
  const [store, setStore] = useState<ConveneStore | null>(null);
  const [status, setStatus] = useState<PullStatus>("loading");

  useEffect(() => {
    let mounted = true;
    const supa = getSupabase();
    (async () => {
      if (!supa) {
        if (mounted) setStatus("error");
        return;
      }
      const { data: row, error } = await supa
        .from(SUPABASE_TABLE)
        .select("data")
        .eq("profile", PULL_PROFILE_KEY)
        .maybeSingle();
      if (!mounted) return;
      if (error) {
        console.error("Pull history load failed", error);
        setStatus("error");
        return;
      }
      if (!row?.data) {
        setStore(emptyStore());
        setStatus("empty");
        return;
      }
      setStore(row.data as ConveneStore);
      setStatus("ready");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const summary: ConveneSummary | null = store ? summarize(store) : null;
  return { store, summary, status };
}
