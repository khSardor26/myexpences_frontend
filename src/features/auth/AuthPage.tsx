import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { ApiError } from '@/lib/api';
import type { LoginChallenge } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';
import { LoginCodeStep } from './LoginCodeStep';

type Mode = 'login' | 'register';

export function AuthPage() {
  const login = useAppStore((state) => state.login);
  const register = useAppStore((state) => state.register);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);

  const isRegister = mode === 'register';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ email, password });
        return;
      }
      const needed = await login({ email, password });
      if (needed) {
        setChallenge(needed);
        setPassword('');
        setSubmitting(false);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : en.errors.generic);
      setSubmitting(false);
    }
  };

  const backToPassword = (reason?: string) => {
    setChallenge(null);
    setError(reason ?? null);
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
  };

  if (challenge) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
        <div className="text-center">
          <p className="text-muted">{en.appName}</p>
          <h1 className="mt-2 text-[1.75rem] leading-8 font-medium tracking-[-0.01em]">{en.auth.loginTitle}</h1>
        </div>
        <LoginCodeStep challenge={challenge} onBack={backToPassword} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-4">
      <div className="text-center">
        <p className="text-muted">{en.appName}</p>
        <h1 className="mt-2 text-[1.75rem] leading-8 font-medium tracking-[-0.01em]">
          {isRegister ? en.auth.registerTitle : en.auth.loginTitle}
        </h1>
      </div>

      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <TextField
          label={en.auth.email}
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label={en.auth.password}
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          minLength={isRegister ? 10 : undefined}
          hint={isRegister ? en.auth.passwordHint : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p role="alert" className="rounded-control border border-warning p-3">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="min-h-12 text-base disabled:opacity-60">
          {isRegister ? en.auth.registerAction : en.auth.loginAction}
        </Button>
      </form>

      <button
        type="button"
        onClick={switchMode}
        className="min-h-tap text-accent underline-offset-4 hover:underline"
      >
        {isRegister ? en.auth.switchToLogin : en.auth.switchToRegister}
      </button>
    </main>
  );
}
