"use client";

import { useEffect, useRef, useState } from "react";
import { OctagonX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { CoffeeShopSite } from "@/components/landing/CoffeeShopSite";
import { FakeCaptcha } from "@/components/landing/FakeCaptcha";
import type { CaptchaState } from "@/components/landing/FakeCaptcha";
import { PixelButton } from "@/components/PixelButton";
import { RetroWindow } from "@/components/RetroWindow";
import { GATEKEEPER_SPRITES } from "@/lib/gameConfig";

type Phase = "idle" | "verifying" | "verified" | "glitch" | "error" | "corrupt" | "launching";

const NEXT: Record<Exclude<Phase, "idle" | "launching">, Phase> = {
  verifying: "verified",
  verified: "glitch",
  glitch: "error",
  error: "corrupt",
  corrupt: "launching",
};

const DURATION_MS: Record<Exclude<Phase, "idle">, number> = {
  verifying: 1000,
  verified: 550,
  glitch: 650,
  error: 2200,
  corrupt: 800,
  launching: 1200,
};

/** With reduced motion the glitch phases are skipped or shortened to a static state. */
const REDUCED_DURATION_MS: Record<Exclude<Phase, "idle">, number> = {
  ...DURATION_MS,
  glitch: 0,
  corrupt: 300,
  launching: 1000,
};

interface CoffeeShopLandingProps {
  /** Called once when the fake site hands over to the game. */
  onLaunch: () => void;
}

/** The opening fake website: a normal coffee shop page with a parody verification checkbox. */
export function CoffeeShopLanding({ onLaunch }: CoffeeShopLandingProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const launched = useRef(false);

  // Warm the Gatekeeper sprites so the first dialogue scene appears fully drawn.
  useEffect(() => {
    Object.values(GATEKEEPER_SPRITES).forEach((src) => {
      new Image().src = src;
    });
  }, []);

  useEffect(() => {
    if (phase === "idle") return;
    const ms = (reduceMotion ? REDUCED_DURATION_MS : DURATION_MS)[phase];
    const id = window.setTimeout(() => {
      if (phase !== "launching") {
        setPhase(NEXT[phase]);
      } else if (!launched.current) {
        launched.current = true;
        onLaunch();
      }
    }, ms);
    return () => window.clearTimeout(id);
  }, [phase, reduceMotion, onLaunch]);

  const captchaState: CaptchaState =
    phase === "idle" ? "idle" : phase === "verifying" ? "verifying" : "verified";
  const glitching = phase === "glitch";
  const corrupted = phase === "corrupt" || phase === "launching";
  const tinted = corrupted || phase === "error";

  return (
    <>
      <div
        className={`${glitching ? "site-glitch-soft" : ""} ${
          corrupted ? "site-glitch-hard" : ""
        } ${tinted ? "site-corrupt" : ""}`}
        inert={phase !== "idle"}
      >
        <CoffeeShopSite
          widget={
            <FakeCaptcha state={captchaState} onActivate={() => setPhase("verifying")} />
          }
        />
      </div>

      {(glitching || corrupted) && !reduceMotion && (
        <div className="landing-bars pointer-events-none fixed inset-0 z-40" aria-hidden="true">
          <span style={{ top: "14%", height: "7%" }} />
          <span style={{ top: "38%", height: "4%" }} />
          <span style={{ top: "57%", height: "9%" }} />
          <span style={{ top: "81%", height: "5%" }} />
        </div>
      )}

      {phase === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4">
          <div
            role="alertdialog"
            aria-labelledby="landing-error-title"
            aria-describedby="landing-error-body"
            className="animate-pop-in w-full max-w-md"
          >
            <RetroWindow title="security_error.exe">
              <div className="flex flex-col items-center gap-4 text-center">
                <OctagonX className="h-12 w-12 text-danger" aria-hidden="true" />
                <h2 id="landing-error-title" className="font-pixel text-sm leading-relaxed text-danger sm:text-base">
                  SECURITY VERIFICATION FAILED
                </h2>
                <p id="landing-error-body" className="font-body text-2xl text-cream">
                  Unexpected human activity detected.
                </p>
                <PixelButton variant="primary" onClick={() => setPhase("corrupt")} autoFocus>
                  OK
                </PixelButton>
              </div>
            </RetroWindow>
          </div>
        </div>
      )}

      {phase === "launching" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.3 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg px-4 text-center"
          role="status"
        >
          <p className="font-pixel text-xs leading-relaxed text-mint sm:text-base">
            Launching GATEKEEPER.EXE...
          </p>
          <div className="bevel-in h-5 w-full max-w-xs bg-bg p-[3px]" aria-hidden="true">
            <motion.div
              className="h-full bg-mint"
              initial={{ width: reduceMotion ? "100%" : "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: reduceMotion ? 0 : 1, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </>
  );
}
