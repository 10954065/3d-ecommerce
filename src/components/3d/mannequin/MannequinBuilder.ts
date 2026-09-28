import * as THREE from "three";
import { buildEarChain, buildEyelidChain, buildFingerChain, buildFootChain, FINGER_LAYOUT } from "./geometry/body-chains";
import { armBreakpoints, computeBodyFrame, legBreakpoints, torsoBreakpoints, type MannequinMorphOverrides } from "./geometry/body-frame";
import { buildPart, concatParts, localToWorld, yOf, type BoneBreakpoint } from "./geometry/skinned-loft";
import { FINGER_RADIAL_SEGMENTS, FINGER_RINGS_PER_SEGMENT, RADIAL_SEGMENTS, RINGS_PER_SEGMENT } from "./mannequinConfig";
import type { BoneName, MannequinGender } from "./mannequinTypes";
import type { MannequinMeasurements } from "../types";

export type { MannequinMorphOverrides } from "./geometry/body-frame";

export interface MannequinBuild {
  geometry: THREE.BufferGeometry;
  boneWorldPositions: Record<BoneName, THREE.Vector3>;
}

/**
 * Builds the full mannequin: one continuous torso+neck+head loft, two arms
 * (each including its own palm), ten fingers, two legs, and two feet — every
 * part its own smooth ring-loft (never a raw primitive), assembled into one
 * BufferGeometry ready to bind to a THREE.Skeleton. Parts meet by deliberate
 * overlap (a couple centimeters embedded into the parent volume) rather than
 * exact vertex welding — see docs/MANNEQUIN_SYSTEM.md for why a fully
 * manifold branching mesh (torso forking into two legs, palms forking into
 * five fingers) is out of scope without a DCC/retopology tool, and why
 * overlap reads as one coherent figure at normal viewing distance regardless.
 *
 * Body-relative sockets/directions come from `computeBodyFrame` (shared with
 * GarmentBuilder.ts) so garments always stay glued to this body regardless of
 * gender, measurements, or morph overrides.
 */
export function buildMannequinGeometry(
  gender: MannequinGender,
  measurements: MannequinMeasurements,
  overrides?: MannequinMorphOverrides,
): MannequinBuild {
  const frame = computeBodyFrame(gender, measurements, overrides);
  const { torso } = frame;

  const boneWorldPositions = {} as Record<BoneName, THREE.Vector3>;
  boneWorldPositions.Root = new THREE.Vector3(0, 0, 0);
  boneWorldPositions.Pelvis = new THREE.Vector3(0, yOf(torso.landmarks, "pelvisBottom"), 0);
  boneWorldPositions.Spine = new THREE.Vector3(0, yOf(torso.landmarks, "hip"), 0);
  boneWorldPositions.Spine_01 = new THREE.Vector3(0, yOf(torso.landmarks, "waist"), 0);
  boneWorldPositions.Spine_02 = new THREE.Vector3(0, yOf(torso.landmarks, "underbust"), 0);
  boneWorldPositions.Chest = new THREE.Vector3(0, yOf(torso.landmarks, "chest"), 0);
  boneWorldPositions.Neck = new THREE.Vector3(0, yOf(torso.landmarks, "neckBase"), 0);
  boneWorldPositions.Head = new THREE.Vector3(0, yOf(torso.landmarks, "jaw"), 0);

  const parts = [
    buildPart(torso.landmarks, torsoBreakpoints(torso), { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
      origin: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      anchorLocalY: 0,
    }),
  ];

  // Minimal facial structure: ears and closed-eyelid ridges, positioned by
  // interpolating between the jaw and cheek landmarks already used for the
  // head's own silhouette (see buildEarChain/buildEyelidChain for why these
  // are separate small lofts rather than an indentation in the head loft).
  const jawLandmark = torso.landmarks.find((l) => l.name === "jaw")!;
  const cheekLandmark = torso.landmarks.find((l) => l.name === "cheek")!;
  const lerpFace = (a: number, b: number, t: number) => a + (b - a) * t;

  (["L", "R"] as const).forEach((sideLabel) => {
    const side = sideLabel === "L" ? -1 : 1;

    const earT = 0.5;
    const earY = lerpFace(jawLandmark.y, cheekLandmark.y, earT);
    const earHalfWidth = lerpFace(jawLandmark.halfWidth, cheekLandmark.halfWidth, earT);
    const earSocket = new THREE.Vector3(side * earHalfWidth * 0.95, earY, -earHalfWidth * 0.08);
    const earDir = new THREE.Vector3(side, -0.2, -0.35).normalize();
    const earLandmarks = buildEarChain(frame.torso.headRadius);
    parts.push(
      buildPart(earLandmarks, [{ bone: "Head", localY: 0 }], { radialSegments: FINGER_RADIAL_SEGMENTS, ringsPerSegment: FINGER_RINGS_PER_SEGMENT }, {
        origin: earSocket,
        direction: earDir,
        anchorLocalY: 0,
      }),
    );

    const eyeT = 0.82;
    const eyeY = lerpFace(jawLandmark.y, cheekLandmark.y, eyeT);
    const eyeHalfWidth = lerpFace(jawLandmark.halfWidth, cheekLandmark.halfWidth, eyeT);
    const eyeDepthFront = lerpFace(jawLandmark.depthFront, cheekLandmark.depthFront, eyeT);
    const eyeSocket = new THREE.Vector3(side * eyeHalfWidth * 0.42, eyeY, eyeDepthFront * 0.9);
    const eyeDir = new THREE.Vector3(0, -0.12, 1).normalize();
    const eyelidLandmarks = buildEyelidChain(frame.torso.headRadius);
    parts.push(
      buildPart(eyelidLandmarks, [{ bone: "Head", localY: 0 }], { radialSegments: FINGER_RADIAL_SEGMENTS, ringsPerSegment: FINGER_RINGS_PER_SEGMENT }, {
        origin: eyeSocket,
        direction: eyeDir,
        anchorLocalY: 0,
      }),
    );
  });

  (["L", "R"] as const).forEach((sideLabel) => {
    const side = sideLabel === "L" ? -1 : 1;
    const { shoulderSocket, armDir, armAnchorY, armLateral, armForward, arm } = frame.arms[sideLabel];

    boneWorldPositions[`${sideLabel}_Shoulder`] = shoulderSocket.clone();
    boneWorldPositions[`${sideLabel}_UpperArm`] = shoulderSocket.clone();
    boneWorldPositions[`${sideLabel}_Forearm`] = localToWorld(new THREE.Vector3(0, yOf(arm.landmarks, "elbow"), 0), shoulderSocket, armDir, armAnchorY);
    boneWorldPositions[`${sideLabel}_Hand`] = localToWorld(new THREE.Vector3(0, yOf(arm.landmarks, "wrist"), 0), shoulderSocket, armDir, armAnchorY);

    parts.push(
      buildPart(arm.landmarks, armBreakpoints(sideLabel, arm), { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
        origin: shoulderSocket,
        direction: armDir,
        anchorLocalY: armAnchorY,
      }),
    );

    const palmEndLandmark = arm.landmarks.find((l) => l.name === "palmEnd")!;
    const palmEndWorld = localToWorld(new THREE.Vector3(0, palmEndLandmark.y, 0), shoulderSocket, armDir, armAnchorY);

    for (const finger of FINGER_LAYOUT) {
      const fingerLength = arm.wristRadius * 3.4 * finger.lengthFraction;
      const fingerRadius = arm.wristRadius * 0.3 * finger.radiusFraction;
      const fingerLandmarks = buildFingerChain(fingerLength, fingerRadius);
      const fingerBaseLocalY = yOf(fingerLandmarks, "base");

      const fingerBaseWorld = palmEndWorld
        .clone()
        .add(armLateral.clone().multiplyScalar(side * finger.spreadX * palmEndLandmark.halfWidth))
        .add(armForward.clone().multiplyScalar(finger.spreadZ * palmEndLandmark.halfWidth));

      const fingerDir =
        finger.name === "thumb"
          ? armDir.clone().lerp(armLateral.clone().multiplyScalar(side), 0.5).normalize()
          : armDir.clone().applyAxisAngle(armLateral, finger.bendZ).normalize();

      parts.push(
        buildPart(
          fingerLandmarks,
          [{ bone: `${sideLabel}_Hand`, localY: fingerBaseLocalY }],
          { radialSegments: FINGER_RADIAL_SEGMENTS, ringsPerSegment: FINGER_RINGS_PER_SEGMENT },
          { origin: fingerBaseWorld, direction: fingerDir, anchorLocalY: fingerBaseLocalY },
        ),
      );
    }

    const { hipSocket, legDir, legAnchorY, ankleWorld, leg } = frame.legs[sideLabel];

    boneWorldPositions[`${sideLabel}_UpperLeg`] = hipSocket.clone();
    boneWorldPositions[`${sideLabel}_LowerLeg`] = localToWorld(new THREE.Vector3(0, yOf(leg.landmarks, "knee"), 0), hipSocket, legDir, legAnchorY);
    boneWorldPositions[`${sideLabel}_Foot`] = ankleWorld.clone();

    parts.push(
      buildPart(leg.landmarks, legBreakpoints(sideLabel, leg), { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
        origin: hipSocket,
        direction: legDir,
        anchorLocalY: legAnchorY,
      }),
    );

    const foot = buildFootChain(measurements, frame.proportions);
    const footAnchorY = yOf(foot.landmarks, "ankleAbove");
    const footDir = new THREE.Vector3(0, 0, 1);
    boneWorldPositions[`${sideLabel}_Toe`] = localToWorld(new THREE.Vector3(0, yOf(foot.landmarks, "ball"), 0), ankleWorld, footDir, footAnchorY);

    const footBreakpoints: BoneBreakpoint[] = [
      { bone: `${sideLabel}_Foot`, localY: yOf(foot.landmarks, "ankleAbove") },
      { bone: `${sideLabel}_Toe`, localY: yOf(foot.landmarks, "ball") },
    ];
    parts.push(
      buildPart(foot.landmarks, footBreakpoints, { radialSegments: RADIAL_SEGMENTS, ringsPerSegment: RINGS_PER_SEGMENT }, {
        origin: ankleWorld,
        direction: footDir,
        anchorLocalY: footAnchorY,
      }),
    );
  });

  const geometry = concatParts(parts);
  return { geometry, boneWorldPositions };
}
