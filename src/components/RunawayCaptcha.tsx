"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { Check } from "lucide-react";
import { TileArt } from "@/components/TileArt";
import { DECOY_KINDS, LEVEL1, TARGET_KIND } from "@/lib/gameConfig";
import type { TileKind } from "@/lib/gameTypes";

interface Tile {
  /** Stable identity; never changes when the tile moves. */
  id: number;
  kind: TileKind;
  /** Grid slot 0-8 (row-major). The only thing shuffling/dodging mutates. */
  slot: number;
  locked: boolean;
  /** Bumped on each wrong pick to replay the red flash. */
  wrongNonce: number;
}

interface Popup {
  id: number;
  slot: number;
  text: string;
  positive: boolean;
}

interface RunawayCaptchaProps {
  /** False once the level is over (cleared) so the board freezes. */
  active: boolean;
  onTargetHit: () => void;
  onWrongPick: () => void;
  onTargetDodged: () => void;
}

const GAP_PX = 8;
const MAX_POPUPS = 6;

const KIND_LABEL: Record<TileKind, string> = {
  trafficLight: "traffic light",
  tree: "tree",
  bicycle: "bicycle",
  car: "car",
  cat: "cat",
  house: "house",
  bus: "bus",
};

function shuffled<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Always three traffic lights plus one of each decoy, in random slots. */
function createTiles(): Tile[] {
  const kinds: TileKind[] = [
    ...Array<TileKind>(LEVEL1.targetCount).fill(TARGET_KIND),
    ...DECOY_KINDS,
  ];
  return shuffled(kinds).map((kind, slot) => ({
    id: slot,
    kind,
    slot,
    locked: false,
    wrongNonce: 0,
  }));
}

function slotStyle(slot: number): CSSProperties {
  const col = slot % 3;
  const row = Math.floor(slot / 3);
  return {
    transform: `translate(calc(${col} * (100% + ${GAP_PX}px)), calc(${row} * (100% + ${GAP_PX}px)))`,
  };
}

export function RunawayCaptcha({
  active,
  onTargetHit,
  onWrongPick,
  onTargetDodged,
}: RunawayCaptchaProps) {
  const [tiles, setTiles] = useState<Tile[]>(createTiles);
  const [popups, setPopups] = useState<Popup[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<Tile[]>(tiles);
  const dodgeCountRef = useRef(0);
  const lastDodgeRef = useRef(-Infinity);
  const popupIdRef = useRef(0);
  const latest = useRef({ active, onTargetHit, onWrongPick, onTargetDodged });

  useEffect(() => {
    latest.current = { active, onTargetHit, onWrongPick, onTargetDodged };
  });

  const commit = useCallback((next: Tile[]) => {
    tilesRef.current = next;
    setTiles(next);
  }, []);

  const addPopup = useCallback((slot: number, text: string, positive: boolean) => {
    const id = popupIdRef.current++;
    setPopups((prev) => [...prev.slice(-(MAX_POPUPS - 1)), { id, slot, text, positive }]);
  }, []);

  // Periodic shuffle of every unlocked tile among the unlocked slots.
  useEffect(() => {
    if (!active) return;
    let intervalId: number | undefined;
    const shuffle = () => {
      const current = tilesRef.current;
      const free = current.filter((t) => !t.locked);
      const slots = shuffled(free.map((t) => t.slot));
      const slotById = new Map(free.map((t, i) => [t.id, slots[i]]));
      commit(current.map((t) => (t.locked ? t : { ...t, slot: slotById.get(t.id) ?? t.slot })));
    };
    const startId = window.setTimeout(() => {
      shuffle();
      intervalId = window.setInterval(shuffle, LEVEL1.shuffleIntervalMs);
    }, LEVEL1.firstShuffleDelayMs);
    return () => {
      window.clearTimeout(startId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [active, commit]);

  const select = useCallback(
    (id: number) => {
      const { active: isActive, onTargetHit: hit, onWrongPick: wrong } = latest.current;
      if (!isActive) return;
      const current = tilesRef.current;
      const tile = current.find((t) => t.id === id);
      if (!tile || tile.locked) return;

      if (tile.kind === TARGET_KIND) {
        commit(current.map((t) => (t.id === id ? { ...t, locked: true } : t)));
        addPopup(tile.slot, `+${LEVEL1.hitPoints}`, true);
        hit();
      } else {
        commit(current.map((t) => (t.id === id ? { ...t, wrongNonce: t.wrongNonce + 1 } : t)));
        addPopup(tile.slot, `-${LEVEL1.missPenalty}`, false);
        wrong();
      }
    },
    [commit, addPopup],
  );

  const handleBoardPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    if (!board || !latest.current.active) return;
    if (dodgeCountRef.current >= LEVEL1.maxDodges) return;
    const now = performance.now();
    if (now - lastDodgeRef.current < LEVEL1.dodgeCooldownMs) return;

    const rect = board.getBoundingClientRect();
    const tileSize = (rect.width - GAP_PX * 2) / 3;
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const center = (slot: number) => ({
      x: (slot % 3) * (tileSize + GAP_PX) + tileSize / 2,
      y: Math.floor(slot / 3) * (tileSize + GAP_PX) + tileSize / 2,
    });

    const current = tilesRef.current;
    const threat = current.find((t) => {
      if (t.kind !== TARGET_KIND || t.locked) return false;
      const c = center(t.slot);
      return Math.hypot(c.x - px, c.y - py) < tileSize * LEVEL1.dodgeTriggerRadius;
    });
    if (!threat) return;

    // Flee to one of the three unlocked slots farthest from the pointer.
    const destinations = current
      .filter((t) => !t.locked && t.id !== threat.id)
      .map((t) => ({ tile: t, dist: Math.hypot(center(t.slot).x - px, center(t.slot).y - py) }))
      .sort((a, b) => b.dist - a.dist)
      .slice(0, 3);
    if (destinations.length === 0) return;
    const swapWith = destinations[Math.floor(Math.random() * destinations.length)].tile;

    dodgeCountRef.current += 1;
    lastDodgeRef.current = now;
    commit(
      current.map((t) => {
        if (t.id === threat.id) return { ...t, slot: swapWith.slot };
        if (t.id === swapWith.id) return { ...t, slot: threat.slot };
        return t;
      }),
    );
    latest.current.onTargetDodged();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(id);
    }
  };

  return (
    <div
      ref={boardRef}
      className="relative aspect-square w-full touch-none select-none"
      onPointerMove={handleBoardPointerMove}
    >
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          aria-label={`${KIND_LABEL[tile.kind]}${tile.locked ? " (selected)" : ""}`}
          aria-pressed={tile.locked}
          disabled={!active && !tile.locked}
          onPointerDown={(e) => {
            e.preventDefault();
            select(tile.id);
          }}
          onKeyDown={(e) => handleKeyDown(e, tile.id)}
          style={{
            ...slotStyle(tile.slot),
            width: `calc((100% - ${GAP_PX * 2}px) / 3)`,
            height: `calc((100% - ${GAP_PX * 2}px) / 3)`,
          }}
          className={`bevel-out absolute left-0 top-0 cursor-pointer overflow-hidden p-0 transition-transform duration-500 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint ${
            tile.locked ? "z-0" : "z-10"
          }`}
        >
          <TileArt kind={tile.kind} />
          {tile.wrongNonce > 0 && (
            <span
              key={tile.wrongNonce}
              className="animate-wrong pointer-events-none absolute inset-0 bg-danger"
            />
          )}
          {tile.locked && (
            <span className="animate-lock pointer-events-none absolute inset-0 flex items-center justify-center bg-mint/60 ring-4 ring-inset ring-mint">
              <span className="flex h-3/5 w-3/5 items-center justify-center bg-bg">
                <Check className="h-4/5 w-4/5 text-mint" strokeWidth={4} aria-hidden="true" />
              </span>
            </span>
          )}
        </button>
      ))}

      {popups.map((popup) => (
        <div
          key={popup.id}
          style={{
            ...slotStyle(popup.slot),
            width: `calc((100% - ${GAP_PX * 2}px) / 3)`,
            height: `calc((100% - ${GAP_PX * 2}px) / 3)`,
          }}
          className="pointer-events-none absolute left-0 top-0 z-20 flex items-center justify-center"
        >
          <span
            onAnimationEnd={() => setPopups((prev) => prev.filter((p) => p.id !== popup.id))}
            className={`animate-popup font-pixel text-xl [text-shadow:2px_2px_0_#131D25] sm:text-2xl ${
              popup.positive ? "text-mint" : "text-danger"
            }`}
          >
            {popup.text}
          </span>
        </div>
      ))}
    </div>
  );
}
