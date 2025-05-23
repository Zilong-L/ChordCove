import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SheetLineDisplay from "./SheetLineDisplay";

export type ChordData = { chord: string; position: number };

export type LineItem = {
  id: string;
  text: string;
};

export default function Bar({
  item,
  index,
  editingIndex,
  setEditingIndex,
  tempValue,
  setTempValue,
  handleDelete,
  finishEditing,
}: {
  item: LineItem;
  index: number;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  tempValue: string;
  setTempValue: React.Dispatch<React.SetStateAction<string>>;
  handleDelete: (index: number) => void;
  finishEditing: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "group relative flex min-h-[4rem] items-center rounded-md p-2 " +
        (item.text.replace(/\[.*?\]/g, "").length > 10 ? "col-span-2" : "")
      }
      onClick={() => {
        setEditingIndex(index);
        setTempValue(item.text);
      }}
    >
      <div className="flex-grow self-end">
        {editingIndex === index ? (
          <input
            type="text"
            className="w-full rounded bg-transparent text-[var(--text-primary)] outline-none"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                finishEditing();
              }
            }}
            autoFocus
            aria-label="Edit line"
          />
        ) : (
          <SheetLineDisplay text={item.text} />
        )}
      </div>

      <div
        {...listeners}
        {...attributes}
        className="absolute right-12 top-[50%] hidden -translate-y-[50%] cursor-grab text-[var(--text-tertiary)] group-hover:block"
        onClick={(e) => e.stopPropagation()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      </div>

      <button
        className="absolute right-4 top-[50%] hidden -translate-y-[50%] text-[var(--text-tertiary)] hover:cursor-pointer hover:text-[var(--text-primary)] group-hover:block"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(index);
        }}
        aria-label="Delete line"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </div>
  );
}
