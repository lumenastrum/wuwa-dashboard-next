import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://ayhrqkxdeecybjhmgdoq.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aHJxa3hkZWVjeWJqaG1nZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTI0NjcsImV4cCI6MjA5Mzg2ODQ2N30.GN-y9xEyNfQUVUXCqOGJC5cpN35X7B8PpOlFJPn10A8";
export const SUPABASE_TABLE = "dashboard_profiles";
export const PROFILE_KEY = "andres-wuwa";
export const SAVE_DEBOUNCE_MS = 650;

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  } catch (e) {
    console.error("Supabase client init failed", e);
    return null;
  }
}
