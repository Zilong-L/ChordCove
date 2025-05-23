import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { PlusIcon } from "@heroicons/react/20/solid";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Note } from "tonal";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";

export type ChordData = { chord: string; position: number };

import Bar, { LineItem } from "./Bar";
import { setContent, setKey, setTempo } from "@stores/simpleScoreSlice";

const midiRange = (startNote: string, endNote: string) => {
  const startMidi = Note.midi(startNote)!;
  const endMidi = Note.midi(endNote)!;
  return Array.from({ length: endMidi - startMidi + 1 }, (_, i) => startMidi + i).map((midi) => ({
    name: Note.fromMidi(midi)!,
    midi,
  }));
};

interface KeySelectorProps {
  currentKey: string;
  onKeyChange: (key: string) => void;
}

interface TempoInputProps {
  currentTempo: number;
  onTempoChange: (tempo: number) => void;
}

function KeySelector({ currentKey, onKeyChange }: KeySelectorProps) {
  const notes = midiRange("C3", "C5");

  return (
    <div className="grid grid-flow-row grid-cols-[80px_50px]">
      Key:
      <Listbox value={currentKey} onChange={onKeyChange}>
        <div className="relative w-32">
          <ListboxButton className="w-full rounded px-2 text-left text-[var(--text-primary)]">
            {currentKey}
          </ListboxButton>
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded text-[var(--text-primary)] shadow-lg backdrop-blur-md">
            {notes.map((note) => (
              <ListboxOption
                key={note.midi}
                value={note.name}
                className="cursor-pointer p-2 hover:bg-[var(--bg-hover)]"
              >
                {note.name}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}

function TempoInput({ currentTempo, onTempoChange }: TempoInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(currentTempo.toString());

  const handleBlur = () => {
    const newTempo = parseInt(tempValue);
    if (!isNaN(newTempo) && newTempo > 0) {
      onTempoChange(newTempo);
    } else {
      setTempValue(currentTempo.toString());
    }
    setIsEditing(false);
  };

  return (
    <div className="grid grid-flow-row grid-cols-[80px_50px]">
      <p>Tempo:</p>
      {isEditing ? (
        <input
          type="number"
          className="w-16 rounded border border-[var(--border-primary)] bg-transparent px-2 text-[var(--text-primary)]"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlur();
            }
          }}
          aria-label="Tempo"
          min="1"
          max="300"
          autoFocus
        />
      ) : (
        <p
          className="cursor-pointer rounded px-2 hover:bg-[var(--bg-hover)]"
          onClick={() => setIsEditing(true)}
        >
          {currentTempo}
        </p>
      )}
    </div>
  );
}

export default function SheetRenderer() {
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const [sheetMissing, _] = useState(false);
  const dispatch = useDispatch();
  const lyrics = simpleScore.content;

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    const arr = lyrics.split("\n");
    return [...arr.map((line, i) => ({ id: `line-${i}`, text: line }))];
  });

  useEffect(() => {
    const arr = lyrics.split("\n");
    setLineItems([...arr.map((line, i) => ({ id: `line-${i}`, text: line }))]);
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

    const filtered = newArr.map((it) => it.text);
    dispatch(setContent(filtered.join("\n")));
  };

  const handleDelete = (index: number) => {
    const newArr = [...lineItems];
    newArr.splice(index, 1);
    setLineItems(newArr);
    const filtered = newArr.map((it) => it.text);
    dispatch(setContent(filtered.join("\n")));
    if (editingIndex === index) {
      setEditingIndex(null);
      setTempValue("");
    }
  };

  const handleAppend = () => {
    const newArr = [...lineItems];
    newArr.push({ id: `line-${newArr.length}`, text: "" });
    setLineItems(newArr);
    const filtered = newArr.map((it) => it.text);
    dispatch(setContent(filtered.join("\n")));
    setEditingIndex(newArr.length - 1);
    setTempValue("");
  };

  const finishEditing = () => {
    const newArr = [...lineItems];
    if (editingIndex !== null && editingIndex < newArr.length) {
      newArr[editingIndex] = { ...newArr[editingIndex], text: tempValue };
      setLineItems(newArr);
      const filtered = newArr.map((it) => it.text);
      dispatch(setContent(filtered.join("\n")));
    }
    setEditingIndex(null);
  };

  if (sheetMissing) {
    return (
      <div className="min-h-[700px] w-full rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-12 xl:px-24">
        <h2 className="mb-2 min-h-16 text-center text-3xl font-bold text-[var(--text-primary)]">
          Sheet not found
        </h2>
      </div>
    );
  }
  return (
    <div className="h-full w-full overflow-y-scroll rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)]">
      <div className="px-8 py-12 xl:px-24">
        <h2 className="mb-2 min-h-16 text-center text-3xl font-bold text-[var(--text-primary)]">
          {sheetMetadata.title}
        </h2>
        <div className="mb-6 flex items-center justify-between text-[var(--text-primary)]">
          <div className="text-lg">
            <KeySelector
              currentKey={simpleScore.key}
              onKeyChange={(key) => dispatch(setKey(key))}
            />
            <TempoInput
              currentTempo={simpleScore.tempo}
              onTempoChange={(tempo) => dispatch(setTempo(tempo))}
            />
          </div>
          <div className="grid grid-cols-[100px_100px] text-left">
            <p>Singer:</p>
            <p>
              {" "}
              {sheetMetadata.singers?.map((singer) => singer.name).join(", ") || "Unknown Singer"}
            </p>
            <p>Upload:</p>
            <p> {sheetMetadata.uploader}</p>
            <p>Composer:</p>
            <p>
              {" "}
              {sheetMetadata.composers?.map((composer) => composer.name).join(", ") ||
                "Unknown Composer"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 content-start gap-2 md:grid-cols-4">
          {/* 顶部信息栏 */}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={lineItems} strategy={rectSortingStrategy}>
              {lineItems.map((item, idx) => (
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
              ))}
            </SortableContext>
          </DndContext>

          {/* Add button */}
          <button
            onClick={handleAppend}
            className="group flex h-[4rem] w-full items-center justify-center rounded-lg duration-500 hover:bg-[var(--bg-hover)]"
            aria-label="Add new line"
          >
            <PlusIcon className="opacity h-6 w-6 text-[var(--text-tertiary)] opacity-0 transition-opacity duration-500 group-hover:opacity-75" />
          </button>
        </div>
      </div>
    </div>
  );
}
