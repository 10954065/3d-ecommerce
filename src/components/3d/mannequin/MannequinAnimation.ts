/* eslint-disable react-hooks/immutability --
 * This hook's entire job is mutating live THREE.Bone transforms inside
 * useFrame — the standard react-three-fiber pattern (mutate the scene graph
 * directly every frame; never setState per frame). That mutation happens on
 * three.js's render loop, outside React's render/memoization cycle, so it
 * cannot break compiler memoization the way mutating React state would.
 * The pre-existing useAnimationController.ts did the same thing to plain
 * Object3D groups without tripping this rule; bones behind a
 * Partial<Record<BoneName, Bone>> apparently do. */
import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { AnimationClipName } from "../types";
import type { MannequinHandle } from "./mannequinTypes";

/**
 * Drives the real skeleton (not a group transform) per animation clip —
 * every SkinnedMesh bound to this skeleton (body + garment, see Garment.tsx)
 * moves together, since Three.js recomputes skin matrices from live bone
 * transforms each frame. These are small, hand-authored procedural clips —
 * see docs/MANNEQUIN_SYSTEM.md for why they aren't baked mocap (no animated
 * GLB asset exists yet). Never touches Head/Foot rotations or the
 * presentation pose's static offsets (MannequinSkeleton.ts's
 * applyPresentationPose), so that stance persists underneath every clip.
 */
export function useMannequinAnimation(mannequinRef: RefObject<MannequinHandle | null>, clip: AnimationClipName) {
  const activityRef = useRef(0.15);

  useFrame((state) => {
    const handle = mannequinRef.current;
    const bones = handle?.bones;
    if (!bones?.Root || !bones.L_Shoulder || !bones.R_Shoulder) return;
    const { Root: root, L_Shoulder: lShoulder, R_Shoulder: rShoulder, L_UpperLeg: lHip, R_UpperLeg: rHip } = bones;
    const t = state.clock.elapsedTime;

    switch (clip) {
      case "TURN_360": {
        root.rotation.y = (t * 0.9) % (Math.PI * 2);
        root.rotation.z = 0;
        root.position.x = 0;
        root.position.y = 0;
        lShoulder.rotation.x = 0;
        rShoulder.rotation.x = 0;
        if (lHip) lHip.rotation.x = 0;
        if (rHip) rHip.rotation.x = 0;
        activityRef.current = 0.35;
        break;
      }
      case "WALK": {
        root.rotation.y = Math.sin(t * 0.6) * 0.55;
        root.rotation.z = Math.sin(t * 3) * 0.035;
        root.position.x = 0;
        root.position.y = Math.abs(Math.sin(t * 3)) * 0.012;
        lShoulder.rotation.x = Math.sin(t * 3) * 0.35;
        rShoulder.rotation.x = -Math.sin(t * 3) * 0.35;
        if (lHip) lHip.rotation.x = -Math.sin(t * 3) * 0.3;
        if (rHip) rHip.rotation.x = Math.sin(t * 3) * 0.3;
        activityRef.current = 0.85;
        break;
      }
      case "ARM_RAISE": {
        const raise = Math.min(t / 1.4, 1) * -1.2 * (0.5 + 0.5 * Math.sin(t * 1.2));
        root.rotation.y = 0;
        root.rotation.z = 0;
        root.position.x = 0;
        root.position.y = 0;
        lShoulder.rotation.x = raise;
        rShoulder.rotation.x = raise;
        if (lHip) lHip.rotation.x = 0;
        if (rHip) rHip.rotation.x = 0;
        activityRef.current = 0.4;
        break;
      }
      case "WEIGHT_SHIFT": {
        root.rotation.y = Math.sin(t * 0.4) * 0.08;
        root.rotation.z = Math.sin(t * 0.8) * 0.06;
        root.position.x = Math.sin(t * 0.8) * 0.015;
        root.position.y = 0;
        lShoulder.rotation.x = 0;
        rShoulder.rotation.x = 0;
        if (lHip) lHip.rotation.x = 0;
        if (rHip) rHip.rotation.x = 0;
        activityRef.current = 0.25;
        break;
      }
      case "FABRIC_TEST": {
        root.rotation.y = Math.sin(t * 0.5) * 0.7;
        root.rotation.z = 0;
        root.position.x = 0;
        root.position.y = Math.abs(Math.sin(t * 1.5)) * 0.006;
        lShoulder.rotation.x = Math.sin(t * 1.1) * 0.5 - 0.15;
        rShoulder.rotation.x = -Math.sin(t * 1.1) * 0.5 - 0.15;
        if (lHip) lHip.rotation.x = 0;
        if (rHip) rHip.rotation.x = 0;
        activityRef.current = 1.0;
        break;
      }
      case "IDLE":
      default: {
        root.rotation.y = Math.sin(t * 0.3) * 0.05;
        root.rotation.z = 0;
        root.position.x = 0;
        root.position.y = Math.sin(t * 0.8) * 0.004;
        lShoulder.rotation.x = Math.sin(t * 0.5) * 0.05;
        rShoulder.rotation.x = -Math.sin(t * 0.5) * 0.05;
        if (lHip) lHip.rotation.x = 0;
        if (rHip) rHip.rotation.x = 0;
        activityRef.current = 0.15;
        break;
      }
    }
  });

  return activityRef;
}
