import { useEffect, useState } from 'react';
import { en } from '@/i18n/en';

const WAIT_SECONDS = 60;

interface ResendCodeButtonProps {
  /** Show the wait straight away, because a code has only just been sent. */
  startWaiting?: boolean;
  onResend: () => Promise<void>;
}

/** Sends another code, at most once a minute, which is the same limit the server applies. */
export function ResendCodeButton({ startWaiting = true, onResend }: ResendCodeButtonProps) {
  const [seconds, setSeconds] = useState(startWaiting ? WAIT_SECONDS : 0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const resend = async () => {
    setSending(true);
    try {
      await onResend();
      setSeconds(WAIT_SECONDS);
    } catch {
      // onResend has already shown why. No wait, so it can be tried again.
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={seconds > 0 || sending}
      onClick={() => void resend()}
      className="min-h-tap text-left text-accent underline-offset-4 tabular-nums hover:underline disabled:text-muted disabled:no-underline"
    >
      {seconds > 0 ? en.security.resendIn(seconds) : en.security.resend}
    </button>
  );
}
