"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile, type ProfileFormState } from "@/lib/actions/account";
import { cn } from "@/lib/utils/cn";

type Props = { email: string; fullName: string; phone: string };

const initialState: ProfileFormState = { status: "idle", message: "" };

export function ProfileForm({ email, fullName, phone }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="max-w-md space-y-5">
      <div>
        <p className="mb-1 text-sm font-semibold">Email</p>
        <p className="text-sm text-muted">
          {email || "None on file — you signed in with your phone number."}
        </p>
      </div>
      <div>
        <label htmlFor="profile-name" className="mb-1 block text-sm font-semibold">
          Full name
        </label>
        <Input
          id="profile-name"
          name="fullName"
          autoComplete="name"
          defaultValue={fullName}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "profile-name-error" : undefined}
        />
        {errors.fullName ? (
          <p id="profile-name-error" className="mt-1 text-xs text-sale">
            {errors.fullName}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="profile-phone" className="mb-1 block text-sm font-semibold">
          Mobile number
        </label>
        <Input
          id="profile-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={phone}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby="profile-phone-hint"
        />
        <p
          id="profile-phone-hint"
          className={cn("mt-1 text-xs", errors.phone ? "text-sale" : "text-muted")}
        >
          {errors.phone ?? "For delivery updates. Optional."}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <p
          role="status"
          className={cn("text-sm", state.status === "error" ? "text-sale" : "text-muted")}
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}
