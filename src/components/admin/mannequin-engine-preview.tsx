"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import {
  Mannequin,
  Garment,
  useMannequinAnimation,
  DEFAULT_FEMALE_MEASUREMENTS,
  DEFAULT_MALE_MEASUREMENTS,
  MANNEQUIN_MATERIAL_PRESETS,
  BODY_SHAPE_PRESETS,
  BODY_SHAPE_WEIGHTS,
  resolveSizeMorphWeights,
  combineMorphWeights,
  type MannequinGender,
  type MannequinHandle,
  type MannequinMaterialPresetId,
  type BodyShapePreset,
  type SizeLabel,
} from "@/components/3d/mannequin";
import { CameraRig, type CameraRigHandle, type CameraView } from "@/components/3d/scene/CameraRig";
import { LightingRig } from "@/components/3d/scene/LightingRig";
import type { AnimationClipName, FitType, GarmentArchetype, LightingPreset } from "@/components/3d/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CAMERA_VIEWS: CameraView[] = ["front", "three-quarter", "right", "back", "left"];
const LIGHTING_PRESETS: LightingPreset[] = ["STUDIO", "DAYLIGHT", "WARM", "COOL", "RUNWAY", "OUTDOOR"];
const MATERIAL_IDS = Object.keys(MANNEQUIN_MATERIAL_PRESETS) as MannequinMaterialPresetId[];
const SIZES: SizeLabel[] = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const ARCHETYPES: (GarmentArchetype | "none")[] = ["none", "tshirt", "shirt", "jacket", "coat", "trousers", "jumpsuit", "skirt", "dress"];
const FITS: FitType[] = ["SLIM", "REGULAR", "RELAXED", "OVERSIZED"];
const CLIPS: AnimationClipName[] = ["IDLE", "WEIGHT_SHIFT", "ARM_RAISE", "TURN_360", "WALK", "FABRIC_TEST"];
const GARMENT_COLORS = ["#2B2B2B", "#C9A9A6", "#3E5C76", "#EFE7D8"];

/** Cotton preset from prisma/seed-data/fabrics.ts — a representative default for QA, not tied to a real product. */
const QA_FABRIC = {
  massGsm: 180,
  friction: 0.45,
  stiffness: 0.35,
  bendingResistance: 0.4,
  stretchResistance: 0.3,
  damping: 0.3,
  elasticity: 0.25,
  drape: "medium" as const,
};

interface PreviewSceneProps {
  gender: MannequinGender;
  measurements: (typeof DEFAULT_FEMALE_MEASUREMENTS);
  material: MannequinMaterialPresetId;
  morphWeights: ReturnType<typeof combineMorphWeights>;
  showCollisionDebug: boolean;
  archetype: GarmentArchetype | "none";
  fit: FitType;
  colorHex: string;
  clip: AnimationClipName;
}

/** Rendered inside <Canvas> — useMannequinAnimation calls useFrame, which only works within the R3F render tree. */
function PreviewScene({ gender, measurements, material, morphWeights, showCollisionDebug, archetype, fit, colorHex, clip }: PreviewSceneProps) {
  const mannequinRef = useRef<MannequinHandle>(null);
  const [skeleton, setSkeleton] = useState<THREE.Skeleton | null>(null);
  const activityRef = useMannequinAnimation(mannequinRef, clip);

  useEffect(() => {
    setSkeleton(mannequinRef.current?.skeleton ?? null);
  }, [gender, measurements, material]);

  return (
    <>
      <Mannequin
        ref={mannequinRef}
        gender={gender}
        measurements={measurements}
        material={material}
        morphWeights={morphWeights}
        showCollisionDebug={showCollisionDebug}
      />
      {skeleton && archetype !== "none" && (
        <Garment
          gender={gender}
          measurements={measurements}
          archetype={archetype}
          fit={fit}
          colorHex={colorHex}
          fabric={QA_FABRIC}
          skeleton={skeleton}
          activityRef={activityRef}
        />
      )}
    </>
  );
}

/** Internal QA surface for the mannequin+garment engine — reuses the existing CameraRig/LightingRig unmodified. */
export function MannequinEnginePreview() {
  const [gender, setGender] = useState<MannequinGender>("female");
  const [material, setMaterial] = useState<MannequinMaterialPresetId>("ivory");
  const [lighting, setLighting] = useState<LightingPreset>("STUDIO");
  const [size, setSize] = useState<SizeLabel>("M");
  const [shape, setShape] = useState<BodyShapePreset>("Regular");
  const [showCollisionDebug, setShowCollisionDebug] = useState(false);
  const [archetype, setArchetype] = useState<GarmentArchetype | "none">("tshirt");
  const [fit, setFit] = useState<FitType>("REGULAR");
  const [colorHex, setColorHex] = useState(GARMENT_COLORS[0]);
  const [clip, setClip] = useState<AnimationClipName>("IDLE");
  const cameraRigRef = useRef<CameraRigHandle>(null);

  const measurements = gender === "female" ? DEFAULT_FEMALE_MEASUREMENTS : DEFAULT_MALE_MEASUREMENTS;
  const morphWeights = useMemo(
    () => combineMorphWeights(resolveSizeMorphWeights(gender, size), BODY_SHAPE_WEIGHTS[shape]),
    [gender, size, shape],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={gender} onValueChange={(v) => setGender(v as MannequinGender)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </SelectContent>
        </Select>

        <Select value={material} onValueChange={(v) => setMaterial(v as MannequinMaterialPresetId)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {MANNEQUIN_MATERIAL_PRESETS[id].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {CAMERA_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => cameraRigRef.current?.setView(view)}
              className="border border-border px-2 py-1 text-[10px] uppercase tracking-wide hover:bg-muted"
            >
              {view.replace("-", " ")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => cameraRigRef.current?.reset()}
            className="border border-border px-2 py-1 text-[10px] uppercase tracking-wide hover:bg-muted"
          >
            reset
          </button>
        </div>

        <div className="flex gap-1">
          {LIGHTING_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setLighting(preset)}
              title={preset}
              className={`h-6 w-6 border text-[9px] uppercase ${lighting === preset ? "border-accent" : "border-border"}`}
            >
              {preset[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={size} onValueChange={(v) => setSize(v as SizeLabel)}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={shape} onValueChange={(v) => setShape(v as BodyShapePreset)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_SHAPE_PRESETS.map((preset) => (
              <SelectItem key={preset} value={preset}>
                {preset}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          <input type="checkbox" checked={showCollisionDebug} onChange={(e) => setShowCollisionDebug(e.target.checked)} />
          collision proxy
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <Select value={archetype} onValueChange={(v) => setArchetype(v as GarmentArchetype | "none")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ARCHETYPES.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fit} onValueChange={(v) => setFit(v as FitType)}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FITS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          {GARMENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorHex(c)}
              aria-label={c}
              className={`h-6 w-6 rounded-full border-2 ${colorHex === c ? "border-accent" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <Select value={clip} onValueChange={(v) => setClip(v as AnimationClipName)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLIPS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="aspect-4/5 w-full max-w-md overflow-hidden rounded-lg border border-border bg-[#F5F1EA]">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.9, 2.6], fov: 32 }}
          gl={{ antialias: true }}
          onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
        >
          <color attach="background" args={["#F5F1EA"]} />
          <Suspense fallback={null}>
            <LightingRig preset={lighting} />
            <PreviewScene
              gender={gender}
              measurements={measurements}
              material={material}
              morphWeights={morphWeights}
              showCollisionDebug={showCollisionDebug}
              archetype={archetype}
              fit={fit}
              colorHex={colorHex}
              clip={clip}
            />
            <CameraRig ref={cameraRigRef} fabricFocus={false} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
