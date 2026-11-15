"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Check, Coffee, Gavel, Home, RotateCcw, SkipForward } from "lucide-react";
import { motion } from "motion/react";
import { DialogueScene } from "@/components/DialogueScene";
import { formatRunTime } from "@/components/GameHUD";
import { Gatekeeper } from "@/components/Gatekeeper";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";
import { STARTING_LIVES } from "@/lib/gameConfig";
import type { Emotion, InspectionOutcome } from "@/lib/gameTypes";
import { MOD_PROFILE } from "@/lib/gatekeeperProfile";
import { FINAL_MELTDOWN } from "@/lib/storyScenes";

interface FinalEvaluationProps {
  score: number;
  lives: number;
  elapsedMs: number;
  outcome: InspectionOutcome | null;
  /** Some checks were passed in presenter mode rather than by the camera. */
  demo: boolean;
  onRestart: () => void;
  onQuit: () => void;
}

type Phase = "report" | "meltdown" | "denied";

const CHECKS = ["FACE DETECTED", "SMILE DETECTED", "MOUTH OPEN DETECTED", "HUMAN BEHAVIOR"] as const;
const TOTAL_ROWS = CHECKS.length + 1;

const QUIPS: Record<"passed" | "skipped", readonly string[]> = {
  passed: [
    "bro actually has a face.",
    "why are you smiling at me.",
    "this is actually embarrassing.",
    "it shook its head at me. that can't be right.",
    "WHAT. IS. THAT. NUMBER.",
  ],
  skipped: [
    "no camera, no face on file.",
    "no smile on record.",
    "mouth status: unknown.",
    "behavior: unobserved.",
    "ESTIMATED FROM VIBES. AND THE VIBES ARE VERY HUMAN.",
  ],
};

const EMOTION_BY_ROW: readonly Emotion[] = [
  "panicking",
  "panicking",
  "panicking",
  "meltdown",
  "meltdown",
  "meltdown",
];

export function FinalEvaluation({
  score,
  lives,
  elapsedMs,
  outcome,
  demo,
  onRestart,
  onQuit,
}: FinalEvaluationProps) {
  const [phase, setPhase] = useState<Phase>("report");
  const [revealed, setRevealed] = useState(0);
  const skipped = outcome === "skipped";

  // Reveal one result at a time, then hand over to the Gatekeeper's breakdown.
  useEffect(() => {
    if (phase !== "report") return;
    const delay = revealed === 0 ? 2400 : revealed < TOTAL_ROWS ? 2600 : 3200;
    const id = window.setTimeout(() => {
      if (revealed < TOTAL_ROWS) setRevealed((r) => r + 1);
      else setPhase("meltdown");
    }, delay);
    return () => window.clearTimeout(id);
  }, [phase, revealed]);

  if (phase === "meltdown") {
    return (
      <DialogueScene
        key="meltdown"
        lines={FINAL_MELTDOWN}
        title="gatekeeper_meltdown.exe"
        skipLabel="SKIP TO VERDICT"
        continueLabel="SEE VERDICT"
        status="ADMIN ABUSE DETECTED"
        onDone={() => setPhase("denied")}
      />
    );
  }

  if (phase === "denied") {
    return (
      <div className="relative w-full max-w-4xl animate-shake-twice">
        <RetroWindow title="ban_notice.exe" className="w-full">
          <div className="grid items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
            <Gatekeeper
              emotion="meltdown"
              dialogue="my server. my rules. skill issue."
              dialogueId={99}
              status="ADMIN ABUSE DETECTED"
              startled
              className="mx-auto w-full max-w-[14rem] sm:max-w-none"
            />
            <div className="flex flex-col items-center gap-4 text-center">
              <motion.h2
                initial={{ scale: 2.6, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: -4, opacity: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 14 }}
                className="flex items-center gap-3 border-4 border-danger bg-bg/40 px-4 py-2 font-pixel text-xl leading-tight text-danger [text-shadow:3px_3px_0_#131D25] sm:text-3xl"
              >
                <Gavel className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" aria-hidden="true" />
                <span>
                  YOU HAVE
                  <br />
                  BEEN BANNED
                </span>
              </motion.h2>

              <p className="flex items-center gap-2 bg-danger px-2 py-1 font-pixel text-[8px] text-bg">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                ADMIN ABUSE DETECTED
              </p>

              <dl className="bevel-in w-full bg-bg p-3 text-left">
                <BanRow label="REASON" value="EXCESSIVE HUMANITY" />
                <BanRow label="ISSUED BY" value={MOD_PROFILE.username.slice(1)} />
                <BanRow label="APPEAL STATUS" value="AUTOMATICALLY DENIED" />
              </dl>

              <p className="font-body text-xl leading-tight text-mint">
                (You proved you&apos;re human. He just can&apos;t handle it.)
              </p>

              <div className="w-full rounded-md border border-[#d9c9ad] bg-bean-cream px-4 py-3 text-left font-site-sans text-sm text-bean-brown">
                <p className="flex items-center gap-2 font-site-serif font-semibold text-bean-green">
                  <Coffee className="h-4 w-4" aria-hidden="true" />
                  The Daily Bean
                </p>
                <p className="mt-1">Sorry! You must verify you&apos;re human to view our menu.</p>
              </div>

              <dl className="bevel-in grid w-full grid-cols-3 gap-2 bg-bg p-3">
                <Stat label="SCORE" value={String(score)} />
                <Stat label="LIVES" value={`${lives}/${STARTING_LIVES}`} />
                <Stat label="RUN TIME" value={formatRunTime(elapsedMs)} />
              </dl>

              <div className="flex flex-wrap justify-center gap-3">
                <PixelButton variant="primary" onClick={onRestart} autoFocus>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  PLAY AGAIN
                </PixelButton>
                <PixelButton onClick={onQuit}>
                  <Home className="h-4 w-4" aria-hidden="true" />
                  BACK TO WEBSITE
                </PixelButton>
              </div>
              <p className="font-pixel text-[8px] text-cream/50">GATEKEEPER STATUS: ADMIN ABUSE DETECTED</p>
            </div>
          </div>
        </RetroWindow>
        <div
          className="animate-wrong pointer-events-none absolute inset-0 bg-danger/40"
          aria-hidden="true"
        />
      </div>
    );
  }

  const quips = QUIPS[skipped ? "skipped" : "passed"];
  const dialogue =
    revealed === 0
      ? "running final evaluation. this should be quick. nobody has ever passed."
      : quips[revealed - 1];

  return (
    <RetroWindow title="final_evaluation.exe" className="w-full max-w-4xl">
      <div className="grid items-start gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
        <Gatekeeper
          emotion={EMOTION_BY_ROW[revealed]}
          dialogue={dialogue}
          dialogueId={revealed}
          status="INVISIBLE"
          className="mx-auto w-full max-w-[14rem] sm:max-w-none"
        />

        <div className="flex flex-col gap-3">
          <div className="bg-mint p-3 text-bg">
            <p className="font-body text-xl leading-none">Human Inspection Department</p>
            <p className="font-pixel text-base sm:text-lg">FINAL EVALUATION</p>
          </div>

          <ul className="bevel-in flex flex-col gap-1 bg-bg p-3">
            {CHECKS.map((label, i) => (
              <Row key={label} label={label} state={rowState(i, revealed)}>
                {skipped ? <span className="text-cream/60">SKIPPED</span> : <Pass />}
              </Row>
            ))}
            <Row label="HUMANITY SCORE" state={rowState(CHECKS.length, revealed)}>
              <span className="animate-pulse-fast text-right text-danger">
                SUSPICIOUSLY HIGH
              </span>
            </Row>
          </ul>

          <div className="bevel-in bg-bg p-3" aria-hidden="true">
            <div className="mb-1 flex items-center justify-between font-pixel text-[9px] text-cream/70">
              <span>HUMANITY LEVEL</span>
              <span className={revealed >= TOTAL_ROWS ? "text-danger" : ""}>
                {revealed >= TOTAL_ROWS ? "OVER 9000" : "CALCULATING"}
              </span>
            </div>
            <div className="h-3 bg-panel p-[2px]">
              <motion.div
                className={`h-full ${revealed >= TOTAL_ROWS ? "bg-danger" : "bg-mint"}`}
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, (revealed / TOTAL_ROWS) * 100)}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          {demo && !skipped && (
            <p className="bg-danger px-2 py-1 text-center font-pixel text-[8px] text-bg">
              PRESENTER MODE: SOME CHECKS WERE SIMULATED
            </p>
          )}

          <div className="flex justify-end">
            <PixelButton className="!px-3 !py-2 !text-[10px]" onClick={() => setPhase("meltdown")}>
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              SKIP
            </PixelButton>
          </div>
        </div>
      </div>
    </RetroWindow>
  );
}

type RowState = "done" | "scanning" | "waiting";

function rowState(index: number, revealed: number): RowState {
  if (index < revealed) return "done";
  return index === revealed ? "scanning" : "waiting";
}

function Row({
  label,
  state,
  children,
}: {
  label: string;
  state: RowState;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b-2 border-panel py-1 font-pixel text-[10px] last:border-b-0 sm:text-xs">
      <span className="text-cream">{label}</span>
      {state === "done" ? (
        <span className="animate-pop-in">{children}</span>
      ) : state === "scanning" ? (
        <span className="animate-pulse-fast text-cream/60">SCANNING...</span>
      ) : (
        <span className="text-cream/25">--</span>
      )}
    </li>
  );
}

function Pass() {
  return (
    <span className="flex items-center gap-1 text-mint">
      <Check className="h-4 w-4" strokeWidth={4} aria-hidden="true" />
      PASS
    </span>
  );
}

function BanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-b-2 border-panel py-1 last:border-b-0">
      <dt className="font-pixel text-[9px] text-cream/60">{label}</dt>
      <dd className="font-pixel text-[10px] text-danger sm:text-xs">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <dt className="font-pixel text-[9px] text-cream/60">{label}</dt>
      <dd className="flex items-center gap-1 font-pixel text-sm text-cream sm:text-base">
        {label === "SCORE" && <AlertTriangle className="h-4 w-4 text-mint" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}
