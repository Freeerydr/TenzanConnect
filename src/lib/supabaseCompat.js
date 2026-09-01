// Assembles a `base44`-shaped object backed entirely by Supabase, so the rest
// of the app (which imports `base44` from @/api/base44Client) keeps working
// without per-page rewrites.
import { supabase } from "@/lib/supabaseClient";
import { createEntity, createUserEntity } from "@/lib/entityFactory";

const ENTITY_TABLES = {
  Post: "posts",
  Comment: "comments",
  Conversation: "conversations",
  Message: "messages",
  GroupMessage: "group_messages",
  Profile: "profiles",
  JournalEntry: "journal_entries",
  Technique: "techniques",
  Goal: "goals",
  PartnerNote: "partner_notes",
  Roll: "rolls",
  Competition: "competitions",
  BeltPromotion: "belt_promotions",
  Achievement: "achievements",
  WeightLog: "weight_logs",
  Injury: "injuries",
  Attendance: "attendance",
  CheckIn: "check_ins",
  Event: "events",
  EventRSVP: "event_rsvps",
  Connection: "connections",
  PollVote: "poll_votes",
  QuoteOfTheWeek: "quotes_of_the_week",
  TechniqueOfTheWeek: "techniques_of_the_week",
};

const entities = {};
for (const [name, table] of Object.entries(ENTITY_TABLES)) {
  entities[name] = createEntity(table);
}
entities.User = createUserEntity();

const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { status: 401, message: "Not authenticated" };
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role, full_name, email")
      .eq("user_id", user.id)
      .single();
    return {
      id: user.id,
      email: user.email,
      full_name: roleRow?.full_name || user.user_metadata?.full_name || user.email,
      role: roleRow?.role || "user",
    };
  },
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  loginWithProvider(provider, redirectTo) {
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo || window.location.origin },
    });
  },
  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "signup" });
    if (error) throw error;
    return { access_token: data?.session?.access_token };
  },
  setToken() {
    // Supabase manages the session automatically; no-op.
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  },
  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
  async resetPassword({ resetToken, newPassword }) {
    if (resetToken) {
      try { await supabase.auth.exchangeCodeForSession(resetToken); } catch {}
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
    else window.location.reload();
  },
  redirectToLogin(nextUrl) {
    const url = nextUrl ? `/login?returnTo=${encodeURIComponent(nextUrl)}` : "/login";
    window.location.href = url;
  },
  async updateMe(data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { status: 401 };
    if (data.full_name !== undefined) {
      await supabase.from("user_roles").update({ full_name: data.full_name }).eq("user_id", user.id);
    }
  },
};

const users = {
  async inviteUser(email, role = "user") {
    // Inviting requires the service-role admin API, which must run server-side
    // (Supabase Edge Function). The app now uses mailto invites instead.
    throw new Error("inviteUser must be called from a server function; use a mailto invite link instead.");
  },
};

// File storage + AI/email via Supabase Storage and Edge Functions.
const storage = {
  async UploadFile({ file }) {
    const path = `${Date.now()}-${(file?.name || "file").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from("public").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("public").getPublicUrl(path);
    return { file_url: data.publicUrl };
  },
  async UploadPrivateFile({ file }) {
    const path = `${Date.now()}-${(file?.name || "file").replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from("private").upload(path, file);
    if (error) throw error;
    return { file_uri: path };
  },
  async CreateFileSignedUrl({ file_uri, expires_in = 300 }) {
    const { data, error } = await supabase.storage.from("private").createSignedUrl(file_uri, expires_in);
    if (error) throw error;
    return { signed_url: data.signedUrl };
  },
};

async function edgeInvoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

const Core = {
  ...storage,
};

const analytics = {
  track({ eventName, properties }) {
    // No-op; wire to your analytics provider if needed.
  },
};

export const base44 = {
  entities,
  auth,
  users,
  analytics,
  integrations: { Core },
  asServiceRole: { integrations: { Core } },
};