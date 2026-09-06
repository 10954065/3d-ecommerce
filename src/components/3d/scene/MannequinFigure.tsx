"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildHumanoidRig } from "../procedural/humanoid";
import { getGarmentPlan } from "../procedural/garment-builder";
import { createFabricMaterial, type FabricMaterialHandle } from "../materials/fabric-material";
import type { FabricPhysicalProps, FitType, GarmentArchetype, MannequinMeasurements } from "../types";

const MANNEQUIN_COLOR = "#DCD5C8";

export interface MannequinFigureHandle {
  root: THREE.Group | null;
  leftArm: THREE.Group | null;
  rightArm: THREE.Group | null;
}

interface GarmentSpec {
  archetype: GarmentArchetype;
  fit: FitType;
  colorHex: string;
  fabric: FabricPhysicalProps;
}

interface MannequinFigureProps {
  measurements: MannequinMeasurements;
  garment: GarmentSpec | null;
  /** Ref rather than state — read inside useFrame so per-frame changes never trigger a re-render. */
  activityRef: RefObject<number>;
}

/**
 * Composes the mannequin body and (optional) garment into one rig so both
 * share the same shoulder pivots — required for the arm-raise / turn / walk
 * animations to move sleeves and arms together. See AnimationController for
 * the imperative per-frame pose driver that targets the refs this exposes.
 */
export const MannequinFigure = forwardRef<MannequinFigureHandle, MannequinFigureProps>(
  function MannequinFigure({ measurements, garment, activityRef }, ref) {
    const rig = useMemo(() => buildHumanoidRig(measurements), [measurements]);
    const plan = useMemo(
      () => (garment ? getGarmentPlan(garment.archetype, rig, garment.fit) : null),
      [garment, rig],
    );

    const rootRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const fabricHandles = useRef<FabricMaterialHandle[]>([]);
    fabricHandles.current = [];

    useImperativeHandle(ref, () => ({
      root: rootRef.current,
      leftArm: leftArmRef.current,
      rightArm: rightArmRef.current,
    }));

    const bodyMaterial = useMemo(
      () => new THREE.MeshStandardMaterial({ color: MANNEQUIN_COLOR, roughness: 0.75, metalness: 0.02 }),
      [],
    );

    function registerFabric(minY: number, maxY: number): THREE.MeshStandardMaterial {
      if (!garment) return bodyMaterial;
      const handle = createFabricMaterial(garment.colorHex, garment.fabric, minY, maxY);
      fabricHandles.current.push(handle);
      return handle.material;
    }

    useFrame((state) => {
      for (const handle of fabricHandles.current) {
        handle.uniforms.uTime.value = state.clock.elapsedTime;
        handle.uniforms.uActivity.value = activityRef.current;
      }
    });

    const armSleeveLength = plan?.sleeve?.length ?? rig.armLength;
    const torsoMinY = plan?.torso[0]?.y ?? rig.torso[0].y;
    const torsoTopSeg = plan?.torso.at(-1) ?? rig.torso.at(-1)!;
    const torsoMaxY = torsoTopSeg.y + torsoTopSeg.height;

    return (
      <group ref={rootRef}>
        {rig.torso.map((seg) => (
          <mesh key={seg.name} position={[0, seg.y + seg.height / 2, 0]} material={bodyMaterial} castShadow receiveShadow>
            <cylinderGeometry args={[seg.radiusTop, seg.radiusBottom, seg.height, 24, 1]} />
          </mesh>
        ))}
        <mesh position={[0, rig.neck.y + rig.neck.height / 2, 0]} material={bodyMaterial} castShadow>
          <cylinderGeometry args={[rig.neck.radiusTop, rig.neck.radiusBottom, rig.neck.height, 16]} />
        </mesh>
        <mesh position={[0, rig.headY, 0]} material={bodyMaterial} castShadow>
          <sphereGeometry args={[rig.headRadius, 24, 24]} />
        </mesh>

        {plan?.torso.map((seg) => (
          <mesh
            key={`g-${seg.name}`}
            position={[0, seg.y + seg.height / 2, 0]}
            material={registerFabric(torsoMinY, torsoMaxY)}
            castShadow
          >
            <cylinderGeometry args={[seg.radiusTop * 1.001, seg.radiusBottom * 1.001, seg.height * 1.01, 24, 1]} />
          </mesh>
        ))}

        {([-1, 1] as const).map((side) => {
          const armRef = side === -1 ? leftArmRef : rightArmRef;
          return (
            <group key={`arm-${side}`} ref={armRef} position={[side * rig.shoulderHalfWidth, rig.shoulderY, 0]}>
              <mesh
                position={[0, -rig.armLength / 2, 0]}
                rotation={[0, 0, side * 0.09]}
                material={bodyMaterial}
                castShadow
              >
                <capsuleGeometry args={[rig.armRadiusTop, rig.armLength - rig.armRadiusTop * 2, 4, 12]} />
              </mesh>
              {plan?.sleeve && (
                <mesh
                  position={[0, -armSleeveLength / 2, 0]}
                  rotation={[0, 0, side * 0.09]}
                  material={registerFabric(rig.shoulderY - armSleeveLength, rig.shoulderY)}
                  castShadow
                >
                  <capsuleGeometry
                    args={[plan.sleeve.radiusTop, Math.max(armSleeveLength - plan.sleeve.radiusTop * 2, 0.02), 4, 12]}
                  />
                </mesh>
              )}
            </group>
          );
        })}

        {([-1, 1] as const).map((side) => (
          <mesh
            key={`leg-${side}`}
            position={[side * rig.hipHalfWidth, rig.ankleY + rig.legLength / 2, 0]}
            material={bodyMaterial}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[rig.legRadiusTop, rig.legRadiusBottom, rig.legLength, 20]} />
          </mesh>
        ))}

        {plan?.legs &&
          ([-1, 1] as const).map((side) => (
            <mesh
              key={`g-leg-${side}`}
              position={[side * rig.hipHalfWidth, plan.legs!.startY + plan.legs!.length / 2, 0]}
              material={registerFabric(plan.legs!.startY, plan.legs!.startY + plan.legs!.length)}
              castShadow
            >
              <cylinderGeometry args={[plan.legs!.radiusTop, plan.legs!.radiusBottom, plan.legs!.length, 20]} />
            </mesh>
          ))}

        {plan?.skirt && (
          <mesh
            position={[0, (plan.skirt.topY + plan.skirt.bottomY) / 2, 0]}
            material={registerFabric(plan.skirt.bottomY, plan.skirt.topY)}
            castShadow
          >
            <cylinderGeometry
              args={[plan.skirt.radiusTop, plan.skirt.radiusBottom, plan.skirt.topY - plan.skirt.bottomY, 32, 4, true]}
            />
          </mesh>
        )}

        <mesh position={[0, 0.005, 0]} receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.01, 32]} />
          <meshStandardMaterial color="#F5F1EA" roughness={0.9} />
        </mesh>
      </group>
    );
  },
);
