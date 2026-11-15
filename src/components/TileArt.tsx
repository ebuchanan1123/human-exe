import type { TileKind } from "@/lib/gameTypes";

const SKY: Record<TileKind, string> = {
  trafficLight: "#B9D9E8",
  tree: "#CDE8B8",
  bicycle: "#F2E2B8",
  car: "#D9D0EE",
  cat: "#F2D0C8",
  house: "#BFE3E0",
  bus: "#E8E4C4",
};

function Art({ kind }: { kind: TileKind }) {
  switch (kind) {
    case "trafficLight":
      return (
        <>
          <rect x="29" y="44" width="6" height="16" fill="#3a3a3a" />
          <rect x="24" y="58" width="16" height="4" fill="#2a2a2a" />
          <rect x="19" y="4" width="26" height="42" fill="#202020" stroke="#0c0c0c" strokeWidth="2" />
          <circle cx="32" cy="14" r="6" fill="#ff5a4d" />
          <circle cx="32" cy="25" r="6" fill="#ffd34d" />
          <circle cx="32" cy="36" r="6" fill="#5dff8a" />
          <rect x="29" y="11" width="3" height="3" fill="#ffd0cb" />
        </>
      );
    case "tree":
      return (
        <>
          <rect x="28" y="40" width="8" height="20" fill="#7a4a26" />
          <circle cx="32" cy="24" r="16" fill="#2f8f4a" />
          <circle cx="22" cy="32" r="10" fill="#37a356" />
          <circle cx="42" cy="32" r="10" fill="#37a356" />
          <circle cx="28" cy="18" r="4" fill="#5cc879" />
        </>
      );
    case "bicycle":
      return (
        <>
          <circle cx="16" cy="42" r="11" fill="none" stroke="#2b2b2b" strokeWidth="3" />
          <circle cx="48" cy="42" r="11" fill="none" stroke="#2b2b2b" strokeWidth="3" />
          <path d="M16 42 L28 24 L42 24 L48 42 M28 24 L34 42 L16 42 M34 42 L42 24" fill="none" stroke="#d6453a" strokeWidth="3" strokeLinejoin="round" />
          <rect x="24" y="19" width="10" height="4" fill="#2b2b2b" />
          <rect x="40" y="16" width="10" height="4" fill="#2b2b2b" />
          <circle cx="34" cy="42" r="3" fill="#2b2b2b" />
        </>
      );
    case "car":
      return (
        <>
          <rect x="4" y="32" width="56" height="16" rx="3" fill="#d6453a" />
          <path d="M16 32 L22 20 H42 L50 32 Z" fill="#e05a4f" />
          <path d="M20 31 L24 22 H31 V31 Z M34 31 V22 H41 L46 31 Z" fill="#bfe3f2" />
          <circle cx="16" cy="48" r="7" fill="#2b2b2b" />
          <circle cx="48" cy="48" r="7" fill="#2b2b2b" />
          <circle cx="16" cy="48" r="3" fill="#cfcfcf" />
          <circle cx="48" cy="48" r="3" fill="#cfcfcf" />
          <rect x="55" y="36" width="5" height="4" fill="#ffe27a" />
        </>
      );
    case "cat":
      return (
        <>
          <path d="M12 26 L14 8 L26 18 Z M52 26 L50 8 L38 18 Z" fill="#e89a3c" />
          <circle cx="32" cy="34" r="20" fill="#f2aa4c" />
          <path d="M22 18 L32 14 L42 18" stroke="#c97a1c" strokeWidth="3" fill="none" />
          <circle cx="24" cy="32" r="4" fill="#202020" />
          <circle cx="40" cy="32" r="4" fill="#202020" />
          <rect x="23" y="30" width="2" height="2" fill="#fff" />
          <rect x="39" y="30" width="2" height="2" fill="#fff" />
          <path d="M29 40 H35 L32 44 Z" fill="#e0707a" />
          <path d="M32 44 V47 M32 47 Q28 50 25 47 M32 47 Q36 50 39 47" stroke="#202020" strokeWidth="1.5" fill="none" />
          <path d="M4 38 H17 M4 44 H17 M60 38 H47 M60 44 H47" stroke="#202020" strokeWidth="1.5" />
        </>
      );
    case "house":
      return (
        <>
          <rect x="10" y="28" width="44" height="30" fill="#e8d9a8" />
          <path d="M5 30 L32 8 L59 30 Z" fill="#b5483c" />
          <rect x="28" y="40" width="10" height="18" fill="#7a4a26" />
          <rect x="14" y="34" width="10" height="10" fill="#8fd0f0" stroke="#5a4a2a" strokeWidth="2" />
          <rect x="42" y="34" width="8" height="10" fill="#8fd0f0" stroke="#5a4a2a" strokeWidth="2" />
          <rect x="44" y="12" width="6" height="12" fill="#8a3a30" />
        </>
      );
    case "bus":
      return (
        <>
          <rect x="3" y="14" width="58" height="34" rx="4" fill="#f2c230" />
          <rect x="7" y="19" width="10" height="11" fill="#bfe3f2" />
          <rect x="20" y="19" width="10" height="11" fill="#bfe3f2" />
          <rect x="33" y="19" width="10" height="11" fill="#bfe3f2" />
          <rect x="46" y="19" width="12" height="18" fill="#bfe3f2" />
          <rect x="3" y="38" width="58" height="3" fill="#d49a10" />
          <circle cx="16" cy="48" r="6" fill="#2b2b2b" />
          <circle cx="48" cy="48" r="6" fill="#2b2b2b" />
          <circle cx="16" cy="48" r="2.5" fill="#cfcfcf" />
          <circle cx="48" cy="48" r="2.5" fill="#cfcfcf" />
        </>
      );
  }
}

export function TileArt({ kind }: { kind: TileKind }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" fill={SKY[kind]} />
      <rect y="56" width="64" height="8" fill="#6f8a6b" opacity="0.55" />
      <Art kind={kind} />
    </svg>
  );
}
