import { useState } from "react";
import type { PerformanceTier } from "../types";

export interface RenderSettings {
  dpr: [number, number];
  shadows: boolean;
  antialias: boolean;
  environmentResolution: number;
}

export const RENDER_SETTINGS: Record<PerformanceTier, RenderSettings> = {
  LOW: { dpr: [1, 1], shadows: false, antialias: false, environmentResolution: 64 },
  MEDIUM: { dpr: [1, 1.5], shadows: true, antialias: false, environmentResolution: 128 },
  HIGH: { dpr: [1, 2], shadows: true, antialias: true, environmentResolution: 256 },
  ULTRA: { dpr: [1, 2], shadows: true, antialias: true, environmentResolution: 512 },
};

function detectTier(): PerformanceTier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;

  let rendererInfo = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    const debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && debugInfo) {
      rendererInfo = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase();
    }
  } catch {
    // Detection is best-effort; fall through to the heuristic below.
  }

  if (cores <= 4 || memory <= 4) return "LOW";
  if (/apple m[1-9]|nvidia|radeon|geforce|rtx|arc a\d/.test(rendererInfo)) return "ULTRA";
  if (cores <= 8) return "MEDIUM";
  return "HIGH";
}

/**
 * Detects device capability once to pick an adaptive render quality tier
 * (section 23/38). Callers of this hook are only ever mounted client-side
 * (behind a `dynamic(..., { ssr: false })` boundary), so reading
 * `navigator`/`document` in the lazy initializer is safe and avoids an
 * extra post-mount render that a `useEffect` + `setState` would cause.
 */
export function usePerformanceTier(): PerformanceTier {
  const [tier] = useState<PerformanceTier>(() => detectTier());
  return tier;
}
