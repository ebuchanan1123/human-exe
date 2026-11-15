"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { FaceLandmarker, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { INSPECTION } from "@/lib/gameConfig";
import {
  CHALLENGE_ORDER,
  conditionMet,
  createHoldState,
  createShakeState,
  headYaw,
  readingFromBlendshapes,
  smileScore,
  stepHold,
  stepShake,
} from "@/lib/faceChallenges";
import type { HoldState, ShakeState } from "@/lib/faceChallenges";
import type { InspectionChallenge, InspectionSource } from "@/lib/gameTypes";

const MODEL_URL = "/models/face_landmarker.task";
const WASM_URL = "/mediapipe/wasm";

export type ScannerPhase = "intro" | "starting" | "live" | "error" | "demo" | "done";
export type ScannerErrorKind = "denied" | "unavailable" | "insecure" | "model" | "runtime";

export interface ScannerError {
  kind: ScannerErrorKind;
  message: string;
}

export interface LiveView {
  faceCount: number;
  smile: number;
  jaw: number;
  /** Head turn offset (fraction of face width); 0 facing the camera. */
  yaw: number;
  /** 0-1 progress toward the current challenge's hold time or stroke count. */
  progress: number;
}

export interface PassFlash {
  id: number;
  challenge: InspectionChallenge;
}

const EMPTY_VIEW: LiveView = { faceCount: 0, smile: 0, jaw: 0, yaw: 0, progress: 0 };

const ERROR_TEXT: Record<ScannerErrorKind, string> = {
  denied: "CAMERA ACCESS WAS BLOCKED. ALLOW THE CAMERA IN YOUR BROWSER, THEN RETRY.",
  unavailable: "NO USABLE CAMERA WAS FOUND, OR ANOTHER APP IS USING IT.",
  insecure: "CAMERA ACCESS NEEDS HTTPS OR LOCALHOST.",
  model: "THE FACE MODEL FAILED TO LOAD. CHECK YOUR CONNECTION AND RETRY.",
  runtime: "THE FACE SCANNER STOPPED UNEXPECTEDLY.",
};

function cameraErrorKind(reason: unknown): ScannerErrorKind {
  const name = reason instanceof DOMException ? reason.name : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
    return "denied";
  }
  return "unavailable";
}

/** Rejects if the model has not finished loading, so a stalled load surfaces as an error instead of an endless wait. */
const MODEL_LOAD_TIMEOUT_MS = 20_000;

async function loadLandmarker(): Promise<FaceLandmarker> {
  // Imported on demand so MediaPipe never runs during server-side rendering.
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  // CPU only: the GPU delegate can hang forever on some machines instead of failing, and the CPU runs fast enough.
  const loading = FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
  });
  let timedOut = false;
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      timedOut = true;
      reject(new Error("Face model load timed out"));
    }, MODEL_LOAD_TIMEOUT_MS);
  });
  loading.then(
    (landmarker) => {
      if (timedOut) landmarker.close();
    },
    () => {},
  );
  return Promise.race([loading, timeout]);
}

interface Resources {
  /** Bumped on every start/stop so late async results from an old session are discarded. */
  session: number;
  stream: MediaStream | null;
  landmarker: FaceLandmarker | null;
  timer: number | null;
  lastVideoTime: number;
  hold: HoldState;
  shake: ShakeState;
  /** Challenges passed; mutated synchronously so a pass can never fire twice. */
  stage: number;
  mode: ScannerPhase;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onPass: (challenge: InspectionChallenge, source: InspectionSource) => void;
}

export function useFaceInspection({ videoRef, canvasRef, onPass }: Options) {
  const [phase, setPhaseState] = useState<ScannerPhase>("intro");
  const [error, setError] = useState<ScannerError | null>(null);
  const [stage, setStage] = useState(0);
  const [view, setView] = useState<LiveView>(EMPTY_VIEW);
  const [aspect, setAspect] = useState(4 / 3);
  const [flash, setFlash] = useState<PassFlash | null>(null);

  const res = useRef<Resources>({
    session: 0,
    stream: null,
    landmarker: null,
    timer: null,
    lastVideoTime: -1,
    hold: createHoldState(),
    shake: createShakeState(),
    stage: 0,
    mode: "intro",
  });
  const onPassRef = useRef(onPass);
  useEffect(() => {
    onPassRef.current = onPass;
  });

  const setPhase = useCallback((next: ScannerPhase) => {
    res.current.mode = next;
    setPhaseState(next);
  }, []);

  /** Stops inference and the camera, and detaches the video. Safe to call repeatedly. */
  const release = useCallback(() => {
    const r = res.current;
    if (r.timer !== null) {
      window.clearInterval(r.timer);
      r.timer = null;
    }
    r.stream?.getTracks().forEach((t) => t.stop());
    r.stream = null;
    r.landmarker?.close();
    r.landmarker = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, [videoRef, canvasRef]);

  const fail = useCallback(
    (kind: ScannerErrorKind) => {
      release();
      setError({ kind, message: ERROR_TEXT[kind] });
      setView(EMPTY_VIEW);
      setPhase("error");
    },
    [release, setPhase],
  );

  const registerPass = useCallback(
    (source: InspectionSource) => {
      const r = res.current;
      const challenge = CHALLENGE_ORDER[r.stage];
      if (!challenge) return;
      r.stage += 1;
      r.hold = createHoldState();
      r.shake = createShakeState();
      setStage(r.stage);
      setView((v) => ({ ...v, progress: 0 }));
      setFlash((f) => ({ id: (f?.id ?? 0) + 1, challenge }));
      onPassRef.current(challenge, source);
      if (r.stage >= CHALLENGE_ORDER.length) {
        release();
        setView(EMPTY_VIEW);
        setPhase("done");
      }
    },
    [release, setPhase],
  );

  const drawOverlay = useCallback(
    (video: HTMLVideoElement, result: FaceLandmarkerResult, showYaw: boolean) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      const landmarks = result.faceLandmarks[0];
      if (!landmarks) return;

      // The video is CSS-mirrored, so x is flipped here instead of mirroring the canvas text.
      let minX = 1;
      let minY = 1;
      let maxX = 0;
      let maxY = 0;
      ctx.fillStyle = "rgba(168, 240, 187, 0.75)";
      landmarks.forEach((p, i) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        if (i % 5 === 0) ctx.fillRect((1 - p.x) * w - 1, p.y * h - 1, 3, 3);
      });

      const pad = 0.04;
      const left = (1 - Math.min(1, maxX + pad)) * w;
      const right = (1 - Math.max(0, minX - pad)) * w;
      const top = Math.max(0, minY - pad) * h;
      const bottom = Math.min(1, maxY + pad) * h;
      const arm = Math.max(14, (right - left) * 0.18);
      ctx.strokeStyle = "#A8F0BB";
      ctx.lineWidth = Math.max(3, w / 160);
      ctx.beginPath();
      ctx.moveTo(left, top + arm);
      ctx.lineTo(left, top);
      ctx.lineTo(left + arm, top);
      ctx.moveTo(right - arm, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, top + arm);
      ctx.moveTo(right, bottom - arm);
      ctx.lineTo(right, bottom);
      ctx.lineTo(right - arm, bottom);
      ctx.moveTo(left + arm, bottom);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left, bottom - arm);
      ctx.stroke();

      // Inner lip landmarks (13 upper, 14 lower) show how open the mouth is.
      const upper = landmarks[13];
      const lower = landmarks[14];
      if (upper && lower) {
        ctx.strokeStyle = "#F1A59C";
        ctx.beginPath();
        ctx.moveTo((1 - upper.x) * w, upper.y * h);
        ctx.lineTo((1 - lower.x) * w, lower.y * h);
        ctx.stroke();
      }

      ctx.fillStyle = "#A8F0BB";
      ctx.font = `${Math.max(10, Math.round(w / 45))}px "Press Start 2P", monospace`;
      ctx.fillText("FACE LOCK", left, Math.max(14, top - 8));

      // Head-turn gauge for the shake challenge: nose dot against the face-edge line.
      const nose = landmarks[1];
      const edgeA = landmarks[234];
      const edgeB = landmarks[454];
      if (showYaw && nose && edgeA && edgeB) {
        ctx.strokeStyle = "#E1E5D6";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo((1 - edgeA.x) * w, ((edgeA.y + edgeB.y) / 2) * h);
        ctx.lineTo((1 - edgeB.x) * w, ((edgeA.y + edgeB.y) / 2) * h);
        ctx.stroke();
        ctx.fillStyle = "#F1A59C";
        ctx.fillRect((1 - nose.x) * w - 4, nose.y * h - 4, 8, 8);
      }
    },
    [canvasRef],
  );

  const start = useCallback(async () => {
    const r = res.current;
    release();
    r.session += 1;
    const session = r.session;
    r.stage = 0;
    r.hold = createHoldState();
    r.shake = createShakeState();
    r.lastVideoTime = -1;
    setStage(0);
    setError(null);
    setView(EMPTY_VIEW);
    setPhase("starting");

    if (!window.isSecureContext) {
      fail("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      fail("unavailable");
      return;
    }

    // Deliberate user action: this runs from the ENABLE CAMERA click. The model loads while the permission prompt is open.
    const [camera, model] = await Promise.allSettled([
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      }),
      loadLandmarker(),
    ]);

    if (session !== r.session) {
      if (camera.status === "fulfilled") camera.value.getTracks().forEach((t) => t.stop());
      if (model.status === "fulfilled") model.value.close();
      return;
    }
    if (camera.status === "rejected") {
      if (model.status === "fulfilled") model.value.close();
      fail(cameraErrorKind(camera.reason));
      return;
    }
    if (model.status === "rejected") {
      console.error("Face model failed to load", model.reason);
      camera.value.getTracks().forEach((t) => t.stop());
      fail("model");
      return;
    }

    r.stream = camera.value;
    r.landmarker = model.value;
    const video = videoRef.current;
    if (!video) {
      fail("runtime");
      return;
    }
    video.srcObject = r.stream;
    video.muted = true;
    try {
      await video.play();
    } catch {
      if (session === r.session) fail("runtime");
      return;
    }
    if (session !== r.session) return;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspect(video.videoWidth / video.videoHeight);
    }

    const tick = () => {
      const landmarker = r.landmarker;
      if (!landmarker || r.session !== session || video.readyState < 2 || video.paused || video.ended) {
        return;
      }
      // Never score the same frame twice: a stalled stream must not keep a hold alive.
      if (video.currentTime === r.lastVideoTime) return;
      r.lastVideoTime = video.currentTime;

      const now = performance.now();
      let result: FaceLandmarkerResult;
      try {
        result = landmarker.detectForVideo(video, now);
      } catch {
        fail("runtime");
        return;
      }

      const faceCount = result.faceLandmarks.length;
      const reading = readingFromBlendshapes(faceCount, result.faceBlendshapes[0]?.categories ?? []);
      const challenge = CHALLENGE_ORDER[r.stage];
      drawOverlay(video, result, challenge === "shake");

      if (!challenge) return;
      const yaw = faceCount > 0 ? headYaw(result.faceLandmarks[0]) : null;
      let progress: number;
      let passed: boolean;
      if (challenge === "shake") {
        const step = stepShake(r.shake, yaw, now);
        r.shake = step.state;
        progress = step.progress;
        passed = step.passed;
      } else {
        const step = stepHold(r.hold, conditionMet(challenge, reading), now);
        r.hold = step.state;
        progress = step.progress;
        passed = step.passed;
      }
      setView({
        faceCount,
        smile: smileScore(reading),
        jaw: reading.jawOpen,
        yaw: yaw ?? 0,
        progress,
      });
      if (passed) registerPass("camera");
    };

    r.timer = window.setInterval(tick, INSPECTION.detectionIntervalMs);
    setPhase("live");
  }, [release, fail, setPhase, videoRef, drawOverlay, registerPass]);

  /** Presenter mode: no camera and no computer vision; each press passes the next challenge. */
  const startDemo = useCallback(() => {
    const r = res.current;
    release();
    r.session += 1;
    r.stage = 0;
    setStage(0);
    setError(null);
    setView(EMPTY_VIEW);
    setPhase("demo");
  }, [release, setPhase]);

  const demoPass = useCallback(() => {
    if (res.current.mode !== "demo") return;
    registerPass("demo");
  }, [registerPass]);

  // Stop everything when the level ends or the component unmounts.
  useEffect(() => {
    const r = res.current;
    return () => {
      r.session += 1;
      release();
    };
  }, [release]);

  return { phase, error, stage, view, aspect, flash, start, startDemo, demoPass };
}
