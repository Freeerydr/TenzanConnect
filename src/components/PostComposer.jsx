import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, Send, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

const baseCategories = [
  { value: "general", label: "General" },
  { value: "question", label: "Question" },
  { value: "event", label: "Event" },
];

export default function PostComposer({ onPosted }) {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [image_url, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
  }, []);

  const isAdmin = me?.role === "admin";
  const categories = [...baseCategories, { value: "poll", label: "Poll" }];

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const submit = async () => {
    if (!content.trim()) return;
    const text = content.trim();
    const cat = category;
    const img = image_url;
    const announce = isAdmin && isAnnouncement;
    const isPoll = cat === "poll";
    const cleanPollOptions = isPoll ? pollOptions.map((o) => o.trim()).filter(Boolean) : [];
    if (isPoll && cleanPollOptions.length < 2) {
      toast({ title: "Add at least 2 poll options", variant: "destructive" });
      return;
    }

    const tempId = "temp-" + Date.now();
    const optimistic = {
      id: tempId,
      content: text,
      author_name: me?.full_name || me?.email || "You",
      category: cat,
      image_url: img,
      poll_options: isPoll ? cleanPollOptions : undefined,
      likes_count: 0,
      comments_count: 0,
      is_announcement: announce,
      pinned: announce,
      created_date: new Date().toISOString(),
      created_by_id: me?.id,
      _optimistic: true,
    };
    onPosted?.(optimistic);
    setContent("");
    setImageUrl("");
    setCategory("general");
    setIsAnnouncement(false);
    setPollOptions(["", ""]);
    setBusy(true);

    try {
      const real = await base44.entities.Post.create({
        content: text,
        author_name: optimistic.author_name,
        category: cat,
        image_url: img,
        poll_options: isPoll ? cleanPollOptions : undefined,
        likes_count: 0,
        comments_count: 0,
        is_announcement: announce,
        pinned: announce,
      });
      onPosted?.({ ...real, _replaceId: tempId });
    } catch {
      onPosted?.({ _removeId: tempId });
      toast({ title: "Could not post", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card p-3 space-y-2.5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={category === "poll" ? "Ask a poll question…" : isAdmin ? "Message the Tenzan crew or post an announcement…" : "Message the Tenzan crew…"}
        rows={2}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none"
      />
      {image_url && (
        <img src={image_url} alt="preview" className="rounded-xl max-h-32 object-cover" />
      )}

      {category === "poll" && (
        <div className="space-y-1.5">
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => setPollOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-foreground/5 rounded-xl px-3 py-1.5 text-sm text-foreground outline-none"
              />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))} className="w-11 h-11 rounded-full bg-foreground/5 text-muted-foreground flex items-center justify-center no-select">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button onClick={() => setPollOptions((prev) => [...prev, ""])} className="text-[11px] font-medium text-rose-600 no-select">+ Add option</button>
          )}
        </div>
      )}

      {isAdmin && (
        <button
          onClick={() => setIsAnnouncement((v) => !v)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all no-select",
            isAnnouncement
              ? "bg-amber-500/15 text-amber-700 border border-amber-300/50"
              : "bg-foreground/5 text-muted-foreground border border-transparent"
          )}
        >
          <Megaphone className="w-3.5 h-3.5" />
          {isAnnouncement ? "Announcement — will pin to top" : "Mark as announcement"}
        </button>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap no-select">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-medium transition-all",
                category === c.value
                  ? "bg-foreground text-background"
                  : "bg-foreground/5 text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer w-11 h-11 rounded-full flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 transition-colors no-select">
            <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
          <button
            onClick={submit}
            disabled={busy || !content.trim()}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-700 transition-colors no-select"
          >
            <Send className="w-3 h-3" />
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}