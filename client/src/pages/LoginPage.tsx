import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';
import { AuthCard } from '../components/AuthCard';
import { TextField } from '../components/TextField';
import { credentialsSchema } from '../lib/validation';

interface FromState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fallback = (location.state as FromState | null)?.from?.pathname ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    const parsed = credentialsSchema.safeParse({ username, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as 'username' | 'password';
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data.username, parsed.data.password);
      navigate(fallback, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not sign you in. Please try again.';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Welcome back, trainer.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          name="username"
          label="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          autoFocus
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        {errors.form && (
          <div
            role="alert"
            className="rounded-md border border-pokered/30 bg-pokered/5 px-3 py-2 text-sm text-pokered"
          >
            {errors.form}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring inline-flex w-full items-center justify-center rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-invert transition-transform active:translate-y-px disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{' '}
        <Link to="/register" className="font-medium text-action hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
