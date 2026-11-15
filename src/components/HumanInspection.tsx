"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import { Camera, CameraOff, Check, FlaskConical, ScanFace, SkipForward } from "lucide-react";
import { PixelButton } from "@/components/PixelButton";
import { useFaceInspection } from "@/hooks/useFaceInspection";
import { CHALLENGE_ORDER, CHALLENGE_TEXT, DEFAULT_DETECTION } from "@/lib/faceChallenges";
import type { InspectionChallenge, InspectionSource } from "@/lib/gameTypes";

interface HumanInspectionProps {
  onPass: (challenge: InspectionChallenge, source: InspectionSource) => void;
  /** Leaves the optional level without costing a life. */
  onSkip: () => void;
}

const smallButton = "!px-3 !py-2 !text-[10px]";

export function HumanInspection({ onPass, onSkip }: HumanInspectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { phase, error, stage, view, aspect, flash, start, startDemo, demoPass } = useFaceInspection({
    videoRef,
    canvasRef,
    onPass,
  });

  const live = phase === "live";
  const current = CHALLENGE_ORDER[stage];

  let status = "";
  let statusTone = "text-cream/80";
  if (phase === "intro") status = "THE SCANNER IS OFFLINE. ENABLE THE CAMERA TO BEGIN.";
  else if (phase === "starting") status = "WAITING FOR CAMERA PERMISSION AND LOADING THE FACE MODEL...";
  else if (phase === "error") {
    status = error?.message ?? "CAMERA UNAVAILABLE.";
    statusTone = "text-danger";
  } else if (phase === "demo") {
    status = current
      ? `PRESENTER MODE: PRESS THE BUTTON TO SIMULATE "${CHALLENGE_TEXT[current].prompt}".`
      : "PRESENTER MODE COMPLETE.";
    statusTone = "text-danger";
  } else if (phase === "done") status = "SCAN COMPLETE. CAMERA OFF.";
  else if (live && current) {
    if (view.faceCount < 1) {
      status = "NO FACE DETECTED. MOVE INTO FRAME.";
      statusTone = "text-danger";
    } else {
      status = `${stage + 1}/${CHALLENGE_ORDER.length}: ${CHALLENGE_TEXT[current].prompt}`;
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-mint p-3 text-bg">
        <p className="font-body text-xl leading-none">Biometric scanner v1.0</p>
        <p className="font-pixel text-base sm:text-lg">HUMAN INSPECTION</p>
      </div>

      <div className="bevel-in relative overflow-hidden bg-bg" style={{ aspectRatio: aspect }}>
        {/* Mirrored like a selfie view; frames stay in the browser and are never sent anywhere. */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={`absolute inset-0 h-full w-full -scale-x-100 object-fill ${live ? "" : "invisible"}`}
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

        {live && (
          <>
            <div className="scanner-lines pointer-events-none absolute inset-0" aria-hidden="true" />
            <div className="scanner-bar pointer-events-none absolute inset-x-0 top-0 h-6" aria-hidden="true" />
            <div className="pointer-events-none absolute left-2 top-2 bg-bg/80 px-2 py-1 font-pixel text-[8px] leading-relaxed text-mint">
              SMILE {view.smile.toFixed(2)} / {DEFAULT_DETECTION.smileThreshold.toFixed(2)}
              <br />
              JAW &nbsp;{view.jaw.toFixed(2)} / {DEFAULT_DETECTION.jawThreshold.toFixed(2)}
              {current === "shake" && (
                <>
                  <br />
                  YAW {view.yaw >= 0 ? "+" : ""}
                  {view.yaw.toFixed(2)}
                </>
              )}
            </div>
            <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 bg-danger px-2 py-1 font-pixel text-[8px] text-bg">
              <span className="animate-pulse-fast">●</span> LIVE
            </div>
          </>
        )}

        {flash && (
          <div key={flash.id} className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="animate-wrong absolute inset-0 bg-mint/50" />
            <span className="animate-toast bevel-out absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-mint px-3 py-2 font-pixel text-xs text-bg">
              {CHALLENGE_TEXT[flash.challenge].label} VERIFIED
            </span>
          </div>
        )}

        {phase === "intro" && (
          <Card>
            <ScanFace className="h-10 w-10 text-mint" aria-hidden="true" />
            <p className="font-body text-xl leading-tight text-cream">
              The inspector needs a live look at your face. Video stays in your browser: nothing is
              recorded, uploaded or stored.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <PixelButton variant="primary" className={smallButton} onClick={start} autoFocus>
                <Camera className="h-4 w-4" aria-hidden="true" />
                ENABLE CAMERA
              </PixelButton>
              <PixelButton className={smallButton} onClick={onSkip}>
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                SKIP LEVEL
              </PixelButton>
            </div>
            <p className="font-pixel text-[8px] text-cream/60">SKIPPING COSTS NO LIFE.</p>
          </Card>
        )}

        {phase === "starting" && (
          <Card>
            <Camera className="animate-pulse-fast h-10 w-10 text-mint" aria-hidden="true" />
            <p className="font-pixel text-[10px] leading-relaxed text-cream">
              ALLOW THE CAMERA WHEN YOUR BROWSER ASKS.
            </p>
            <p className="font-body text-xl text-cream/80">No timer is running.</p>
            <PixelButton className={smallButton} onClick={onSkip}>
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              SKIP LEVEL
            </PixelButton>
          </Card>
        )}

        {phase === "error" && (
          <Card>
            <CameraOff className="h-10 w-10 text-danger" aria-hidden="true" />
            <p className="font-pixel text-[10px] leading-relaxed text-danger">{error?.message}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <PixelButton variant="primary" className={smallButton} onClick={start}>
                <Camera className="h-4 w-4" aria-hidden="true" />
                RETRY CAMERA
              </PixelButton>
              <PixelButton className={smallButton} onClick={startDemo}>
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                PRESENTER MODE
              </PixelButton>
              <PixelButton className={smallButton} onClick={onSkip}>
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                SKIP LEVEL
              </PixelButton>
            </div>
            <p className="font-pixel text-[8px] text-cream/60">
              PRESENTER MODE USES NO CAMERA AND NO COMPUTER VISION. SKIPPING COSTS NO LIFE.
            </p>
          </Card>
        )}

        {phase === "demo" && (
          <Card striped>
            <p className="bg-danger px-2 py-1 font-pixel text-[9px] leading-relaxed text-bg">
              DEMO MODE - NOT COMPUTER VISION
            </p>
            <p className="font-body text-xl leading-tight text-cream">
              No camera is in use. The button below pretends the inspector saw you.
            </p>
            {current && (
              <PixelButton variant="primary" className={smallButton} onClick={demoPass} autoFocus>
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                SIMULATE: {CHALLENGE_TEXT[current].label}
              </PixelButton>
            )}
            <PixelButton className={smallButton} onClick={onSkip}>
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              SKIP LEVEL
            </PixelButton>
          </Card>
        )}

        {phase === "done" && (
          <Card>
            <Check className="h-10 w-10 text-mint" strokeWidth={4} aria-hidden="true" />
            <p className="font-pixel text-[10px] text-mint">SCAN COMPLETE. CAMERA OFF.</p>
          </Card>
        )}
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label="Inspection challenges">
        {CHALLENGE_ORDER.map((id, i) => {
          const done = i < stage;
          const active = i === stage && live;
          const fill = done ? 1 : active ? view.progress : 0;
          return (
            <li key={id} className="bevel-in bg-bg p-2">
              <div
                className={`flex items-center justify-between font-pixel text-[9px] ${
                  done ? "text-mint" : "text-cream/70"
                }`}
              >
                <span>
                  {i + 1}. {CHALLENGE_TEXT[id].label}
                </span>
                {done && <Check className="h-3 w-3" strokeWidth={4} aria-label="passed" />}
              </div>
              <div className="mt-1 h-2 bg-panel p-[1px]">
                <div className="h-full bg-mint" style={{ width: `${fill * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ol>

      <p
        className={`bevel-in min-h-[3rem] bg-bg px-3 py-2 text-center font-pixel text-[10px] leading-relaxed ${statusTone}`}
        role="status"
      >
        {status}
      </p>
    </div>
  );
}

function Card({ children, striped = false }: { children: ReactNode; striped?: boolean }) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center ${
        striped
          ? "bg-[repeating-linear-gradient(45deg,#131D25_0_10px,#1b2a31_10px_20px)]"
          : "bg-bg/90"
      }`}
    >
      {children}
    </div>
  );
}
