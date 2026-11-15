"use client";

import { useCallback, useEffect, useReducer } from "react";
import {
  CIRCUIT,
  DIALOGUE,
  EMOTION_BY_HITS,
  INSPECTION,
  LEVEL1,
  MAZE,
  PANIC_BY_HITS,
  STARTING_LIVES,
  TERMS,
} from "@/lib/gameConfig";
import type {
  GameAction,
  GameState,
  InspectionChallenge,
  InspectionSource,
  InspectionStage,
} from "@/lib/gameTypes";
import { CHALLENGE_ORDER } from "@/lib/faceChallenges";
import { STORY } from "@/lib/storyScenes";

const INSPECTION_ORDER: Record<InspectionChallenge, number> = {
  face: 0,
  smile: 1,
  mouth: 2,
  shake: 3,
};
const INSPECTION_TOTAL = CHALLENGE_ORDER.length;

export const initialState: GameState = {
  screen: "landing",
  level: 1,
  lives: STARTING_LIVES,
  score: 0,
  correctCount: 0,
  timeLeftMs: LEVEL1.timeLimitMs,
  elapsedMs: 0,
  panic: PANIC_BY_HITS[0],
  mazeStage: 0,
  mazeNotice: null,
  termsStage: 0,
  termsRetry: false,
  circuitStage: 0,
  circuitRetry: false,
  inspectionStage: 0,
  inspectionOutcome: null,
  inspectionDemo: false,
  storyId: null,
  mazeSqueezed: false,
  attempt: 0,
  emotion: "smug",
  dialogue: DIALOGUE.start,
  dialogueId: 0,
};

function say(
  state: GameState,
  dialogue: string,
  emotion: GameState["emotion"] = state.emotion,
): Pick<GameState, "dialogue" | "dialogueId" | "emotion"> {
  return { dialogue, emotion, dialogueId: state.dialogueId + 1 };
}

function pick(lines: readonly string[], index: number): string {
  return lines[index % lines.length];
}

function isMazeActive(state: GameState): boolean {
  return state.screen === "maze" && state.mazeStage >= 1;
}

/** Costs a life and either ends the run or starts a fresh attempt of the current level. */
function loseLife(state: GameState, cause: "timeout" | "wall"): GameState {
  const lives = state.lives - 1;
  if (lives <= 0) {
    return {
      ...state,
      lives: 0,
      timeLeftMs: 0,
      mazeStage: 0,
      screen: "gameOver",
      ...say(state, DIALOGUE.gameOver, "smug"),
    };
  }

  if (state.screen === "circuit") {
    return {
      ...state,
      lives,
      timeLeftMs: CIRCUIT.timeLimitMs,
      attempt: state.attempt + 1,
      circuitStage: 0,
      circuitRetry: true,
      panic: CIRCUIT.panic.base,
      ...say(state, DIALOGUE.circuit.timeout, "nervous"),
    };
  }

  if (state.screen === "terms") {
    return {
      ...state,
      lives,
      timeLeftMs: TERMS.timeLimitMs,
      attempt: state.attempt + 1,
      termsStage: 0,
      termsRetry: true,
      panic: TERMS.panic.base,
      ...say(state, DIALOGUE.terms.timeout, "annoyed"),
    };
  }

  if (state.screen === "maze") {
    const line =
      cause === "timeout"
        ? DIALOGUE.maze.timeout
        : lives === 1
          ? DIALOGUE.maze.wallLivesLeft1
          : DIALOGUE.maze.wallLivesLeft2;
    return {
      ...state,
      lives,
      timeLeftMs: MAZE.timeLimitMs,
      attempt: state.attempt + 1,
      mazeStage: 0,
      mazeNotice: cause,
      mazeSqueezed: false,
      panic: MAZE.panic.base,
      ...say(state, line, "annoyed"),
    };
  }

  return {
    ...state,
    lives,
    correctCount: 0,
    timeLeftMs: LEVEL1.timeLimitMs,
    attempt: state.attempt + 1,
    panic: PANIC_BY_HITS[0],
    ...say(
      state,
      lives === 1 ? DIALOGUE.timeout.livesLeft1 : DIALOGUE.timeout.livesLeft2,
      "smug",
    ),
  };
}

/* Level entry points. Narrative scenes sit in front of these; failures and retries never go through them. */

function enterLevel1(state: GameState, afterIntro: boolean): GameState {
  return {
    ...state,
    screen: "playing",
    level: 1,
    attempt: state.attempt + 1,
    correctCount: 0,
    timeLeftMs: LEVEL1.timeLimitMs,
    ...say(state, afterIntro ? STORY.intro[STORY.intro.length - 1].text : DIALOGUE.start, "smug"),
  };
}

function enterMaze(state: GameState): GameState {
  return {
    ...state,
    screen: "maze",
    level: 2,
    attempt: state.attempt + 1,
    correctCount: 0,
    timeLeftMs: MAZE.timeLimitMs,
    mazeStage: 0,
    mazeNotice: null,
    mazeSqueezed: false,
    panic: MAZE.panic.base,
    ...say(state, DIALOGUE.maze.intro, "annoyed"),
  };
}

function enterTerms(state: GameState): GameState {
  return {
    ...state,
    screen: "terms",
    level: 3,
    attempt: state.attempt + 1,
    timeLeftMs: TERMS.timeLimitMs,
    termsStage: 0,
    termsRetry: false,
    panic: TERMS.panic.base,
    ...say(state, DIALOGUE.terms.intro, "nervous"),
  };
}

function enterCircuit(state: GameState): GameState {
  return {
    ...state,
    screen: "circuit",
    level: 4,
    attempt: state.attempt + 1,
    timeLeftMs: CIRCUIT.timeLimitMs,
    circuitStage: 0,
    circuitRetry: false,
    panic: CIRCUIT.panic.base,
    ...say(state, DIALOGUE.circuit.intro, "nervous"),
  };
}

function enterInspection(state: GameState): GameState {
  return {
    ...state,
    screen: "inspection",
    level: 5,
    attempt: state.attempt + 1,
    timeLeftMs: 0,
    inspectionStage: 0,
    inspectionOutcome: null,
    inspectionDemo: false,
    panic: INSPECTION.panic.face,
    ...say(state, DIALOGUE.inspection.intro, "panicking"),
  };
}

function enterFinal(state: GameState): GameState {
  return { ...state, screen: "final", panic: 100, emotion: "nervous" };
}

function startStory(state: GameState, storyId: NonNullable<GameState["storyId"]>): GameState {
  return { ...state, screen: "story", storyId };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const fresh: GameState = {
        ...initialState,
        attempt: state.attempt,
        dialogueId: state.dialogueId,
      };
      return action.showIntro ? startStory(fresh, "intro") : enterLevel1(fresh, false);
    }

    case "LANDING_DONE": {
      // The fake website hands over to the Gatekeeper's intro; no timers run until Level 1.
      if (state.screen !== "landing") return state;
      return startStory(
        { ...initialState, attempt: state.attempt, dialogueId: state.dialogueId },
        "intro",
      );
    }

    case "SKIP_LANDING":
      if (state.screen !== "landing") return state;
      return { ...state, screen: "title" };

    case "STORY_DONE": {
      if (state.screen !== "story" || state.storyId === null) return state;
      const next = { ...state, storyId: null };
      switch (state.storyId) {
        case "intro":
          return enterLevel1(next, true);
        case "afterLevel1":
          return enterMaze(next);
        case "afterLevel2":
          return enterTerms(next);
        case "afterLevel3":
          return enterCircuit(next);
        case "afterLevel4":
          return enterInspection(next);
      }
      return state;
    }

    case "CAPTCHA_SWAP":
      if (state.screen !== "playing") return state;
      return { ...state, ...say(state, DIALOGUE.swap) };

    case "MAZE_SQUEEZE":
      if (!isMazeActive(state) || state.mazeSqueezed) return state;
      return { ...state, mazeSqueezed: true, ...say(state, DIALOGUE.maze.squeeze) };

    case "TARGET_HIT": {
      if (state.screen !== "playing" || state.correctCount >= LEVEL1.targetCount) {
        return state;
      }
      const correctCount = state.correctCount + 1;
      const patch = {
        score: state.score + LEVEL1.hitPoints,
        correctCount,
        panic: PANIC_BY_HITS[correctCount],
        ...say(state, DIALOGUE.hits[correctCount - 1], EMOTION_BY_HITS[correctCount]),
      };
      return correctCount === LEVEL1.targetCount
        ? { ...state, ...patch, screen: "cleared" }
        : { ...state, ...patch };
    }

    case "WRONG_PICK":
      if (state.screen !== "playing") return state;
      return {
        ...state,
        score: Math.max(0, state.score - LEVEL1.missPenalty),
        ...say(state, pick(DIALOGUE.wrong, state.dialogueId)),
      };

    case "TARGET_DODGED":
      if (state.screen !== "playing") return state;
      return { ...state, ...say(state, pick(DIALOGUE.dodge, state.dialogueId)) };

    case "TICK": {
      // The inspection level is untimed: only cumulative run time advances.
      if (state.screen === "inspection") {
        return { ...state, elapsedMs: state.elapsedMs + action.deltaMs };
      }
      if (
        state.screen !== "playing" &&
        state.screen !== "terms" &&
        state.screen !== "circuit" &&
        !isMazeActive(state)
      ) {
        return state;
      }
      const elapsedMs = state.elapsedMs + action.deltaMs;
      const timeLeftMs = Math.max(0, state.timeLeftMs - action.deltaMs);
      if (timeLeftMs > 0) {
        const crossedWarning =
          state.timeLeftMs > LEVEL1.lowTimeWarningMs &&
          timeLeftMs <= LEVEL1.lowTimeWarningMs;
        return crossedWarning
          ? { ...state, elapsedMs, timeLeftMs, ...say(state, DIALOGUE.lowTime) }
          : { ...state, elapsedMs, timeLeftMs };
      }
      return loseLife({ ...state, elapsedMs, timeLeftMs }, "timeout");
    }

    case "SHOW_LEVEL_COMPLETE":
      if (state.screen !== "cleared") return state;
      return { ...state, screen: "levelComplete" };

    case "MAZE_ENTER":
      if (state.screen !== "maze" || state.mazeStage !== 0) return state;
      return {
        ...state,
        mazeStage: 1,
        mazeNotice: null,
        panic: MAZE.panic.enter,
        ...say(state, DIALOGUE.maze.enter, "nervous"),
      };

    case "MAZE_EXIT_MOVED":
      if (state.screen !== "maze" || state.mazeStage !== 1) return state;
      return {
        ...state,
        mazeStage: 2,
        panic: MAZE.panic.exitMoved,
        ...say(state, DIALOGUE.maze.exitMoved, "panicking"),
      };

    case "MAZE_LOCKDOWN":
      if (state.screen !== "maze" || state.mazeStage !== 2) return state;
      return {
        ...state,
        mazeStage: 3,
        panic: MAZE.panic.lockdown,
        ...say(state, DIALOGUE.maze.lockdown, "panicking"),
      };

    case "MAZE_PASSED_GATE":
      if (state.screen !== "maze" || state.mazeStage !== 3) return state;
      return {
        ...state,
        mazeStage: 4,
        panic: MAZE.panic.passedGate,
        ...say(state, DIALOGUE.maze.passedGate, "panicking"),
      };

    case "MAZE_WALL_HIT":
      if (!isMazeActive(state)) return state;
      return loseLife(state, "wall");

    case "MAZE_FINISH":
      if (!isMazeActive(state)) return state;
      return {
        ...state,
        screen: "mazeCleared",
        score: state.score + MAZE.finishPoints,
        panic: MAZE.panic.finish,
        ...say(state, DIALOGUE.maze.finish, "panicking"),
      };

    case "SHOW_MAZE_COMPLETE":
      if (state.screen !== "mazeCleared") return state;
      return { ...state, screen: "mazeComplete" };

    case "TERMS_BOTTOM": {
      if (state.screen !== "terms") return state;
      if (state.termsStage === 0) {
        return {
          ...state,
          termsStage: 1,
          panic: TERMS.panic.bottom,
          ...say(state, DIALOGUE.terms.bottom, "panicking"),
        };
      }
      if (state.termsStage === 3) {
        return {
          ...state,
          termsStage: 4,
          panic: TERMS.panic.finalBottom,
          ...say(state, DIALOGUE.terms.finalBottom, "panicking"),
        };
      }
      return state;
    }

    case "TERMS_SWAP":
      if (state.screen !== "terms" || state.termsStage !== 1) return state;
      return {
        ...state,
        termsStage: 2,
        panic: TERMS.panic.swap,
        ...say(state, DIALOGUE.terms.swap, "panicking"),
      };

    case "TERMS_NEW_CLAUSE":
      if (state.screen !== "terms" || state.termsStage !== 2) return state;
      return {
        ...state,
        termsStage: 3,
        panic: TERMS.panic.clause,
        ...say(state, DIALOGUE.terms.clause, "panicking"),
      };

    case "TERMS_DISAGREE":
      if (state.screen !== "terms") return state;
      return { ...state, ...say(state, DIALOGUE.terms.disagree) };

    case "TERMS_AGREE":
      if (state.screen !== "terms" || state.termsStage !== 4) return state;
      return {
        ...state,
        screen: "termsCleared",
        score: state.score + TERMS.finishPoints,
        panic: TERMS.panic.finish,
        ...say(state, DIALOGUE.terms.complete, "meltdown"),
      };

    case "SHOW_TERMS_COMPLETE":
      if (state.screen !== "termsCleared") return state;
      return { ...state, screen: "termsComplete" };

    case "CIRCUIT_PROGRESS":
      if (state.screen !== "circuit" || state.circuitStage !== 0) return state;
      return {
        ...state,
        circuitStage: 1,
        panic: CIRCUIT.panic.progress,
        ...say(state, DIALOGUE.circuit.progress, "panicking"),
      };

    case "CIRCUIT_CHEAT":
      if (state.screen !== "circuit" || state.circuitStage !== 1) return state;
      return {
        ...state,
        circuitStage: 2,
        panic: CIRCUIT.panic.cheat,
        ...say(state, DIALOGUE.circuit.cheat, "panicking"),
      };

    case "CIRCUIT_SOLVED":
      if (state.screen !== "circuit") return state;
      return {
        ...state,
        screen: "circuitCleared",
        score: state.score + CIRCUIT.finishPoints,
        panic: CIRCUIT.panic.finish,
        ...say(state, DIALOGUE.circuit.complete, "meltdown"),
      };

    case "SHOW_CIRCUIT_COMPLETE":
      if (state.screen !== "circuitCleared") return state;
      return { ...state, screen: "circuitComplete" };

    case "INSPECTION_PASS": {
      if (state.screen !== "inspection") return state;
      const order = INSPECTION_ORDER[action.challenge];
      if (state.inspectionStage !== order) return state;
      return {
        ...state,
        inspectionStage: (order + 1) as InspectionStage,
        inspectionDemo: state.inspectionDemo || action.source === "demo",
        panic: INSPECTION.panic[action.challenge],
        ...say(
          state,
          DIALOGUE.inspection[action.challenge],
          action.challenge === "face" || action.challenge === "smile" ? "panicking" : "meltdown",
        ),
      };
    }

    case "INSPECTION_COMPLETE":
      if (state.screen !== "inspection" || state.inspectionStage !== INSPECTION_TOTAL) return state;
      return {
        ...state,
        screen: "inspectionCleared",
        inspectionOutcome: "passed",
        score: state.score + INSPECTION.finishPoints,
        panic: INSPECTION.panic.finish,
        ...say(state, DIALOGUE.inspection.complete, "meltdown"),
      };

    case "INSPECTION_SKIP":
      if (state.screen !== "inspection" || state.inspectionStage === INSPECTION_TOTAL) return state;
      return enterFinal({ ...state, inspectionOutcome: "skipped" });

    case "SHOW_INSPECTION_COMPLETE":
      if (state.screen !== "inspectionCleared") return state;
      return enterFinal(state);

    case "CONTINUE":
      switch (state.screen) {
        case "levelComplete":
          return startStory(state, "afterLevel1");
        case "mazeComplete":
          return startStory(state, "afterLevel2");
        case "termsComplete":
          return startStory(state, "afterLevel3");
        case "circuitComplete":
          return startStory(state, "afterLevel4");
        default:
          return state;
      }

    case "QUIT_TO_TITLE":
      return { ...initialState, attempt: state.attempt };
  }
}

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { screen, attempt, inspectionStage } = state;
  const ticking =
    screen === "playing" ||
    screen === "terms" ||
    screen === "circuit" ||
    screen === "inspection" ||
    isMazeActive(state);

  // Countdown: real elapsed time, so throttled background tabs stay accurate.
  useEffect(() => {
    if (!ticking) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "TICK", deltaMs: now - last });
      last = now;
    }, 100);
    return () => window.clearInterval(id);
  }, [ticking, attempt]);

  // Brief victory beat before each level-complete screen.
  useEffect(() => {
    if (screen === "cleared") {
      const id = window.setTimeout(
        () => dispatch({ type: "SHOW_LEVEL_COMPLETE" }),
        LEVEL1.clearedDelayMs,
      );
      return () => window.clearTimeout(id);
    }
    if (screen === "mazeCleared") {
      const id = window.setTimeout(
        () => dispatch({ type: "SHOW_MAZE_COMPLETE" }),
        MAZE.clearedDelayMs,
      );
      return () => window.clearTimeout(id);
    }
    if (screen === "termsCleared") {
      const id = window.setTimeout(
        () => dispatch({ type: "SHOW_TERMS_COMPLETE" }),
        TERMS.clearedDelayMs,
      );
      return () => window.clearTimeout(id);
    }
    if (screen === "circuitCleared") {
      const id = window.setTimeout(
        () => dispatch({ type: "SHOW_CIRCUIT_COMPLETE" }),
        CIRCUIT.clearedDelayMs,
      );
      return () => window.clearTimeout(id);
    }
    if (screen === "inspectionCleared") {
      const id = window.setTimeout(
        () => dispatch({ type: "SHOW_INSPECTION_COMPLETE" }),
        INSPECTION.clearedDelayMs,
      );
      return () => window.clearTimeout(id);
    }
  }, [screen]);

  // After the last challenge, let the Gatekeeper's reaction land before the completion beat.
  useEffect(() => {
    if (screen !== "inspection" || inspectionStage < INSPECTION_TOTAL) return;
    const id = window.setTimeout(
      () => dispatch({ type: "INSPECTION_COMPLETE" }),
      INSPECTION.completeDelayMs,
    );
    return () => window.clearTimeout(id);
  }, [screen, inspectionStage]);

  const startGame = useCallback(
    (showIntro = true) => dispatch({ type: "START_GAME", showIntro }),
    [],
  );
  const storyDone = useCallback(() => dispatch({ type: "STORY_DONE" }), []);
  const landingDone = useCallback(() => dispatch({ type: "LANDING_DONE" }), []);
  const skipLanding = useCallback(() => dispatch({ type: "SKIP_LANDING" }), []);
  const captchaSwapped = useCallback(() => dispatch({ type: "CAPTCHA_SWAP" }), []);
  const mazeSqueeze = useCallback(() => dispatch({ type: "MAZE_SQUEEZE" }), []);
  const targetHit = useCallback(() => dispatch({ type: "TARGET_HIT" }), []);
  const wrongPick = useCallback(() => dispatch({ type: "WRONG_PICK" }), []);
  const targetDodged = useCallback(() => dispatch({ type: "TARGET_DODGED" }), []);
  const continueToNext = useCallback(() => dispatch({ type: "CONTINUE" }), []);
  const quitToTitle = useCallback(() => dispatch({ type: "QUIT_TO_TITLE" }), []);
  const mazeEnter = useCallback(() => dispatch({ type: "MAZE_ENTER" }), []);
  const mazeExitMoved = useCallback(() => dispatch({ type: "MAZE_EXIT_MOVED" }), []);
  const mazeLockdown = useCallback(() => dispatch({ type: "MAZE_LOCKDOWN" }), []);
  const mazePassedGate = useCallback(() => dispatch({ type: "MAZE_PASSED_GATE" }), []);
  const mazeWallHit = useCallback(() => dispatch({ type: "MAZE_WALL_HIT" }), []);
  const mazeFinish = useCallback(() => dispatch({ type: "MAZE_FINISH" }), []);
  const termsBottom = useCallback(() => dispatch({ type: "TERMS_BOTTOM" }), []);
  const termsSwap = useCallback(() => dispatch({ type: "TERMS_SWAP" }), []);
  const termsNewClause = useCallback(() => dispatch({ type: "TERMS_NEW_CLAUSE" }), []);
  const termsDisagree = useCallback(() => dispatch({ type: "TERMS_DISAGREE" }), []);
  const termsAgree = useCallback(() => dispatch({ type: "TERMS_AGREE" }), []);
  const circuitProgress = useCallback(() => dispatch({ type: "CIRCUIT_PROGRESS" }), []);
  const circuitCheat = useCallback(() => dispatch({ type: "CIRCUIT_CHEAT" }), []);
  const circuitSolved = useCallback(() => dispatch({ type: "CIRCUIT_SOLVED" }), []);
  const inspectionPass = useCallback(
    (challenge: InspectionChallenge, source: InspectionSource) =>
      dispatch({ type: "INSPECTION_PASS", challenge, source }),
    [],
  );
  const inspectionSkip = useCallback(() => dispatch({ type: "INSPECTION_SKIP" }), []);

  return {
    state,
    startGame,
    storyDone,
    landingDone,
    skipLanding,
    captchaSwapped,
    mazeSqueeze,
    targetHit,
    wrongPick,
    targetDodged,
    continueToNext,
    quitToTitle,
    mazeEnter,
    mazeExitMoved,
    mazeLockdown,
    mazePassedGate,
    mazeWallHit,
    mazeFinish,
    termsBottom,
    termsSwap,
    termsNewClause,
    termsDisagree,
    termsAgree,
    circuitProgress,
    circuitCheat,
    circuitSolved,
    inspectionPass,
    inspectionSkip,
  };
}
