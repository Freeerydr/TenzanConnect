import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache so many components (e.g. every PostCard) share one fetch.
let _cache = null;
let _promise = null;

function loadProfiles() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = base44.entities.Profile.list("-created_date", 500)
    .then((profiles) => {
      const map = {};
      (profiles || []).forEach((p) => {
        if (p.user_id && p.user_name) map[p.user_id] = p.user_name;
      });
      _cache = map;
      return map;
    })
    .catch(() => {
      _promise = null;
      return {};
    });
  return _promise;
}

// Formats a full name for feed display: "John Quincy Doe" -> "John Q. D."
export function formatFeedName(full) {
  if (!full) return full;
  const parts = String(full).trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || full;
  const first = parts[0];
  const last = parts[parts.length - 1];
  const middle = parts.slice(1, -1).map((w) => w.charAt(0) + ".").join(" ");
  return middle ? `${first} ${middle} ${last.charAt(0)}.` : `${first} ${last.charAt(0)}.`;
}

export function useProfileNames() {
  const [nameMap, setNameMap] = useState(_cache || {});
  useEffect(() => {
    if (_cache) { setNameMap(_cache); return; }
    let alive = true;
    loadProfiles().then((map) => { if (alive) setNameMap(map); });
    return () => { alive = false; };
  }, []);
  const nameFor = (userId, fallback) => (userId && nameMap[userId]) || fallback;
  return { nameFor, nameMap };
}