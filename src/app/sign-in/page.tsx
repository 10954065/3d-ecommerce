import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — Forme",
};

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;
  const signUpHref = callbackUrl
    ? `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/sign-up";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-16">
      <p className="text-xs uppercase tracking-editorial text-muted-foreground">
        Forme
      </p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-editorial">
        Sign In
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back. Sign in to view your orders and saved addresses.
      </p>

      <SignInForm callbackUrl={callbackUrl} />

      <p className="mt-6 text-sm text-muted-foreground">
        New to Forme?{" "}
        <Link href={signUpHref} className="text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
