"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { MAZE } from "@/lib/gameConfig";
import type { MazeNotice } from "@/lib/gameTypes";
import {
  FINISH_CELLS,
  FLOOR_CELLS,
  GATE_CELL,
  MAZE_CELL,
  MAZE_COLS,
  MAZE_H,
  MAZE_ROWS,
  MAZE_W,
  NARROW_CELLS,
  NARROW_INSET,
  SQUEEZE,
  START_CELL,
  WALL_CELLS,
  cellCenter,
  cellOrigin,
  inCell,
  inSqueezeTrigger,
  isBlocked,
} from "@/lib/mazeGeometry";
import type { Point } from "@/lib/mazeGeometry";

type Status = "idle" | "active" | "dead" | "won";
type Lockdown = "none" | "warning" | "live";
type Squeeze = "none" | "closing" | "done";

interface MouseMazeProps {
  /** True once the level is over (win) so the maze ignores input. */
  frozen: boolean;
  notice: MazeNotice | null;
  onEnter: () => void;
  onExitMoved: () => void;
  onLockdown: () => void;
  onPassedGate: () => void;
  onSqueeze: () => void;
  onWallHit: () => void;
  onFinish: () => void;
}

/** Collision sampling interval along a pointer segment, in maze units. */
const SAMPLE_STEP = 2;
const GATE_ORIGIN = cellOrigin(GATE_CELL);
const FIRST_EXIT_CENTER = cellCenter(FINISH_CELLS[0]);
const GATE_CYCLE_MS = MAZE.gate.closedMs + MAZE.gate.openMs + MAZE.gate.warnMs;
const CELL_COUNT = MAZE_COLS * MAZE_ROWS;
const ALL_CELLS = Array.from({ length: CELL_COUNT }, (_, i) => ({
  col: i % MAZE_COLS,
  row: Math.floor(i / MAZE_COLS),
}));

/** Distance from a point to the nearest edge of a cell (0 when inside). */
function distanceToCell(p: Point, col: number, row: number): number {
  const dx = Math.max(col * MAZE_CELL - p.x, 0, p.x - (col + 1) * MAZE_CELL);
  const dy = Math.max(row * MAZE_CELL - p.y, 0, p.y - (row + 1) * MAZE_CELL);
  return Math.hypot(dx, dy);
}

const STATUS_TEXT: Record<string, string> = {
  idle: "CLICK THE START ZONE TO BEGIN",
  dead: "WALL CONTACT!",
  active: "STAY IN THE CORRIDOR. DO NOT TOUCH THE WALLS.",
  warning: "!! SECURITY LOCKDOWN INCOMING !!",
  live: "SECURITY GATE ONLINE. TIME YOUR CROSSING.",
  won: "ACCESS GRANTED?!",
};

export function MouseMaze({
  frozen,
  notice,
  onEnter,
  onExitMoved,
  onLockdown,
  onPassedGate,
  onSqueeze,
  onWallHit,
  onFinish,
}: MouseMazeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const cursorRef = useRef<SVGGElement>(null);
  const gateRef = useRef<SVGGElement>(null);
  const leafRef = useRef<SVGRectElement>(null);
  const jawTopRef = useRef<SVGRectElement>(null);
  const jawBottomRef = useRef<SVGRectElement>(null);
  const fogRef = useRef<SVGGElement>(null);
  const revealed = useRef(new Uint8Array(CELL_COUNT));

  const [status, setStatus] = useState<Status>("idle");
  const [exitIndex, setExitIndex] = useState<0 | 1>(0);
  const [lockdown, setLockdown] = useState<Lockdown>("none");
  const [squeeze, setSqueeze] = useState<Squeeze>("none");
  const [exitWarning, setExitWarning] = useState(false);

  // Transient simulation state lives in a ref so pointer moves never re-render.
  const sim = useRef({
    status: "idle" as Status,
    exit: 0 as 0 | 1,
    exitMoved: false,
    lockdown: "none" as Lockdown,
    lockdownAt: 0,
    liveAt: 0,
    passedGate: false,
    squeeze: "none" as Squeeze,
    squeezeElapsed: 0,
    squeezeReported: false,
    jawTop: 0,
    jawBottom: 0,
    exitWarning: false,
    leaf: 0,
    prev: null as Point | null,
  });
  const latest = useRef({
    frozen,
    onEnter,
    onExitMoved,
    onLockdown,
    onPassedGate,
    onSqueeze,
    onWallHit,
    onFinish,
  });
  useEffect(() => {
    latest.current = {
      frozen,
      onEnter,
      onExitMoved,
      onLockdown,
      onPassedGate,
      onSqueeze,
      onWallHit,
      onFinish,
    };
  });

  // Drives the gate leaf and the lockdown countdown; uses refs only, so it runs once per mount.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      const s = sim.current;
      if (s.status === "active" && !latest.current.frozen) {
        if (s.squeeze === "closing") {
          // Frame-time accumulation, so a pause never makes the jaws jump. Ease-out: they slam, then settle.
          // A jaw never advances onto the cursor: it stops a few units short and resumes once clear.
          const { maxIntrude, x0, x1, yTop, yBottom } = SQUEEZE;
          s.squeezeElapsed += dt;
          const t = Math.min(1, s.squeezeElapsed / MAZE.squeezeCloseMs);
          const wanted = (1 - (1 - t) ** 3) * maxIntrude;
          const near = s.prev !== null && s.prev.x >= x0 - 20 && s.prev.x < x1 + 20;
          const capTop = near && s.prev ? s.prev.y - yTop - MAZE.squeezeClearance : maxIntrude;
          const capBottom = near && s.prev ? yBottom - s.prev.y - MAZE.squeezeClearance : maxIntrude;
          s.jawTop = Math.max(s.jawTop, Math.min(wanted, capTop));
          s.jawBottom = Math.max(s.jawBottom, Math.min(wanted, capBottom));
          jawTopRef.current?.setAttribute("height", String(s.jawTop));
          if (jawBottomRef.current) {
            jawBottomRef.current.setAttribute("y", String(yBottom - s.jawBottom));
            jawBottomRef.current.setAttribute("height", String(s.jawBottom));
          }
          // The Gatekeeper only reacts once the walls have finished moving.
          if (t >= 1 && !s.squeezeReported) {
            s.squeezeReported = true;
            latest.current.onSqueeze();
          }
          if (s.jawTop >= maxIntrude && s.jawBottom >= maxIntrude) {
            s.squeeze = "done";
            setSqueeze("done");
          }
        }
        if (s.lockdown === "warning" && now >= s.lockdownAt) {
          s.lockdown = "live";
          s.liveAt = now;
          setLockdown("live");
          latest.current.onLockdown();
        }
        if (s.lockdown === "live") {
          const { closedMs, openMs, slideMs } = MAZE.gate;
          const t = (now - s.liveAt) % GATE_CYCLE_MS;
          const wantsClosed = t < closedMs || t >= GATE_CYCLE_MS - slideMs;
          const warn = t >= closedMs + openMs && t < GATE_CYCLE_MS - slideMs;
          // Never close on top of the player.
          const occupied = s.prev !== null && inCell(s.prev, GATE_CELL, 4);
          const target = wantsClosed && !occupied ? 1 : 0;
          const step = dt / slideMs;
          s.leaf =
            target > s.leaf
              ? Math.min(target, s.leaf + step)
              : Math.max(target, s.leaf - step);
          leafRef.current?.setAttribute("width", String(s.leaf * MAZE_CELL));
          if (gateRef.current) gateRef.current.dataset.warn = warn ? "1" : "0";
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toMaze = (e: PointerEvent): Point | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) * MAZE_W) / rect.width,
      y: ((e.clientY - rect.top) * MAZE_H) / rect.height,
    };
  };

  const placeCursor = (p: Point) => {
    cursorRef.current?.setAttribute("transform", `translate(${p.x} ${p.y})`);
  };

  /** Lights every cell within the reveal radius of p (or all of them), and keeps them lit. */
  const reveal = useCallback((p: Point, all = false) => {
    const fog = fogRef.current;
    if (!fog) return;
    const lit = revealed.current;
    for (let i = 0; i < CELL_COUNT; i++) {
      if (lit[i]) continue;
      const { col, row } = ALL_CELLS[i];
      if (!all && distanceToCell(p, col, row) > MAZE.revealRadius) continue;
      lit[i] = 1;
      (fog.children[i] as SVGElement).style.opacity = "0";
    }
  }, []);

  // Before START only the area around the start cell is lit.
  useEffect(() => {
    reveal(cellCenter(START_CELL));
  }, [reveal]);

  const fail = () => {
    const s = sim.current;
    if (s.status !== "active") return;
    s.status = "dead";
    latest.current.onWallHit();
  };

  const advance = (to: Point) => {
    const s = sim.current;
    const from = s.prev ?? to;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / SAMPLE_STEP));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const p = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };

      if (isBlocked(p, s.leaf, { top: s.jawTop, bottom: s.jawBottom })) {
        fail();
        return;
      }

      if (s.squeeze === "none" && inSqueezeTrigger(p)) {
        s.squeeze = "closing";
        s.squeezeElapsed = 0;
        setSqueeze("closing");
      }

      if (
        !s.exitMoved &&
        Math.hypot(p.x - FIRST_EXIT_CENTER.x, p.y - FIRST_EXIT_CENTER.y) <
          MAZE.approachTriggerRadius
      ) {
        s.exitMoved = true;
        s.exit = 1;
        s.lockdown = "warning";
        s.lockdownAt = performance.now() + MAZE.lockdownWarnMs;
        setExitIndex(1);
        setLockdown("warning");
        setExitWarning(false);
        s.exitWarning = false;
        latest.current.onExitMoved();
      }

      if (
        s.lockdown === "live" &&
        !s.passedGate &&
        p.x >= GATE_ORIGIN.x &&
        p.x < GATE_ORIGIN.x + MAZE_CELL &&
        p.y >= GATE_ORIGIN.y + MAZE_CELL
      ) {
        s.passedGate = true;
        latest.current.onPassedGate();
      }

      if (inCell(p, FINISH_CELLS[s.exit])) {
        s.status = "won";
        s.prev = p;
        setStatus("won");
        reveal(p, true);
        latest.current.onFinish();
        return;
      }
    }

    s.prev = to;
    placeCursor(to);
    reveal(to);

    const near =
      !s.exitMoved &&
      Math.hypot(to.x - FIRST_EXIT_CENTER.x, to.y - FIRST_EXIT_CENTER.y) <
        MAZE.approachWarnRadius;
    if (near !== s.exitWarning) {
      s.exitWarning = near;
      setExitWarning(near);
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (latest.current.frozen) return;
    const p = toMaze(e);
    if (!p) return;
    if (s.status === "idle") {
      if (!inCell(p, START_CELL)) return;
      s.status = "active";
      s.prev = p;
      placeCursor(p);
      setStatus("active");
      latest.current.onEnter();
    } else if (s.status === "active") {
      advance(p);
    }
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (sim.current.status !== "active" || latest.current.frozen) return;
    const p = toMaze(e);
    if (p) advance(p);
  };

  const handlePointerLeave = () => {
    if (latest.current.frozen) return;
    fail();
  };

  const finish = FINISH_CELLS[exitIndex];
  const finishOrigin = cellOrigin(finish);
  const oldExitOrigin = cellOrigin(FINISH_CELLS[0]);
  const startOrigin = cellOrigin(START_CELL);
  const statusKey = status === "active" && lockdown !== "none" ? lockdown : status;
  const showLockdown = lockdown !== "none";

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-mint p-3 text-bg">
        <p className="font-body text-xl leading-none">Mouse maze: click START, then reach</p>
        <p className="font-pixel text-base sm:text-lg">THE FINISH</p>
      </div>

      <div
        className="bevel-in relative touch-none select-none bg-bg"
        style={{ cursor: status === "active" ? "none" : "pointer" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAZE_W} ${MAZE_H}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Maze. Click START, then guide the cursor to the FINISH without touching the walls."
          shapeRendering="crispEdges"
        >
          <defs>
            <pattern id="wall-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#17232a" />
              <rect width="4" height="4" fill="#1d2d35" />
              <rect x="4" y="4" width="4" height="4" fill="#1d2d35" />
            </pattern>
            <pattern id="floor-pattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#3f716e" />
              <rect width="4" height="4" fill="#467a76" />
              <rect x="4" y="4" width="4" height="4" fill="#467a76" />
            </pattern>
            <pattern id="finish-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#E1E5D6" />
              <rect width="5" height="5" fill="#131D25" />
              <rect x="5" y="5" width="5" height="5" fill="#131D25" />
            </pattern>
            <pattern
              id="hazard-pattern"
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="12" height="12" fill="#F1A59C" />
              <rect width="6" height="12" fill="#131D25" />
            </pattern>
          </defs>

          <rect width={MAZE_W} height={MAZE_H} fill="url(#wall-pattern)" />
          {WALL_CELLS.map((c) => (
            <rect
              key={`w${c.col}-${c.row}`}
              x={c.col * MAZE_CELL}
              y={c.row * MAZE_CELL}
              width={MAZE_CELL}
              height={MAZE_CELL}
              fill="none"
              stroke="#0b1318"
              strokeWidth="1"
            />
          ))}
          {FLOOR_CELLS.map((c) => (
            <rect
              key={`f${c.col}-${c.row}`}
              x={c.col * MAZE_CELL}
              y={c.row * MAZE_CELL}
              width={MAZE_CELL}
              height={MAZE_CELL}
              fill="url(#floor-pattern)"
            />
          ))}
          {/* Narrow passages: wall strips drawn over the floor, matching isWalkable */}
          {NARROW_CELLS.map((c) => {
            const x = c.col * MAZE_CELL;
            const y = c.row * MAZE_CELL;
            const strips =
              c.axis === "h"
                ? [
                    { x, y, w: MAZE_CELL, h: NARROW_INSET },
                    { x, y: y + MAZE_CELL - NARROW_INSET, w: MAZE_CELL, h: NARROW_INSET },
                  ]
                : [
                    { x, y, w: NARROW_INSET, h: MAZE_CELL },
                    { x: x + MAZE_CELL - NARROW_INSET, y, w: NARROW_INSET, h: MAZE_CELL },
                  ];
            return strips.map((s, i) => (
              <rect
                key={`n${c.col}-${c.row}-${i}`}
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                fill="url(#wall-pattern)"
                stroke="#0b1318"
                strokeWidth="1"
              />
            ));
          })}

          {/* START */}
          <g>
            <rect
              x={startOrigin.x}
              y={startOrigin.y}
              width={MAZE_CELL}
              height={MAZE_CELL}
              fill="#A8F0BB"
              className={status === "idle" ? "animate-pulse-fast" : ""}
            />
            <text
              x={startOrigin.x + MAZE_CELL / 2}
              y={startOrigin.y + MAZE_CELL / 2 + 5}
              textAnchor="middle"
              fontSize="15"
              fill="#131D25"
              style={{ fontFamily: "var(--font-body-src), monospace" }}
            >
              START
            </text>
          </g>

          {/* Original exit, abandoned once the Gatekeeper moves it */}
          {exitIndex === 1 && (
            <g>
              <rect
                x={oldExitOrigin.x}
                y={oldExitOrigin.y}
                width={MAZE_CELL}
                height={MAZE_CELL}
                fill="#F1A59C"
                opacity="0.55"
              />
              <path
                d={`M${oldExitOrigin.x + 10} ${oldExitOrigin.y + 10} l20 20 M${oldExitOrigin.x + 30} ${oldExitOrigin.y + 10} l-20 20`}
                stroke="#131D25"
                strokeWidth="4"
              />
            </g>
          )}

          {/* Shrinking corridor: no warning, two jaws slam in (geometry mirrors collision) */}
          {squeeze !== "none" && (
            <g>
              <rect
                ref={jawTopRef}
                x={SQUEEZE.x0}
                y={SQUEEZE.yTop}
                width={SQUEEZE.x1 - SQUEEZE.x0}
                height="0"
                fill="url(#hazard-pattern)"
                stroke="#131D25"
                strokeWidth="1"
              />
              <rect
                ref={jawBottomRef}
                x={SQUEEZE.x0}
                y={SQUEEZE.yBottom}
                width={SQUEEZE.x1 - SQUEEZE.x0}
                height="0"
                fill="url(#hazard-pattern)"
                stroke="#131D25"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Security gate */}
          {showLockdown && (
            <g
              ref={gateRef}
              data-warn="0"
              className={lockdown === "warning" ? "gate-preview" : "gate"}
            >
              <rect
                x={GATE_ORIGIN.x}
                y={GATE_ORIGIN.y}
                width={MAZE_CELL}
                height={MAZE_CELL}
                fill="none"
                stroke="#F1A59C"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              {lockdown === "warning" && (
                <rect
                  x={GATE_ORIGIN.x}
                  y={GATE_ORIGIN.y}
                  width={MAZE_CELL / 2}
                  height={MAZE_CELL}
                  fill="url(#hazard-pattern)"
                  opacity="0.7"
                />
              )}
              <rect
                ref={leafRef}
                x={GATE_ORIGIN.x}
                y={GATE_ORIGIN.y}
                width="0"
                height={MAZE_CELL}
                fill="url(#hazard-pattern)"
                stroke="#131D25"
                strokeWidth="1"
              />
            </g>
          )}

          {/* FINISH */}
          <g className={exitWarning ? "animate-pulse-fast" : ""}>
            <rect
              x={finishOrigin.x}
              y={finishOrigin.y}
              width={MAZE_CELL}
              height={MAZE_CELL}
              fill="url(#finish-pattern)"
              stroke={exitWarning ? "#F1A59C" : "#A8F0BB"}
              strokeWidth="2"
            />
            <rect
              x={finishOrigin.x + 3}
              y={finishOrigin.y + 13}
              width={MAZE_CELL - 6}
              height="14"
              fill="#131D25"
            />
            <text
              x={finishOrigin.x + MAZE_CELL / 2}
              y={finishOrigin.y + MAZE_CELL / 2 + 5}
              textAnchor="middle"
              fontSize="14"
              fill="#A8F0BB"
              style={{ fontFamily: "var(--font-body-src), monospace" }}
            >
              FINISH
            </text>
            {exitWarning && (
              <text
                x={finishOrigin.x + MAZE_CELL / 2}
                y={finishOrigin.y - 4}
                textAnchor="middle"
                fontSize="18"
                fill="#F1A59C"
                style={{ fontFamily: "var(--font-pixel), monospace" }}
              >
                !
              </text>
            )}
          </g>

          {status === "won" &&
            [0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={finishOrigin.x + MAZE_CELL / 2}
                cy={finishOrigin.y + MAZE_CELL / 2}
                r="14"
                fill="none"
                stroke="#A8F0BB"
                strokeWidth="3"
                className="animate-burst"
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animationDelay: `${i * 0.18}s`,
                }}
              />
            ))}

          {/* Unexplored cells stay dark until the cursor gets close; opacity is set imperatively */}
          <g ref={fogRef} aria-hidden="true">
            {ALL_CELLS.map((c) => (
              <rect
                key={`fog${c.col}-${c.row}`}
                x={c.col * MAZE_CELL}
                y={c.row * MAZE_CELL}
                width={MAZE_CELL}
                height={MAZE_CELL}
                fill="#0b1318"
                className="maze-fog"
              />
            ))}
          </g>

          {/* Glowing cursor marker; position set imperatively */}
          <g
            ref={cursorRef}
            style={{ display: status === "active" ? undefined : "none" }}
          >
            <circle r="9" fill="#A8F0BB" opacity="0.3" />
            <circle r="4" fill="#E1E5D6" stroke="#A8F0BB" strokeWidth="2" />
          </g>
        </svg>

        {notice && status === "idle" && (
          <div
            key={notice}
            className="animate-wrong pointer-events-none absolute inset-0 bg-danger"
            aria-hidden="true"
          />
        )}
      </div>

      <p
        className={`bevel-in px-3 py-2 text-center font-pixel text-[10px] leading-relaxed ${
          statusKey === "warning"
            ? "animate-pulse-fast bg-danger text-bg"
            : "bg-bg text-cream/80"
        }`}
        role="status"
      >
        {status === "idle" && notice === "wall" && (
          <span className="mb-1 block text-danger">WALL CONTACT. -1 LIFE.</span>
        )}
        {status === "idle" && notice === "timeout" && (
          <span className="mb-1 block text-danger">TIME&apos;S UP. -1 LIFE.</span>
        )}
        {status === "idle" && notice ? "CLICK START TO RETRY" : STATUS_TEXT[statusKey]}
      </p>
    </div>
  );
}
