"use client";

import { Check, ShieldCheck } from "lucide-react";

export type CaptchaState = "idle" | "verifying" | "verified";

export const CAPTCHA_TITLE_ID = "captcha-title";
export const CAPTCHA_DESC_ID = "captcha-desc";

interface FakeCaptchaProps {
  state: CaptchaState;
  onActivate: () => void;
}

/** A generic, parody "I'm not a robot" panel. It does no real verification or security. */
export function FakeCaptcha({ state, onActivate }: FakeCaptchaProps) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-[#cfd2d6] bg-white font-site-sans shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-2 border-b border-[#e1e3e6] bg-[#f3f4f6] px-5 py-3">
        <ShieldCheck className="h-5 w-5 text-[#4b5563]" aria-hidden="true" />
        <h2 id={CAPTCHA_TITLE_ID} className="text-sm font-semibold text-[#1f2937]">
          Verify you&apos;re human
        </h2>
      </div>

      <div className="px-5 py-6">
        <p id={CAPTCHA_DESC_ID} className="mb-4 text-sm text-[#4b5563]">
          One quick step before you continue to The Daily Bean.
        </p>

        <button
          type="button"
          role="checkbox"
          aria-checked={state === "verified"}
          aria-busy={state === "verifying"}
          autoFocus
          disabled={state !== "idle"}
          onClick={onActivate}
          className="flex w-full items-center gap-4 rounded border border-[#d3d6da] bg-[#fafafa] px-4 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bean-green enabled:cursor-pointer enabled:hover:bg-[#f1f2f4] disabled:cursor-default"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border-2 border-[#9ca3af] bg-white">
            {state === "verifying" && <span className="captcha-spinner" aria-hidden="true" />}
            {state === "verified" && (
              <Check className="h-6 w-6 text-[#1e9e55]" strokeWidth={4} aria-hidden="true" />
            )}
          </span>
          <span className="text-xl text-[#111827]">I&apos;m not a robot</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-[#e1e3e6] bg-[#f9fafb] px-5 py-2 text-[11px] text-[#6b7280]">
        <span>Human check</span>
        <span>Privacy · Terms</span>
      </div>

      <span className="sr-only" role="status">
        {state === "verifying" ? "Verifying" : state === "verified" ? "Verified" : ""}
      </span>
    </div>
  );
}
