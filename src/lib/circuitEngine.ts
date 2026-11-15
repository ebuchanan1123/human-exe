export type Direction = "N" | "E" | "S" | "W";
/** Quarter turns clockwise. */
export type Rotation = 0 | 1 | 2 | 3;
export type PieceKind = "straight" | "elbow" | "tee" | "empty" | "source" | "terminal";

export interface Piece {
  kind: PieceKind;
  rotation: Rotation;
}

export interface PuzzleCell {
  kind: PieceKind;
  /** Orientation that belongs in the intended solution (the fixed orientation for fixed pieces). */
  solution: Rotation;
  editable: boolean;
}

export const GRID_SIZE = 4;

const DIRECTIONS: readonly Direction[] = ["N", "E", "S", "W"];

/** Connectors at rotation 0. */
const BASE_CONNECTORS: Record<PieceKind, readonly Direction[]> = {
  straight: ["N", "S"],
  elbow: ["N", "E"],
  tee: ["N", "E", "W"],
  empty: [],
  source: ["N"],
  terminal: ["N"],
};

const OFFSETS: Record<Direction, { dRow: number; dCol: number }> = {
  N: { dRow: -1, dCol: 0 },
  E: { dRow: 0, dCol: 1 },
  S: { dRow: 1, dCol: 0 },
  W: { dRow: 0, dCol: -1 },
};

export function oppositeOf(d: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(d) + 2) % 4];
}

export function rotateDirection(d: Direction, rotation: Rotation): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(d) + rotation) % 4];
}

export function normalizeRotation(turns: number): Rotation {
  return (((turns % 4) + 4) % 4) as Rotation;
}

export function connectorsOf(kind: PieceKind, rotation: Rotation): Direction[] {
  return BASE_CONNECTORS[kind].map((d) => rotateDirection(d, rotation));
}

/** Index of the neighbouring cell in a direction, or null at the grid edge. */
export function neighborIndex(index: number, d: Direction): number | null {
  const row = Math.floor(index / GRID_SIZE) + OFFSETS[d].dRow;
  const col = (index % GRID_SIZE) + OFFSETS[d].dCol;
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return null;
  return row * GRID_SIZE + col;
}

/**
 * Breadth-first flood from the source. Power only crosses an edge when both
 * tiles have a connector facing each other; connectors that point at a wall,
 * the grid edge or a mismatched neighbour carry nothing.
 */
export function computePower(pieces: readonly Piece[]): Set<number> {
  const powered = new Set<number>();
  const start = pieces.findIndex((p) => p.kind === "source");
  if (start < 0) return powered;

  powered.add(start);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift() as number;
    const here = pieces[current];
    for (const d of connectorsOf(here.kind, here.rotation)) {
      const next = neighborIndex(current, d);
      if (next === null || powered.has(next)) continue;
      const there = pieces[next];
      if (connectorsOf(there.kind, there.rotation).includes(oppositeOf(d))) {
        powered.add(next);
        queue.push(next);
      }
    }
  }
  return powered;
}

export function isSolved(pieces: readonly Piece[], powered = computePower(pieces)): boolean {
  const terminal = pieces.findIndex((p) => p.kind === "terminal");
  return terminal >= 0 && powered.has(terminal);
}

/*
 * Hand-designed board. Indices are row * 4 + col.
 *
 *   SRC>  ─    ┐    ▒
 *   ┌     ┬    ┘    ▒
 *   │     └    ─    ┐
 *   └     ─    ┘    TERM^
 *
 * Intended route: 0 → 1 → 2 → 6 → 5 → 9 → 10 → 11 → 15.
 * The tee at 5 also feeds a powered decoy branch (4, 8, 12, 13, 14).
 */
function cell(kind: PieceKind, solution: Rotation, editable = true): PuzzleCell {
  return { kind, solution, editable };
}

export const PUZZLE: readonly PuzzleCell[] = [
  cell("source", 1, false), cell("straight", 1), cell("elbow", 2), cell("empty", 0, false),
  cell("elbow", 1), cell("tee", 2), cell("elbow", 3), cell("empty", 0, false),
  cell("straight", 0), cell("elbow", 0), cell("straight", 1), cell("elbow", 2),
  cell("elbow", 0), cell("straight", 1), cell("elbow", 3), cell("terminal", 0, false),
];

/** Intended route tiles that the player rotates, in order from the source. */
export const PATH_ORDER: readonly number[] = [1, 2, 6, 5, 9, 10, 11];

/** The Gatekeeper reacts once this many route tiles are powered. */
export const MOSTLY_POWERED = Math.ceil(PATH_ORDER.length * 0.7);

export function solutionPieces(): Piece[] {
  return PUZZLE.map((c) => ({ kind: c.kind, rotation: c.solution }));
}

export function piecesFromTurns(turns: readonly number[]): Piece[] {
  return PUZZLE.map((c, i) => ({
    kind: c.kind,
    rotation: c.editable ? normalizeRotation(turns[i]) : c.solution,
  }));
}

export function poweredPathCount(powered: ReadonlySet<number>): number {
  return PATH_ORDER.filter((i) => powered.has(i)).length;
}

/**
 * Tile the Gatekeeper turns next: an editable tile whose quarter turn would not complete the
 * circuit, preferring a correctly placed, powered route tile. Null when nothing qualifies.
 */
export function pickSabotageTile(turns: readonly number[], random: () => number = Math.random): number | null {
  const pieces = piecesFromTurns(turns);
  const powered = computePower(pieces);
  const candidates = PUZZLE.flatMap((c, i) => {
    if (!c.editable) return [];
    const next = [...turns];
    next[i] += 1;
    return isSolved(piecesFromTurns(next)) ? [] : [i];
  });
  if (candidates.length === 0) return null;
  const onRoute = candidates.filter(
    (i) => PATH_ORDER.includes(i) && powered.has(i) && normalizeRotation(turns[i]) === PUZZLE[i].solution,
  );
  const pool = onRoute.length > 0 ? onRoute : candidates;
  return pool[Math.floor(random() * pool.length)];
}

/**
 * Random starting turns for every editable tile. Any rotation set is solvable
 * because each tile can be turned to its solution orientation, so we only
 * re-roll boards that are already solved or already mostly powered.
 */
export function createInitialTurns(random: () => number = Math.random): number[] {
  for (;;) {
    const turns = PUZZLE.map((c) => (c.editable ? Math.floor(random() * 4) : 0));
    const pieces = piecesFromTurns(turns);
    const powered = computePower(pieces);
    if (!isSolved(pieces, powered) && poweredPathCount(powered) < MOSTLY_POWERED - 1) {
      return turns;
    }
  }
}
