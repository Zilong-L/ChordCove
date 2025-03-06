import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

//
// 1) ChordData 与 parseLine 保持不变
//
export type ChordData = { chord: string; position: number };

function parseLine(line: string) {
  const regex = /\[([^\]]+)\]/g;
  let lyricsOnly = "";
  let chords: ChordData[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    lyricsOnly += line.substring(lastIndex, match.index);
    chords.push({ chord: match[1], position: lyricsOnly.length });
    lastIndex = match.index + match[0].length;
  }

  lyricsOnly += line.substring(lastIndex);
  return { lyrics: lyricsOnly, chords };
}

//
// 2) 用于表示每一行的结构
//
type LineItem = {
  id: string;   // 每行唯一 ID（用于 @dnd-kit 排序）
  text: string; // 每行内容
};

//
// 3) 单行组件：可拖拽、可编辑、可删除，拖拽操作只通过手柄启动
//
function SortableLine({
  item,
  index,                // 用来判断是否是“添加新行”那一项
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
  // 使用 useSortable 为当前行获取拖拽相关属性，但不直接绑定到外层容器
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",   
  };

  const { lyrics: plainLyrics, chords } = parseLine(item.text);

  // 判断是否为“添加新行”占位项
  const isAppendItem = item.id === "append";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center min-h-[4rem] bg-[#fafafa] pt-[2rem] p-2 rounded-md hover:bg-stone-100 hover:shadow-md group"
      // 点击外层区域触发编辑（或添加新行）
      onClick={() => {
        if (isAppendItem) {
          // “添加新行”区域：调用父级添加逻辑
          return;
        }
        setEditingIndex(index);
        setTempValue(item.text);
      }}
    >
      {/* 主体内容区域 */}
      <div className="flex-grow">
        {editingIndex === index ? (
          <input
            type="text"
            className="w-full outline-none text-zinc-900 rounded"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                finishEditing();
              }
            }}
            autoFocus
          />
        ) : (
          <div className="flex">
            {plainLyrics.split("").map((char, charIndex) => {
              const chordData = chords.find((ch) => ch.position === charIndex);
              return (
                <span key={charIndex} className="relative text-zinc-900">
                  {chordData && (
                    <div className="absolute top-[-1.5em] text-teal-600 font-bold">
                      {chordData.chord}
                    </div>
                  )}
                  {char === " " ? "\u00A0" : char}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {/* 拖拽手柄，仅对非“添加新行”项显示 */}
      {!isAppendItem && (
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab absolute right-12 top-[50%] -translate-y-[50%] hidden group-hover:block"
          onClick={(e) => e.stopPropagation()} // 防止点击手柄也触发编辑
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
      )}
      {/* 删除按钮，仅对非“添加新行”项显示 */}
      {!isAppendItem && (
        <button
          className="absolute right-4 top-[50%] -translate-y-[50%] hidden group-hover:block text-red-500 hover:text-red-700 hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(index);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

//
// 4) 主组件：整合排序、编辑、删除、添加等功能
//
export default function SheetRenderer({
  lyrics,
  setLyrics,
}: {
  lyrics: string;
  setLyrics: (val: string) => void;
}) {
  // 将外部 lyrics 拆分成行
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    const arr = lyrics.split("\n");
    // 末尾再加一个专门用于“添加新行”的占位
    return [
      ...arr.map((line, i) => ({ id: `line-${i}`, text: line })),
      { id: "append", text: "[C]歌词" },
    ];
  });

  // 当外部 lyrics 改变时，同步更新 lineItems（可选）
  useEffect(() => {
    const arr = lyrics.split("\n");
    setLineItems([
      ...arr.map((line, i) => ({ id: `line-${i}`, text: line })),
      { id: "append", text: "[C]歌词" },
    ]);
  }, [lyrics]);

  // 编辑相关
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState("");

  // 传感器：让 DnDKit 监听鼠标/触摸事件
  const sensors = useSensors(useSensor(PointerSensor));

  // 拖拽结束时，根据 active 与 over 的 id 重排
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lineItems.findIndex((it) => it.id === active.id);
    const newIndex = lineItems.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newArr = arrayMove(lineItems, oldIndex, newIndex);
    setLineItems(newArr);

    // 同步到父级 lyrics（排除“append”那一项）
    const filtered = newArr
      .filter((it) => it.id !== "append")
      .map((it) => it.text);
    setLyrics(filtered.join("\n"));
  };

  // 删除行
  const handleDelete = (index: number) => {
    const newArr = [...lineItems];
    newArr.splice(index, 1);
    setLineItems(newArr);
    const filtered = newArr
      .filter((it) => it.id !== "append")
      .map((it) => it.text);
    setLyrics(filtered.join("\n"));
    if (editingIndex === index) {
      setEditingIndex(null);
      setTempValue("");
    }
  };

  // 添加新行
  const handleAppend = () => {
    const newArr = [...lineItems];
    newArr.splice(newArr.length - 1, 0, {
      id: `line-${Date.now()}`,
      text: "",
    });
    setLineItems(newArr);
    const filtered = newArr
      .filter((it) => it.id !== "append")
      .map((it) => it.text);
    setLyrics(filtered.join("\n"));
    setEditingIndex(newArr.length - 2);
    setTempValue("");
  };

  // 编辑结束时调用的函数
  const finishEditing = () => {
    const newArr = [...lineItems];
    if (editingIndex !== null && editingIndex < newArr.length) {
      newArr[editingIndex] = { ...newArr[editingIndex], text: tempValue };
      setLineItems(newArr);
      const filtered = newArr
        .filter((it) => it.id !== "append")
        .map((it) => it.text);
      setLyrics(filtered.join("\n"));
    }
    setEditingIndex(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={lineItems.map((it) => it.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-4 bg-white rounded-md px-4 py-2 min-h-[400px] content-start gap-2">
          {lineItems.map((item, idx) => {
            if (item.id === "append") {
              return (
                <div
                  key={item.id}
                  className="relative flex items-center bg-[#fafafa] p-2 rounded-md hover:cursor-pointer hover:bg-stone-100 hover:shadow-md group"
                  onClick={handleAppend}
                >
                  <div className="flex min-h-[3rem] w-full justify-center items-center">
                    <span className="text-gray-500">点击添加新行</span>
                  </div>
                  <div className="hidden group-hover:block absolute right-4 top-[50%] -translate-y-[50%] text-gray-500 hover:text-gray-700 hover:cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                </div>
              );
            }
            return (
              <SortableLine
                key={item.id}
                item={item}
                index={idx}
                editingIndex={editingIndex}
                setEditingIndex={setEditingIndex}
                tempValue={tempValue}
                setTempValue={setTempValue}
                handleDelete={handleDelete}
                finishEditing={finishEditing}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
