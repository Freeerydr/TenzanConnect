import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BeltBadge from "@/components/BeltBadge";
import ProfileAvatar from "@/components/ProfileAvatar";
import ProfileForm from "@/components/ProfileForm";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Award, Pencil, Star, UserPlus, UserCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import SheetSelect from "@/components/SheetSelect";
import { BELTS, BELT_COLOR, beltLabel } from "@/lib/belts";

export default function Members() {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [promos, setPromos] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [users, setUsers] = useState([]);
  const [awarding, setAwarding] = useState(false);
  const [awardForm, setAwardForm] = useState({ user_id: "", belt: "white", stripes: 0, promotion_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [managingAdmins, setManagingAdmins] = useState(false);
  const [roleBusy, setRoleBusy] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    Promise.all([
      base44.entities.Profile.list("-created_date", 200),
      base44.entities.BeltPromotion.list("-promotion_date", 500),
      base44.entities.Connection.list("-created_date", 500),
    ]).then(([p, pr, c]) => { setProfiles(p || []); setPromos(pr || []); setConnections(c || []); }).finally(() => setLoading(false));
  }, []);

  const isAdmin = me?.role === "admin";

  const beltByUser = {};
  promos.forEach((p) => {
    const ex = beltByUser[p.user_id];
    if (!ex || new Date(p.promotion_date) > new Date(ex.promotion_date)) beltByUser[p.user_id] = p;
  });

  const myProfile = profiles.find((p) => p.user_id === me?.id);

  const isFollowing = (uid) => connections.some((c) => c.follower_id === me?.id && c.following_id === uid && c.type === "follow");
  const isFav = (uid) => connections.some((c) => c.follower_id === me?.id && c.following_id === uid && c.type === "favorite");
  const followerCount = (uid) => connections.filter((c) => c.following_id === uid && c.type === "follow").length;

  const saveProfile = async (data) => {
    try {
      if (myProfile) {
        const updated = await base44.entities.Profile.update(myProfile.id, data);
        setProfiles((prev) => prev.map((p) => (p.id === myProfile.id ? updated : p)));
      } else {
        const created = await base44.entities.Profile.create({ ...data, user_id: me.id, user_name: data.user_name || me.full_name || me.email || "Member" });
        setProfiles((prev) => [created, ...prev]);
      }
      setEditing(false);
    } catch { toast({ title: "Could not save profile", variant: "destructive" }); }
  };

  const toggleConn = async (profile, type) => {
    const existing = connections.find((c) => c.follower_id === me.id && c.following_id === profile.user_id && c.type === type);
    try {
      if (existing) {
        await base44.entities.Connection.delete(existing.id);
        setConnections((prev) => prev.filter((c) => c.id !== existing.id));
      } else {
        const c = await base44.entities.Connection.create({
          follower_id: me.id,
          following_id: profile.user_id,
          follower_name: me.full_name || me.email || "Member",
          following_name: profile.user_name,
          type,
        });
        setConnections((prev) => [...prev, c]);
      }
    } catch { toast({ title: "Could not update", variant: "destructive" }); }
  };

  const sendInvite = () => {
    const to = inviteEmail.trim();
    if (!to) { toast({ title: "Enter an email address", variant: "destructive" }); return; }
    const subject = encodeURIComponent("You're invited to Tenzan Connect");
    const body = encodeURIComponent(
      "You've been invited to join Tenzan Connect — the Tenzan Jiu-Jitsu team hub.\n\n" +
      "Open this link on your phone to join the team:\n" +
      "https://tenzan-connect.base44.app/register\n\n" +
      "Tip: tap 'Continue with Google' for the fastest sign-up. " +
      "Once you're in, set up your profile and say hi on the feed!"
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    toast({ title: `Opening your email to ${to}` });
    setInviteEmail("");
    setInviting(false);
  };

  const openAward = async () => {
    if (awarding) { setAwarding(false); return; }
    if (users.length === 0) {
      try { const u = await base44.entities.User.list("-full_name", 200); setUsers(u || []); }
      catch { toast({ title: "Could not load members", variant: "destructive" }); return; }
    }
    setAwarding(true);
  };
  const award = async () => {
    if (!awardForm.user_id) { toast({ title: "Select a member", variant: "destructive" }); return; }
    const user = users.find((u) => u.id === awardForm.user_id);
    try {
      const p = await base44.entities.BeltPromotion.create({
        user_id: awardForm.user_id,
        user_name: user?.full_name || user?.email || "Member",
        belt: awardForm.belt,
        stripes: Number(awardForm.stripes) || 0,
        promotion_date: awardForm.promotion_date,
        notes: awardForm.notes,
      });
      setPromos((prev) => [p, ...prev]);
      setAwardForm({ user_id: "", belt: "white", stripes: 0, promotion_date: new Date().toISOString().slice(0, 10), notes: "" });
      setAwarding(false);
    } catch { toast({ title: "Could not award promotion", variant: "destructive" }); }
  };

  const openManageAdmins = async () => {
    if (managingAdmins) { setManagingAdmins(false); return; }
    if (users.length === 0) {
      try { const u = await base44.entities.User.list("-full_name", 200); setUsers(u || []); }
      catch { toast({ title: "Could not load members", variant: "destructive" }); return; }
    }
    setManagingAdmins(true);
  };

  const toggleAdminRole = async (u) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    setRoleBusy(u.id);
    try {
      await base44.entities.User.update(u.id, { role: newRole });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
      toast({ title: `${u.full_name || u.email || "Member"} is now ${newRole === "admin" ? "an admin" : "a member"}` });
    } catch (e) {
      toast({ title: "Could not update role", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setRoleBusy(null);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground no-select">
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Members</h1>
              <p className="text-sm text-muted-foreground mt-1">Athlete profiles across the Tenzan crew</p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button onClick={() => setInviting((v) => !v)} className={cn("w-11 h-11 rounded-full flex items-center justify-center no-select", inviting ? "bg-foreground text-background" : "bg-foreground/5 text-foreground")} aria-label="Invite member">
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button onClick={openAward} className={cn("w-11 h-11 rounded-full flex items-center justify-center no-select", awarding ? "bg-foreground text-background" : "bg-foreground/5 text-foreground")} aria-label="Award promotion">
                    <Award className="w-5 h-5" />
                  </button>
                  <button onClick={openManageAdmins} className={cn("w-11 h-11 rounded-full flex items-center justify-center no-select", managingAdmins ? "bg-foreground text-background" : "bg-foreground/5 text-foreground")} aria-label="Manage admin roles">
                    <Shield className="w-5 h-5" />
                  </button>
                </>
              )}
              <button onClick={() => setEditing((v) => !v)} className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center no-select" aria-label="Edit your profile">
                <Pencil className="w-5 h-5" />
              </button>
            </div>
          </div>

          {editing ? (
            <ProfileForm initial={myProfile} onSave={saveProfile} onCancel={() => setEditing(false)} />
          ) : myProfile ? (
            <Link to={`/members/${myProfile.id}`} className="glass-card p-4 flex items-center gap-3 hover:bg-foreground/5 transition-colors no-select">
              <ProfileAvatar profile={myProfile} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">You · {myProfile.user_name}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{myProfile.bio || "No bio yet — tap edit to add one."}</div>
              </div>
              <BeltBadge belt={(beltByUser[myProfile.user_id]?.belt) || myProfile.belt} stripes={beltByUser[myProfile.user_id]?.stripes || myProfile.stripes || 0} />
            </Link>
          ) : (
            <button onClick={() => setEditing(true)} className="glass-card p-4 w-full text-left flex items-center gap-3 hover:bg-foreground/5 no-select">
              <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Create your profile</div>
                <div className="text-xs text-muted-foreground">Add a bio and belt so others can find you</div>
              </div>
            </button>
          )}

          {isAdmin && inviting && (
            <div className="glass-card p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invite a member</div>
              <div className="text-[11px] text-muted-foreground -mt-1">We'll open your email app with a link to the team sign-up page. They create their account right here on Tenzan Connect — no separate platform account needed. New members join as regular members; promote them to admin later if needed.</div>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="athlete@email.com" type="email" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <button onClick={sendInvite} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium flex items-center justify-center gap-2 no-select">
                <UserPlus className="w-4 h-4" />
                Send invitation
              </button>
            </div>
          )}

          {isAdmin && awarding && (
            <div className="glass-card p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Award promotion</div>
              <SheetSelect
                value={awardForm.user_id}
                onChange={(v) => setAwardForm((f) => ({ ...f, user_id: v }))}
                options={users.map((u) => ({ value: u.id, label: u.full_name || u.email }))}
                placeholder="Select member…"
                triggerClassName="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 border-none shadow-none"
              />
              <div className="flex gap-2 flex-wrap">
                {BELTS.map((b) => (
                  <button key={b} onClick={() => setAwardForm((f) => ({ ...f, belt: b }))} className={cn("text-[10px] px-2 py-1 rounded-full capitalize border", awardForm.belt === b ? BELT_COLOR[b] : "bg-foreground/5 text-muted-foreground border-transparent")}>{beltLabel(b)}</button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Stripes</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button key={n} onClick={() => setAwardForm((f) => ({ ...f, stripes: n }))} className={cn("w-8 h-8 rounded-full text-xs font-medium", awardForm.stripes === n ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}>{n}</button>
                  ))}
                </div>
              </div>
              <input type="date" value={awardForm.promotion_date} onChange={(e) => setAwardForm((f) => ({ ...f, promotion_date: e.target.value }))} className="text-xs text-muted-foreground bg-foreground/5 rounded-full px-3 py-1 outline-none" />
              <input value={awardForm.notes} onChange={(e) => setAwardForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)" className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none" />
              <button onClick={award} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select">Award promotion</button>
            </div>
          )}

          {isAdmin && managingAdmins && (
            <div className="glass-card p-4 space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin roles</div>
              <div className="text-[11px] text-muted-foreground -mt-1">Promote an existing member to admin — or demote one back to member.</div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-xs text-muted-foreground px-2 py-3">No members yet.</div>
                ) : users.map((u) => {
                  const isMe = u.id === me?.id;
                  const isAdminUser = u.role === "admin";
                  return (
                    <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-xl bg-foreground/5">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{u.full_name || u.email || "Member"}{isMe ? " (you)" : ""}</div>
                        <div className="text-[10px] text-muted-foreground capitalize">{u.role || "user"}</div>
                      </div>
                      <button
                        onClick={() => toggleAdminRole(u)}
                        disabled={isMe || roleBusy === u.id}
                        className={cn("text-xs font-medium px-3 py-1.5 rounded-full no-select disabled:opacity-40 flex items-center gap-1", isAdminUser ? "bg-foreground/10 text-foreground" : "bg-rose-600 text-white")}
                      >
                        {roleBusy === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isAdminUser ? "Demote" : "Make admin"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : profiles.filter((p) => p.user_id !== me?.id).length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-sm text-muted-foreground">No other profiles yet. Invite training partners to join.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {profiles.filter((p) => p.user_id !== me?.id).map((profile) => {
                const belt = beltByUser[profile.user_id];
                const following = isFollowing(profile.user_id);
                const fav = isFav(profile.user_id);
                return (
                  <div key={profile.id} className="glass-card p-3.5 flex items-center gap-3">
                    <Link to={`/members/${profile.id}`} className="shrink-0 no-select">
                      <ProfileAvatar profile={profile} />
                    </Link>
                    <Link to={`/members/${profile.id}`} className="flex-1 min-w-0 no-select">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{profile.user_name}</span>
                        <BeltBadge belt={belt?.belt || profile.belt} stripes={belt?.stripes || profile.stripes || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{profile.bio || "No bio yet"}</p>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{followerCount(profile.user_id)} followers</div>
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleConn(profile, "favorite")}
                        className={cn("w-8 h-8 rounded-full flex items-center justify-center no-select", fav ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground bg-foreground/5")}
                        aria-label="Favorite"
                      >
                        <Star className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => toggleConn(profile, "follow")}
                        className={cn("text-xs font-medium px-3 py-1.5 rounded-full no-select flex items-center gap-1", following ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-600 text-white")}
                      >
                        {following ? <><UserCheck className="w-3 h-3" />Following</> : <><UserPlus className="w-3 h-3" />Follow</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}