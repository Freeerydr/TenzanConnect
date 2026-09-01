// Randomized diagonal split — divides the viewport along a random line through
// its center into two polygons that recede apart along the line's normal.
// The same slash as the opening splash, but at a fresh angle every transition.
// Pure + client-side; no backend, no persistence.

export function randomSplit() {
  // Pick a random point on the perimeter; its reflection through the center is
  // the second point — guarantees a line through the middle every time.
  const edge = Math.floor(Math.random() * 4);
  const f = Math.random();
  let p1;
  if (edge === 0) p1 = [f, 0];
  else if (edge === 1) p1 = [1, f];
  else if (edge === 2) p1 = [1 - f, 1];
  else p1 = [0, 1 - f];
  const p2 = [1 - p1[0], 1 - p1[1]];

  // Perimeter parameterization (CCW from bottom-left): bottom 0..1, right 1..2,
  // top 2..3, left 3..4.
  const sOf = ([x, y]) => {
    if (y <= 0) return x;
    if (x >= 1) return 1 + y;
    if (y >= 1) return 2 + (1 - x);
    return 3 + (1 - y);
  };
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const cornerS = [0, 1, 2, 3];

  let s1 = sOf(p1);
  let s2 = sOf(p2);
  let a = p1;
  let b = p2;
  if (s1 > s2) { [s1, s2] = [s2, s1]; [a, b] = [b, a]; }

  const cornersA = corners.filter((_, i) => cornerS[i] > s1 && cornerS[i] < s2);
  const cornersB = [...corners.filter((_, i) => cornerS[i] > s2), ...corners.filter((_, i) => cornerS[i] < s1)];
  const polyA = [a, ...cornersA, b];
  const polyB = [b, ...cornersB, a];

  const toPoly = (pts) =>
    `polygon(${pts.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(", ")})`;

  // Outward normal of the split line, oriented toward polyA.
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const cax = polyA.reduce((s, p) => s + p[0], 0) / polyA.length;
  const cay = polyA.reduce((s, p) => s + p[1], 0) / polyA.length;
  if (nx * (cax - 0.5) + ny * (cay - 0.5) < 0) { nx = -nx; ny = -ny; }

  // Recede far enough to clear the viewport along the normal (px, GPU-friendly).
  const D = 1.7 * Math.max(window.innerWidth, window.innerHeight);

  return {
    topClip: toPoly(polyA),
    bottomClip: toPoly(polyB),
    topX: nx * D,
    topY: ny * D,
    bottomX: -nx * D,
    bottomY: -ny * D,
  };
}