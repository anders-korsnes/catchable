import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';
import { AuthCard } from '../components/AuthCard';
import { TextField } from '../components/TextField';
import { credentialsSchema } from '../lib/validation';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirm?: string;
    form?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});

    const parsed = credentialsSchema.safeParse({ username, password });
    const fieldErrors: typeof errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as 'username' | 'password';
        fieldErrors[key] = issue.message;
      }
    }
    if (password !== confirm) {
      fieldErrors.confirm = 'Passwords do not match';
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register(parsed.data.username, parsed.data.password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not create your account. Please try again.';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Create account" subtitle="Pick a trainer name and a password.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          name="username"
          label="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          hint="3–32 characters · letters, numbers, _ and -"
          autoFocus
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters"
        />
        <TextField
          name="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
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
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-action hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
