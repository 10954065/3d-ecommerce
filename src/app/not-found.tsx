import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-6 px-4 py-32 text-center">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Error 404
      </p>
      <h1 className="font-display text-4xl">This page has left the collection.</h1>
      <p className="max-w-[42ch] text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Explore the current collection instead.
      </p>
      <Button size="lg" className="uppercase tracking-editorial" render={<Link href="/" />}>
        Return home
      </Button>
    </div>
  );
}
