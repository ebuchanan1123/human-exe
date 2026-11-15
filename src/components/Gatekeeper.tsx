"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { EMOTION_META, GATEKEEPER_SPRITES } from "@/lib/gameConfig";
import type { Emotion } from "@/lib/gameTypes";

interface GatekeeperProps {
  emotion: Emotion;
  dialogue: string;
  /** Changes on every new line so the dialogue panel re-animates even for repeated text. */
  dialogueId?: number;
  /** Plays a strong one-off recoil, e.g. when the player clears a level. */
  startled?: boolean;
  className?: string;
}

const EMOTIONS = Object.keys(GATEKEEPER_SPRITES) as Emotion[];

/** Sweat drop positions (percent of the stage) near the temples. */
const SWEAT: Record<Emotion, readonly { left: number; delay: number }[]> = {
  smug: [],
  annoyed: [],
  nervous: [
    { left: 27, delay: 0 },
    { left: 68, delay: 0.7 },
  ],
  panicking: [
    { left: 25, delay: 0 },
    { left: 70, delay: 0.25 },
    { left: 33, delay: 0.5 },
    { left: 62, delay: 0.75 },
  ],
  meltdown: [
    { left: 22, delay: 0 },
    { left: 74, delay: 0.15 },
    { left: 30, delay: 0.35 },
    { left: 66, delay: 0.5 },
    { left: 48, delay: 0.65 },
  ],
};

export function Gatekeeper({
  emotion,
  dialogue,
  dialogueId,
  startled = false,
  className = "",
}: GatekeeperProps) {
  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const [missing, setMissing] = useState<ReadonlySet<Emotion>>(new Set());
  const meta = EMOTION_META[emotion];

  // Pop on every emotion change.
  useEffect(() => {
    if (reduceMotion) return;
    void controls.start({
      scale: [0.94, 1.03, 1],
      y: [8, -3, 0],
      transition: { duration: 0.35, ease: "easeOut" },
    });
  }, [emotion, controls, reduceMotion]);

  // Declared after the pop so it wins when both fire in the same render.
  useEffect(() => {
    if (!startled || reduceMotion) return;
    void controls.start({
      x: [0, -14, 12, -9, 6, 0],
      y: [0, -14, 0],
      scale: [1, 1.1, 1],
      rotate: [0, -5, 4, 0],
      transition: { duration: 0.6, ease: "easeOut" },
    });
  }, [startled, controls, reduceMotion]);

  return (
    <section className={`flex flex-col gap-3 ${className}`} aria-label="The Gatekeeper">
      <motion.div
        key={dialogueId ?? dialogue}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="speech-bubble bevel-out bg-panel p-1"
        role="status"
        aria-live="polite"
      >
        <div className="titlebar px-2 py-0.5 font-pixel text-[8px]">GATEKEEPER.EXE</div>
        <p className="flex min-h-[7.5rem] items-center bg-cream p-2 font-body text-xl leading-tight text-bg">
          {dialogue}
        </p>
      </motion.div>

      <div
        className="gk-stage bevel-in relative aspect-[2/3] w-full overflow-hidden"
        style={{ boxShadow: `inset 0 0 0 3px ${meta.color}33, 0 0 0 2px #0b1318` }}
      >
        <motion.div
          animate={controls}
          className="absolute inset-0"
          style={{ transformOrigin: "50% 100%" }}
        >
          <div className={`gk-sprite gk-${emotion} absolute inset-0`}>
            {/* All sprites stay mounted so emotion swaps never wait on a network load. */}
            {EMOTIONS.map((e) =>
              missing.has(e) ? null : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={e}
                  src={GATEKEEPER_SPRITES[e]}
                  alt={e === emotion ? `The Gatekeeper looking ${e}` : ""}
                  aria-hidden={e !== emotion}
                  draggable={false}
                  className={`pixelated absolute inset-0 h-full w-full select-none object-contain object-bottom transition-opacity duration-150 ${
                    e === emotion ? "opacity-100" : "opacity-0"
                  }`}
                  onError={() => setMissing((prev) => new Set(prev).add(e))}
                />
              ),
            )}
          </div>
        </motion.div>

        {missing.has(emotion) && (
          <p className="absolute inset-x-3 top-1/2 -translate-y-1/2 bg-bg/80 p-2 text-center font-pixel text-[9px] leading-relaxed text-danger">
            MISSING SPRITE
            <br />
            {GATEKEEPER_SPRITES[emotion]}
          </p>
        )}

        {SWEAT[emotion].map((drop, i) => (
          <span
            key={`${emotion}-${i}`}
            className="gk-sweat"
            style={{ left: `${drop.left}%`, animationDelay: `${drop.delay}s` }}
            aria-hidden="true"
          />
        ))}

        {emotion === "meltdown" && (
          <>
            <div className="gk-error-flash pointer-events-none absolute inset-0 bg-danger" aria-hidden="true" />
            <div className="gk-glitch-bar pointer-events-none absolute inset-x-0 top-0 h-3 bg-danger/40" aria-hidden="true" />
            <div
              className="gk-glitch-bar pointer-events-none absolute inset-x-0 top-0 h-2 bg-mint/30"
              style={{ animationDelay: "-0.5s" }}
              aria-hidden="true"
            />
            <div
              className="gk-error-window bevel-out pointer-events-none absolute bottom-2 right-2 w-[46%] bg-panel p-0.5"
              aria-hidden="true"
            >
              <div className="bg-danger px-1 py-0.5 font-pixel text-[7px] text-bg">ERROR 0xDEAD</div>
              <div className="bg-cream px-1 py-1 font-pixel text-[6px] leading-snug text-bg">
                GATEKEEPER.EXE
                <br />
                NOT RESPONDING
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {startled && (
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="pointer-events-none absolute right-3 top-3 font-pixel text-2xl text-danger [text-shadow:2px_2px_0_#131D25]"
              aria-hidden="true"
            >
              !!
            </motion.span>
          )}
        </AnimatePresence>

        <span
          className="absolute left-2 top-2 px-2 py-1 font-pixel text-[9px] text-bg"
          style={{ backgroundColor: meta.color }}
        >
          {meta.label}
        </span>
      </div>
    </section>
  );
}
