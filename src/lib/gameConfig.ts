import type { Emotion, TileKind } from "./gameTypes";

export const STARTING_LIVES = 3;

export const LEVEL1 = {
  timeLimitMs: 20_000,
  targetCount: 3,
  hitPoints: 100,
  missPenalty: 25,
  lowTimeWarningMs: 5_000,
  /** Delay between the final correct tile and the level-complete screen. */
  clearedDelayMs: 1_100,
  firstShuffleDelayMs: 1_800,
  shuffleIntervalMs: 2_400,
  dodgeCooldownMs: 1_400,
  maxDodges: 4,
  /** Pointer distance (in tile widths) from a target's centre that triggers a dodge. */
  dodgeTriggerRadius: 0.85,
} as const;

export const MAZE = {
  timeLimitMs: 25_000,
  finishPoints: 300,
  clearedDelayMs: 1_500,
  /** Pointer distance (maze units) from the first exit that makes it flicker. */
  approachWarnRadius: 130,
  /** Pointer distance (maze units) from the first exit that makes the Gatekeeper move it. */
  approachTriggerRadius: 80,
  /** Delay between the exit moving and the security gate going live. */
  lockdownWarnMs: 1_500,
  gate: {
    closedMs: 1_000,
    openMs: 1_800,
    warnMs: 600,
    slideMs: 200,
  },
  panic: {
    base: 50,
    enter: 60,
    exitMoved: 80,
    lockdown: 86,
    passedGate: 92,
    finish: 97,
  },
} as const;

export const TERMS = {
  timeLimitMs: 30_000,
  finishPoints: 400,
  clearedDelayMs: 1_500,
  /** Both buttons ignore input this long after a swap so the same click can't land twice. */
  swapLockMs: 600,
  panic: {
    base: 70,
    bottom: 78,
    swap: 86,
    clause: 93,
    finalBottom: 96,
    finish: 100,
  },
} as const;

export const CIRCUIT = {
  timeLimitMs: 60_000,
  finishPoints: 500,
  clearedDelayMs: 1_600,
  /** Warning time between the maintenance alert and the tile turning back. */
  warnMs: 1_800,
  panic: {
    base: 75,
    progress: 88,
    cheat: 94,
    finish: 100,
  },
} as const;

export const INSPECTION = {
  finishPoints: 500,
  /** Beat between the last challenge and the completion line. */
  completeDelayMs: 1_400,
  clearedDelayMs: 1_600,
  /** Starting thresholds (0-1 blendshape scores); tune against real cameras. */
  thresholds: {
    smile: 0.4,
    jawOpen: 0.4,
  },
  /** A condition must hold continuously this long to pass a challenge. */
  holdMs: 700,
  /** Landmarker runs at roughly 12 fps. */
  detectionIntervalMs: 80,
  /** A longer gap between processed frames counts as lost tracking and resets the hold. */
  maxFrameGapMs: 400,
  /** Ignore detections briefly after a pass so one expression cannot chain-pass stages. */
  passPauseMs: 900,
  /** Mouth-corner score floor for each side, relative to the smile threshold. */
  smileSideRatio: 0.5,
  panic: {
    face: 90,
    smile: 95,
    mouth: 98,
    finish: 100,
  },
} as const;

export const TARGET_KIND: TileKind = "trafficLight";
export const DECOY_KINDS: readonly TileKind[] = [
  "tree",
  "bicycle",
  "car",
  "cat",
  "house",
  "bus",
];

export const GATEKEEPER_SPRITES: Record<Emotion, string> = {
  smug: "/sprites/gatekeeper/smug.png",
  annoyed: "/sprites/gatekeeper/annoyed.png",
  nervous: "/sprites/gatekeeper/nervous.png",
  panicking: "/sprites/gatekeeper/panicking.png",
  meltdown: "/sprites/gatekeeper/meltdown.png",
};

export const EMOTION_META: Record<
  Emotion,
  { label: string; color: string }
> = {
  smug: { label: "SMUG", color: "#A8F0BB" },
  annoyed: { label: "ANNOYED", color: "#E1E5D6" },
  nervous: { label: "NERVOUS", color: "#F1D9A5" },
  panicking: { label: "PANICKING", color: "#F1A59C" },
  meltdown: { label: "MELTDOWN", color: "#F1A59C" },
};

/** Panic meter value (0-100) by number of traffic lights found. */
export const PANIC_BY_HITS: readonly number[] = [8, 40, 75, 100];

export const EMOTION_BY_HITS: readonly Emotion[] = [
  "smug",
  "annoyed",
  "nervous",
  "panicking",
];

export const DIALOGUE = {
  start: "Oh great. Another human.",
  hits: [
    "Lucky guess.",
    "Wait. You're not supposed to be good at this.",
    "THAT DOESN'T COUNT.",
  ],
  wrong: [
    "Nope. Minus points. I love this job.",
    "Wrong! Did you even look at the pictures?",
    "Ha! Robots are better at this.",
  ],
  dodge: [
    "Oops. My finger slipped.",
    "Did that traffic light just move? Weird.",
    "Hold still! ...Not you. Them.",
  ],
  lowTime: "Tick tock, meatbag.",
  timeout: {
    livesLeft2: "As expected.",
    livesLeft1: "One life left. Try not to cry on my keyboard.",
  },
  gameOver: "Human verification FAILED. Goodbye.",
  maze: {
    intro:
      "Fine. You passed the first test. Let's see how precise those suspicious little fingers really are.",
    enter: "Be careful. Those walls are very expensive.",
    exitMoved: "NOPE. I MOVED IT. THAT'S ALLOWED. I MAKE THE RULES.",
    lockdown: "STOP MOVING SO ACCURATELY.",
    passedGate: "YOU'RE NOT SUPPOSED TO WIN.",
    finish: "That exit was a clerical error.",
    wallLivesLeft2: "BONK. That wall is company property. You're paying for it.",
    wallLivesLeft1: "One life left. Please. Touch more walls.",
    timeout: "Time's up. The walls remain undefeated.",
  },
  final: "Fine. One LAST verification.",
  terms: {
    intro: "Nobody reads these. What's wrong with you?",
    bottom: "WAIT. I haven't finished writing them.",
    swap: "HA! READ THE BUTTONS NEXT TIME.",
    clause: "SECURITY POLICY UPDATED.",
    finalBottom: "STOP SCROLLING. THAT IS A SECURITY INCIDENT.",
    disagree: "Disagreement noted. And ignored.",
    timeout: "Time's up. Reading is hard, isn't it?",
    complete: "YOU CAN'T JUST AGREE TO EVERYTHING!",
  },
  circuit: {
    intro: "You can't brute-force electrical engineering.",
    progress: "STOP CONNECTING THINGS.",
    cheat: "Routine security maintenance. Nothing suspicious.",
    timeout: "Power failure. Have you tried plugging yourself in?",
    complete: "WHO GAVE YOU ACCESS TO THE POWER GRID?!",
  },
  inspection: {
    intro: "ENOUGH. I NEED TO SEE YOUR FACE.",
    face: "Oh, you have a face. How convenient.",
    smile: "STOP SMILING. THIS IS A GOVERNMENT FACILITY.",
    mouth: "WHY WOULD YOU ACTUALLY DO THAT?!",
    complete: "YOUR HUMANITY LEVELS ARE OFF THE CHARTS!",
  },
} as const;
