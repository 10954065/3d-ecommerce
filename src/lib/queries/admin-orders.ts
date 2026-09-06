import "server-only";
import { getTenantDb } from "@/lib/db";
import type { OrderStatus } from "@/generated/prisma/client";

export const ORDERS_PAGE_SIZE = 20;

interface ListOrdersParams {
  status?: OrderStatus;
  page?: number;
}

export async function listOrders({ status, page = 1 }: ListOrdersParams) {
  const db = await getTenantDb();
  const where = status ? { status } : {};

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        grandTotal: true,
        currency: true,
        createdAt: true,
        guestEmail: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      grandTotal: Number(o.grandTotal),
      currency: o.currency,
      createdAt: o.createdAt,
      customerName: o.user?.name ?? (o.guestEmail ? "Guest" : null),
      customerEmail: o.user?.email ?? o.guestEmail ?? "Unknown",
    })),
    total,
    page,
    pageSize: ORDERS_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  };
}

export async function getOrderById(id: string) {
  const db = await getTenantDb();
  return db.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      address: true,
      items: { include: { product: { select: { slug: true } } } },
      payment: true,
    },
  });
}
