import { createClient } from "@supabase/supabase-js";
import { assertServerEnv, env } from "@/lib/env";

export function getSupabaseAdmin() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      "Supabase admin client is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getSupabaseBrowserConfig() {
  return {
    url: assertServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: assertServerEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
