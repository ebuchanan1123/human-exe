"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Monitor, TriangleAlert, Zap } from "lucide-react";
import { CIRCUIT } from "@/lib/gameConfig";
import {
  GRID_SIZE,
  MOSTLY_POWERED,
  PATH_ORDER,
  PUZZLE,
  computePower,
  connectorsOf,
  createInitialTurns,
  isSolved,
  piecesFromTurns,
  poweredPathCount,
} from "@/lib/circuitEngine";
import type { Direction, PieceKind } from "@/lib/circuitEngine";

interface CircuitBoardProps {
  /** True once the level is won, so the board goes inert. */
  frozen: boolean;
  /** True when this attempt follows a timeout. */
  retry: boolean;
  onProgress: () => void;
  onCheat: () => void;
  onSolved: () => void;
}

const ARM_PATH: Record<Direction, string> = {
  N: "M20 20 V0",
  E: "M20 20 H40",
  S: "M20 20 V40",
  W: "M20 20 H0",
};

interface CircuitTileProps {
  index: number;
  kind: PieceKind;
  turns: number;
  powered: boolean;
  warned: boolean;
  celebrate: boolean;
  onRotate: (index: number) => void;
}

const CircuitTile = memo(function CircuitTile({
  index,
  kind,
  turns,
  powered,
  warned,
  celebrate,
  onRotate,
}: CircuitTileProps) {
  const editable = PUZZLE[index].editable;
  const solutionTurns = PUZZLE[index].solution;
  const arms = connectorsOf(kind, 0);
  const rotation = editable ? turns * 90 : solutionTurns * 90;
  const row = Math.floor(index / GRID_SIZE) + 1;
  const col = (index % GRID_SIZE) + 1;

  const art = (
    <>
      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: editable ? "transform 160ms ease-out" : undefined,
        }}
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true" shapeRendering="crispEdges">
          {kind !== "empty" && (
            <>
              {arms.map((d) => (
                <path key={`o${d}`} d={ARM_PATH[d]} stroke="#0b1318" strokeWidth="14" fill="none" />
              ))}
              {arms.map((d) => (
                <path
                  key={`b${d}`}
                  d={ARM_PATH[d]}
                  stroke={powered ? "#A8F0BB" : "#4a646d"}
                  strokeWidth="10"
                  fill="none"
                />
              ))}
              <rect x="15" y="15" width="10" height="10" fill={powered ? "#A8F0BB" : "#4a646d"} />
              {powered &&
                arms.map((d) => (
                  <path
                    key={`f${d}`}
                    d={ARM_PATH[d]}
                    stroke="#E1E5D6"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    fill="none"
                    className="circuit-flow"
                  />
                ))}
            </>
          )}
        </svg>
      </div>

      {kind === "empty" && (
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#0b1318_0_6px,#1b2a31_6px_12px)]" />
      )}

      {kind === "source" && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-bg">
          <Zap className="h-5 w-5 fill-mint text-mint" aria-hidden="true" />
          <span className="bg-mint px-1 font-pixel text-[7px] leading-tight">SRC</span>
        </span>
      )}
      {kind === "terminal" && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Monitor
            className={`h-5 w-5 ${powered ? "text-mint" : "text-danger"}`}
            aria-hidden="true"
          />
          <span
            className={`px-1 font-pixel text-[7px] leading-tight text-bg ${powered ? "bg-mint" : "bg-danger"}`}
          >
            TERM
          </span>
        </span>
      )}

      {warned && (
        <span className="animate-pulse-fast pointer-events-none absolute inset-0 flex items-start justify-end bg-danger/30 p-1 ring-4 ring-inset ring-danger">
          <TriangleAlert className="h-4 w-4 text-danger" aria-hidden="true" />
        </span>
      )}
    </>
  );

  const frame = `relative aspect-square w-full overflow-hidden ${
    powered ? "bg-[#1d3a36]" : "bg-[#17232a]"
  } ${celebrate && powered ? "circuit-win" : ""}`;
  const glow = powered ? { boxShadow: "0 0 0 2px #0b1318, 0 0 10px 1px rgba(168,240,187,0.55)" } : undefined;

  if (!editable) {
    return (
      <div className={`${frame} bevel-in`} style={glow} aria-hidden={kind === "empty"}>
        {art}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRotate(index)}
      aria-label={`Row ${row}, column ${col}, ${kind} piece, ${powered ? "powered" : "unpowered"}. Rotate 90 degrees.`}
      className={`${frame} bevel-out cursor-pointer p-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream`}
      style={glow}
    >
      {art}
    </button>
  );
});

export function CircuitBoard({ frozen, retry, onProgress, onCheat, onSolved }: CircuitBoardProps) {
  const [turns, setTurns] = useState<number[]>(createInitialTurns);
  const [warning, setWarning] = useState<number | null>(null);
  const [cheated, setCheated] = useState(false);
  const [moved, setMoved] = useState(false);

  // Refs hold what timers and rapid clicks must read synchronously, so no event sees stale state.
  const turnsRef = useRef(turns);
  const flags = useRef({ won: false, progressed: false });
  const latest = useRef({ onProgress, onCheat, onSolved });
  useEffect(() => {
    latest.current = { onProgress, onCheat, onSolved };
  });

  const pieces = useMemo(() => piecesFromTurns(turns), [turns]);
  const powered = useMemo(() => computePower(pieces), [pieces]);
  const solved = isSolved(pieces, powered);
  const terminalPowered = PUZZLE.some((c, i) => c.kind === "terminal" && powered.has(i));

  const commit = useCallback((next: number[]) => {
    turnsRef.current = next;
    setTurns(next);
  }, []);

  const rotate = useCallback(
    (index: number) => {
      const f = flags.current;
      if (f.won || !PUZZLE[index].editable) return;
      const next = [...turnsRef.current];
      next[index] += 1;
      commit(next);
      setMoved(true);

      const nextPieces = piecesFromTurns(next);
      const nextPower = computePower(nextPieces);
      if (isSolved(nextPieces, nextPower)) {
        f.won = true;
        setWarning(null);
        latest.current.onSolved();
        return;
      }
      if (!f.progressed && poweredPathCount(nextPower) >= MOSTLY_POWERED) {
        f.progressed = true;
        latest.current.onProgress();
        // Warn on the furthest powered route tile, then reverse it once.
        const target = [...PATH_ORDER].reverse().find((i) => nextPower.has(i)) ?? PATH_ORDER[0];
        setWarning(target);
      }
    },
    [commit],
  );

  useEffect(() => {
    if (warning === null || frozen) return;
    const id = window.setTimeout(() => {
      setWarning(null);
      if (flags.current.won) return;
      const next = [...turnsRef.current];
      next[warning] -= 1;
      // The Gatekeeper never completes the circuit for the player.
      if (isSolved(piecesFromTurns(next))) return;
      commit(next);
      setCheated(true);
      latest.current.onCheat();
    }, CIRCUIT.warnMs);
    return () => window.clearTimeout(id);
  }, [warning, frozen, commit]);

  const poweredTiles = poweredPathCount(powered);
  let status = "CLICK A PIECE TO ROTATE IT. CONNECT SOURCE TO TERMINAL.";
  if (solved) status = "CIRCUIT COMPLETE. TERMINAL ONLINE.";
  else if (warning !== null) status = "!! SECURITY MAINTENANCE IN PROGRESS !!";
  else if (cheated) status = "MAINTENANCE COMPLETE. ONE PIECE WAS TURNED BACK. KEEP GOING.";
  else if (poweredTiles > 0) status = `${poweredTiles}/${PATH_ORDER.length} ROUTE PIECES POWERED. TERMINAL ${terminalPowered ? "ONLINE" : "OFFLINE"}.`;

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-mint p-3 text-bg">
        <p className="font-body text-xl leading-none">Rotate the pieces to connect</p>
        <p className="font-pixel text-base sm:text-lg">SOURCE TO TERMINAL</p>
      </div>

      <div className="bevel-in bg-bg p-2">
        <div className="grid grid-cols-4 gap-1">
          {PUZZLE.map((cell, i) => (
            <CircuitTile
              key={i}
              index={i}
              kind={cell.kind}
              turns={turns[i]}
              powered={powered.has(i)}
              warned={warning === i}
              celebrate={frozen && solved}
              onRotate={frozen ? noop : rotate}
            />
          ))}
        </div>
      </div>

      <p
        className={`bevel-in min-h-[3rem] px-3 py-2 text-center font-pixel text-[10px] leading-relaxed ${
          warning !== null ? "animate-pulse-fast bg-danger text-bg" : "bg-bg text-cream/80"
        }`}
        role="status"
      >
        {retry && !moved && (
          <span className="mb-1 block text-danger">POWER FAILURE. -1 LIFE. BOARD RESET.</span>
        )}
        {status}
      </p>
    </div>
  );
}

function noop() {}
