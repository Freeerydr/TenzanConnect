// Local-date helper — avoids the UTC rollover bug where toISOString().slice(0,10)
// produces tomorrow's date in the evening for users behind UTC.
export const localDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Normalizes a stored date value to a local YYYY-MM-DD string.
// Handles date-only ("2026-08-23") and full ISO ("2026-08-23T00:00:00.000Z")
// without timezone shifting, so comparisons against localDateStr() stay stable.
export const toDateStr = (value) => {
  if (value == null || value === "") return "";
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : String(value);
};