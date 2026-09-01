import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { base44 } from "@/api/base44Client";
import BeltBadge from "@/components/BeltBadge";
import ProfileAvatar from "@/components/ProfileAvatar";
import ProfileForm from "@/components/ProfileForm";
import AchievementsSection from "@/components/AchievementsSection";
import PostCard from "@/components/PostCard";
import { useToast } from "@/components/ui/use-toast";
import { Star, UserPlus, UserCheck, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MemberProfile() {
  const { id } = useParams();
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [promos, setPromos] = useState([]);
  const [connections, setConnections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    Promise.all([
      base44.entities.Profile.get(id),
      base44.entities.BeltPromotion.list("-promotion_date", 500),
      base44.entities.Connection.list("-created_date", 500),
      base44.entities.Post.list("-created_date", 50),
    ]).then(([p, pr, c, po]) => {
      setProfile(p);
      setPromos(pr || []);
      setConnections(c || []);
      setPosts((po || []).filter((x) => x.author_name === p?.user_name));
    }).catch(() => setProfile(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-slate-100" />
        <main className="app-main px-3">
          <div className="mx-auto max-w-2xl glass-card p-10 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Profile not found.</p>
            <Link to="/members" className="text-sm text-rose-600 font-medium">Back to members</Link>
          </div>
        </main>
      </div>
    );
  }

  const promo = promos
    .filter((p) => p.user_id === profile.user_id)
    .sort((a, b) => new Date(b.promotion_date) - new Date(a.promotion_date))[0];
  const belt = promo?.belt || profile.belt;
  const stripes = promo?.stripes ?? profile.stripes ?? 0;

  const isMe = me?.id === profile.user_id;
  const following = connections.some((c) => c.follower_id === me?.id && c.following_id === profile.user_id && c.type === "follow");
  const fav = connections.some((c) => c.follower_id === me?.id && c.following_id === profile.user_id && c.type === "favorite");
  const followers = connections.filter((c) => c.following_id === profile.user_id && c.type === "follow").length;
  const followingCount = connections.filter((c) => c.follower_id === profile.user_id && c.type === "follow").length;

  const toggleConn = async (type) => {
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

  const saveProfile = async (data) => {
    try {
      const updated = await base44.entities.Profile.update(profile.id, data);
      setProfile(updated);
      setEditing(false);
    } catch { toast({ title: "Could not save profile", variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-slate-100" />
      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/members" label="Back to Members" />

          {editing && isMe ? (
            <ProfileForm initial={profile} onSave={saveProfile} onCancel={() => setEditing(false)} />
          ) : (
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-start gap-4">
                <ProfileAvatar profile={profile} size="w-20 h-20" text="text-2xl" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-foreground">{profile.user_name}</h1>
                  <div className="mt-1.5"><BeltBadge belt={belt} stripes={stripes} /></div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span><span className="font-semibold text-foreground">{followers}</span> followers</span>
                    <span><span className="font-semibold text-foreground">{followingCount}</span> following</span>
                  </div>
                </div>
              </div>

              {profile.bio && <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>}

              {isMe ? (
                <button onClick={() => setEditing(true)} className="w-full py-2.5 rounded-xl glass-card text-sm font-medium text-foreground flex items-center justify-center gap-1.5 no-select">
                  <Pencil className="w-4 h-4" /> Edit your profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleConn("favorite")}
                    className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 no-select", fav ? "bg-amber-500/15 text-amber-700" : "glass-card text-foreground")}
                  >
                    <Star className="w-4 h-4" fill={fav ? "currentColor" : "none"} /> {fav ? "Favorited" : "Favorite"}
                  </button>
                  <button
                    onClick={() => toggleConn("follow")}
                    className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 no-select", following ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-600 text-white")}
                  >
                    {following ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                  </button>
                </div>
              )}
            </div>
          )}

          <AchievementsSection isMe={isMe} />

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2 px-1">Recent posts</h2>
            {posts.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => <PostCard key={p.id} post={p} isMine={me?.id != null && p.created_by_id === me.id} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}