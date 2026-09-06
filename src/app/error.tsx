"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-6 px-4 py-32 text-center">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="font-display text-4xl">We hit a snag.</h1>
      <p className="max-w-[42ch] text-sm text-muted-foreground">
        Please try again. If the problem persists, your cart and account are
        unaffected.
      </p>
      <Button size="lg" className="uppercase tracking-editorial" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
