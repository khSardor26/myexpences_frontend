import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type Over,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { en } from '@/i18n/en';

interface SortableRowProps {
  id: string;
  handleLabel: string;
  children: ReactNode;
}

function SortableRow({ id, handleLabel, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-start bg-surface ${isDragging ? 'relative z-10 outline outline-control' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={handleLabel}
        // touch-none stops a phone from scrolling the page instead of dragging.
        className="flex size-tap shrink-0 cursor-grab touch-none items-center justify-center text-muted"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden className="size-5" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

interface SortableListProps<T extends { id: string }> {
  entries: T[];
  /** The entry's name, for its drag handle and for screen reader announcements. */
  entryName: (entry: T) => string;
  renderEntry: (entry: T) => ReactNode;
  onReorder: (ids: string[]) => void;
}

/** A list reordered by dragging each row's handle: by mouse, finger, or keyboard. */
export function SortableList<T extends { id: string }>({
  entries,
  entryName,
  renderEntry,
  onReorder,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = entries.map((entry) => entry.id);

  const nameOf = (target: Active | Over) => {
    const entry = entries.find((candidate) => candidate.id === String(target.id));
    return entry ? entryName(entry) : '';
  };
  const positionOf = (target: Over) => ids.indexOf(String(target.id)) + 1;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: { draggable: en.sortable.instructions },
        announcements: {
          onDragStart: ({ active }) => en.sortable.pickedUp(nameOf(active)),
          onDragOver: ({ active, over }) =>
            over ? en.sortable.moved(nameOf(active), positionOf(over), ids.length) : undefined,
          onDragEnd: ({ active, over }) =>
            over ? en.sortable.dropped(nameOf(active), positionOf(over), ids.length) : undefined,
          onDragCancel: ({ active }) => en.sortable.cancelled(nameOf(active)),
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-line">
          {entries.map((entry) => (
            <SortableRow key={entry.id} id={entry.id} handleLabel={en.sortable.handle(entryName(entry))}>
              {renderEntry(entry)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
