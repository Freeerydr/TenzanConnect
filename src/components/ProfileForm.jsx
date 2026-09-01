import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { BELTS, BELT_COLOR, beltLabel } from "@/lib/belts";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";
import { Loader2, Camera } from "lucide-react";

export default function ProfileForm({ initial, onSave, onCancel }) {
  const [userName, setUserName] = useState(initial?.user_name || "");
  const [bio, setBio] = useState(initial?.bio || "");
  const [avatar_url, setAvatarUrl] = useState(initial?.avatar_url || "");
  const [belt, setBelt] = useState(initial?.belt || "white");
  const [stripes, setStripes] = useState(initial?.stripes || 0);
  const [trainingDays, setTrainingDays] = useState(initial?.training_days || []);
  const [uploading, setUploading] = useState(false);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
    } catch {
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your profile</div>
      <input
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Display name"
        className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 outline-none"
      />
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center shrink-0">
          {avatar_url ? (
            <Image src={avatar_url} fittingType="fill" className="w-full h-full" />
          ) : (
            <span className="text-lg font-semibold text-muted-foreground">{(userName || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-foreground/5 text-sm font-medium text-foreground cursor-pointer no-select">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {avatar_url ? "Change photo" : "Upload photo"}
          <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        </label>
        {avatar_url && (
          <button type="button" onClick={() => setAvatarUrl("")} className="text-xs text-muted-foreground px-2 no-select">Remove</button>
        )}
      </div>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Short bio — training focus, how long you've been on the mats, what you're working on"
        rows={3}
        className="w-full text-sm text-foreground bg-foreground/5 rounded-xl px-3 py-2 resize-none outline-none"
      />
      <div className="flex gap-2 flex-wrap">
        {BELTS.map((b) => (
          <button
            key={b}
            onClick={() => setBelt(b)}
            className={cn("text-[10px] px-2 py-1 rounded-full capitalize border", belt === b ? BELT_COLOR[b] : "bg-foreground/5 text-muted-foreground border-transparent")}
          >
            {beltLabel(b)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Stripes</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setStripes(n)}
              className={cn("w-8 h-8 rounded-full text-xs font-medium", stripes === n ? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Training days</div>
        <div className="flex gap-1 flex-wrap no-select">
          {[["mon","Mon"],["tue","Tue"],["wed","Wed"],["thu","Thu"],["sat","Sat"]].map(([key, label]) => {
            const on = trainingDays.includes(key);
            return (
              <button key={key} onClick={() => setTrainingDays((prev) => on ? prev.filter((d) => d !== key) : [...prev, key])} className={cn("text-[11px] px-2.5 py-1.5 rounded-full", on ? "bg-rose-600 text-white" : "bg-foreground/5 text-muted-foreground")}>{label}</button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ user_name: userName.trim() || initial?.user_name, bio, avatar_url, belt, stripes: Number(stripes) || 0, training_days: trainingDays })}
          className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium no-select"
        >
          Save profile
        </button>
        <button onClick={onCancel} className="px-4 rounded-xl glass-card text-sm font-medium text-foreground no-select">
          Cancel
        </button>
      </div>
    </div>
  );
}