import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { PlusIcon } from "@heroicons/react/20/solid";

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
import { setContent } from "@stores/simpleScoreSlice";

export default function SheetRenderer() {
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const dispatch = useDispatch();
  const lyrics = simpleScore.content;

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
    dispatch(setContent((filtered.join("\n"))));
  };

  const handleDelete = (index: number) => {
    const newArr = [...lineItems];
    newArr.splice(index, 1);
    setLineItems(newArr);
    const filtered = newArr
      .map((it) => it.text);
    dispatch(setContent((filtered.join("\n"))));
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
    dispatch(setContent((filtered.join("\n"))));
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
      dispatch(setContent((filtered.join("\n"))));
    }
    setEditingIndex(null);
  };

  return (
    <div className="bg-gradient-to-b from-[#212121] to-[#121212] rounded-md py-12 px-8 xl:px-24  min-h-[700px]">
      <h2 className="text-3xl font-bold text-center mb-2 min-h-16">{sheetMetadata.title}</h2>
      <div className="flex justify-between items-center text-gray-100 mb-6">
        <div className="text-lg">
          <div className="grid-flow-row grid grid-cols-[80px_50px]"><p>Key:</p><p className="px-2 ">{simpleScore.key}</p></div>
          <div className="grid-flow-row grid grid-cols-[80px_50px]"><p>Tempo:</p><p className="px-2 ">{simpleScore.tempo}</p> </div>
        </div>
        <div className="text-left grid grid-cols-[100px_100px]">
          <p >Singer:</p><p> {sheetMetadata.singer}</p>
          <p >Upload:</p><p> {sheetMetadata.uploader}</p>
          <p >Composer:</p><p> {sheetMetadata.composer}</p>
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
          className="z-1 group min-h-[4rem] flex items-center justify-center transition-color duration-500 hover:bg-[#1f1f1f] cursor-pointer rounded-lg"
          onClick={handleAppend}
        >
          <PlusIcon className="w-6 h-6 opacity-0 group-hover:opacity-75 opacity transition-opacity duration-500  text-gray-400" />
        </div>
      </div>
    </div>
  );
}