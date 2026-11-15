import { BadgeCheck } from "lucide-react";
import { MOD_PROFILE, MOD_STATUS_META } from "@/lib/gatekeeperProfile";
import type { ModStatus } from "@/lib/gatekeeperProfile";

interface ModProfileProps {
  status: ModStatus;
  className?: string;
}

/** Fictional retro moderator header: name, role badge, username and presence status. */
export function ModProfile({ status, className = "" }: ModProfileProps) {
  const meta = MOD_STATUS_META[status];
  return (
    <div className={`flex flex-col gap-0.5 bg-bg px-2 py-1.5 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-1.5">
        <span className="font-pixel text-[9px] text-cream">{MOD_PROFILE.name}</span>
        <span className="flex items-center gap-0.5 bg-danger px-1 py-px font-pixel text-[7px] text-bg">
          <BadgeCheck className="h-2.5 w-2.5" aria-hidden="true" />
          {MOD_PROFILE.role}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span className="font-pixel text-[7px] text-cream/60">{MOD_PROFILE.username}</span>
        <span className="flex items-center gap-1 font-pixel text-[7px] text-cream/80">
          <span
            className={`inline-block h-2 w-2 rounded-full ${meta.pulse ? "animate-pulse-fast" : ""}`}
            style={
              meta.hollow
                ? { border: `2px solid ${meta.color}` }
                : { backgroundColor: meta.color }
            }
            aria-hidden="true"
          />
          {status}
        </span>
      </div>
    </div>
  );
}
