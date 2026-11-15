import { Play, ShieldCheck } from "lucide-react";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <RetroWindow title="security_check.exe" className="w-full max-w-2xl">
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <ShieldCheck className="h-14 w-14 text-mint" aria-hidden="true" />
        <div className="flex flex-col gap-3">
          <h1 className="font-pixel text-3xl leading-tight text-mint [text-shadow:4px_4px_0_#131D25] sm:text-5xl">
            CAPTCHA
            <br />
            <span className="text-danger">HELL</span>
          </h1>
          <p className="font-body text-3xl text-cream">
            Prove you&apos;re human. We dare you.
          </p>
        </div>
        <ul className="bevel-in w-full bg-bg p-4 text-left font-body text-2xl text-cream/90">
          <li>&gt; Click every traffic light before time runs out.</li>
          <li>&gt; Wrong squares cost points. Timeouts cost lives.</li>
          <li>&gt; The Gatekeeper will cheat. Probably.</li>
        </ul>
        <PixelButton variant="primary" onClick={onStart} autoFocus>
          <Play className="h-4 w-4" aria-hidden="true" />
          START VERIFICATION
        </PixelButton>
      </div>
    </RetroWindow>
  );
}
