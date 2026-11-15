// Hand-designed maze. S start, A first exit, B relocated exit, G security gate, . corridor, # wall.
const LAYOUT = [
  "###########",
  "#S...#...A#",
  "####.#.##.#",
  "#....#..#G#",
  "#.####.##.#",
  "#......##B#",
  "###########",
] as const;

/** Logical units per grid cell; all geometry is in these units, independent of screen size. */
export const MAZE_CELL = 40;
export const MAZE_COLS = LAYOUT[0].length;
export const MAZE_ROWS = LAYOUT.length;
export const MAZE_W = MAZE_COLS * MAZE_CELL;
export const MAZE_H = MAZE_ROWS * MAZE_CELL;

export interface Point {
  x: number;
  y: number;
}

export interface Cell {
  col: number;
  row: number;
}

function charAt(col: number, row: number): string {
  return LAYOUT[row]?.[col] ?? "#";
}

function findCell(ch: string): Cell {
  for (let row = 0; row < MAZE_ROWS; row++) {
    const col = LAYOUT[row].indexOf(ch);
    if (col >= 0) return { col, row };
  }
  throw new Error(`Maze layout is missing "${ch}"`);
}

export const START_CELL = findCell("S");
/** Index 0 is the first exit, index 1 is where the Gatekeeper relocates it. */
export const FINISH_CELLS: readonly [Cell, Cell] = [findCell("A"), findCell("B")];
export const GATE_CELL = findCell("G");

export const WALL_CELLS: readonly Cell[] = LAYOUT.flatMap((line, row) =>
  [...line].flatMap((ch, col) => (ch === "#" ? [{ col, row }] : [])),
);
export const FLOOR_CELLS: readonly Cell[] = LAYOUT.flatMap((line, row) =>
  [...line].flatMap((ch, col) => (ch !== "#" ? [{ col, row }] : [])),
);

export function cellOrigin(cell: Cell): Point {
  return { x: cell.col * MAZE_CELL, y: cell.row * MAZE_CELL };
}

export function cellCenter(cell: Cell): Point {
  return { x: (cell.col + 0.5) * MAZE_CELL, y: (cell.row + 0.5) * MAZE_CELL };
}

export function inCell(p: Point, cell: Cell, pad = 0): boolean {
  const o = cellOrigin(cell);
  return (
    p.x >= o.x - pad &&
    p.x < o.x + MAZE_CELL + pad &&
    p.y >= o.y - pad &&
    p.y < o.y + MAZE_CELL + pad
  );
}

/**
 * The one narrowing section: the bottom corridor (row 5, cols 3-5). Two jaws
 * close in from the walls above and below, each up to maxIntrude units, so the
 * corridor shrinks from 40 to 18 wide (45%) and never closes.
 */
export const SQUEEZE = {
  x0: 3 * MAZE_CELL,
  x1: 6 * MAZE_CELL,
  yTop: 5 * MAZE_CELL,
  yBottom: 6 * MAZE_CELL,
  maxIntrude: 11,
  /** Walking into this rectangle (the approach from the west) triggers the lockdown. */
  trigger: { x0: 70, x1: 3 * MAZE_CELL, y0: 5 * MAZE_CELL, y1: 6 * MAZE_CELL },
} as const;

/** How far each jaw currently intrudes into the corridor, in maze units. */
export interface SqueezeIntrusion {
  top: number;
  bottom: number;
}

export const NO_SQUEEZE: SqueezeIntrusion = { top: 0, bottom: 0 };

function inSqueezeJaw(p: Point, s: SqueezeIntrusion): boolean {
  if (p.x < SQUEEZE.x0 || p.x >= SQUEEZE.x1) return false;
  if (p.y < SQUEEZE.yTop || p.y >= SQUEEZE.yBottom) return false;
  return p.y < SQUEEZE.yTop + s.top || p.y >= SQUEEZE.yBottom - s.bottom;
}

export function inSqueezeTrigger(p: Point): boolean {
  const t = SQUEEZE.trigger;
  return p.x >= t.x0 && p.x < t.x1 && p.y >= t.y0 && p.y < t.y1;
}

export function isWalkable(p: Point): boolean {
  if (p.x < 0 || p.y < 0 || p.x >= MAZE_W || p.y >= MAZE_H) return false;
  return charAt(Math.floor(p.x / MAZE_CELL), Math.floor(p.y / MAZE_CELL)) !== "#";
}

/** Wall or closed/closing security gate. leafProgress is 0 (open) to 1 (closed). */
export function isBlocked(
  p: Point,
  leafProgress: number,
  squeeze: SqueezeIntrusion = NO_SQUEEZE,
): boolean {
  if (!isWalkable(p)) return true;
  if (inSqueezeJaw(p, squeeze)) return true;
  if (leafProgress <= 0) return false;
  const o = cellOrigin(GATE_CELL);
  return (
    p.x >= o.x &&
    p.x < o.x + leafProgress * MAZE_CELL &&
    p.y >= o.y &&
    p.y < o.y + MAZE_CELL
  );
}
