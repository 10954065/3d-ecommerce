"use client";

import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Loader2, Maximize2, RotateCcw, Sparkles, Wind } from "lucide-react";
import { Scene } from "./scene/Scene";
import type { CameraRigHandle, CameraView } from "./scene/CameraRig";
import { usePerformanceTier } from "./hooks/usePerformanceTier";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useWebglSupport } from "./hooks/useWebglSupport";
import { FallbackGallery } from "./FallbackGallery";
import { FabricInfoPanel } from "./FabricInfoPanel";
import type { MannequinGender } from "./mannequin";
import type {
  AnimationClipName,
  FabricPhysicalProps,
  FitType,
  GarmentArchetype,
  LightingPreset,
  MannequinMeasurements,
} from "./types";

export interface GarmentViewerSizeOption {
  size: string;
  measurements: MannequinMeasurements;
  gender: MannequinGender;
}

export interface GarmentViewerColorOption {
  id: string;
  name: string;
  hexCode: string;
}

interface GarmentViewerProps {
  productId: string;
  productName: string;
  archetype: GarmentArchetype;
  fit: FitType;
  fabric: FabricPhysicalProps;
  fabricName: string;
  colors: GarmentViewerColorOption[];
  sizes: GarmentViewerSizeOption[];
  fallbackImages: { url: string; alt: string }[];
  onSelectionChange?: (selection: { colorId: string; size: string }) => void;
}

const LIGHTING_PRESETS: LightingPreset[] = ["STUDIO", "DAYLIGHT", "WARM", "COOL", "RUNWAY", "OUTDOOR"];
const CAMERA_VIEWS: CameraView[] = ["front", "three-quarter", "right", "back", "left"];

function trackViewEvent(productId: string, action: string) {
  fetch("/api/analytics/3d-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, action }),
    keepalive: true,
  }).catch(() => undefined);
}

export function GarmentViewer(props: GarmentViewerProps) {
  const { productId, productName, archetype, fit, fabric, fabricName, colors, sizes, fallbackImages } = props;

  const webglSupported = useWebglSupport();
  const tier = usePerformanceTier();
  const reducedMotion = useReducedMotion();

  const [colorId, setColorId] = useState(colors[0]?.id);
  const [size, setSize] = useState(sizes.find((s) => s.size === "M")?.size ?? sizes[0]?.size);
  const [clip, setClip] = useState<AnimationClipName>("IDLE");
  const [lighting, setLighting] = useState<LightingPreset>("STUDIO");
  const [fabricFocus, setFabricFocus] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRigRef = useRef<CameraRigHandle>(null);
  const hasTrackedOpenRef = useRef(false);

  const selectedColor = colors.find((c) => c.id === colorId) ?? colors[0];
  const selectedSize = sizes.find((s) => s.size === size) ?? sizes[0];
  const selectedMeasurements = selectedSize?.measurements;
  const selectedGender = selectedSize?.gender ?? "female";

  useEffect(() => {
    if (!hasTrackedOpenRef.current) {
      hasTrackedOpenRef.current = true;
      trackViewEvent(productId, "3d_view_opened");
    }
  }, [productId]);

  const garment = useMemo(
    () =>
      selectedColor
        ? { archetype, fit, colorHex: selectedColor.hexCode, fabric }
        : null,
    [archetype, fit, selectedColor, fabric],
  );

  if (webglSupported === false) {
    return <FallbackGallery images={fallbackImages} reason="3D preview unavailable on this device" />;
  }

  function handleSizeSelect(nextSize: string) {
    setSize(nextSize);
    props.onSelectionChange?.({ colorId: colorId ?? "", size: nextSize });
    trackViewEvent(productId, "size_selected");
  }

  function handleColorSelect(nextColorId: string) {
    setColorId(nextColorId);
    props.onSelectionChange?.({ colorId: nextColorId, size: size ?? "" });
    trackViewEvent(productId, "color_selected");
  }

  function handleSeeInMotion() {
    setClip(clip === "WALK" ? "IDLE" : "WALK");
    trackViewEvent(productId, "simulation_started");
  }

  function handleFeelFabric() {
    const next = !fabricFocus;
    setFabricFocus(next);
    setClip(next ? "FABRIC_TEST" : "IDLE");
    cameraRigRef.current?.setView(next ? "three-quarter" : "front");
    if (next) trackViewEvent(productId, "fabric_viewed");
  }

  function handleFullscreen() {
    containerRef.current?.requestFullscreen?.();
  }

  if (!selectedMeasurements || !garment) {
    return <FallbackGallery images={fallbackImages} reason="This product has no size/color configured yet" />;
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Interactive 3D fitting view of ${productName}`}
      className="relative aspect-4/5 w-full overflow-hidden bg-[#F5F1EA] sm:aspect-3/4"
    >
      <Suspense fallback={<ViewerLoading />}>
        <Scene
          tier={tier}
          gender={selectedGender}
          measurements={selectedMeasurements}
          garment={garment}
          clip={reducedMotion ? "IDLE" : clip}
          lighting={lighting}
          fabricFocus={fabricFocus}
          cameraRigRef={cameraRigRef}
        />
      </Suspense>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
        <div className="pointer-events-auto flex gap-1.5">
          {CAMERA_VIEWS.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => cameraRigRef.current?.setView(view)}
              className="border border-ink/15 bg-background/80 px-2 py-1 text-[10px] uppercase tracking-editorial backdrop-blur transition-colors hover:bg-background"
            >
              {view.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => cameraRigRef.current?.reset()}
            aria-label="Reset camera"
            className="flex h-8 w-8 items-center justify-center border border-ink/15 bg-background/80 backdrop-blur hover:bg-background"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="flex h-8 w-8 items-center justify-center border border-ink/15 bg-background/80 backdrop-blur hover:bg-background"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-3 sm:p-4">
        {fabricFocus && <FabricInfoPanel fabricName={fabricName} fabric={fabric} />}

        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSeeInMotion}
            className="flex items-center gap-1.5 border border-ink bg-ink px-3 py-1.5 text-[11px] uppercase tracking-editorial text-bone transition-opacity hover:opacity-85"
          >
            <Wind className="h-3.5 w-3.5" strokeWidth={1.5} />
            {clip === "WALK" ? "Stop motion" : "See it in motion"}
          </button>
          <button
            type="button"
            onClick={handleFeelFabric}
            className="flex items-center gap-1.5 border border-ink/20 bg-background/80 px-3 py-1.5 text-[11px] uppercase tracking-editorial backdrop-blur transition-colors hover:bg-background"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            {fabricFocus ? "Exit fabric view" : "Experience the fabric"}
          </button>

          <div className="ml-auto flex gap-1">
            {LIGHTING_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLighting(preset)}
                aria-label={`${preset} lighting`}
                className={`h-6 w-6 border ${lighting === preset ? "border-accent" : "border-ink/15"} bg-background/80 text-[9px] uppercase backdrop-blur`}
                title={preset}
              >
                {preset[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-4 border-t border-ink/10 pt-3">
          <div className="flex items-center gap-1.5">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => handleColorSelect(color.id)}
                aria-label={color.name}
                title={color.name}
                className={`h-6 w-6 rounded-full border-2 ${colorId === color.id ? "border-accent" : "border-transparent"}`}
                style={{ backgroundColor: color.hexCode }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {sizes.map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={() => handleSizeSelect(s.size)}
                className={`h-7 min-w-7 border px-1.5 text-[11px] ${
                  size === s.size ? "border-ink bg-ink text-bone" : "border-ink/20 bg-background/80"
                }`}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewerLoading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F5F1EA] text-ink">
      <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Preparing your fitting experience
      </p>
    </div>
  );
}
