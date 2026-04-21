import { Link } from 'react-router-dom';
import { PokeballIcon } from './PokeballIcon';

interface Props {
  title: string;
  body: string;
  /** Optional CTA after the user signs in — defaults back to the current page. */
  redirectTo?: string;
}

/**
 * Friendly placeholder shown on auth-gated pages while the visitor is logged
 * out. Keeps the modal layout intact instead of bouncing them straight to the
 * login screen — they can still feel out the rest of the app first.
 */
export function SignInPrompt({ title, body, redirectTo }: Props) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg shadow-inner">
        <PokeballIcon size={44} />
      </div>
      <h2 className="pixel-text mt-5 text-sm">{title}</h2>
      <p className="mt-3 max-w-xs text-sm text-ink-muted">{body}</p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Link
          to="/login"
          state={redirectTo ? { from: { pathname: redirectTo } } : undefined}
          className="focus-ring inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="focus-ring inline-flex items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
        >
          Create an account
        </Link>
      </div>
    </section>
  );
}
