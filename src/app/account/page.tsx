import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { signOutAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Your Account — Forme",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function AccountPage() {
  const session = await auth();
  // The proxy already gates /account, but a Server Component should never
  // trust that alone — re-verify and bail out defensively.
  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/account");
  }

  const userId = session.user.id;

  const [user, addresses, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.order.findMany({
      where: { userId },
      include: { items: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) {
    redirect("/sign-in?callbackUrl=/account");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-editorial text-muted-foreground">
            Account
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-editorial">
            {user.name ?? "Your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sign Out
          </Button>
        </form>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-lg uppercase tracking-editorial">
          Saved Addresses
        </h2>
        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No saved addresses yet — one is added automatically the next time you check out.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className="border border-border p-4 text-sm">
                <p className="font-medium">
                  {address.fullName}
                  {address.isDefault && (
                    <span className="ml-2 text-xs uppercase tracking-editorial text-muted-foreground">
                      Default
                    </span>
                  )}
                </p>
                <p className="mt-1 text-muted-foreground">{address.phone}</p>
                <p className="mt-1 text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
                </p>
                <p className="text-muted-foreground">{address.country}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-lg uppercase tracking-editorial">
          Order History
        </h2>
        {orders.length === 0 ? (
          <div className="mt-3 flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              You have not placed any orders yet.
            </p>
            <Button render={<Link href="/women" />} variant="outline">
              Start shopping
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-editorial text-muted-foreground">
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-sm font-medium">
                    {formatMoney(order.grandTotal.toString(), order.currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
