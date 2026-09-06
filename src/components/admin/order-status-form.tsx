"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatusAction, type ActionResult } from "@/app/admin/orders/actions";
import type { OrderStatus } from "@/generated/prisma/client";

const FORWARD_LIFECYCLE: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];
const MANUAL_OVERRIDES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const INITIAL_STATE: ActionResult = { success: false };

// Base UI's <Select.Value> displays the raw stored value unless given a
// render function, so build an explicit label lookup (including the
// "(override)" suffix for the manual statuses).
const STATUS_LABELS: Record<string, string> = Object.fromEntries([
  ...FORWARD_LIFECYCLE.map((s) => [s, s]),
  ...MANUAL_OVERRIDES.map((s) => [s, `${s} (override)`]),
]);

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const action = updateOrderStatusAction.bind(null, orderId);
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.success) toast.success("Order status updated.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Order status</label>
        <Select name="status" defaultValue={currentStatus}>
          <SelectTrigger className="w-44">
            <SelectValue>{(v: string) => STATUS_LABELS[v] ?? v}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FORWARD_LIFECYCLE.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
            {MANUAL_OVERRIDES.map((s) => (
              <SelectItem key={s} value={s}>{s} (override)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update status"}
      </Button>
    </form>
  );
}
