import { ArrowRight, Star, Trophy } from "lucide-react";
import { formatRunTime } from "@/components/GameHUD";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";
import { STARTING_LIVES } from "@/lib/gameConfig";

interface LevelCompleteProps {
  level: number;
  score: number;
  lives: number;
  timeLeftMs: number | null;
  elapsedMs: number;
  onContinue: () => void;
}

const MESSAGES: Record<number, string> = {
  1: "Three traffic lights. Zero mercy. Somehow, you did it.",
  2: "Perfect precision. The walls are filing a complaint.",
  3: "You agreed to everything. The Gatekeeper is considering a ban.",
  4: "The terminal is online. The Gatekeeper's moderation panel is not.",
};

export function LevelComplete({
  level,
  score,
  lives,
  timeLeftMs,
  elapsedMs,
  onContinue,
}: LevelCompleteProps) {
  return (
    <RetroWindow title={`level${level}_complete.exe`} className="w-full max-w-xl">
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <Trophy className="h-14 w-14 text-mint" aria-hidden="true" />
        <h2 className="font-pixel text-lg text-mint sm:text-2xl">LEVEL {level} CLEARED</h2>
        <p className="font-body text-2xl text-cream">{MESSAGES[level]}</p>
        <dl className="bevel-in grid w-full grid-cols-2 gap-3 bg-bg p-3 sm:grid-cols-4 sm:gap-2">
          <Result label="SCORE" value={String(score)} icon />
          <Result label="LIVES" value={`${lives}/${STARTING_LIVES}`} />
          <Result
            label="TIME LEFT"
            value={timeLeftMs === null ? "NO LIMIT" : `${(timeLeftMs / 1000).toFixed(1)}s`}
          />
          <Result label="RUN TIME" value={formatRunTime(elapsedMs)} />
        </dl>
        <PixelButton variant="primary" onClick={onContinue} autoFocus>
          CONTINUE
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </PixelButton>
      </div>
    </RetroWindow>
  );
}

function Result({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <dt className="font-pixel text-[10px] text-cream/60">{label}</dt>
      <dd className="flex items-center gap-1 font-pixel text-base text-cream sm:text-lg">
        {icon && <Star className="h-4 w-4 text-mint" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}
