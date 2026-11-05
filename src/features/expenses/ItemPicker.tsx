import { Plus } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { activeItems, findItem, includingChosen } from '@/lib/expenses';
import { useAppData, useAppStore } from '@/store/useAppStore';

interface ItemPickerProps {
  categoryId: string;
  value?: string;
  onChange: (itemId: string | undefined) => void;
}

/** Chooses an item in the category, or "General" for none, and can add a new item. */
export function ItemPicker({ categoryId, value, onChange }: ItemPickerProps) {
  const { items } = useAppData();
  const addItem = useAppStore((state) => state.addItem);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    const name = newName.trim();
    if (!name) {
      setAdding(false);
      return;
    }

    setError(null);
    try {
      const item = findItem(items, categoryId, name) ?? (await addItem(categoryId, name));
      onChange(item.id);
      setNewName('');
      setAdding(false);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  // Enter here adds the item. It must not submit the expense form around it.
  const onNewNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void add();
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium">{en.expense.item}</legend>
      <div className="flex flex-wrap gap-2">
        <Chip selected={value === undefined} onClick={() => onChange(undefined)}>
          {en.expense.general}
        </Chip>
        {includingChosen(activeItems(items, categoryId), items, value).map((item) => (
          <Chip key={item.id} selected={item.id === value} onClick={() => onChange(item.id)}>
            <span className="min-w-0 wrap-anywhere">{item.name}</span>
          </Chip>
        ))}
        {!adding && (
          <Chip onClick={() => setAdding(true)}>
            <Plus aria-hidden className="size-4" />
            {en.expense.newItem}
          </Chip>
        )}
      </div>

      {adding && (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              label={en.expense.newItemName}
              autoFocus
              maxLength={100}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={onNewNameKeyDown}
            />
          </div>
          <Button variant="secondary" onClick={() => void add()}>
            {en.expense.addItem}
          </Button>
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
