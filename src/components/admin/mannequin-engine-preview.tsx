"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Mannequin,
  DEFAULT_FEMALE_MEASUREMENTS,
  DEFAULT_MALE_MEASUREMENTS,
  MANNEQUIN_MATERIAL_PRESETS,
  type MannequinGender,
  type MannequinMaterialPresetId,
} from "@/components/3d/mannequin";
import { CameraRig, type CameraRigHandle, type CameraView } from "@/components/3d/scene/CameraRig";
import { LightingRig } from "@/components/3d/scene/LightingRig";
import type { LightingPreset } from "@/components/3d/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CAMERA_VIEWS: CameraView[] = ["front", "three-quarter", "right", "back", "left"];
const LIGHTING_PRESETS: LightingPreset[] = ["STUDIO", "DAYLIGHT", "WARM", "COOL", "RUNWAY", "OUTDOOR"];
const MATERIAL_IDS = Object.keys(MANNEQUIN_MATERIAL_PRESETS) as MannequinMaterialPresetId[];

/** Internal QA surface for the Phase 1 mannequin engine — reuses the existing CameraRig/LightingRig unmodified. */
export function MannequinEnginePreview() {
  const [gender, setGender] = useState<MannequinGender>("female");
  const [material, setMaterial] = useState<MannequinMaterialPresetId>("ivory");
  const [lighting, setLighting] = useState<LightingPreset>("STUDIO");
  const cameraRigRef = useRef<CameraRigHandle>(null);

  const measurements = gender === "female" ? DEFAULT_FEMALE_MEASUREMENTS : DEFAULT_MALE_MEASUREMENTS;

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

      <div className="aspect-4/5 w-full max-w-md overflow-hidden rounded-lg border border-border bg-[#F5F1EA]">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.9, 2.6], fov: 32 }} gl={{ antialias: true }}>
          <color attach="background" args={["#F5F1EA"]} />
          <Suspense fallback={null}>
            <LightingRig preset={lighting} />
            <Mannequin gender={gender} measurements={measurements} material={material} />
            <CameraRig ref={cameraRigRef} fabricFocus={false} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
