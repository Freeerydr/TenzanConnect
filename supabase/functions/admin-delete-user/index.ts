// Supabase Edge Function — an admin deletes ANOTHER member's account, and
// every row of app data tied to them (posts, attendance, journal entries,
// messages, etc.), not just their auth login.
//
// Invoked from the app as:
//   supabase.functions.invoke("admin-delete-user", { body: { targetUserId } })
//
// NOTE: the data-wipe logic below is intentionally duplicated in
// delete-account's index.ts rather than shared via an import, since the
// Supabase Dashboard's single-file editor doesn't reliably support extra
// files alongside index.ts. If you ever change what "delete everything"
// covers, update it in both files.
//
// Must run server-side: deleting another user's auth.users row (and
// bypassing RLS to clean up their data across every table) requires the
// service_role key, which can never be exposed to the browser.
//
// No secrets need to be set manually — SUPABASE_URL, SUPABASE_ANON_KEY, and
// SUPABASE_SERVICE_ROLE_KEY are provided automatically to every Edge Function.
//
// Deploy with: supabase functions deploy admin-delete-user
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const CREATED_BY_TABLES = [
  "posts", "comments", "conversations", "messages", "group_messages",
  "journal_entries", "techniques", "goals", "partner_notes", "rolls",
  "competitions", "weight_logs", "injuries", "event_rsvps", "poll_votes",
  "quotes_of_the_week", "techniques_of_the_week",
];
const USER_ID_TABLES = [
  "profiles", "belt_promotions", "achievements", "attendance", "check_ins",
];

async function deleteUserCompletely(adminClient: ReturnType<typeof createClient>, userId: string) {
  const errors: string[] = [];

  for (const table of CREATED_BY_TABLES) {
    const { error } = await adminClient.from(table).delete().eq("created_by_id", userId);
    if (error) errors.push(`${table} (created_by_id): ${error.message}`);
  }
  for (const table of USER_ID_TABLES) {
    const { error } = await adminClient.from(table).delete().eq("user_id", userId);
    if (error) errors.push(`${table} (user_id): ${error.message}`);
  }
  const { error: connErr1 } = await adminClient.from("connections").delete().eq("follower_id", userId);
  if (connErr1) errors.push(`connections (follower_id): ${connErr1.message}`);
  const { error: connErr2 } = await adminClient.from("connections").delete().eq("following_id", userId);
  if (connErr2) errors.push(`connections (following_id): ${connErr2.message}`);

  const { error: deleteUserErr } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteUserErr) {
    errors.push(`auth user: ${deleteUserErr.message}`);
    return { success: false as const, error: errors.join("; ") };
  }
  return { success: true as const, warnings: errors.length ? errors : undefined };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  let body: { targetUserId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const targetUserId = body.targetUserId;
  if (!targetUserId) return json({ error: "targetUserId is required" }, 400);

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller) return json({ error: "Not authenticated" }, 401);

  const { data: callerRole } = await callerClient
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .single();
  if (callerRole?.role !== "admin") {
    return json({ error: "Only admins can remove other members." }, 403);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const result = await deleteUserCompletely(adminClient, targetUserId);
  if (!result.success) return json({ error: result.error }, 500);

  return json({ success: true, warnings: result.warnings });
});
