import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Tag, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import PollWidget from "@/components/PollWidget";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useProfileNames, formatFeedName } from "@/hooks/useProfileNames";

const categoryColors = {
  general: "bg-sky-500/15 text-sky-700",
  question: "bg-amber-500/15 text-amber-700",
  roll_report: "bg-rose-500/15 text-rose-700",
  technique: "bg-violet-500/15 text-violet-700",
  event: "bg-emerald-500/15 text-emerald-700",
  poll: "bg-fuchsia-500/15 text-fuchsia-700",
};

export default function PostCard({ post, isMine, me, onDelete }) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { nameFor } = useProfileNames();
  const authorName = formatFeedName(nameFor(post.created_by_id, post.author_name));
  const count = (post.likes_count || 0) + (liked ? 1 : 0);
  const isPoll = post.category === "poll" && Array.isArray(post.poll_options) && post.poll_options.length > 0;

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await base44.entities.Post.delete(post.id);
      onDelete?.(post.id);
    } catch {
      toast({ title: "Could not delete post", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-2.5 max-w-[85%]", isMine && "flex-row-reverse")}>
        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow",
            isMine
              ? "bg-gradient-to-br from-rose-500 to-red-700"
              : "bg-gradient-to-br from-slate-600 to-slate-800"
          )}
        >
          {authorName?.charAt(0).toUpperCase()}
        </div>

        <div className={cn("flex flex-col min-w-0", isMine ? "items-end" : "items-start")}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[120px]">
              {isMine ? "You" : authorName}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {new Date(post.created_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>

          {isPoll ? (
            <div
              className={cn(
                "glass-card px-3.5 py-2.5 rounded-2xl",
                isMine ? "rounded-tr-md bg-rose-500/15 border-rose-200/50" : "rounded-tl-md"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 mb-1.5",
                  categoryColors[post.category] || categoryColors.general
                )}
              >
                <Tag className="w-2.5 h-2.5" />
                {post.category?.replace("_", " ")}
              </span>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-2">{post.content}</p>
              <PollWidget postId={post.id} options={post.poll_options} meId={me?.id} />
            </div>
          ) : (
            <Link to={`/post/${post.id}`} className="block no-select">
              <div
                className={cn(
                  "glass-card px-3.5 py-2.5 rounded-2xl",
                  isMine ? "rounded-tr-md bg-rose-500/15 border-rose-200/50" : "rounded-tl-md"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 mb-1.5",
                    categoryColors[post.category] || categoryColors.general
                  )}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {post.category?.replace("_", " ")}
                </span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
                {post.image_url && (
                  <div className="mt-2 rounded-xl overflow-hidden">
                    <Image src={post.image_url} fittingType="fill" className="w-full h-48" />
                  </div>
                )}
              </div>
            </Link>
          )}

          <div className={cn("flex items-center gap-3 mt-1 px-1", isMine && "flex-row-reverse")}>
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-500 transition-colors no-select"
            >
              <Heart className={cn("w-3.5 h-3.5", liked && "fill-rose-500 text-rose-500")} />
              {count}
            </button>
            <Link
              to={`/post/${post.id}`}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors no-select"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {post.comments_count || 0}
            </Link>
            {isMine && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-rose-500 transition-colors no-select disabled:opacity-50"
                aria-label="Delete post"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}