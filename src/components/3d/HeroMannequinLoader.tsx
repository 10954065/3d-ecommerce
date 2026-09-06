"use client";

import dynamic from "next/dynamic";

export const HeroMannequinLoader = dynamic(
  () => import("./HeroMannequin").then((mod) => mod.HeroMannequin),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#F5F1EA]" /> },
);
