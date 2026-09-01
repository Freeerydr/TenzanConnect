import React from "react";
import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { useProfileNames, formatFeedName } from "@/hooks/useProfileNames";

export default function AnnouncementBanner({ post }) {
  const { nameFor } = useProfileNames();
  const authorName = formatFeedName(nameFor(post.created_by_id, post.author_name));
  return (
    <Link to={`/post/${post.id}`} className="block no-select">
      <div className="glass-card p-3.5 border-amber-300/60 bg-amber-50/70 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Megaphone className="w-4 h-4 text-amber-600" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
            Announcement · {authorName}
          </div>
          <p className="text-sm text-foreground leading-snug mt-0.5 line-clamp-2">{post.content}</p>
        </div>
      </div>
    </Link>
  );
}