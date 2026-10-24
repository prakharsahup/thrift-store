"use client";

import { useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { Button } from "@/components/ui/Button";
import { Input, inputVariants } from "@/components/ui/Input";
import { createAddress, type Address } from "@/lib/actions/addresses";
import { findCountry, shippingCountries, type CountryCode } from "@/lib/config/countries";
import { indianStates } from "@/lib/config/india";
import { addressSchema, type AddressInput } from "@/lib/validators/checkout";

type Props = {
  /** Called with the saved address. */
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  /** Prefill the recipient's name and phone (from the profile). */
  defaults?: { name?: string; phone?: string };
};

type Field = keyof AddressInput;
type FieldErrors = Partial<Record<Field, string>>;

type FieldSpec = {
  name: Exclude<Field, "state" | "country">;
  label: string;
  autoComplete: string;
  inputMode?: "numeric" | "tel";
  optional?: boolean;
  half?: boolean;
  hint?: string;
};

// Indian addresses take a 10-digit mobile and a PIN code; addresses abroad take a phone number
// with its country code and an optional postal code (lib/validators/checkout.ts).
function fieldsFor(india: boolean): FieldSpec[] {
  return [
    { name: "name", label: "Full name", autoComplete: "name" },
    india
      ? { name: "phone", label: "Mobile number", autoComplete: "tel-national", inputMode: "tel" }
      : {
          name: "phone",
          label: "Phone number",
          autoComplete: "tel",
          inputMode: "tel",
          hint: "With the country code, like +1 415 555 0100.",
        },
    { name: "line1", label: "House no., building, street", autoComplete: "address-line1" },
    { name: "line2", label: "Area, landmark", autoComplete: "address-line2", optional: true },
    { name: "city", label: "City", autoComplete: "address-level2", half: true },
    india
      ? {
          name: "pincode",
          label: "PIN code",
          autoComplete: "postal-code",
          inputMode: "numeric",
          half: true,
        }
      : {
          name: "pincode",
          label: "Postal code",
          autoComplete: "postal-code",
          half: true,
          optional: true,
        },
  ];
}

// New delivery address. Validates in the browser with the same zod schema the server uses, then
// saves through the createAddress server action. The country starts as the visitor's own when we
// ship there.
export function AddressForm({ onSaved, onCancel, defaults }: Props) {
  const { country: visitorCountry } = useCurrency();
  // Until the shopper picks one; the visitor's country is only known after hydration.
  const [picked, setPicked] = useState<CountryCode | null>(null);
  const country = picked ?? findCountry(visitorCountry)?.code ?? "IN";
  const india = country === "IN";
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = addressSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as Field;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    const result = await createAddress(values);
    setBusy(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
      return;
    }
    onSaved(result.address);
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate className="grid grid-cols-2 gap-4">
      {message ? (
        <p role="alert" className="col-span-2 text-sm text-sale">
          {message}
        </p>
      ) : null}
      <div className="col-span-2">
        <label htmlFor="address-country" className="mb-1 block text-sm font-semibold">
          Country
        </label>
        <select
          id="address-country"
          name="country"
          autoComplete="country"
          value={country}
          onChange={(e) => {
            setPicked(e.target.value as CountryCode);
            setErrors({});
          }}
          aria-invalid={errors.country ? true : undefined}
          aria-describedby={errors.country ? "address-country-error" : undefined}
          className={inputVariants()}
        >
          {shippingCountries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.country ? (
          <p id="address-country-error" className="mt-1 text-xs text-sale">
            {errors.country}
          </p>
        ) : null}
      </div>
      {fieldsFor(india).map((field) => (
        <div key={field.name} className={field.half ? "col-span-1" : "col-span-2"}>
          <label htmlFor={`address-${field.name}`} className="mb-1 block text-sm font-semibold">
            {field.label}
            {field.optional ? <span className="font-normal text-muted"> (optional)</span> : null}
          </label>
          <Input
            id={`address-${field.name}`}
            name={field.name}
            autoComplete={field.autoComplete}
            inputMode={field.inputMode}
            defaultValue={
              field.name === "name" || (field.name === "phone" && india)
                ? defaults?.[field.name]
                : undefined
            }
            aria-invalid={errors[field.name] ? true : undefined}
            aria-describedby={
              [
                field.hint ? `address-${field.name}-hint` : null,
                errors[field.name] ? `address-${field.name}-error` : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {field.hint ? (
            <p id={`address-${field.name}-hint`} className="mt-1 text-xs text-muted">
              {field.hint}
            </p>
          ) : null}
          {errors[field.name] ? (
            <p id={`address-${field.name}-error`} className="mt-1 text-xs text-sale">
              {errors[field.name]}
            </p>
          ) : null}
        </div>
      ))}
      <div className="col-span-2">
        <label htmlFor="address-state" className="mb-1 block text-sm font-semibold">
          {india ? "State" : "State, province or region"}
          {india ? null : <span className="font-normal text-muted"> (optional)</span>}
        </label>
        {india ? (
          <select
            id="address-state"
            name="state"
            autoComplete="address-level1"
            defaultValue=""
            aria-invalid={errors.state ? true : undefined}
            aria-describedby={errors.state ? "address-state-error" : undefined}
            className={inputVariants()}
          >
            <option value="" disabled>
              Choose a state
            </option>
            {indianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="address-state"
            name="state"
            autoComplete="address-level1"
            aria-invalid={errors.state ? true : undefined}
            aria-describedby={errors.state ? "address-state-error" : undefined}
          />
        )}
        {errors.state ? (
          <p id="address-state-error" className="mt-1 text-xs text-sale">
            {errors.state}
          </p>
        ) : null}
      </div>
      <div className="col-span-2 flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
