import React from "react";

const GRADIENTS = {
  gold: ["#FFF3B0", "#E6B450", "#C8961E", "#8A6300"],
  silver: ["#FFFFFF", "#DCDCDC", "#A8A8A8", "#6E6E6E"],
  bronze: ["#F7C99B", "#D8915A", "#A05A2A", "#6B3E12"],
};

function ShapeBody({ shape, fill }) {
  switch (shape) {
    case "star":
      return (
        <path
          d="M32 24 L37.88 39.91 L54.83 40.58 L41.51 51.09 L46.11 67.42 L32 58 L17.89 67.42 L22.49 51.09 L9.17 40.58 L26.12 39.91 Z"
          fill={fill}
        />
      );
    case "shield":
      return <path d="M32 26 L52 33 L52 48 C52 60, 43 68, 32 72 C21 68, 12 60, 12 48 L12 33 Z" fill={fill} />;
    case "flame":
      return (
        <>
          <path d="M32 28 C 42 40, 48 48, 44 58 C 42 64, 36 70, 32 72 C 28 70, 22 64, 20 58 C 16 48, 22 40, 32 28 Z" fill={fill} />
          <path d="M32 42 C 37 48, 39 53, 37 58 C 35 62, 32 65, 32 66 C 32 65, 29 62, 27 58 C 25 53, 27 48, 32 42 Z" fill="#ffffff" opacity="0.3" />
        </>
      );
    case "lotus":
      return (
        <g>
          {[-60, -30, 0, 30, 60].map((deg) => (
            <path
              key={deg}
              d="M32 30 C 40 40, 40 50, 32 56 C 24 50, 24 40, 32 30 Z"
              fill={fill}
              transform={`rotate(${deg} 32 56)`}
            />
          ))}
          <circle cx="32" cy="54" r="4" fill={fill} />
        </g>
      );
    case "laurel": {
      const leaves = [];
      for (let i = 0; i < 10; i++) {
        const angDeg = 40 + i * 30;
        const ang = (angDeg * Math.PI) / 180;
        const cx = 32 + 20 * Math.cos(ang);
        const cy = 48 + 20 * Math.sin(ang);
        leaves.push(
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="3.5"
            ry="7"
            fill={fill}
            transform={`rotate(${angDeg + 90} ${cx} ${cy})`}
          />
        );
      }
      return <g>{leaves}<circle cx="32" cy="48" r="20" fill="none" stroke={fill} strokeWidth="1.5" opacity="0.4" /></g>;
    }
    case "medal":
    default:
      return (
        <>
          <circle cx="32" cy="48" r="24" fill={fill} />
          <circle cx="32" cy="48" r="18" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.35" />
          <path d="M32 38 L34.2 44.8 L41.5 44.8 L35.6 49 L37.8 55.8 L32 51.6 L26.2 55.8 L28.4 49 L22.5 44.8 L29.8 44.8 Z" fill="#ffffff" opacity="0.5" />
        </>
      );
  }
}

export default function MedalBadge({ placing, shape = "medal", size = 64 }) {
  const color = placing === "gold" ? "gold" : placing === "silver" ? "silver" : "bronze";
  const stops = GRADIENTS[color] || GRADIENTS.bronze;
  const uid = React.useId().replace(/:/g, "");
  const gradId = `medal-${uid}`;
  const ribbonId = `ribbon-${uid}`;
  const fill = `url(#${gradId})`;

  return (
    <svg viewBox="0 0 64 80" width={size} height={size * 1.25} xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stops[0]} />
          <stop offset="40%" stopColor={stops[1]} />
          <stop offset="70%" stopColor={stops[2]} />
          <stop offset="100%" stopColor={stops[3]} />
        </linearGradient>
        <linearGradient id={ribbonId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#be123c" />
        </linearGradient>
      </defs>
      <path d="M21 24 L31 24 L27 6 L19 8 Z" fill={`url(#${ribbonId})`} />
      <path d="M43 24 L33 24 L37 6 L45 8 Z" fill={`url(#${ribbonId})`} />
      <ShapeBody shape={shape} fill={fill} />
      <ellipse cx="24" cy="40" rx="7" ry="4" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}