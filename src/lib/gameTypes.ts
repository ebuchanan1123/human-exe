export type Emotion =
  | "smug"
  | "annoyed"
  | "nervous"
  | "panicking"
  | "meltdown";

export type Screen =
  | "landing"
  | "title"
  | "story"
  | "playing"
  | "cleared"
  | "levelComplete"
  | "maze"
  | "mazeCleared"
  | "mazeComplete"
  | "terms"
  | "termsCleared"
  | "termsComplete"
  | "circuit"
  | "circuitCleared"
  | "circuitComplete"
  | "inspection"
  | "inspectionCleared"
  | "final"
  | "gameOver";

/** 0 waiting at START, 1 entered, 2 exit moved, 3 lockdown live, 4 gate survived. */
export type MazeStage = 0 | 1 | 2 | 3 | 4;

export type MazeNotice = "wall" | "timeout";

/** 0 reading, 1 reached bottom, 2 buttons swapped, 3 clause added, 4 reached bottom again. */
export type TermsStage = 0 | 1 | 2 | 3 | 4;

/** 0 untouched, 1 most of the circuit powered, 2 Gatekeeper cheated. */
export type CircuitStage = 0 | 1 | 2;

export type InspectionChallenge = "face" | "smile" | "mouth" | "shake";

/** Narrative scenes shown at level transitions; never after a failure or retry. */
export type StoryId =
  | "intro"
  | "afterLevel1"
  | "afterLevel2"
  | "afterLevel3"
  | "afterLevel4";

/** Number of inspection challenges passed so far. */
export type InspectionStage = 0 | 1 | 2 | 3 | 4;

/** Where the final evaluation's results come from. */
export type InspectionOutcome = "passed" | "skipped";

/** Whether a challenge was passed by real detection or by presenter mode. */
export type InspectionSource = "camera" | "demo";

export type TileKind =
  | "trafficLight"
  | "tree"
  | "bicycle"
  | "car"
  | "cat"
  | "house"
  | "bus";

export interface GameState {
  screen: Screen;
  level: number;
  lives: number;
  score: number;
  /** Traffic lights found in the current attempt. */
  correctCount: number;
  timeLeftMs: number;
  /** Total time spent in active play across all levels. */
  elapsedMs: number;
  /** Gatekeeper panic meter, 0-100. */
  panic: number;
  mazeStage: MazeStage;
  /** Why the last maze attempt ended; shown on the fresh attempt. */
  mazeNotice: MazeNotice | null;
  termsStage: TermsStage;
  /** True on a fresh Level 3 attempt that follows a timeout. */
  termsRetry: boolean;
  circuitStage: CircuitStage;
  /** True on a fresh Level 4 attempt that follows a timeout. */
  circuitRetry: boolean;
  inspectionStage: InspectionStage;
  inspectionOutcome: InspectionOutcome | null;
  /** Some inspection steps were passed in presenter mode, not by the camera. */
  inspectionDemo: boolean;
  /** Scene currently playing while screen is "story". */
  storyId: StoryId | null;
  /** The Level 2 corridor has already narrowed this attempt. */
  mazeSqueezed: boolean;
  /** Incremented on every fresh minigame attempt; used as a React key to reset it. */
  attempt: number;
  emotion: Emotion;
  dialogue: string;
  /** Fake moderation-log line shown with the current dialogue event, or null. */
  modNotice: string | null;
  /** Incremented on every dialogue event; used for animation keys and line selection. */
  dialogueId: number;
}

export type GameAction =
  | { type: "START_GAME"; showIntro: boolean }
  | { type: "LANDING_DONE" }
  | { type: "SKIP_LANDING" }
  | { type: "STORY_DONE" }
  | { type: "CAPTCHA_SWAP" }
  | { type: "MAZE_SQUEEZE" }
  | { type: "TARGET_HIT" }
  | { type: "WRONG_PICK"; tile: string }
  | { type: "TARGET_DODGED" }
  | { type: "TICK"; deltaMs: number }
  | { type: "SHOW_LEVEL_COMPLETE" }
  | { type: "MAZE_ENTER" }
  | { type: "MAZE_EXIT_MOVED" }
  | { type: "MAZE_LOCKDOWN" }
  | { type: "MAZE_PASSED_GATE" }
  | { type: "MAZE_WALL_HIT" }
  | { type: "MAZE_FINISH" }
  | { type: "SHOW_MAZE_COMPLETE" }
  | { type: "TERMS_BOTTOM" }
  | { type: "TERMS_SWAP" }
  | { type: "TERMS_NEW_CLAUSE" }
  | { type: "TERMS_DISAGREE" }
  | { type: "TERMS_AGREE" }
  | { type: "SHOW_TERMS_COMPLETE" }
  | { type: "CIRCUIT_PROGRESS" }
  | { type: "CIRCUIT_CHEAT" }
  | { type: "CIRCUIT_SABOTAGE"; count: number; near: boolean }
  | { type: "CIRCUIT_SOLVED" }
  | { type: "SHOW_CIRCUIT_COMPLETE" }
  | { type: "INSPECTION_PASS"; challenge: InspectionChallenge; source: InspectionSource }
  | { type: "INSPECTION_COMPLETE" }
  | { type: "INSPECTION_SKIP" }
  | { type: "SHOW_INSPECTION_COMPLETE" }
  | { type: "CONTINUE" }
  | { type: "QUIT_TO_TITLE" };
