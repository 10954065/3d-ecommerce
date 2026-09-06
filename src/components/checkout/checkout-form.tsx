"use client";

import { useActionState, useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { placeOrderAction, type PlaceOrderState } from "@/app/actions/checkout-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SavedAddress {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
}

export interface ShippingZoneOption {
  id: string;
  name: string;
  countries: string[];
  flatRate: number;
  currency: string;
}

interface CheckoutFormProps {
  savedAddresses: SavedAddress[];
  isSignedIn: boolean;
  userEmail?: string | null;
  subtotal: number;
  currency: string;
  shippingZones: ShippingZoneOption[];
}

const COUNTRY_OPTIONS = [
  { code: "GH", label: "Ghana" },
  { code: "NG", label: "Nigeria" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
];

const initialState: PlaceOrderState = {};

export function CheckoutForm({
  savedAddresses,
  isSignedIn,
  userEmail,
  subtotal,
  currency,
  shippingZones,
}: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultAddress ? defaultAddress.id : "new",
  );
  const [country, setCountry] = useState<string>(defaultAddress?.country ?? "GH");

  const estimatedShipping = useMemo(() => {
    const upper = country.toUpperCase();
    const matched = shippingZones.find((zone) => zone.countries.includes(upper));
    const fallback = shippingZones.find((zone) => !zone.countries.includes("GH")) ?? shippingZones[0];
    return matched ?? fallback ?? null;
  }, [country, shippingZones]);

  const estimatedTotal = subtotal + (estimatedShipping?.flatRate ?? 0);
  const usingNewAddress = selectedAddressId === "new";

  return (
    <form action={formAction} className="flex flex-col gap-10">
      {!isSignedIn && (
        <section>
          <h2 className="font-display text-lg uppercase tracking-editorial">Contact</h2>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send your order confirmation here.
            </p>
          </div>
        </section>
      )}

      {isSignedIn && userEmail && (
        <input type="hidden" name="email" value={userEmail} />
      )}

      <section>
        <h2 className="font-display text-lg uppercase tracking-editorial">
          Shipping Address
        </h2>

        {savedAddresses.length > 0 && (
          <RadioGroup
            className="mt-4 gap-3"
            value={selectedAddressId}
            onValueChange={(value) => {
              const id = String(value);
              setSelectedAddressId(id);
              const match = savedAddresses.find((a) => a.id === id);
              if (match) setCountry(match.country);
            }}
          >
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className="flex cursor-pointer items-start gap-3 border border-border p-4 text-sm has-data-checked:border-foreground"
              >
                <RadioGroupItem value={address.id} className="mt-0.5" />
                <span>
                  <span className="block font-medium">{address.fullName}</span>
                  <span className="block text-muted-foreground">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}, {address.city}
                    {address.state ? `, ${address.state}` : ""}, {address.country}
                  </span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-3 border border-border p-4 text-sm has-data-checked:border-foreground">
              <RadioGroupItem value="new" />
              <span className="font-medium">Use a new address</span>
            </label>
          </RadioGroup>
        )}

        {usingNewAddress && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="savedAddressId" value="" />
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="line1">Address</Label>
              <Input id="line1" name="line1" required autoComplete="address-line1" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
              <Input id="line2" name="line2" autoComplete="address-line2" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required autoComplete="address-level2" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State / Region (optional)</Label>
              <Input id="state" name="state" autoComplete="address-level1" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postalCode">Postal code (optional)</Label>
              <Input id="postalCode" name="postalCode" autoComplete="postal-code" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Select
                name="country"
                defaultValue={country}
                onValueChange={(value) => setCountry(String(value))}
              >
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!usingNewAddress && (
          <input type="hidden" name="savedAddressId" value={selectedAddressId} />
        )}
      </section>

      <section className="border border-border p-6">
        <h2 className="font-display text-lg uppercase tracking-editorial">
          Order Summary
        </h2>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Estimated shipping{estimatedShipping ? ` (${estimatedShipping.name})` : ""}
            </dt>
            <dd>
              {estimatedShipping
                ? formatMoney(estimatedShipping.flatRate, estimatedShipping.currency)
                : "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm font-medium">
          <span>Estimated total</span>
          <span>{formatMoney(estimatedTotal, currency)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Final shipping and totals are confirmed on the next step.
        </p>
      </section>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="w-full uppercase tracking-editorial"
      >
        {isPending ? "Placing order…" : "Continue to Payment"}
      </Button>
    </form>
  );
}
