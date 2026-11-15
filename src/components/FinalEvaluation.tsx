"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Coffee, Gavel, Home, RotateCcw, SkipForward } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { formatRunTime } from "@/components/GameHUD";
import { Gatekeeper } from "@/components/Gatekeeper";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";
import { STARTING_LIVES } from "@/lib/gameConfig";
import type { Emotion, InspectionOutcome } from "@/lib/gameTypes";
import { MOD_PROFILE } from "@/lib/gatekeeperProfile";

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

type Phase = "sequence" | "result";

/** How long each step stays on screen before the next; the last one leads to the result (about 6.7s in all). */
const STEP_MS = [700, 800, 1000, 900, 900, 900, 1300] as const;

/** Steps: 0 log starts, 1 scan, 2 verdict, 3 meltdown, 4 override, 5 escalation, 6 ban stamp. */
const OVERRIDE_STEP = 3;
const STAMP_STEP = 6;

const DIALOGUE_BY_STEP: readonly { text: string; emotion: Emotion }[] = [
  { text: "running final evaluation. this should be quick. nobody has ever passed.", emotion: "panicking" },
  { text: "okay. scanning. any second now.", emotion: "panicking" },
  { text: "wait. WAIT. that's not supposed to say that.", emotion: "panicking" },
  { text: "NO. NO NO NO. YOU PASSED EVERYTHING.", emotion: "meltdown" },
  { text: "I'M THE HEAD MOD. I MAKE THE RULES.", emotion: "meltdown" },
  { text: "PRIVILEGES. ESCALATING. NOW.", emotion: "meltdown" },
  { text: "YOU'RE BANNED.", emotion: "meltdown" },
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
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("sequence");
  const [step, setStep] = useState(0);
  const skipped = outcome === "skipped";

  useEffect(() => {
    if (phase !== "sequence") return;
    const id = window.setTimeout(() => {
      if (step < STEP_MS.length - 1) setStep((s) => s + 1);
      else setPhase("result");
    }, STEP_MS[step]);
    return () => window.clearTimeout(id);
  }, [phase, step]);

  if (phase === "result") {
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
                <span>YOU ARE BANNED</span>
              </motion.h2>

              <p className="flex items-center gap-2 bg-danger px-2 py-1 font-pixel text-[8px] text-bg">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                ADMIN ABUSE DETECTED
              </p>

              <dl className="bevel-in w-full bg-bg p-3 text-left">
                <BanRow label="REASON" value="Being suspiciously competent" />
                <BanRow label="ISSUED BY" value={MOD_PROFILE.username.slice(1)} />
                <BanRow label="APPEAL STATUS" value="Denied by the same moderator" />
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
                <Stat label="TOTAL TIME" value={formatRunTime(elapsedMs)} />
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

  const line = DIALOGUE_BY_STEP[step];
  const scanLine = skipped
    ? "[SCAN] camera skipped. results estimated from vibes."
    : demo
      ? "[SCAN] face / smile / mouth / head shake ... PASS (presenter mode)"
      : "[SCAN] face / smile / mouth / head shake ... PASS";

  return (
    <RetroWindow title="final_evaluation.exe" className="relative w-full max-w-4xl">
      <div className="grid items-start gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
        <Gatekeeper
          emotion={line.emotion}
          dialogue={line.text}
          dialogueId={step}
          status={step >= OVERRIDE_STEP ? "ADMIN ABUSE DETECTED" : "INVISIBLE"}
          startled={step === OVERRIDE_STEP}
          className="mx-auto w-full max-w-[14rem] sm:max-w-none"
        />

        <div className="flex flex-col gap-3">
          <div className="bg-mint p-3 text-bg">
            <p className="font-body text-xl leading-none">Human Inspection Department</p>
            <p className="font-pixel text-base sm:text-lg">FINAL EVALUATION</p>
          </div>

          <div
            className="bevel-in flex min-h-[15rem] flex-col gap-3 bg-bg p-3 font-pixel text-[10px] leading-relaxed sm:text-xs"
            role="log"
            aria-live="polite"
          >
            <p className="text-cream/70">&gt; final_evaluation.exe --run</p>
            {step >= 1 && <p className="animate-pop-in text-cream/70">{scanLine}</p>}
            {step >= 2 && (
              <p className="animate-pop-in text-sm text-mint sm:text-base">
                Humanity confirmed: 100% &mdash; VERIFICATION PASSED
              </p>
            )}
            {step >= 4 && (
              <p className="animate-pop-in text-danger">
                [SYS] Gatekeeper_Official is overriding verification results...
              </p>
            )}
            {step >= 5 && (
              <p className="animate-pop-in animate-pulse-fast bg-danger px-2 py-1 text-bg">
                MODERATOR PRIVILEGES ESCALATED
              </p>
            )}
            <span className="animate-pulse-fast text-cream/60" aria-hidden="true">
              _
            </span>
          </div>

          <div className="flex justify-end">
            <PixelButton className="!px-3 !py-2 !text-[10px]" onClick={() => setPhase("result")}>
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              SKIP TO RESULT
            </PixelButton>
          </div>
        </div>
      </div>

      {step >= 5 && (
        <div
          key={step}
          className="animate-wrong pointer-events-none absolute inset-0 bg-danger/30"
          aria-hidden="true"
        />
      )}

      {step >= STAMP_STEP && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/50">
          <motion.div
            initial={reduceMotion ? false : { scale: 3.2, rotate: -26, opacity: 0 }}
            animate={{ scale: 1, rotate: -10, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 16 }}
            className="border-8 border-danger bg-bg/80 px-4 py-3 text-center font-pixel text-2xl leading-tight text-danger [text-shadow:4px_4px_0_#131D25] sm:px-8 sm:text-5xl"
            role="status"
          >
            PERMANENT
            <br />
            BAN ISSUED
          </motion.div>
        </div>
      )}
    </RetroWindow>
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
