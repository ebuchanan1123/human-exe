// Serves the MediaPipe WASM runtime from our own origin so the Human Inspection level works offline.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = join(process.cwd(), "public", "mediapipe", "wasm");

if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log("Copied MediaPipe WASM to public/mediapipe/wasm");
} else {
  console.warn("MediaPipe WASM not found; run npm install first.");
}
