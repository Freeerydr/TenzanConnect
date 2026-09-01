// IBJJF youth colored belts followed by the adult system (transitions to blue).
export const BELTS = [
  "white",
  "grey_white",
  "grey",
  "grey_black",
  "yellow_white",
  "yellow",
  "yellow_black",
  "orange_white",
  "orange",
  "orange_black",
  "green_white",
  "green",
  "green_black",
  "blue",
  "purple",
  "brown",
  "black",
];

export const BELT_COLOR = {
  white: "bg-slate-200 text-slate-700 border-slate-300",
  grey_white: "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-800 border-slate-400",
  grey: "bg-slate-400 text-slate-900 border-slate-500",
  grey_black: "bg-gradient-to-r from-slate-400 to-slate-800 text-white border-slate-700",
  yellow_white: "bg-gradient-to-r from-slate-200 to-yellow-400 text-slate-800 border-yellow-500",
  yellow: "bg-yellow-400 text-slate-900 border-yellow-500",
  yellow_black: "bg-gradient-to-r from-yellow-400 to-slate-800 text-white border-yellow-600",
  orange_white: "bg-gradient-to-r from-slate-200 to-orange-400 text-slate-800 border-orange-500",
  orange: "bg-orange-400 text-slate-900 border-orange-500",
  orange_black: "bg-gradient-to-r from-orange-400 to-slate-800 text-white border-orange-600",
  green_white: "bg-gradient-to-r from-slate-200 to-green-500 text-white border-green-600",
  green: "bg-green-500 text-white border-green-600",
  green_black: "bg-gradient-to-r from-green-500 to-slate-800 text-white border-green-700",
  blue: "bg-blue-500 text-white border-blue-600",
  purple: "bg-purple-500 text-white border-purple-600",
  brown: "bg-amber-700 text-white border-amber-800",
  black: "bg-slate-900 text-white border-slate-950",
};

export const beltLabel = (belt) => (belt || "white").replace(/_/g, " ");