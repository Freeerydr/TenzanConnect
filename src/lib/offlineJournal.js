const KEY = "tenzan_offline_journal";

export function getPendingEntries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addPendingEntry(entry) {
  const list = getPendingEntries();
  const id = (typeof crypto !== "undefined" && crypto.randomUUID?.()) || String(Date.now() + Math.random());
  const item = { ...entry, _pendingId: id };
  localStorage.setItem(KEY, JSON.stringify([...list, item]));
  return item;
}

export function removePendingEntry(id) {
  const list = getPendingEntries().filter((e) => e._pendingId !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function pendingCount() {
  return getPendingEntries().length;
}