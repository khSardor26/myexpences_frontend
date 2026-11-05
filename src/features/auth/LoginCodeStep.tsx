import { useState, type FormEvent } from 'react';
import { ResendCodeButton } from '@/components/ResendCodeButton';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { ApiError, errorMessage } from '@/lib/api';
import type { LoginChallenge } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';

interface LoginCodeStepProps {
  challenge: LoginChallenge;
  /** Back to the password, with a reason if the sign-in can't continue. */
  onBack: (reason?: string) => void;
}

/** The second step of signing in, for accounts with Telegram turned on. */
export function LoginCodeStep({ challenge, onBack }: LoginCodeStepProps) {
  const verifyLogin = useAppStore((state) => state.verifyLogin);
  const resendLoginCode = useAppStore((state) => state.resendLoginCode);

  // If Telegram couldn't deliver, only a recovery code can work.
  const [usingRecovery, setUsingRecovery] = useState(!challenge.delivered);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(
    challenge.delivered ? null : en.security.notDelivered,
  );
  const [submitting, setSubmitting] = useState(false);

  /** The server ended this sign-in: expired, or too many wrong codes. */
  const isOver = (caught: unknown) =>
    caught instanceof ApiError && (caught.status === 401 || caught.status === 429);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const entry = value.trim();
    if (!entry) return;

    setError(null);
    setSubmitting(true);
    try {
      await verifyLogin(challenge.challengeId, usingRecovery ? { recoveryCode: entry } : { code: entry });
    } catch (caught) {
      setSubmitting(false);
      if (isOver(caught)) {
        onBack(errorMessage(caught));
        return;
      }
      setValue('');
      setError(errorMessage(caught));
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const { delivered } = await resendLoginCode(challenge.challengeId);
      if (!delivered) setError(en.security.notDelivered);
    } catch (caught) {
      // Here a 429 only means "wait a little", so the sign-in carries on.
      if (caught instanceof ApiError && caught.status === 401) {
        onBack(errorMessage(caught));
        return;
      }
      setError(errorMessage(caught));
      throw caught;
    }
  };

  const switchMode = () => {
    setUsingRecovery(!usingRecovery);
    setValue('');
    setError(null);
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <p className="text-muted">{usingRecovery ? en.security.enterRecovery : en.security.enterCode}</p>

      {usingRecovery ? (
        <TextField
          key="recovery"
          label={en.security.recoveryCode}
          autoComplete="off"
          autoCapitalize="characters"
          autoFocus
          maxLength={20}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      ) : (
        <TextField
          key="code"
          label={en.security.code}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={value}
          onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))}
        />
      )}

      {error && (
        <p role="alert" className="rounded-control border border-warning p-3">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting || !value.trim()} className="min-h-12 text-base disabled:opacity-60">
        {en.security.verify}
      </Button>

      <div className="flex flex-col items-start">
        {!usingRecovery && <ResendCodeButton onResend={resend} />}
        <button
          type="button"
          onClick={switchMode}
          className="min-h-tap text-left text-accent underline-offset-4 hover:underline"
        >
          {usingRecovery ? en.security.useTelegramCode : en.security.useRecovery}
        </button>
        <button
          type="button"
          onClick={() => onBack()}
          className="min-h-tap text-left text-accent underline-offset-4 hover:underline"
        >
          {en.security.backToPassword}
        </button>
      </div>
    </form>
  );
}
