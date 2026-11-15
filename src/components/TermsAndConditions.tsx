"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationEvent, UIEvent } from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { TERMS } from "@/lib/gameConfig";
import { BASE_CLAUSES, END_MARK, NEW_CLAUSE, TERMS_TITLE } from "@/lib/termsContent";

type Phase = "reading" | "ready" | "swapped" | "updated" | "final";

interface Toast {
  id: number;
  title: string;
  body: string;
}

interface TermsAndConditionsProps {
  /** True once the level is won, so the controls go inert. */
  frozen: boolean;
  /** True when this attempt follows a timeout. */
  retry: boolean;
  onReachedBottom: () => void;
  onSwap: () => void;
  onNewClause: () => void;
  onDisagree: () => void;
  onAgree: () => void;
}

const BOTTOM_TOLERANCE_PX = 4;

const STATUS: Record<Phase, string> = {
  reading: "SCROLL TO THE BOTTOM TO ENABLE I AGREE",
  ready: "I AGREE IS NOW ENABLED",
  swapped: "BUTTONS RECONFIGURED. CHECK THEM CAREFULLY.",
  updated: "NEW CLAUSE ADDED. SCROLL TO THE BOTTOM AGAIN.",
  final: "I AGREE IS ENABLED. PROBABLY.",
};

const buttonBase =
  "bevel-out pixel-btn font-pixel flex h-16 flex-1 cursor-pointer items-center justify-center px-3 text-xs sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream disabled:cursor-not-allowed disabled:opacity-50";

export function TermsAndConditions({
  frozen,
  retry,
  onReachedBottom,
  onSwap,
  onNewClause,
  onDisagree,
  onAgree,
}: TermsAndConditionsProps) {
  const [phase, setPhaseState] = useState<Phase>("reading");
  const [toast, setToast] = useState<Toast | null>(null);
  const [shaking, setShaking] = useState(false);
  const [flash, setFlash] = useState(0);

  // Refs mirror state that event handlers must read synchronously, so rapid events never see stale values.
  const phaseRef = useRef<Phase>("reading");
  const lockUntil = useRef(0);
  const completed = useRef(false);
  const toastId = useRef(0);
  const docRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const swapped = phase !== "reading" && phase !== "ready";
  const hasNewClause = phase === "updated" || phase === "final";
  const agreeEnabled = !frozen && (phase === "ready" || phase === "swapped" || phase === "final");

  const go = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const syncBar = useCallback(() => {
    const el = docRef.current;
    if (!el || !barRef.current) return;
    const max = el.scrollHeight - el.clientHeight;
    const pct = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 100;
    barRef.current.style.width = `${pct}%`;
  }, []);

  useEffect(() => {
    docRef.current?.focus({ preventScroll: true });
  }, []);

  // New content changes the scroll range without firing a scroll event.
  useEffect(() => {
    syncBar();
  }, [phase, syncBar]);

  const alarm = (title: string, body: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, title, body });
    setShaking(true);
    setFlash((n) => n + 1);
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    syncBar();
    if (frozen) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.clientHeight - el.scrollTop > BOTTOM_TOLERANCE_PX) return;
    if (phaseRef.current === "reading") {
      go("ready");
      onReachedBottom();
    } else if (phaseRef.current === "updated") {
      go("final");
      onReachedBottom();
    }
  };

  const handleAgree = () => {
    if (frozen || completed.current || performance.now() < lockUntil.current) return;
    switch (phaseRef.current) {
      case "ready":
        lockUntil.current = performance.now() + TERMS.swapLockMs;
        go("swapped");
        alarm("ERROR 418", "I AGREE and I DISAGREE have been reconfigured for your security.");
        onSwap();
        break;
      case "swapped":
        go("updated");
        alarm("SECURITY POLICY UPDATED", "1 new clause has been added. Please read it. All of it.");
        onNewClause();
        docRef.current?.focus({ preventScroll: true });
        break;
      case "final":
        completed.current = true;
        onAgree();
        break;
      default:
        break;
    }
  };

  const handleDisagree = () => {
    if (frozen || performance.now() < lockUntil.current) return;
    onDisagree();
  };

  const handleRootAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setShaking(false);
  };

  return (
    <div
      className={`relative flex flex-col gap-2 ${shaking ? "animate-shake-twice" : ""}`}
      onAnimationEnd={handleRootAnimationEnd}
    >
      <div className="bg-mint p-3 text-bg">
        <p className="font-body text-xl leading-none">Please read the agreement carefully</p>
        <p className="font-pixel text-base sm:text-lg">TERMS &amp; CONDITIONS</p>
      </div>

      <div
        className={`flex h-6 items-center justify-between px-2 font-pixel text-[9px] ${
          hasNewClause ? "animate-pulse-fast bg-danger text-bg" : "bg-bg text-cream/70"
        }`}
      >
        <span>{hasNewClause ? "SECURITY POLICY UPDATED" : "SECURITY POLICY"}</span>
        <span>{hasNewClause ? "v2.0" : "v1.0"}</span>
      </div>

      <div className="relative">
        <div
          ref={docRef}
          tabIndex={0}
          role="region"
          aria-label="Terms and conditions document. Scroll to the bottom to enable I AGREE."
          onScroll={handleScroll}
          className="retro-scroll bevel-in h-72 overflow-y-auto bg-cream p-3 text-bg focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-mint"
        >
          <h3 className="mb-3 font-pixel text-[10px] leading-relaxed">{TERMS_TITLE}</h3>
          {BASE_CLAUSES.map((clause) => (
            <p key={clause} className="mb-3 font-body text-xl leading-tight">
              {clause}
            </p>
          ))}
          {hasNewClause && (
            <p className="mb-3 bg-danger/60 px-1 font-body text-xl leading-tight">
              <span className="mr-2 bg-bg px-1 font-pixel text-[8px] text-danger">NEW</span>
              {NEW_CLAUSE}
            </p>
          )}
          <p className="font-pixel text-[9px] leading-relaxed">{END_MARK}</p>
        </div>

        {toast && (
          <div
            key={toast.id}
            role="alert"
            onAnimationEnd={() => setToast(null)}
            className="animate-toast bevel-out pointer-events-none absolute left-1/2 top-1/2 z-20 w-[82%] -translate-x-1/2 -translate-y-1/2 bg-panel p-1"
          >
            <div className="flex items-center gap-2 bg-danger px-2 py-1 font-pixel text-[9px] text-bg">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              {toast.title}
            </div>
            <p className="bg-cream p-2 font-body text-xl leading-tight text-bg">{toast.body}</p>
          </div>
        )}
      </div>

      <div className="h-3 bg-bg p-[2px]" aria-hidden="true">
        <div ref={barRef} className="h-full w-0 bg-mint" />
      </div>

      <p
        className="bevel-in min-h-[3rem] bg-bg px-3 py-2 text-center font-pixel text-[10px] leading-relaxed text-cream/80"
        role="status"
      >
        {retry && phase === "reading" && (
          <span className="mb-1 block text-danger">TIME&apos;S UP. -1 LIFE. AGREEMENT RESET.</span>
        )}
        {STATUS[phase]}
      </p>

      <div className="flex gap-3">
        <motion.button
          layout="position"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          type="button"
          disabled={!agreeEnabled}
          onClick={handleAgree}
          className={`${buttonBase} bg-mint text-bg ${swapped ? "order-2" : "order-1"}`}
        >
          I AGREE
        </motion.button>
        <motion.button
          layout="position"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          type="button"
          disabled={frozen}
          onClick={handleDisagree}
          className={`${buttonBase} bg-danger text-bg ${swapped ? "order-1" : "order-2"}`}
        >
          I DISAGREE
        </motion.button>
      </div>

      {flash > 0 && (
        <div
          key={flash}
          className="animate-wrong pointer-events-none absolute inset-0 z-10 bg-danger/50"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
