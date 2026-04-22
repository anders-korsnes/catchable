import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  // Derive id from name when not provided so the label/input pair stays linked.
  const inputId = id ?? (rest.name ? `field-${rest.name}` : undefined);
  const describedById = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedById}
        className={[
          'focus-ring block w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink',
          'placeholder:text-ink-muted',
          error ? 'border-pokered' : 'border-line',
          className ?? '',
        ].join(' ')}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-err`} className="text-xs text-pokered" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
