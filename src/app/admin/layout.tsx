import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Forme Admin",
  },
  robots: { index: false, follow: false },
};

/**
 * Route access itself is already gated by src/proxy.ts (redirects unauthenticated
 * users to /sign-in and non-admin/staff users to /). This layout only reads the
 * session for display purposes (greeting, sign-out).
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <div className="border-b border-sidebar-border px-4 py-4">
          <Link href="/admin" className="font-display text-lg uppercase tracking-editorial text-sidebar-foreground">
            Forme Admin
          </Link>
        </div>
        <div className="flex-1">
          <AdminSidebar />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-3 text-xs text-sidebar-foreground/60">
            {session?.user?.email}
          </p>
          <p className="px-3 pb-2 text-[11px] uppercase tracking-wide text-sidebar-foreground/40">
            {session?.user?.role}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <span className="font-display text-base uppercase tracking-editorial">Forme Admin</span>
          <Link href="/" className="text-xs text-muted-foreground underline">
            View storefront
          </Link>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
