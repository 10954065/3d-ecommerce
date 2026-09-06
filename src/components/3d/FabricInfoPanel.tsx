import type { FabricPhysicalProps } from "./types";

interface FabricInfoPanelProps {
  fabricName: string;
  fabric: FabricPhysicalProps;
}

function stretchLabel(value: number): string {
  if (value < 0.2) return "High";
  if (value < 0.5) return "Medium";
  return "Low";
}

function weightLabel(gsm: number): string {
  if (gsm < 150) return "Lightweight";
  if (gsm < 350) return "Medium";
  return "Heavyweight";
}

/** Section 16 — fabric detail shown during "Experience the Fabric" mode. */
export function FabricInfoPanel({ fabricName, fabric }: FabricInfoPanelProps) {
  const rows = [
    { label: "Material", value: fabricName },
    { label: "Weight", value: weightLabel(fabric.massGsm) },
    { label: "Drape", value: fabric.drape[0].toUpperCase() + fabric.drape.slice(1) },
    { label: "Stretch", value: stretchLabel(fabric.stretchResistance) },
  ];

  return (
    <div className="pointer-events-auto grid grid-cols-2 gap-x-6 gap-y-1 border border-ink/15 bg-background/90 p-3 text-xs backdrop-blur sm:grid-cols-4">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="text-[10px] uppercase tracking-editorial text-muted-foreground">{row.label}</p>
          <p>{row.value}</p>
        </div>
      ))}
    </div>
  );
}
