"use client";

import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";

/**
 * Real, working GLTF loading — not a stub. Nothing calls this today because
 * no licensed mannequin GLB exists yet (see docs/MANNEQUIN_SYSTEM.md), but
 * pointing a Mannequin.baseModelUrl at a real file is a data change: this
 * hook is exactly what `Mannequin.tsx`'s "gltf" branch already uses.
 */
export function useGltfMannequinAsset(url: string): GLTF {
  return useGLTF(url) as unknown as GLTF;
}

useGltfMannequinAsset.preload = (url: string) => useGLTF.preload(url);
