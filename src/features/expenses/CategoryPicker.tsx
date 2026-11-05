import { Chip } from '@/components/ui/Chip';
import { en } from '@/i18n/en';
import { activeCategories, includingChosen } from '@/lib/expenses';
import { useAppData } from '@/store/useAppStore';

interface CategoryPickerProps {
  value?: string;
  error?: string;
  onChange: (categoryId: string) => void;
}

export function CategoryPicker({ value, error, onChange }: CategoryPickerProps) {
  const { categories } = useAppData();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-medium">{en.expense.category}</legend>
      <div className="grid grid-cols-2 gap-2">
        {includingChosen(activeCategories(categories), categories, value).map((category) => (
          <Chip
            key={category.id}
            selected={category.id === value}
            onClick={() => onChange(category.id)}
            className="justify-start px-3 text-left"
          >
            <span aria-hidden>{category.icon}</span>
            <span className="min-w-0 wrap-break-word">{category.name}</span>
          </Chip>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
