import { Archive, Check, Pencil, Plus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { SortableList } from '@/components/SortableList';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { activeItems, findItem } from '@/lib/expenses';
import type { Item } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';

const iconButton =
  'flex size-tap shrink-0 items-center justify-center rounded-control text-muted hover:bg-primary-soft';

interface ItemRowProps {
  item: Item;
  onArchive: (item: Item) => void;
}

function ItemRow({ item, onArchive }: ItemRowProps) {
  const { items } = useAppData();
  const renameItem = useAppStore((state) => state.renameItem);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.name) {
      setEditing(false);
      return;
    }

    const duplicate = findItem(items, item.categoryId, trimmed);
    if (duplicate && duplicate.id !== item.id) {
      setError(en.settings.itemExists(trimmed));
      return;
    }

    setError(null);
    try {
      await renameItem(item.id, trimmed);
      setEditing(false);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  if (!editing) {
    return (
      <div className="flex min-h-tap items-center gap-1 pr-1">
        <span className="min-w-0 flex-1 wrap-anywhere">{item.name}</span>
        <button
          type="button"
          aria-label={en.settings.renameItem(item.name)}
          onClick={() => {
            setName(item.name);
            setEditing(true);
          }}
          className={iconButton}
        >
          <Pencil aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label={en.settings.archiveItem(item.name)}
          onClick={() => onArchive(item)}
          className={iconButton}
        >
          <Archive aria-hidden className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void save(event)} className="flex flex-col gap-1 py-1 pr-1">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          aria-label={en.settings.itemName}
          maxLength={100}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          className="min-h-tap w-full min-w-0 flex-1 rounded-control border border-line bg-surface px-2"
        />
        <button type="submit" aria-label={en.common.save} className={iconButton}>
          <Check aria-hidden className="size-5" />
        </button>
        <button
          type="button"
          aria-label={en.common.cancel}
          onClick={() => {
            setError(null);
            setEditing(false);
          }}
          className={iconButton}
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

/** The items of one category: add, rename, reorder and archive. */
export function ItemsEditor({ categoryId }: { categoryId: string }) {
  const { items } = useAppData();
  const addItem = useAppStore((state) => state.addItem);
  const reorderItems = useAppStore((state) => state.reorderItems);
  const archiveItem = useAppStore((state) => state.archiveItem);
  const showToast = useToastStore((state) => state.showToast);

  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<Item | null>(null);

  const active = activeItems(items, categoryId);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (findItem(items, categoryId, name)) {
      setError(en.settings.itemExists(name));
      return;
    }

    setError(null);
    try {
      await addItem(categoryId, name);
      setNewName('');
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const reorder = async (ids: string[]) => {
    try {
      await reorderItems(ids);
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-line bg-canvas pb-3">
      {active.length > 0 ? (
        <SortableList
          entries={active}
          entryName={(item) => item.name}
          renderEntry={(item) => <ItemRow item={item} onArchive={setArchiving} />}
          onReorder={(ids) => void reorder(ids)}
        />
      ) : (
        <p className="px-4 pt-3 text-sm text-muted">{en.settings.noItems}</p>
      )}

      <form onSubmit={(event) => void add(event)} className="flex items-end gap-2 px-3">
        <div className="min-w-0 flex-1">
          <TextField
            label={en.settings.newItem}
            maxLength={100}
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setError(null);
            }}
            className="w-full"
          />
        </div>
        <Button type="submit" variant="secondary">
          <Plus aria-hidden className="size-4" />
          {en.settings.add}
        </Button>
      </form>
      {error && (
        <p role="alert" className="mx-3 rounded-control border border-warning p-3">
          {error}
        </p>
      )}

      <ConfirmSheet
        open={archiving !== null}
        title={en.settings.archiveItemTitle(archiving?.name ?? '')}
        body={en.settings.archiveItemBody}
        confirmLabel={en.settings.archive}
        onConfirm={async () => {
          if (archiving) await archiveItem(archiving.id);
          setArchiving(null);
        }}
        onClose={() => setArchiving(null)}
      />
    </div>
  );
}
