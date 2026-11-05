import { Plus, X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { findSource } from '@/lib/income';
import { useAppData, useAppStore } from '@/store/useAppStore';

interface SourcePickerProps {
  value: string;
  onChange: (source: string) => void;
}

/** Chooses an income source, and adds to or removes from the list of sources. */
export function SourcePicker({ value, onChange }: SourcePickerProps) {
  const { incomeSources } = useAppData();
  const updateSources = useAppStore((state) => state.updateIncomeSources);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // An entry can use a source that has since been removed from the list.
  const shown = incomeSources.includes(value) || !value ? incomeSources : [...incomeSources, value];
  const canRemove = incomeSources.length > 1;

  const addSource = async () => {
    const name = newName.trim();
    if (!name) {
      setAdding(false);
      return;
    }

    const existing = findSource(incomeSources, name);
    setError(null);
    try {
      if (!existing) await updateSources([...incomeSources, name]);
      onChange(existing ?? name);
      setNewName('');
      setAdding(false);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const removeSource = async (source: string) => {
    setError(null);
    try {
      await updateSources(incomeSources.filter((existing) => existing !== source));
      setConfirmRemove(null);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  // Enter here adds the source. It must not submit the income form around it.
  const onNewNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void addSource();
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <legend className="font-medium">{en.income.source}</legend>
        <button
          type="button"
          onClick={() => {
            setEditing(!editing);
            setConfirmRemove(null);
          }}
          className="min-h-tap px-2 text-accent underline-offset-4 hover:underline"
        >
          {editing ? en.income.doneEditingSources : en.income.editSources}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {shown.map((source) =>
          editing ? (
            <Chip
              key={source}
              disabled={!canRemove || !incomeSources.includes(source)}
              onClick={() => setConfirmRemove(source)}
              aria-label={en.income.removeSource(source)}
              className="disabled:opacity-60"
            >
              {source}
              {canRemove && incomeSources.includes(source) && <X aria-hidden className="size-4" />}
            </Chip>
          ) : (
            <Chip key={source} selected={source === value} onClick={() => onChange(source)}>
              {source}
            </Chip>
          ),
        )}
        {!editing && !adding && (
          <Chip onClick={() => setAdding(true)}>
            <Plus aria-hidden className="size-4" />
            {en.income.newSource}
          </Chip>
        )}
      </div>

      {adding && (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              label={en.income.newSourceName}
              autoFocus
              maxLength={100}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={onNewNameKeyDown}
            />
          </div>
          <Button variant="secondary" onClick={() => void addSource()}>
            {en.income.addSource}
          </Button>
        </div>
      )}

      {confirmRemove && (
        <div className="flex flex-col gap-2 rounded-control border border-line p-3">
          <p>{en.income.confirmRemoveSource(confirmRemove)}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void removeSource(confirmRemove)}>
              {en.income.confirmRemoveAction}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
              {en.common.cancel}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-control border border-warning p-3">
          {error}
        </p>
      )}
    </fieldset>
  );
}
