import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

// Prefer the values pasted in supabaseConfig.js; fall back to environment
// variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) if set.
const supabaseUrl = SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Not connected yet. Open src/lib/supabaseConfig.js and paste your Project URL and anon key."
  );
}

export const supabase = createClient(supabaseUrl || "http://localhost", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;