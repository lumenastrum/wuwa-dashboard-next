"use client";

import { getSupabase } from "./supabase";

// Since the 2026-07-07 lockdown, `dashboard_profiles` is anon-read-only (RLS).
// Live edits require the owner's Supabase session: one sign-in per browser —
// supabase-js persists the session in localStorage and auto-refreshes it, and
// every subsequent PostgREST call on the shared client carries the JWT.

export async function hasSession(): Promise<boolean> {
  const supa = getSupabase();
  if (!supa) return false;
  const { data } = await supa.auth.getSession();
  return !!data.session;
}

/** Returns null on success, or a human-readable error message. */
export async function signIn(email: string, password: string): Promise<string | null> {
  const supa = getSupabase();
  if (!supa) return "Supabase client unavailable";
  const { error } = await supa.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}
