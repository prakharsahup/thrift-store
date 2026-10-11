import { Input, inputVariants } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

type Shared = {
  name: string;
  label: string;
  /** Shown under the field. */
  hint?: string;
  error?: string;
  className?: string;
};

/** Label + control + hint/error, with the ARIA wiring between them. */
export function FormField({
  name,
  label,
  hint,
  error,
  className,
  children,
}: Shared & {
  children: (props: { id: string; describedBy?: string; invalid?: true }) => React.ReactNode;
}) {
  const id = `field-${name}`;
  const describedBy =
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      {children({ id, describedBy, invalid: error ? true : undefined })}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-sale">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextProps = Shared &
  Omit<React.ComponentProps<"input">, "name" | "id" | "size" | "defaultValue"> & {
    defaultValue?: string | number | null;
  };

export function TextField({
  name,
  label,
  hint,
  error,
  className,
  defaultValue,
  ...input
}: TextProps) {
  return (
    <FormField name={name} label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {...input}
        />
      )}
    </FormField>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  error,
  className,
  defaultValue,
  rows = 4,
}: Shared & { defaultValue?: string | null; rows?: number }) {
  return (
    <FormField name={name} label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          name={name}
          rows={rows}
          defaultValue={defaultValue ?? ""}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(inputVariants(), "h-auto py-2")}
        />
      )}
    </FormField>
  );
}

export function SelectField({
  name,
  label,
  hint,
  error,
  className,
  defaultValue,
  options,
  placeholder,
  disabled,
}: Shared & {
  defaultValue?: string | null;
  options: readonly { value: string; label: string }[];
  /** An empty first option, e.g. "None" or "Choose…". */
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <FormField name={name} label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={inputVariants()}
        >
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <input
        id={`field-${name}`}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `field-${name}-hint` : undefined}
        className="mt-0.5 size-5 accent-primary"
      />
      <div>
        <label htmlFor={`field-${name}`} className="text-sm font-semibold">
          {label}
        </label>
        {hint ? (
          <p id={`field-${name}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
