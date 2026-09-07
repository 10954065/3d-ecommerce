import * as THREE from "three";
import type { BoneName, MannequinGender } from "./mannequinTypes";
import type { MannequinMeasurements } from "../types";

const effR = (cm: number) => cm / (2 * Math.PI) / 100;

export interface CollisionCapsuleSpec {
  name: string;
  fromBone: BoneName;
  /** Equal to fromBone for a single sphere (hands) rather than a capsule between two joints. */
  toBone: BoneName;
  radius: number;
}

/**
 * Capsule-per-bone collision proxy — the industry-standard technique for
 * body/cloth collision (this is what Marvelous Designer, CLO3D, and every
 * game-engine ragdoll use, not a second detailed mesh). Radii are rough
 * measurement-derived approximations, not re-derived from the visible loft,
 * since a collision volume only needs to roughly contain the body, not match
 * its surface exactly. Capsules are rigid and parented to bone world
 * positions computed by MannequinBuilder, so they track skeleton posing for
 * free — no separate skinning needed since each is one rigid segment.
 */
export function buildCollisionCapsuleSpecs(gender: MannequinGender, m: MannequinMeasurements): CollisionCapsuleSpec[] {
  const chestR = effR(m.chestCm);
  const waistR = effR(m.waistCm);
  const hipR = effR(m.hipsCm);
  const headR = (m.heightCm / 100) * 0.062;
  const neckR = effR(m.neckCm);
  const thighR = effR(m.thighCm) * 0.75;
  const calfR = thighR * 0.62;
  const footR = calfR * 0.55;
  const genderScale = gender === "male" ? 1.04 : 0.96;

  return [
    { name: "headNeck", fromBone: "Head", toBone: "Neck", radius: headR * 0.85 },
    { name: "chest", fromBone: "Chest", toBone: "Spine_02", radius: chestR * genderScale },
    { name: "abdomen", fromBone: "Spine_02", toBone: "Spine_01", radius: waistR * genderScale },
    { name: "pelvis", fromBone: "Spine_01", toBone: "Pelvis", radius: hipR * genderScale },
    { name: "L_upperArm", fromBone: "L_Shoulder", toBone: "L_Forearm", radius: neckR * 0.7 },
    { name: "L_forearm", fromBone: "L_Forearm", toBone: "L_Hand", radius: neckR * 0.55 },
    { name: "R_upperArm", fromBone: "R_Shoulder", toBone: "R_Forearm", radius: neckR * 0.7 },
    { name: "R_forearm", fromBone: "R_Forearm", toBone: "R_Hand", radius: neckR * 0.55 },
    { name: "L_hand", fromBone: "L_Hand", toBone: "L_Hand", radius: neckR * 0.4 },
    { name: "R_hand", fromBone: "R_Hand", toBone: "R_Hand", radius: neckR * 0.4 },
    { name: "L_thigh", fromBone: "L_UpperLeg", toBone: "L_LowerLeg", radius: thighR },
    { name: "L_calf", fromBone: "L_LowerLeg", toBone: "L_Foot", radius: calfR },
    { name: "R_thigh", fromBone: "R_UpperLeg", toBone: "R_LowerLeg", radius: thighR },
    { name: "R_calf", fromBone: "R_LowerLeg", toBone: "R_Foot", radius: calfR },
    { name: "L_foot", fromBone: "L_Foot", toBone: "L_Toe", radius: footR },
    { name: "R_foot", fromBone: "R_Foot", toBone: "R_Toe", radius: footR },
  ];
}

/**
 * Builds the visual/physical collision proxy — a THREE.Group of spheres
 * (hands) and capsules (everything else), positioned from the same bone
 * world positions MannequinBuilder computed for the visible mesh. Not
 * skinned/deformable: each segment is rigid, matching how capsule ragdolls
 * work in every engine that uses this technique.
 */
export function buildCollisionProxy(
  specs: CollisionCapsuleSpec[],
  boneWorldPositions: Record<BoneName, THREE.Vector3>,
  material: THREE.Material = new THREE.MeshBasicMaterial({ color: "#4fc3f7", wireframe: true, transparent: true, opacity: 0.55 }),
): THREE.Group {
  const group = new THREE.Group();
  group.name = "MannequinCollisionProxy";

  for (const spec of specs) {
    const from = boneWorldPositions[spec.fromBone];
    const to = boneWorldPositions[spec.toBone];

    if (spec.fromBone === spec.toBone) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 10, 8), material);
      mesh.position.copy(from);
      mesh.name = spec.name;
      group.add(mesh);
      continue;
    }

    const length = from.distanceTo(to);
    const cylinderLength = Math.max(length - spec.radius, 0.001);
    const capsule = new THREE.CapsuleGeometry(spec.radius, cylinderLength, 4, 8);
    const mesh = new THREE.Mesh(capsule, material);
    mesh.position.copy(from.clone().add(to).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    mesh.name = spec.name;
    group.add(mesh);
  }

  return group;
}
