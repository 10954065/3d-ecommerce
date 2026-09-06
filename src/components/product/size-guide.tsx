"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SizeGuideProps {
  sizeOptions: {
    size: string;
    measurements: {
      heightCm: number;
      chestCm: number;
      waistCm: number;
      hipsCm: number;
    };
  }[];
}

export function SizeGuide({ sizeOptions }: SizeGuideProps) {
  return (
    <Dialog>
      <DialogTrigger className="text-xs underline underline-offset-4">
        Size guide
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-editorial">
            Size Guide
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-editorial text-muted-foreground">
                <th className="py-2 pr-4">Size</th>
                <th className="py-2 pr-4">Height (cm)</th>
                <th className="py-2 pr-4">Chest (cm)</th>
                <th className="py-2 pr-4">Waist (cm)</th>
                <th className="py-2">Hips (cm)</th>
              </tr>
            </thead>
            <tbody>
              {sizeOptions.map((option) => (
                <tr key={option.size} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{option.size}</td>
                  <td className="py-2 pr-4">{option.measurements.heightCm}</td>
                  <td className="py-2 pr-4">{option.measurements.chestCm}</td>
                  <td className="py-2 pr-4">{option.measurements.waistCm}</td>
                  <td className="py-2">{option.measurements.hipsCm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
