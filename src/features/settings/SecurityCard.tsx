import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ResendCodeButton } from '@/components/ResendCodeButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage, type SecurityStatus } from '@/lib/api';
import { useToastStore } from '@/store/toastStore';
import { useAppStore } from '@/store/useAppStore';

const POLL_MS = 3000;

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-control border border-warning p-3">
      {error}
    </p>
  );
}

function CodeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label={en.security.code}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
    />
  );
}

/** Connect Telegram: get a link, press Start in the bot. The app notices by itself. */
function ConnectStep({ onLinked }: { onLinked: () => void }) {
  const connectTelegram = useAppStore((state) => state.connectTelegram);
  const getSecurity = useAppStore((state) => state.getSecurity);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const timer = setInterval(() => {
      void getSecurity()
        .then((status) => {
          if (status.telegram === 'linked') onLinked();
        })
        .catch(() => undefined); // A missed check is fine: the next one tries again.
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [url, getSecurity, onLinked]);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      setUrl((await connectTelegram()).url);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted">{en.security.telegramIntro}</p>
      {url ? (
        <>
          <p>{en.security.pressStart}</p>
          {/* A real link, because browsers block new windows opened after a request finishes. */}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-tap items-center bg-primary px-3 text-on-primary hover:bg-accent-hover hover:text-white"
          >
            {en.security.openBot}
          </a>
          <p role="status" className="text-muted">
            {en.security.waitingForStart}
          </p>
        </>
      ) : (
        <Button onClick={() => void connect()} disabled={busy} className="disabled:opacity-60">
          {en.security.connect}
        </Button>
      )}
      <ErrorNote error={error} />
    </div>
  );
}

/** The bot has been started. A code proves messages really arrive before anything depends on them. */
function ConfirmStep({ onConfirmed, onCancelled }: { onConfirmed: (codes: string[]) => void; onCancelled: () => void }) {
  const confirmTelegram = useAppStore((state) => state.confirmTelegram);
  const resendTelegramCode = useAppStore((state) => state.resendTelegramCode);
  const cancelTelegram = useAppStore((state) => state.cancelTelegram);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onConfirmed((await confirmTelegram(code)).recoveryCodes);
    } catch (caught) {
      setCode('');
      setError(errorMessage(caught));
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendTelegramCode();
    } catch (caught) {
      setError(errorMessage(caught));
      throw caught;
    }
  };

  const cancel = async () => {
    try {
      await cancelTelegram();
      onCancelled();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
      <p>{en.security.enterConfirmCode}</p>
      <CodeField value={code} onChange={setCode} />
      <ErrorNote error={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || code.length !== 6} className="disabled:opacity-60">
          {en.security.turnOn}
        </Button>
        <Button variant="secondary" onClick={() => void cancel()}>
          {en.common.cancel}
        </Button>
      </div>
      <div>
        <ResendCodeButton onResend={resend} />
      </div>
    </form>
  );
}

/** Shown once, straight after turning on. Only hashes are kept on the server. */
function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const showToast = useToastStore((state) => state.showToast);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      showToast(en.security.copied);
    } catch {
      showToast(en.security.copyFailed);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">{en.security.recoveryTitle}</p>
      <p role="alert" className="rounded-control border border-warning p-3">
        {en.security.recoveryWarning}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 border border-line p-3 font-mono">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => void copy()}>
          {en.security.copy}
        </Button>
        <Button onClick={onDone}>{en.security.savedThem}</Button>
      </div>
    </div>
  );
}

/** Telegram is on. Turning it off needs the password and a code or recovery code. */
function TurnOffForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const sendDisableCode = useAppStore((state) => state.sendDisableCode);
  const disableTelegram = useAppStore((state) => state.disableTelegram);
  const showToast = useToastStore((state) => state.showToast);
  const [password, setPassword] = useState('');
  const [value, setValue] = useState('');
  const [usingRecovery, setUsingRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    try {
      await sendDisableCode();
    } catch (caught) {
      setError(errorMessage(caught));
      throw caught;
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await disableTelegram(password, usingRecovery ? { recoveryCode: value } : { code: value });
      showToast(en.security.turnedOff);
      onDone();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
      <TextField
        label={en.auth.password}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {usingRecovery ? (
        <TextField
          label={en.security.recoveryCode}
          autoComplete="off"
          maxLength={20}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      ) : (
        <CodeField value={value} onChange={setValue} />
      )}
      <div className="flex flex-col items-start">
        {!usingRecovery && <ResendCodeButton startWaiting={false} onResend={send} />}
        <button
          type="button"
          onClick={() => {
            setUsingRecovery(!usingRecovery);
            setValue('');
          }}
          className="min-h-tap text-left text-accent underline-offset-4 hover:underline"
        >
          {usingRecovery ? en.security.useTelegramCode : en.security.useRecovery}
        </button>
      </div>
      <ErrorNote error={error} />
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" type="submit" disabled={busy || !password || !value} className="disabled:opacity-60">
          {en.security.turnOff}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {en.common.cancel}
        </Button>
      </div>
    </form>
  );
}

function TelegramSection({ status, reload }: { status: SecurityStatus; reload: () => void }) {
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [turningOff, setTurningOff] = useState(false);

  if (recoveryCodes) {
    return (
      <RecoveryCodes
        codes={recoveryCodes}
        onDone={() => {
          setRecoveryCodes(null);
          reload();
        }}
      />
    );
  }

  if (!status.telegramAvailable && status.telegram === 'off') {
    return <p className="text-muted">{en.security.notSetUp}</p>;
  }
  if (status.telegram === 'off') return <ConnectStep onLinked={reload} />;
  if (status.telegram === 'linked') return <ConfirmStep onConfirmed={setRecoveryCodes} onCancelled={reload} />;

  return (
    <div className="flex flex-col items-start gap-3">
      <p>
        <span className="font-medium text-income">{en.security.on}</span>{' '}
        <span className="text-muted">{en.security.recoveryLeft(status.recoveryCodesLeft)}</span>
      </p>
      {turningOff ? (
        <div className="w-full">
          <TurnOffForm
            onCancel={() => setTurningOff(false)}
            onDone={() => {
              setTurningOff(false);
              reload();
            }}
          />
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setTurningOff(true)}>
          {en.security.turnOff}
        </Button>
      )}
    </div>
  );
}

export function SecurityCard() {
  const getSecurity = useAppStore((state) => state.getSecurity);
  const signOutEverywhere = useAppStore((state) => state.signOutEverywhere);
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const load = useCallback(() => {
    setError(null);
    getSecurity()
      .then(setStatus)
      .catch((caught: unknown) => setError(errorMessage(caught)));
  }, [getSecurity]);

  useEffect(load, [load]);

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="section-title">{en.security.title}</h2>

      <div className="flex flex-col gap-2">
        <h3 className="font-medium">{en.security.telegramTitle}</h3>
        {status ? (
          <TelegramSection status={status} reload={load} />
        ) : error ? (
          <div className="flex flex-col items-start gap-2">
            <ErrorNote error={error} />
            <Button variant="secondary" onClick={load}>
              {en.common.retry}
            </Button>
          </div>
        ) : (
          <p role="status" className="text-muted">
            {en.common.loading}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 border-t border-line pt-4">
        <h3 className="font-medium">{en.security.signOutEverywhereTitle}</h3>
        <p className="text-muted">{en.security.signOutEverywhereBody}</p>
        <Button variant="secondary" onClick={() => setConfirmingSignOut(true)}>
          {en.security.signOutEverywhere}
        </Button>
      </div>

      <ConfirmSheet
        open={confirmingSignOut}
        title={en.security.signOutEverywhereTitle}
        body={en.security.signOutEverywhereConfirm}
        confirmLabel={en.security.signOutEverywhere}
        onConfirm={signOutEverywhere}
        onClose={() => setConfirmingSignOut(false)}
      />
    </Card>
  );
}
