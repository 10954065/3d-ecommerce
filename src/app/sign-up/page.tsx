import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create Account — Forme",
};

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { callbackUrl } = await searchParams;
  const signInHref = callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-in";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-16">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Forme
      </p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-editorial">
        Create Account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Save addresses and track orders across every visit.
      </p>

      <SignUpForm callbackUrl={callbackUrl} />

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={signInHref} className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
