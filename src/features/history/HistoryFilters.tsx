import { PeriodNavigator } from '@/components/PeriodNavigator';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { en } from '@/i18n/en';
import { activeCategories, activeItems } from '@/lib/expenses';
import { GENERAL_ITEM } from '@/lib/history';
import { useAppData } from '@/store/useAppStore';

export interface HistoryFilterValues {
  onlyPeriod: boolean;
  categoryId: string;
  itemId: string;
  search: string;
}

export const NO_FILTERS: HistoryFilterValues = {
  onlyPeriod: false,
  categoryId: '',
  itemId: '',
  search: '',
};

interface HistoryFiltersProps {
  values: HistoryFilterValues;
  onChange: (values: HistoryFilterValues) => void;
}

export function HistoryFilters({ values, onChange }: HistoryFiltersProps) {
  const { categories, items, expenses } = useAppData();
  const { onlyPeriod, categoryId, itemId, search } = values;

  // Archived entries stay filterable while past expenses still use them.
  const usedCategoryIds = new Set(expenses.map((expense) => expense.categoryId));
  const usedItemIds = new Set(expenses.map((expense) => expense.itemId));
  const archivedCategoriesInUse = categories.filter(
    (category) => category.archived && usedCategoryIds.has(category.id),
  );
  const archivedItemsInUse = items.filter(
    (item) => item.categoryId === categoryId && item.archived && usedItemIds.has(item.id),
  );

  const isFiltered = onlyPeriod || categoryId !== '' || itemId !== '' || search !== '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center">
        <Segmented
          label={en.history.periodFilter}
          options={[
            { value: 'all', label: en.history.allTime },
            { value: 'period', label: en.history.onePeriod },
          ]}
          value={onlyPeriod ? 'period' : 'all'}
          onChange={(scope) => onChange({ ...values, onlyPeriod: scope === 'period' })}
        />
      </div>

      {onlyPeriod && <PeriodNavigator />}

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={en.history.category}
          value={categoryId}
          onChange={(event) => onChange({ ...values, categoryId: event.target.value, itemId: '' })}
        >
          <option value="">{en.history.allCategories}</option>
          {[...activeCategories(categories), ...archivedCategoriesInUse].map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label={en.history.item}
          value={itemId}
          disabled={!categoryId}
          onChange={(event) => onChange({ ...values, itemId: event.target.value })}
          className="disabled:opacity-60"
        >
          <option value="">{en.history.allItems}</option>
          {categoryId && <option value={GENERAL_ITEM}>{en.expense.general}</option>}
          {[...activeItems(items, categoryId), ...archivedItemsInUse].map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        label={en.history.search}
        type="search"
        value={search}
        onChange={(event) => onChange({ ...values, search: event.target.value })}
      />

      {isFiltered && (
        <Button variant="secondary" onClick={() => onChange(NO_FILTERS)}>
          {en.history.clearFilters}
        </Button>
      )}
    </div>
  );
}
