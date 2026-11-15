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
  /** Fired when the Gatekeeper's hover cheat swaps a target with a decoy. */
  onTileSwapped: () => void;
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
  onTileSwapped,
}: RunawayCaptchaProps) {
  const [tiles, setTiles] = useState<Tile[]>(createTiles);
  const [popups, setPopups] = useState<Popup[]>([]);
  /** Target currently hovered long enough to be flagged for "maintenance". */
  const [warnId, setWarnId] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<Tile[]>(tiles);
  const dodgeCountRef = useRef(0);
  const lastDodgeRef = useRef(-Infinity);
  const popupIdRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const hoverRef = useRef<{ id: number; timer: number } | null>(null);
  const swapCountRef = useRef(new Map<number, number>());
  const lastSwapRef = useRef(-Infinity);
  /** Until when any tile movement is still animating. */
  const movingUntilRef = useRef(0);
  /** Until when a hover swap is still animating; shuffles and dodges wait it out. */
  const swapUntilRef = useRef(0);
  const syncHoverRef = useRef<() => void>(() => {});
  const fireSwapRef = useRef<(id: number) => void>(() => {});
  const latest = useRef({ active, onTargetHit, onWrongPick, onTargetDodged, onTileSwapped });

  useEffect(() => {
    latest.current = { active, onTargetHit, onWrongPick, onTargetDodged, onTileSwapped };
  });

  const commit = useCallback((next: Tile[], moved = false) => {
    tilesRef.current = next;
    if (moved) movingUntilRef.current = performance.now() + LEVEL1.moveSettleMs;
    setTiles(next);
    // Tiles can move under a stationary pointer, so re-check what is hovered.
    syncHoverRef.current();
  }, []);

  const addPopup = useCallback((slot: number, text: string, positive: boolean) => {
    const id = popupIdRef.current++;
    setPopups((prev) => [...prev.slice(-(MAX_POPUPS - 1)), { id, slot, text, positive }]);
  }, []);

  /** The tile under the last known pointer position, using the same slot geometry as rendering. */
  const tileUnderPointer = useCallback((): Tile | null => {
    const board = boardRef.current;
    const p = pointerRef.current;
    if (!board || !p) return null;
    const rect = board.getBoundingClientRect();
    const size = (rect.width - GAP_PX * 2) / 3;
    const step = size + GAP_PX;
    const x = p.x - rect.left;
    const y = p.y - rect.top;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    if (col < 0 || col > 2 || row < 0 || row > 2) return null;
    if (x - col * step > size || y - row * step > size) return null;
    return tilesRef.current.find((t) => t.slot === row * 3 + col) ?? null;
  }, []);

  const clearHover = useCallback(() => {
    const h = hoverRef.current;
    if (h) window.clearTimeout(h.timer);
    hoverRef.current = null;
    setWarnId(null);
  }, []);

  const fireSwap = useCallback(
    (id: number) => {
      const h = hoverRef.current;
      if (!h || h.id !== id) return;
      hoverRef.current = null;

      const current = tilesRef.current;
      const tile = current.find((t) => t.id === id);
      const count = swapCountRef.current.get(id) ?? 0;
      if (
        !latest.current.active ||
        !tile ||
        tile.locked ||
        count >= LEVEL1.maxSwapsPerTarget ||
        tileUnderPointer()?.id !== id
      ) {
        setWarnId(null);
        return;
      }

      // Wait out the global cooldown and any tile still sliding; never stack animations.
      const now = performance.now();
      const wait = Math.max(lastSwapRef.current + LEVEL1.swapCooldownMs, movingUntilRef.current) - now;
      if (wait > 0) {
        const timer = window.setTimeout(() => fireSwapRef.current(id), wait + 16);
        hoverRef.current = { id, timer };
        return;
      }

      const partners = current.filter((t) => !t.locked && t.kind !== TARGET_KIND);
      if (partners.length === 0) {
        setWarnId(null);
        return;
      }
      const partner = partners[Math.floor(Math.random() * partners.length)];

      swapCountRef.current.set(id, count + 1);
      lastSwapRef.current = now;
      swapUntilRef.current = now + LEVEL1.moveSettleMs;
      setWarnId(null);
      commit(
        current.map((t) => {
          if (t.id === tile.id) return { ...t, slot: partner.slot };
          if (t.id === partner.id) return { ...t, slot: tile.slot };
          return t;
        }),
        true,
      );
      latest.current.onTileSwapped();
    },
    [commit, tileUnderPointer],
  );

  /** Starts or cancels the hover timer depending on what the pointer is resting on. */
  const syncHover = useCallback(() => {
    const under = latest.current.active ? tileUnderPointer() : null;
    const eligible =
      under &&
      under.kind === TARGET_KIND &&
      !under.locked &&
      (swapCountRef.current.get(under.id) ?? 0) < LEVEL1.maxSwapsPerTarget
        ? under
        : null;
    if ((hoverRef.current?.id ?? null) === (eligible?.id ?? null)) return;
    clearHover();
    if (!eligible) return;
    const id = eligible.id;
    hoverRef.current = {
      id,
      timer: window.setTimeout(() => fireSwapRef.current(id), LEVEL1.hoverSwapMs),
    };
    setWarnId(id);
  }, [tileUnderPointer, clearHover]);

  useEffect(() => {
    fireSwapRef.current = fireSwap;
  }, [fireSwap]);

  useEffect(() => {
    syncHoverRef.current = syncHover;
  }, [syncHover]);

  useEffect(
    () => () => {
      const h = hoverRef.current;
      if (h) window.clearTimeout(h.timer);
    },
    [],
  );

  // Periodic shuffle of every unlocked tile among the unlocked slots.
  useEffect(() => {
    if (!active) return;
    let intervalId: number | undefined;
    const shuffle = () => {
      // A hover swap is mid-slide: skip this tick instead of stacking animations.
      if (performance.now() < swapUntilRef.current) return;
      const current = tilesRef.current;
      const free = current.filter((t) => !t.locked);
      const slots = shuffled(free.map((t) => t.slot));
      const slotById = new Map(free.map((t, i) => [t.id, slots[i]]));
      commit(
        current.map((t) => (t.locked ? t : { ...t, slot: slotById.get(t.id) ?? t.slot })),
        true,
      );
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
    pointerRef.current = { x: event.clientX, y: event.clientY };
    syncHover();

    const board = boardRef.current;
    if (!board || !latest.current.active) return;
    if (dodgeCountRef.current >= LEVEL1.maxDodges) return;
    const now = performance.now();
    if (now < swapUntilRef.current) return;
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
      true,
    );
    latest.current.onTargetDodged();
  };

  const handleBoardPointerLeave = () => {
    pointerRef.current = null;
    syncHover();
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
      onPointerLeave={handleBoardPointerLeave}
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
          {warnId === tile.id && !tile.locked && (
            <span className="animate-pulse-fast pointer-events-none absolute inset-0 bg-danger/20 ring-4 ring-inset ring-danger" />
          )}
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
