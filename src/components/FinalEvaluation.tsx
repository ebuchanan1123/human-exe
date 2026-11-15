import { Gavel, Home } from "lucide-react";
import { formatRunTime } from "@/components/GameHUD";
import { Gatekeeper } from "@/components/Gatekeeper";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";
import type { Emotion } from "@/lib/gameTypes";

interface FinalEvaluationProps {
  score: number;
  elapsedMs: number;
  emotion: Emotion;
  dialogue: string;
  dialogueId: number;
  onQuit: () => void;
}

export function FinalEvaluation({
  score,
  elapsedMs,
  emotion,
  dialogue,
  dialogueId,
  onQuit,
}: FinalEvaluationProps) {
  return (
    <RetroWindow title="final_evaluation.exe" className="w-full max-w-4xl">
      <div className="grid gap-6 sm:grid-cols-[17rem_minmax(0,1fr)]">
        <Gatekeeper
          emotion={emotion}
          dialogue={dialogue}
          dialogueId={dialogueId}
          className="mx-auto w-full max-w-[14rem] sm:max-w-none"
        />
        <div className="flex flex-col items-center justify-center gap-5 text-center">
          <Gavel className="h-14 w-14 text-danger" aria-hidden="true" />
          <h2 className="font-pixel text-base text-danger sm:text-xl">FINAL EVALUATION</h2>
          <p className="font-body text-2xl text-cream">Coming in the next iteration.</p>
          <p className="font-pixel text-xs leading-relaxed text-cream/70">
            SCORE SO FAR: {score}
            <br />
            RUN TIME: {formatRunTime(elapsedMs)}
          </p>
          <PixelButton onClick={onQuit}>
            <Home className="h-4 w-4" aria-hidden="true" />
            BACK TO TITLE
          </PixelButton>
        </div>
      </div>
    </RetroWindow>
  );
}
