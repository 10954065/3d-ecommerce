import * as THREE from "three";
import { BONE_ORDER, BONE_PARENTS } from "./mannequinConfig";
import type { BoneName } from "./mannequinTypes";

export interface BuiltSkeleton {
  skeleton: THREE.Skeleton;
  bones: Record<BoneName, THREE.Bone>;
  rootBone: THREE.Bone;
}

/**
 * Builds the requested bone hierarchy (Root -> Pelvis -> Spine -> ... ) from
 * world-space bone positions computed alongside the mesh in MannequinBuilder,
 * so joints always line up with the geometry regardless of measurements.
 * Bones are left at identity rotation in the bind pose — nothing here relies
 * on a specific bone-forward convention, only on world position, which
 * `SkinnedMesh.bind()` captures correctly regardless of orientation.
 */
export function buildSkeleton(boneWorldPositions: Record<BoneName, THREE.Vector3>): BuiltSkeleton {
  const bones = {} as Record<BoneName, THREE.Bone>;
  for (const name of BONE_ORDER) {
    const bone = new THREE.Bone();
    bone.name = name;
    bones[name] = bone;
  }
  for (const name of BONE_ORDER) {
    const parentName = BONE_PARENTS[name];
    if (parentName === null) {
      bones[name].position.copy(boneWorldPositions[name]);
    } else {
      bones[name].position.copy(boneWorldPositions[name].clone().sub(boneWorldPositions[parentName]));
      bones[parentName].add(bones[name]);
    }
  }

  const rootBone = bones.Root;
  rootBone.updateMatrixWorld(true);

  const skeleton = new THREE.Skeleton(BONE_ORDER.map((name) => bones[name]));
  return { skeleton, bones, rootBone };
}

/**
 * A fixed, static, non-T-pose stance applied once at bind time — a relaxed
 * head tilt and slightly turned-out feet, matching how a real retail
 * mannequin stands. The base geometry already hangs its arms at a natural
 * angle rather than a literal horizontal T-pose, so this is a light finishing
 * touch, not a full pose system; real animation clips are Phase 3.
 */
export function applyPresentationPose(bones: Record<BoneName, THREE.Bone>): void {
  const deg = THREE.MathUtils.degToRad;
  bones.Head.rotation.y = deg(4);
  bones.Head.rotation.z = deg(-2);
  bones.Spine_02.rotation.y = deg(-1.5);
  bones.L_Foot.rotation.y = deg(-8);
  bones.R_Foot.rotation.y = deg(10);
}
