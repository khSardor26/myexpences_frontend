import { Archive, ChevronDown, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { SortableList } from '@/components/SortableList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { en } from '@/i18n/en';
import { errorMessage } from '@/lib/api';
import { activeCategories, activeItems } from '@/lib/expenses';
import type { Category } from '@/lib/types';
import { useToastStore } from '@/store/toastStore';
import { useAppData, useAppStore } from '@/store/useAppStore';
import { ArchiveCategorySheet, OTHER_CATEGORY_ID } from './ArchiveCategorySheet';
import { CategoryForm } from './CategoryForm';
import { ItemsEditor } from './ItemsEditor';

const iconButton =
  'flex size-tap shrink-0 items-center justify-center rounded-control text-muted hover:bg-primary-soft';

interface CategoryRowProps {
  category: Category;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

function CategoryRow({ category, expanded, onToggle, onEdit, onArchive }: CategoryRowProps) {
  const { items } = useAppData();
  const count = activeItems(items, category.id).length;

  return (
    <div className="flex min-h-tap items-center pr-1">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex min-h-tap min-w-0 flex-1 items-center gap-2 text-left hover:bg-primary-soft"
      >
        <span aria-hidden className="w-6 shrink-0 text-center">
          {category.icon}
        </span>
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: category.color }}
        />
        <span className="min-w-0 flex-1">
          <span className="font-medium wrap-anywhere">{category.name}</span>{' '}
          <span className="text-sm whitespace-nowrap text-muted">{en.settings.itemCount(count)}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      <button type="button" aria-label={en.settings.editCategory(category.name)} onClick={onEdit} className={iconButton}>
        <Pencil aria-hidden className="size-4" />
      </button>
      {category.id === OTHER_CATEGORY_ID ? (
        // Keeps the rows lined up. Other can't be archived: moved expenses need somewhere to go.
        <span aria-hidden className="size-tap shrink-0" />
      ) : (
        <button
          type="button"
          aria-label={en.settings.archiveCategory(category.name)}
          onClick={onArchive}
          className={iconButton}
        >
          <Archive aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}

export function CategoriesCard() {
  const { categories } = useAppData();
  const reorderCategories = useAppStore((state) => state.reorderCategories);
  const showToast = useToastStore((state) => state.showToast);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [archiving, setArchiving] = useState<Category | null>(null);

  const active = activeCategories(categories);

  const reorder = async (ids: string[]) => {
    try {
      await reorderCategories(ids);
    } catch (caught) {
      showToast(errorMessage(caught));
    }
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">{en.settings.categories}</h2>
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden className="size-4" />
          {en.settings.addCategory}
        </Button>
      </div>

      <Card flush>
        <SortableList
          entries={active}
          entryName={(category) => category.name}
          onReorder={(ids) => void reorder(ids)}
          renderEntry={(category) => (
            <>
              <CategoryRow
                category={category}
                expanded={expandedId === category.id}
                onToggle={() => setExpandedId(expandedId === category.id ? null : category.id)}
                onEdit={() => {
                  setEditing(category);
                  setFormOpen(true);
                }}
                onArchive={() => setArchiving(category)}
              />
              {expandedId === category.id && <ItemsEditor categoryId={category.id} />}
            </>
          )}
        />
      </Card>

      <Sheet
        open={formOpen}
        title={editing ? en.settings.editCategoryTitle : en.settings.addCategory}
        onClose={() => setFormOpen(false)}
      >
        <CategoryForm category={editing} onDone={() => setFormOpen(false)} />
      </Sheet>

      {archiving && <ArchiveCategorySheet category={archiving} open onClose={() => setArchiving(null)} />}
    </section>
  );
}
