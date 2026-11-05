import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import type { Category } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

const DEFAULT_ICON = '📁';
const DEFAULT_COLOR = '#3a49c9';

interface CategoryFormProps {
  /** The category to edit. Leave out to add a new one. */
  category?: Category;
  onDone: () => void;
}

export function CategoryForm({ category, onDone }: CategoryFormProps) {
  const addCategory = useAppStore((state) => state.addCategory);
  const updateCategory = useAppStore((state) => state.updateCategory);

  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? DEFAULT_ICON);
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const fields = { name: name.trim(), icon: icon.trim(), color };
    if (!fields.name || !fields.icon) {
      setError(en.settings.categoryRequired);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (category) await updateCategory(category.id, fields);
      else await addCategory(fields);
      onDone();
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <TextField
        label={en.settings.categoryName}
        data-autofocus
        maxLength={100}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label={en.settings.categoryIcon}
          hint={en.settings.categoryIconHint}
          maxLength={16}
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
        />
        <TextField
          label={en.settings.categoryColor}
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="w-full cursor-pointer p-1"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-control border border-warning p-3">
          {error}
        </p>
      )}
      <Button type="submit" disabled={saving} className="disabled:opacity-60">
        {en.common.save}
      </Button>
    </form>
  );
}
