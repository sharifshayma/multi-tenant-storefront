"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteMedia, reorderMedia } from "@/actions/media";
import type { BookMediaItem } from "@/lib/types";

function SortableItem({
  item,
  onDelete,
}: {
  item: BookMediaItem;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-white"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute start-1 top-1 z-10 flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-white/90 text-muted"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="absolute end-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-red-50"
        aria-label="حذف"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div className="relative aspect-square w-full bg-paper">
        {item.type === "IMAGE" ? (
          <Image src={item.url} alt="" fill sizes="150px" className="object-contain p-2" />
        ) : (
          <video src={item.url} className="h-full w-full object-cover" muted />
        )}
      </div>
    </div>
  );
}

export function MediaList({
  bookId,
  media,
}: {
  bookId: string;
  media: BookMediaItem[];
}) {
  const [items, setItems] = useState(media);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    reorderMedia(bookId, next.map((i) => i.id));
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    deleteMedia(id);
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">لا توجد صور أو فيديوهات إضافية بعد.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
