import { INSPECTION } from "./gameConfig";
import type { InspectionChallenge } from "./gameTypes";

export const CHALLENGE_ORDER: readonly InspectionChallenge[] = ["face", "smile", "mouth"];

export const CHALLENGE_TEXT: Record<InspectionChallenge, { label: string; prompt: string }> = {
  face: { label: "FACE", prompt: "SHOW YOUR FACE" },
  smile: { label: "SMILE", prompt: "SMILE FOR THE CAMERA" },
  mouth: { label: "MOUTH", prompt: "OPEN YOUR MOUTH WIDE" },
};

/** What the landmarker saw in one frame. Scores are 0 whenever no face is present. */
export interface FrameReading {
  faceCount: number;
  smileLeft: number;
  smileRight: number;
  jawOpen: number;
}

export interface Detection {
  smileThreshold: number;
  jawThreshold: number;
  smileSideRatio: number;
}

export const DEFAULT_DETECTION: Detection = {
  smileThreshold: INSPECTION.thresholds.smile,
  jawThreshold: INSPECTION.thresholds.jawOpen,
  smileSideRatio: INSPECTION.smileSideRatio,
};

export const NO_FACE: FrameReading = { faceCount: 0, smileLeft: 0, smileRight: 0, jawOpen: 0 };

interface Category {
  categoryName: string;
  score: number;
}

export function readingFromBlendshapes(faceCount: number, categories: readonly Category[]): FrameReading {
  if (faceCount < 1) return NO_FACE;
  const score = (name: string) => categories.find((c) => c.categoryName === name)?.score ?? 0;
  return {
    faceCount,
    smileLeft: score("mouthSmileLeft"),
    smileRight: score("mouthSmileRight"),
    jawOpen: score("jawOpen"),
  };
}

export function smileScore(r: FrameReading): number {
  return (r.smileLeft + r.smileRight) / 2;
}

/**
 * A challenge condition is only met when a face is present. A smile needs the
 * average of both mouth corners over the threshold and neither corner near zero,
 * so a one-sided grimace does not count.
 */
export function conditionMet(
  challenge: InspectionChallenge,
  r: FrameReading,
  d: Detection = DEFAULT_DETECTION,
): boolean {
  if (r.faceCount < 1) return false;
  switch (challenge) {
    case "face":
      return true;
    case "smile": {
      const floor = d.smileThreshold * d.smileSideRatio;
      return smileScore(r) >= d.smileThreshold && r.smileLeft >= floor && r.smileRight >= floor;
    }
    case "mouth":
      return r.jawOpen >= d.jawThreshold;
  }
}

export interface HoldState {
  /** When the current unbroken run of valid frames began. */
  since: number | null;
  lastFrameAt: number | null;
  /** Frames before this time are ignored (post-pass cooldown). */
  pausedUntil: number;
}

export function createHoldState(): HoldState {
  return { since: null, lastFrameAt: null, pausedUntil: 0 };
}

export interface HoldStep {
  state: HoldState;
  /** 0-1 progress toward the required hold. */
  progress: number;
  passed: boolean;
}

/**
 * Advances the continuous-hold timer by one processed frame. Any invalid frame,
 * or a gap between frames longer than maxFrameGapMs (stalled or hidden video),
 * discards accumulated time, so stale frames can never complete a challenge.
 */
export function stepHold(
  prev: HoldState,
  met: boolean,
  now: number,
  holdMs: number = INSPECTION.holdMs,
  maxGapMs: number = INSPECTION.maxFrameGapMs,
  passPauseMs: number = INSPECTION.passPauseMs,
): HoldStep {
  if (now < prev.pausedUntil) {
    return { state: { ...prev, since: null, lastFrameAt: now }, progress: 0, passed: false };
  }

  const stale = prev.lastFrameAt !== null && now - prev.lastFrameAt > maxGapMs;
  let since = stale ? null : prev.since;
  if (!met) since = null;
  else if (since === null) since = now;

  const held = since === null ? 0 : now - since;
  if (since !== null && held >= holdMs) {
    return {
      state: { since: null, lastFrameAt: now, pausedUntil: now + passPauseMs },
      progress: 1,
      passed: true,
    };
  }
  return {
    state: { since, lastFrameAt: now, pausedUntil: prev.pausedUntil },
    progress: Math.min(1, held / holdMs),
    passed: false,
  };
}
