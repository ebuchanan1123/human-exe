import { INSPECTION } from "./gameConfig";
import type { InspectionChallenge } from "./gameTypes";

export const CHALLENGE_ORDER: readonly InspectionChallenge[] = ["face", "smile", "mouth", "shake"];

export const CHALLENGE_TEXT: Record<InspectionChallenge, { label: string; prompt: string }> = {
  face: { label: "FACE", prompt: "SHOW YOUR FACE" },
  smile: { label: "SMILE", prompt: "SMILE FOR THE CAMERA" },
  mouth: { label: "MOUTH", prompt: "OPEN YOUR MOUTH WIDE" },
  shake: { label: "SHAKE", prompt: "SHAKE YOUR HEAD NO" },
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
    case "shake":
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

interface Landmark {
  x: number;
  y: number;
}

/**
 * Horizontal head turn: the nose tip's offset from the midpoint of the two face
 * edges, as a fraction of face width. About 0 facing the camera, and it swings
 * either way as the head turns. Moving the whole face sideways does not change it.
 */
export function headYaw(landmarks: readonly Landmark[]): number | null {
  const nose = landmarks[1];
  const edgeA = landmarks[234];
  const edgeB = landmarks[454];
  if (!nose || !edgeA || !edgeB) return null;
  const width = Math.abs(edgeB.x - edgeA.x);
  if (width < 0.02) return null;
  return (nose.x - (edgeA.x + edgeB.x) / 2) / width;
}

export interface ShakeState {
  /** Yaw at the last confirmed extreme (or the starting pose). */
  pivot: number | null;
  /** 1 moving one way, -1 the other, 0 not yet moving. */
  dir: 0 | 1 | -1;
  /** Furthest yaw reached in the current stroke. */
  extreme: number;
  /** Completed strokes, each at least `amplitude` wide. */
  legs: number;
  startedAt: number | null;
  lastFrameAt: number | null;
  pausedUntil: number;
}

export function createShakeState(): ShakeState {
  return { pivot: null, dir: 0, extreme: 0, legs: 0, startedAt: null, lastFrameAt: null, pausedUntil: 0 };
}

export interface ShakeStep {
  state: ShakeState;
  /** 0-1 progress toward the required number of strokes. */
  progress: number;
  passed: boolean;
}

/**
 * Counts left-right strokes of the head. A stroke only counts once the yaw
 * reverses by `amplitude`, so jitter is ignored. Losing the face, a stalled
 * stream, or running out of time resets the count, so it can't pass on stale data.
 */
export function stepShake(
  prev: ShakeState,
  yaw: number | null,
  now: number,
  cfg: { amplitude: number; legs: number; windowMs: number } = INSPECTION.shake,
  maxGapMs: number = INSPECTION.maxFrameGapMs,
  passPauseMs: number = INSPECTION.passPauseMs,
): ShakeStep {
  const fresh = (): ShakeState => ({ ...createShakeState(), pausedUntil: prev.pausedUntil });

  if (now < prev.pausedUntil) {
    return { state: { ...fresh(), lastFrameAt: now }, progress: 0, passed: false };
  }
  const stale = prev.lastFrameAt !== null && now - prev.lastFrameAt > maxGapMs;
  if (yaw === null) return { state: { ...fresh(), lastFrameAt: now }, progress: 0, passed: false };

  let s = stale ? fresh() : prev;
  if (s.startedAt !== null && now - s.startedAt > cfg.windowMs) s = fresh();

  let { pivot, dir, extreme, legs, startedAt } = s;
  if (pivot === null) {
    pivot = yaw;
    extreme = yaw;
  }

  if (dir === 0) {
    if (Math.abs(yaw - pivot) >= cfg.amplitude) {
      dir = yaw > pivot ? 1 : -1;
      extreme = yaw;
      startedAt = startedAt ?? now;
    }
  } else if (dir === 1) {
    if (yaw > extreme) extreme = yaw;
    else if (extreme - yaw >= cfg.amplitude) {
      legs += 1;
      pivot = extreme;
      dir = -1;
      extreme = yaw;
    }
  } else if (yaw < extreme) {
    extreme = yaw;
  } else if (yaw - extreme >= cfg.amplitude) {
    legs += 1;
    pivot = extreme;
    dir = 1;
    extreme = yaw;
  }

  if (legs >= cfg.legs) {
    return {
      state: { ...createShakeState(), lastFrameAt: now, pausedUntil: now + passPauseMs },
      progress: 1,
      passed: true,
    };
  }
  return {
    state: { pivot, dir, extreme, legs, startedAt, lastFrameAt: now, pausedUntil: prev.pausedUntil },
    progress: Math.min(1, legs / cfg.legs),
    passed: false,
  };
}
