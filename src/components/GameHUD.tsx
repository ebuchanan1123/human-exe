import type { ReactNode } from "react";
import { Clock, Heart, Skull, Star, Timer } from "lucide-react";
import { STARTING_LIVES } from "@/lib/gameConfig";

interface GameHUDProps {
  lives: number;
  level: number;
  timeLeftMs: number | null;
  elapsedMs: number;
  score: number;
  panic: number;
}

const PANIC_SEGMENTS = 10;

export function formatRunTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function GameHUD({ lives, level, timeLeftMs, elapsedMs, score, panic }: GameHUDProps) {
  const untimed = timeLeftMs === null;
  const seconds = untimed ? 0 : Math.ceil(timeLeftMs / 100) / 10;
  const urgent = !untimed && timeLeftMs <= 5_000;
  const litSegments = Math.round((panic / 100) * PANIC_SEGMENTS);

  return (
    <div className="bevel-in grid grid-cols-2 gap-x-4 gap-y-3 bg-bg p-3 sm:grid-cols-5">
      <Stat label="LIVES">
        <div className="flex gap-1" aria-label={`${lives} of ${STARTING_LIVES} lives`}>
          {Array.from({ length: STARTING_LIVES }, (_, i) => (
            <Heart
              key={i}
              className={`h-7 w-7 ${i < lives ? "fill-danger text-danger" : "text-cream/25"}`}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          ))}
        </div>
      </Stat>

      <Stat label="LEVEL">
        <span className="font-pixel text-lg text-cream">{level}</span>
      </Stat>

      <Stat label="TIME">
        <span
          className={`flex items-center gap-2 font-pixel text-lg tabular-nums ${
            urgent ? "animate-pulse-fast text-danger" : "text-mint"
          }`}
          role="timer"
        >
          <Clock className="h-5 w-5" aria-hidden="true" />
          {untimed ? "NONE" : `${seconds.toFixed(1)}s`}
        </span>
      </Stat>

      <Stat label="SCORE">
        <span className="flex items-center gap-2 font-pixel text-lg tabular-nums text-cream">
          <Star className="h-5 w-5 text-mint" aria-hidden="true" />
          {score}
        </span>
      </Stat>
      <Stat label="RUN TIME">
        <span className="flex items-center gap-2 font-pixel text-lg tabular-nums text-cream">
          <Timer className="h-5 w-5 text-mint" aria-hidden="true" />
          {formatRunTime(elapsedMs)}
        </span>
      </Stat>
      <div className="col-span-2 sm:col-span-5">
        <div className="mb-1 flex items-center justify-between font-pixel text-[10px] text-cream/70">
          <span className="flex items-center gap-2">
            <Skull className="h-4 w-4" aria-hidden="true" />
            GATEKEEPER PANIC
          </span>
          <span>{panic}%</span>
        </div>
        <div
          className="flex h-5 gap-[3px] bg-panel p-[3px]"
          role="meter"
          aria-label="Gatekeeper panic"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={panic}
        >
          {Array.from({ length: PANIC_SEGMENTS }, (_, i) => (
            <div
              key={i}
              className={`flex-1 transition-colors duration-300 ${
                i < litSegments
                  ? i >= PANIC_SEGMENTS * 0.7
                    ? "bg-danger"
                    : "bg-mint"
                  : "bg-bg"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-pixel text-[10px] text-cream/60">{label}</span>
      {children}
    </div>
  );
}
