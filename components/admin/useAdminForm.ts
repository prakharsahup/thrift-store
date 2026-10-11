"use client";

import { startTransition, useActionState } from "react";
import { idleForm, type FormState } from "@/lib/admin/form";

/**
 * Runs an admin form action without React 19's automatic form reset (which would put every field
 * back to its original value after each save or failed validation). Spread `formProps` onto the
 * <form>, and pass `state`/`pending` to FormFooter.
 */
export function useAdminForm(
  action: (previous: FormState, formData: FormData) => Promise<FormState>,
) {
  const [state, dispatch, pending] = useActionState(action, idleForm);
  const formProps = {
    noValidate: true,
    onSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(() => dispatch(formData));
    },
  };
  return { state, pending, formProps, errors: state.fieldErrors ?? {} };
}
