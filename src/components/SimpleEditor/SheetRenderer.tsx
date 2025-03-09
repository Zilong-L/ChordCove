import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";


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
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

export type ChordData = { chord: string; position: number };

import Bar, { LineItem } from "./Bar";

export default function SheetRenderer() {
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const simpleScore = useSelector((state: RootState) => state.simpleScore);

  const [lyrics, setLyrics] = useState<string>(`[G]春风又[C]绿江南岸
[Am]明月何[D]时照我还
[G]想你[Em]时你在[C]天涯海角
[Am]望你[D]时你在[G]天上`);
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    const arr = lyrics.split("\n");
    return [
      ...arr.map((line, i) => ({ id: `line-${i}`, text: line })),
    ];
  });

  useEffect(() => {
    const arr = lyrics.split("\n");
    setLineItems([
      ...arr.map((line, i) => ({ id: `line-${i}`, text: line })),
    ]);
  }, [lyrics]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lineItems.findIndex((it) => it.id === active.id);
    const newIndex = lineItems.findIndex((it) => it.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newArr = arrayMove(lineItems, oldIndex, newIndex);
    setLineItems(newArr);

    const filtered = newArr
      .map((it) => it.text);
    setLyrics(filtered.join("\n"));
  };

  const handleDelete = (index: number) => {
    const newArr = [...lineItems];
    newArr.splice(index, 1);
    setLineItems(newArr);
    const filtered = newArr
      .map((it) => it.text);
    setLyrics(filtered.join("\n"));
    if (editingIndex === index) {
      setEditingIndex(null);
      setTempValue("");
    }
  };

  const handleAppend = () => {
    const newArr = [...lineItems];
    newArr.push({ id: `line-${newArr.length}`, text: "" });
    setLineItems(newArr);
    const filtered = newArr
      .map((it) => it.text);
    setLyrics(filtered.join("\n"));
    setEditingIndex(newArr.length - 1);
    setTempValue("");
  };

  const finishEditing = () => {
    const newArr = [...lineItems];
    if (editingIndex !== null && editingIndex < newArr.length) {
      newArr[editingIndex] = { ...newArr[editingIndex], text: tempValue };
      setLineItems(newArr);
      const filtered = newArr
        .map((it) => it.text);
      setLyrics(filtered.join("\n"));
    }
    setEditingIndex(null);
  };

  return (
    <div className="bg-gradient-to-b from-[#212121] to-[#121212] rounded-md py-12 px-8 xl:px-24  min-h-[700px]">
      <h2 className="text-3xl font-bold text-center mb-2 min-h-16">{sheetMetadata.title}</h2>
      <div className="flex justify-between items-center text-white mb-6">
        <div className="text-lg">
          <p>Key: {simpleScore.key}</p>
          <p className="grid-flow-row grid grid-cols-[80px_50px]"><p>Tempo:</p><p className="px-2 ">{simpleScore.tempo}</p> </p>
        </div>
        <div className="text-right">
          <p>Uploader: {sheetMetadata.uploader}</p>
          <p>Singer: {sheetMetadata.singer}</p>
          <p>Composer: {sheetMetadata.composer}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4  content-start gap-2">
        {/* 顶部信息栏 */}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lineItems.map((it) => it.id)}
            strategy={rectSortingStrategy}
          >
            {lineItems.map((item, idx) => {
              return (
                <Bar
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
          </SortableContext>
        </DndContext>
        <div
          className="relative flex items-center  p-2 rounded-md hover:cursor-pointer group"
          onClick={handleAppend}
        >
          <div className="flex min-h-[3rem] w-full justify-start items-center">
            <span className="text-gray-400">点击添加新行</span>
          </div>
          <div className="hidden group-hover:block absolute right-4 top-[50%] -translate-y-[50%] text-gray-400 hover:text-gray-200 hover:cursor-pointer">
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
      </div>
    </div>
  );
}