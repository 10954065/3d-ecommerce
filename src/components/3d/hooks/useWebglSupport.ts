import { useState } from "react";

function detectWebglSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Detects whether WebGL is usable at all — drives the section-24 fallback
 * experience. Only ever mounted client-side (behind `ssr: false`), so a lazy
 * `useState` initializer is safe here and avoids an extra render.
 */
export function useWebglSupport(): boolean {
  const [supported] = useState<boolean>(() => detectWebglSupport());
  return supported;
}
