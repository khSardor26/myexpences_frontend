import { useState } from 'react';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { SelectField } from '@/components/ui/SelectField';
import { en } from '@/i18n/en';
import { activeCategories } from '@/lib/expenses';
import type { Category } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';

/** Must match the Other category's fixed id on the server. */
export const OTHER_CATEGORY_ID = 'other';

interface ArchiveCategorySheetProps {
  category: Category;
  open: boolean;
  onClose: () => void;
}

/** Archives a category. Any expenses in it are moved, never deleted. */
export function ArchiveCategorySheet({ category, open, onClose }: ArchiveCategorySheetProps) {
  const { categories, expenses } = useAppData();
  const archiveCategory = useAppStore((state) => state.archiveCategory);
  const showToast = useToastStore((state) => state.showToast);
  const [destination, setDestination] = useState(OTHER_CATEGORY_ID);

  const count = expenses.filter((expense) => expense.categoryId === category.id).length;
  const others = activeCategories(categories).filter((entry) => entry.id !== category.id);

  const confirm = async () => {
    await archiveCategory(category.id, count > 0 ? destination : undefined);
    showToast(en.settings.categoryArchived(category.name));
    onClose();
  };

  return (
    <ConfirmSheet
      open={open}
      title={en.settings.archiveCategoryTitle(category.name)}
      body={count > 0 ? en.settings.archiveWithExpenses(count) : en.settings.archiveEmpty}
      confirmLabel={count > 0 ? en.settings.moveAndArchive : en.settings.archive}
      onConfirm={confirm}
      onClose={onClose}
    >
      {count > 0 && (
        <SelectField
          label={en.settings.moveExpensesTo}
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        >
          {others.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </SelectField>
      )}
    </ConfirmSheet>
  );
}
