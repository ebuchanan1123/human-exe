import { RotateCcw, ShieldX } from "lucide-react";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";

interface GameOverProps {
  score: number;
  onRestart: () => void;
  onQuit: () => void;
}

export function GameOver({ score, onRestart, onQuit }: GameOverProps) {
  return (
    <RetroWindow title="verification_failed.exe" className="w-full max-w-xl">
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <ShieldX className="h-14 w-14 text-danger" aria-hidden="true" />
        <h2 className="font-pixel text-lg text-danger sm:text-2xl">GAME OVER</h2>
        <p className="font-body text-2xl text-cream">
          You are officially, scientifically, probably a robot.
        </p>
        <p className="font-pixel text-xs text-cream/70">FINAL SCORE: {score}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <PixelButton variant="primary" onClick={onRestart} autoFocus>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            RESTART
          </PixelButton>
          <PixelButton onClick={onQuit}>BACK TO WEBSITE</PixelButton>
        </div>
      </div>
    </RetroWindow>
  );
}
