"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronRight, FastForward } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Gatekeeper } from "@/components/Gatekeeper";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";
import type { StoryLine } from "@/lib/storyScenes";

interface DialogueSceneProps {
  lines: readonly StoryLine[];
  /** Called exactly once, when the scene is finished or skipped. */
  onDone: () => void;
  skipLabel?: string;
  continueLabel?: string;
}

const MS_PER_CHAR = 26;

export function DialogueScene({
  lines,
  onDone,
  skipLabel = "SKIP DIALOGUE",
  continueLabel = "CONTINUE",
}: DialogueSceneProps) {
  const reduceMotion = useReducedMotion();
  const [scene, setScene] = useState({ index: 0, shown: 0 });
  const doneRef = useRef(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const { index } = scene;
  const line = lines[index];
  const isLast = index === lines.length - 1;
  const shown = reduceMotion ? line.text.length : scene.shown;
  const full = shown >= line.text.length;

  useEffect(() => {
    regionRef.current?.focus({ preventScroll: true });
  }, []);

  // Typewriter: one character per tick until the line is fully revealed.
  useEffect(() => {
    if (full) return;
    const id = window.setInterval(() => {
      setScene((s) => (s.index === index ? { ...s, shown: s.shown + 1 } : s));
    }, MS_PER_CHAR);
    return () => window.clearInterval(id);
  }, [index, full]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  /** Reveal the whole line, then advance, then finish after the last line. */
  const advance = () => {
    if (doneRef.current) return;
    if (!full) setScene({ index, shown: line.text.length });
    else if (!isLast) setScene({ index: index + 1, shown: 0 });
    else finish();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
      event.preventDefault();
      advance();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-4xl"
    >
      <RetroWindow title="gatekeeper_briefing.exe" className="w-full">
        <div className="grid items-center gap-4 sm:grid-cols-[17rem_minmax(0,1fr)]">
          <Gatekeeper
            emotion={line.emotion}
            dialogue=""
            showDialogue={false}
            className="mx-auto w-full max-w-[14rem] sm:max-w-none"
          />

          <div className="flex flex-col gap-3">
            <div
              ref={regionRef}
              tabIndex={0}
              role="button"
              aria-label="Dialogue. Press Enter or Space to continue."
              onClick={advance}
              onKeyDown={handleKeyDown}
              className="bevel-out cursor-pointer bg-panel p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              <div className="titlebar flex items-center justify-between px-2 py-0.5 font-pixel text-[8px]">
                <span>THE GATEKEEPER</span>
                <span>
                  {index + 1}/{lines.length}
                </span>
              </div>
              <p className="min-h-[11rem] bg-cream p-4 font-body text-2xl leading-snug text-bg sm:text-3xl">
                <span className="sr-only">{line.text}</span>
                <span aria-hidden="true">
                  {line.text.slice(0, shown)}
                  {/* Unrevealed text stays in the layout so the window never resizes mid-line. */}
                  <span className="invisible">{line.text.slice(shown)}</span>
                </span>
                {full && (
                  <span className="animate-pulse-fast ml-1 inline-block" aria-hidden="true">
                    ▼
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <PixelButton onClick={finish} className="!px-3 !py-2 !text-[10px]">
                <FastForward className="h-4 w-4" aria-hidden="true" />
                {skipLabel}
              </PixelButton>
              {full &&
                (isLast ? (
                  <PixelButton variant="primary" onClick={finish} autoFocus>
                    {continueLabel}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </PixelButton>
                ) : (
                  <PixelButton variant="primary" onClick={advance} className="!px-4 !py-2 !text-[10px]">
                    NEXT
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </PixelButton>
                ))}
            </div>
          </div>
        </div>
      </RetroWindow>
    </motion.div>
  );
}
