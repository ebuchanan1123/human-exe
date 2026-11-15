import type { Emotion, TileKind } from "./gameTypes";

export const STARTING_LIVES = 3;

export const LEVEL1 = {
  timeLimitMs: 20_000,
  targetCount: 3,
  hitPoints: 100,
  /** After a wrong pick (which costs a life) every tile ignores input this long. */
  wrongLockMs: 700,
  lowTimeWarningMs: 5_000,
  /** Delay between the final correct tile and the level-complete screen. */
  clearedDelayMs: 1_100,
  firstShuffleDelayMs: 1_800,
  shuffleIntervalMs: 2_400,
  dodgeCooldownMs: 1_400,
  maxDodges: 4,
  /** Pointer distance (in tile widths) from a target's centre that triggers a dodge. */
  dodgeTriggerRadius: 0.85,
  /** Hover cheat: resting on a target this long makes the Gatekeeper swap it with a decoy. */
  hoverSwapMs: 1_000,
  /** Minimum gap between any two hover swaps. */
  swapCooldownMs: 1_000,
  maxSwapsPerTarget: 2,
  /** Tile slide transition length plus a small margin. */
  moveSettleMs: 520,
} as const;

export const MAZE = {
  timeLimitMs: 50_000,
  finishPoints: 300,
  clearedDelayMs: 1_500,
  /** Maze cells light up when the cursor comes this close (maze units) and stay lit. */
  revealRadius: 100,
  /** Pointer distance (maze units) from the first exit that makes it flicker. */
  approachWarnRadius: 130,
  /** Pointer distance (maze units) from the first exit that makes the Gatekeeper move it. */
  approachTriggerRadius: 80,
  /** Delay between the exit moving and the security gate going live. */
  lockdownWarnMs: 1_500,
  /** Shrinking corridor: no warning, the jaws slam shut once per attempt. */
  squeezeCloseMs: 400,
  /** Jaws stop this far (maze units) short of the cursor while closing. */
  squeezeClearance: 3,
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
  /** Repeating sabotage: after the grace period the Gatekeeper turns one tile at random intervals. */
  sabotage: {
    graceMs: 5_000,
    minGapMs: 6_000,
    maxGapMs: 8_000,
    maxCount: 4,
    warnMs: 800,
  },
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
  /**
   * Head shake: the nose offset between the cheeks (as a fraction of face width)
   * must swing back and forth by `amplitude` for `legs` strokes within `windowMs`.
   */
  shake: {
    amplitude: 0.05,
    legs: 3,
    windowMs: 3_000,
  },
  /** Mouth-corner score floor for each side, relative to the smile threshold. */
  smileSideRatio: 0.5,
  panic: {
    face: 90,
    smile: 95,
    mouth: 98,
    shake: 99,
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
  start: "oh great. another human.",
  hits: ["lucky guess.", "okay relax.", "that wasn't supposed to happen."],
  /** Wrong tile picks; a line naming the tile (wrongNamed) is added to the pool. */
  wrong: [
    "skill issue.",
    "did you even look?",
    "negative aura.",
    "uninstall your mouse.",
    "that's embarrassing.",
    "you're actually cooked.",
  ],
  wrongNamed: (tile: string) => `bro clicked the ${tile.toUpperCase()}.`,
  dodge: [
    "oops. my finger slipped.",
    "that light moved? couldn't be me.",
    "hold still! ...not you. them.",
    "get good. catch it.",
  ],
  lowTime: "tick tock, bro.",
  swap: "oops! routine maintenance. not my problem.",
  timeout: {
    livesLeft2: "womp womp.",
    livesLeft1: "one life left. bro is NOT verified.",
  },
  gameOver: "bro is NOT verified. goodbye.",
  maze: {
    intro: "fine. you passed the first test. let's see how good your mouse control actually is.",
    enter: "walk slow. those walls are expensive.",
    exitMoved: "WAIT. I MOVED THE EXIT. I MAKE THE RULES.",
    lockdown: "WAIT WAIT WAIT. STOP BEING SO ACCURATE.",
    /** Said only after the corridor has finished narrowing; there is no warning. */
    squeezed: ["skill issue tbh.", "bro just walk through it.", "not my problem."],
    passedGate: "nah this is rigged.",
    finish: "that exit was a clerical error.",
    wall: [
      "skill issue tbh.",
      "have you tried not touching the wall?",
      "bro has zero mouse control.",
      "get good.",
    ],
    wallLivesLeft1: "one life left. touch more walls, please.",
    timeout: "time's up. the walls remain undefeated.",
  },
  terms: {
    intro: "nobody reads these. what's wrong with you?",
    bottom: "WAIT WAIT WAIT. I'm not done writing them.",
    swap: "HA! skill issue. read the buttons.",
    clause: "SECURITY POLICY UPDATED. I make the rules.",
    finalBottom: "STOP SCROLLING. THAT'S A SECURITY INCIDENT.",
    disagree: "disagreement noted. not my problem.",
    timeout: "time's up. reading is hard, isn't it?",
    complete: "YOU CAN'T JUST AGREE TO EVERYTHING!",
  },
  circuit: {
    intro: "you can't brute-force electrical engineering.",
    progress: "STOP COOKING. who let bro near the wiring?",
    cheat: "i'm literally fixing it for you.",
    sabotage: [
      "whoops. security maintenance.",
      "i'm literally fixing it for you.",
      "nah, rotate that back.",
      "I'M ALLOWED TO TOUCH THE BOARD. YOU'RE NOT.",
    ],
    timeout: "power failure. have you tried plugging yourself in?",
    complete: "WHO GAVE YOU PERMISSION?! THAT'S THE POWER GRID.",
  },
  inspection: {
    intro: "ENOUGH. I NEED TO SEE YOUR FACE.",
    face: "oh. you have a face. okay.",
    smile: "why are you smiling at me?!",
    mouth: "bro is making faces at his laptop.",
    shake: "DON'T YOU SHAKE YOUR HEAD AT ME!",
    complete: "okay that's enough. YOUR HUMANITY LEVELS ARE OFF THE CHARTS!",
  },
} as const;
