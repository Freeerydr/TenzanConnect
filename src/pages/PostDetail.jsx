import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BackButton from "@/components/BackButton";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import PollWidget from "@/components/PollWidget";
import { Send, MessageSquare, Megaphone, Loader2, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileNames } from "@/hooks/useProfileNames";

const categoryColors = {
  general: "bg-sky-500/15 text-sky-700",
  question: "bg-amber-500/15 text-amber-700",
  roll_report: "bg-rose-500/15 text-rose-700",
  technique: "bg-violet-500/15 text-violet-700",
  event: "bg-emerald-500/15 text-emerald-700",
  poll: "bg-fuchsia-500/15 text-fuchsia-700",
};

function CommentItem({ c, nameFor }) {
  const authorName = nameFor(c.created_by_id, c.author_name);
  return (
    <div className="glass-card px-3.5 py-2.5 rounded-2xl rounded-tl-md">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white text-[10px] font-semibold">
          {authorName?.charAt(0).toUpperCase()}
        </div>
        <span className="text-[11px] font-medium text-foreground">{authorName}</span>
        <span className="text-[10px] text-muted-foreground/70">
          {new Date(c.created_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{c.content}</p>
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { nameFor } = useProfileNames();

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await base44.entities.Post.delete(id);
      navigate("/");
    } catch {
      toast({ title: "Could not delete post", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    Promise.all([
      base44.entities.Post.get(id),
      base44.entities.Comment.filter({ post_id: id }, "created_date", 500),
    ])
      .then(([p, c]) => { setPost(p); setComments(c || []); })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  const submitComment = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const c = await base44.entities.Comment.create({
        content: text.trim(),
        post_id: id,
        author_name: me?.full_name || me?.email || "Anonymous",
      });
      setComments((prev) => [...prev, c]);
      setText("");
      try {
        await base44.entities.Post.update(id, { comments_count: (post.comments_count || 0) + 1 });
      } catch {}
      setPost((p) => (p ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
    } catch {
      toast({ title: "Could not post reply", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const messageAuthor = async () => {
    if (!post?.created_by_id || !me || post.created_by_id === me.id) return;
    try {
      const convos = await base44.entities.Conversation.list("-updated_date", 200);
      const existing = convos.find((c) => c.participant_ids?.includes(post.created_by_id));
      if (existing) { navigate(`/messages/${existing.id}`); return; }
      const convo = await base44.entities.Conversation.create({
        participant_ids: [me.id, post.created_by_id],
        participant_names: [me?.full_name || me?.email || "You", post.author_name],
        last_message: "",
      });
      navigate(`/messages/${convo.id}`);
    } catch {
      toast({ title: "Could not start conversation", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Post not found.</p>
        <Link to="/" className="text-sm text-rose-600 font-medium">Back to feed</Link>
      </div>
    );
  }

  const isMine = me && post.created_by_id === me.id;
  const authorName = nameFor(post.created_by_id, post.author_name);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-rose-50 via-white to-slate-100" />

      <main className="app-main px-3">
        <div className="mx-auto max-w-2xl space-y-4">
          <BackButton to="/" label="Back to Feed" />

          {/* Post */}
          <div className={cn("glass-card p-4 space-y-3", post.is_announcement && "border-amber-300/60 bg-amber-50/60")}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-sm font-semibold">
                {authorName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{authorName}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(post.created_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
              {post.is_announcement && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-full no-select">
                  <Megaphone className="w-3 h-3" /> Announcement
                </span>
              )}
            </div>

            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 w-fit no-select", categoryColors[post.category] || categoryColors.general)}>
              <Tag className="w-2.5 h-2.5" />
              {post.category?.replace("_", " ")}
            </span>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.image_url && (
              <div className="rounded-xl overflow-hidden">
                <Image src={post.image_url} fittingType="fill" className="w-full h-64" />
              </div>
            )}
            {post.category === "poll" && Array.isArray(post.poll_options) && post.poll_options.length > 0 && (
              <PollWidget postId={post.id} options={post.poll_options} meId={me?.id} />
            )}
          </div>

          {/* Message author */}
          {me && post.created_by_id && !isMine && (
            <button
              onClick={messageAuthor}
              className="w-full glass-card p-3 flex items-center justify-center gap-2 text-sm font-medium text-rose-600 hover:bg-rose-500/5 transition-colors no-select"
            >
              <MessageSquare className="w-4 h-4" />
              Message {authorName}
            </button>
          )}

          {isMine && (
            <button
              onClick={deletePost}
              disabled={deleting}
              className="w-full glass-card p-3 flex items-center justify-center gap-2 text-sm font-medium text-rose-600 hover:bg-rose-500/5 transition-colors no-select disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete post
            </button>
          )}

          {/* Replies */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
            </div>
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground/70 py-2">No replies yet — start the conversation.</p>
            )}
            {comments.map((c) => <CommentItem key={c.id} c={c} nameFor={nameFor} />)}
          </div>

          {/* Reply composer */}
          <div className="glass-card p-2.5 flex items-end gap-2 sticky bottom-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32 py-1.5"
            />
            <button
              onClick={submitComment}
              disabled={busy || !text.trim()}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-700 transition-colors no-select shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}