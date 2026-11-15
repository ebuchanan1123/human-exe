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

export function isWalkable(p: Point): boolean {
  if (p.x < 0 || p.y < 0 || p.x >= MAZE_W || p.y >= MAZE_H) return false;
  return charAt(Math.floor(p.x / MAZE_CELL), Math.floor(p.y / MAZE_CELL)) !== "#";
}

/** Wall or closed/closing security gate. leafProgress is 0 (open) to 1 (closed). */
export function isBlocked(p: Point, leafProgress: number): boolean {
  if (!isWalkable(p)) return true;
  if (leafProgress <= 0) return false;
  const o = cellOrigin(GATE_CELL);
  return (
    p.x >= o.x &&
    p.x < o.x + leafProgress * MAZE_CELL &&
    p.y >= o.y &&
    p.y < o.y + MAZE_CELL
  );
}
