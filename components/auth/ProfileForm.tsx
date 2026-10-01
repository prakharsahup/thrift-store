"use client";

import { useActionState } from "react";
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
        <p className="text-sm text-muted">{email}</p>
      </div>
      <div>
        <label htmlFor="profile-name" className="mb-1 block text-sm font-semibold">
          Full name
        </label>
        <input
          id="profile-name"
          name="fullName"
          autoComplete="name"
          defaultValue={fullName}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "profile-name-error" : undefined}
          className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm aria-invalid:border-sale"
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
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={phone}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby="profile-phone-hint"
          className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm aria-invalid:border-sale"
        />
        <p
          id="profile-phone-hint"
          className={cn("mt-1 text-xs", errors.phone ? "text-sale" : "text-muted")}
        >
          {errors.phone ?? "For delivery updates. Optional."}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-fg hover:bg-fg disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
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
