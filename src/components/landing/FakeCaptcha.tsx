"use client";

import { Check, ShieldCheck } from "lucide-react";

export type CaptchaState = "idle" | "verifying" | "verified";

interface FakeCaptchaProps {
  state: CaptchaState;
  onActivate: () => void;
}

/** A generic, parody "I'm not a robot" widget. It does no real verification or security. */
export function FakeCaptcha({ state, onActivate }: FakeCaptchaProps) {
  return (
    <div className="flex w-full max-w-[19rem] items-center justify-between gap-3 rounded-[3px] border border-[#d3d3d3] bg-[#fafafa] px-3 py-3 font-site-sans shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={state === "verified"}
          aria-busy={state === "verifying"}
          aria-label="I'm not a robot"
          disabled={state !== "idle"}
          onClick={onActivate}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[2px] border-2 border-[#c1c1c1] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bean-green enabled:cursor-pointer enabled:hover:border-[#8a8a8a] disabled:cursor-default"
        >
          {state === "verifying" && <span className="captcha-spinner" aria-hidden="true" />}
          {state === "verified" && (
            <Check className="h-5 w-5 text-[#1e9e55]" strokeWidth={4} aria-hidden="true" />
          )}
        </button>
        <span className="text-[15px] text-[#222]">I&apos;m not a robot</span>
      </div>

      <div className="flex flex-col items-center text-[#6b7280]" aria-hidden="true">
        <ShieldCheck className="h-6 w-6" />
        <span className="mt-0.5 text-[9px] leading-tight">Human check</span>
        <span className="text-[8px] leading-tight">Privacy · Terms</span>
      </div>

      <span className="sr-only" role="status">
        {state === "verifying" ? "Verifying" : state === "verified" ? "Verified" : ""}
      </span>
    </div>
  );
}
