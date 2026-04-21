import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span
            aria-hidden
            className="inline-block h-9 w-9 rounded-full device-shell ring-4 ring-white"
          />
          <h1 className="pixel-text text-base">POKÉ TINDER</h1>
        </div>
        <div className="rounded-device border border-line bg-surface p-6 shadow-device">
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
