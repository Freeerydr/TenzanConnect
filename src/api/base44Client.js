// Drop-in replacement for the Base44 SDK client. Exposes the same `base44`
// surface the app imports everywhere, now backed by Supabase.
import { base44 as supabaseBase44 } from "@/lib/supabaseCompat";

export const base44 = supabaseBase44;