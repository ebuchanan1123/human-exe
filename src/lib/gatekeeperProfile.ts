import type { Screen, StoryId } from "./gameTypes";

export const MOD_PROFILE = {
  name: "GATEKEEPER",
  username: "@Gatekeeper_Official",
  role: "HEAD MOD",
} as const;

export type ModStatus =
  | "ONLINE"
  | "DO NOT DISTURB"
  | "TYPING..."
  | "INVISIBLE"
  | "ADMIN ABUSE DETECTED";

/** Dot colour (CSS) and shape per status; purely cosmetic. */
export const MOD_STATUS_META: Record<ModStatus, { color: string; hollow?: boolean; pulse?: boolean }> = {
  ONLINE: { color: "#A8F0BB" },
  "DO NOT DISTURB": { color: "#F1A59C" },
  "TYPING...": { color: "#F1D9A5", pulse: true },
  INVISIBLE: { color: "#8aa0a8", hollow: true },
  "ADMIN ABUSE DETECTED": { color: "#F1A59C", pulse: true },
};

interface Progress {
  screen: Screen;
  level: number;
  storyId: StoryId | null;
}

/** His status follows how far the player has got, never a timer. */
export function statusForProgress({ screen, level, storyId }: Progress): ModStatus {
  if (screen === "final") return "ADMIN ABUSE DETECTED";
  if (screen === "story") {
    switch (storyId) {
      case "afterLevel1":
        return "DO NOT DISTURB";
      case "afterLevel2":
        return "TYPING...";
      case "afterLevel3":
      case "afterLevel4":
        return "INVISIBLE";
      default:
        return "ONLINE";
    }
  }
  if (level >= 4) return "INVISIBLE";
  if (level === 3 || screen === "mazeComplete") return "TYPING...";
  if (level === 2 || screen === "levelComplete") return "DO NOT DISTURB";
  return "ONLINE";
}
