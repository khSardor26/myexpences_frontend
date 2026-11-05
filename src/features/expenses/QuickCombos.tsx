import { Chip } from '@/components/ui/Chip';
import { en } from '@/i18n/en';
import type { Combo } from '@/lib/expenses';
import { useAppData } from '@/store/useAppStore';

interface QuickCombosProps {
  combos: Combo[];
  categoryId?: string;
  itemId?: string;
  onSelect: (combo: Combo) => void;
}

/** One-tap shortcuts for the most recently used category and item pairs. */
export function QuickCombos({ combos, categoryId, itemId, onSelect }: QuickCombosProps) {
  const { categories, items } = useAppData();
  if (combos.length === 0) return null;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="font-medium">{en.expense.recent}</legend>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {combos.map((combo) => {
          const category = categories.find((entry) => entry.id === combo.categoryId);
          const item = items.find((entry) => entry.id === combo.itemId);
          if (!category) return null;

          return (
            <Chip
              key={combo.key}
              selected={combo.categoryId === categoryId && combo.itemId === itemId}
              onClick={() => onSelect(combo)}
              className="shrink-0 whitespace-nowrap"
            >
              <span aria-hidden>{category.icon}</span>
              {category.name} → {item?.name ?? en.expense.general}
            </Chip>
          );
        })}
      </div>
    </fieldset>
  );
}
