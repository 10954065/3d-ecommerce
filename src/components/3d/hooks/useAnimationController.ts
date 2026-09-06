import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { MannequinFigureHandle } from "../scene/MannequinFigure";
import type { AnimationClipName } from "../types";

/**
 * Imperative per-frame pose driver — the Level 1 (Performance Mode) stand-in
 * for skeletal animation clips. Each clip is a small set of absolute,
 * time-based transforms applied directly to the root/arm group refs exposed
 * by MannequinFigure, so nothing here triggers a React re-render. `activity`
 * scales the fabric shader's secondary-motion amplitude (see
 * materials/fabric-material.ts) so garments visibly respond more during
 * WALK/FABRIC_TEST than IDLE.
 */
export function useAnimationController(
  figureRef: RefObject<MannequinFigureHandle | null>,
  clip: AnimationClipName,
) {
  const activityRef = useRef(0.15);

  useFrame((state) => {
    const figure = figureRef.current;
    if (!figure?.root || !figure.leftArm || !figure.rightArm) return;
    const t = state.clock.elapsedTime;
    const { root, leftArm, rightArm } = figure;

    switch (clip) {
      case "TURN_360": {
        root.rotation.y = (t * 0.9) % (Math.PI * 2);
        root.position.y = 0;
        root.rotation.z = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        activityRef.current = 0.35;
        break;
      }
      case "WALK": {
        root.rotation.y = Math.sin(t * 0.6) * 0.55;
        root.position.y = Math.abs(Math.sin(t * 3)) * 0.012;
        root.rotation.z = Math.sin(t * 3) * 0.035;
        leftArm.rotation.x = Math.sin(t * 3) * 0.18;
        rightArm.rotation.x = -Math.sin(t * 3) * 0.18;
        activityRef.current = 0.85;
        break;
      }
      case "ARM_RAISE": {
        const raise = Math.min(t / 1.4, 1) * -1.2 * (0.5 + 0.5 * Math.sin(t * 1.2));
        root.rotation.y = 0;
        root.position.y = 0;
        root.rotation.z = 0;
        leftArm.rotation.x = raise;
        rightArm.rotation.x = raise;
        activityRef.current = 0.4;
        break;
      }
      case "WEIGHT_SHIFT": {
        root.rotation.z = Math.sin(t * 0.8) * 0.06;
        root.position.x = Math.sin(t * 0.8) * 0.015;
        root.position.y = 0;
        root.rotation.y = Math.sin(t * 0.4) * 0.08;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        activityRef.current = 0.25;
        break;
      }
      case "FABRIC_TEST": {
        root.rotation.y = Math.sin(t * 0.5) * 0.7;
        root.position.y = Math.abs(Math.sin(t * 1.5)) * 0.006;
        leftArm.rotation.x = Math.sin(t * 1.1) * 0.3 - 0.15;
        rightArm.rotation.x = -Math.sin(t * 1.1) * 0.3 - 0.15;
        activityRef.current = 1.0;
        break;
      }
      case "IDLE":
      default: {
        root.rotation.y = Math.sin(t * 0.3) * 0.05;
        root.position.y = Math.sin(t * 0.8) * 0.004;
        root.position.x = 0;
        root.rotation.z = 0;
        leftArm.rotation.x = Math.sin(t * 0.5) * 0.02;
        rightArm.rotation.x = -Math.sin(t * 0.5) * 0.02;
        activityRef.current = 0.15;
        break;
      }
    }
  });

  return activityRef;
}
