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
    base: 40,
    enter: 44,
    exitMoved: 52,
    lockdown: 56,
    passedGate: 60,
    finish: 64,
  },
} as const;

export const TERMS = {
  timeLimitMs: 30_000,
  finishPoints: 400,
  clearedDelayMs: 1_500,
  /** Both buttons ignore input this long after a swap so the same click can't land twice. */
  swapLockMs: 600,
  panic: {
    base: 66,
    bottom: 69,
    swap: 73,
    clause: 77,
    finalBottom: 80,
    finish: 82,
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
    base: 84,
    progress: 88,
    cheat: 91,
    finish: 93,
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
    face: 94,
    smile: 96,
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
export const PANIC_BY_HITS: readonly number[] = [8, 18, 28, 36];

export const EMOTION_BY_HITS: readonly Emotion[] = [
  "smug",
  "smug",
  "annoyed",
  "annoyed",
];

/** Fake moderation-log lines shown beside the sprite when the Gatekeeper abuses his powers. */
export const MOD_NOTICES = {
  swap: "[MOD] tile swapped by Gatekeeper_Official",
  wrong: "[MOD] warning issued: -1 life",
  exit: "[MOD] FINISH relocated",
  squeeze: "[MOD] corridor edited",
  termsSwap: "[MOD] buttons reconfigured",
  clause: "[MOD] rule #901 posted",
  circuit: "[MOD] board edited",
} as const;

/*
 * Voice: a washed-up Head Mod. Lowercase and smug early; caps and panic as the player wins.
 * Instructional lines (what to do) are always plain.
 */
export const DIALOGUE = {
  start: "select the traffic lights. shouldn't be hard. for normal people.",
  hits: ["lucky guess.", "okay relax.", "okay that literally doesn't count."],
  /** Wrong tile picks; a line naming the tile (wrongNamed) is added to the pool. */
  wrong: ["skill issue tbh.", "did you even look?", "negative aura.", "uninstall your mouse."],
  wrongNamed: (tile: string) => `bro clicked the ${tile.toUpperCase()}.`,
  dodge: [
    "oops. my finger slipped.",
    "that light moved? couldn't be me.",
    "hold still! ...not you. them.",
    "okay relax. i'm moderating.",
  ],
  lowTime: "tick tock, bro.",
  swap: "mod privileges. cry about it.",
  timeout: {
    livesLeft2: "womp womp.",
    livesLeft1: "one life left. bro is NOT verified.",
  },
  gameOver: "bro is NOT verified. goodbye.",
  maze: {
    intro: "let's test those suspicious mouse skills. click START, then reach the FINISH.",
    enter: "walk slow. those walls are expensive.",
    exitMoved: "WAIT. I MOVED THE EXIT. I'M A MOD.",
    lockdown: "WAIT WAIT WAIT. STOP BEING SO ACCURATE.",
    /** Said only after the corridor has finished narrowing; there is no warning. */
    squeezed: ["budget cuts. skill issue.", "bro just walk through it."],
    passedGate: "nah this is rigged.",
    finish: "bro is NOT supposed to be this good.",
    wall: [
      "have you tried not touching the wall?",
      "negative aura.",
      "bro has zero mouse control.",
      "get good.",
    ],
    wallLivesLeft1: "one life left. touch more walls, please.",
    timeout: "time's up. the walls remain undefeated.",
  },
  terms: {
    intro: "read the rules. all 900 of them. then scroll to the bottom.",
    bottom: "WAIT WAIT WAIT. I'm not done writing them.",
    swap: "i changed the rules. i'm a mod.",
    clause: "new rule just dropped.",
    finalBottom: "STOP SCROLLING. THAT'S A SECURITY INCIDENT.",
    disagree: "disagreement noted. not my problem.",
    timeout: "time's up. reading is hard, isn't it?",
    complete: "YOU CAN'T JUST AGREE TO EVERYTHING.",
  },
  circuit: {
    intro: "who let bro near the wiring. connect the source to the terminal.",
    progress: "STOP COOKING.",
    cheat: "that wire looked suspicious.",
    sabotage: [
      "routine mod maintenance.",
      "i'm literally fixing it for you.",
      "nah, rotate that back.",
      "I'M ALLOWED TO TOUCH THE BOARD. I'M A MOD.",
    ],
    timeout: "power failure. have you tried plugging yourself in?",
    complete: "nah. you're using exploits.",
  },
  inspection: {
    intro: "alright. face reveal. now.",
    face: "bro actually has a face.",
    smile: "why are you smiling at me.",
    mouth: "this is actually embarrassing.",
    shake: "DON'T YOU SHAKE YOUR HEAD AT ME!",
    complete: "HOW ARE YOU PASSING ALL OF THESE?!",
  },
} as const;
