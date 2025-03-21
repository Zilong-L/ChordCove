// dnd
import { DndContext, closestCenter, useSensor, PointerSensor, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";

// redux states
import { useSelector, useDispatch } from "react-redux";
import { addBar, reorderBars, updateBars } from "../../stores/scoreSlice";
import {
  updateLastInputNote,
  updateInputDuration,
  clearEditingSlot,
  setEditingSlot,
  toggleDotted,
  setEditingMode,
} from "../../stores/editingSlice";
import { RootState } from "../../stores/store";
import { insertScore } from "./modifyScore";

// note icons
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";

// editing mode icons
import Dotted from "@assets/musicnotes/Dotted";
import {
  PlusIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  ChatBubbleBottomCenterIcon,
  HomeIcon,
} from "@heroicons/react/20/solid";
// Import react-hotkeys-hook and your theory helpers
import { useHotkeys } from "react-hotkeys-hook";
import { getNoteInKey, findCloestNote, keyMap } from "@utils/theory/Note";

// Components
import { SortableBar } from "./SortableBar";
import KeySelector from "./KeySelector";
import { useEffect, useState, ComponentType } from "react";

const noteIcons = {
  1: WholeNote,
  2: HalfNote,
  4: QuarterNote,
  8: EighthNote,
  16: SixteenthNote,
  32: ThirtySecondNote,
};

const modeToIcon: Record<string, ComponentType<{ className?: string }>> = {
  chord: HomeIcon,
  lyric: DocumentTextIcon,
  extrainfo: ChatBubbleBottomCenterIcon,
  melody: MusicalNoteIcon,
};
export default function Editor() {
  const dispatch = useDispatch();

  const score = useSelector((state: RootState) => state.score);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const editingStore = useSelector((state: RootState) => state.editing);
  const rotatedScale = getNoteInKey(score.key);
  const { allowedNoteTime, insertNoteTime } = editingStore;
  const bars = score.bars;
  const [flatSlots, setFlatSlots] = useState<Array<{ bar: number; beat: number }>>([]);
  const [flatSlotsIdx, setFlatSlotsIdx] = useState(0);
  useEffect(() => {
    const flatSlots = [];
    for (const bar of bars) {
      for (const slot of bar.slots) {
        flatSlots.push({ bar: bar.barNumber, beat: slot.beat });
      }
    }
    setFlatSlots(flatSlots);
    console.log(flatSlots, flatSlotsIdx);
  }, [bars, flatSlotsIdx]);
  useEffect(() => {
    for (let i = 0; i < flatSlots.length; i++) {
      const slot = flatSlots[i];
      if (slot.bar === editingStore.barNumber && slot.beat === editingStore.slotBeat) {
        console.log(i);
        setFlatSlotsIdx(i);
        break;
      }
    }
  }, [flatSlots, editingStore.barNumber, editingStore.slotBeat]);
  useHotkeys(Object.entries(keyMap).join(","), (event, handler) => {
    event.preventDefault();
    let pressedKey = handler.keys![0];
    if (handler.ctrl && handler.alt) {
      pressedKey = "ctrl+alt+" + pressedKey;
    }
    const degreeIndex = keyMap[pressedKey];

    const targetNoteLetter = rotatedScale[degreeIndex];
    const {
      barNumber,
      slotBeat,
      allowedDurations,
      isdotted,
      lastInputNote,
      editingMode,
    } = editingStore;
    let insertedDuration = editingStore.insertedDuration;
    if (editingMode !== "melody") return;

    const finalNote = findCloestNote(lastInputNote, targetNoteLetter);
    if (finalNote) {
      dispatch(updateLastInputNote(finalNote));

      if (isdotted) {
        insertedDuration = insertedDuration * 1.5;
      }

      const { newBars, nextBarNumber, nextBeat } = insertScore(
        score,
        barNumber!,
        slotBeat!,
        finalNote,
        insertedDuration,
        allowedDurations
      );
      dispatch(updateBars({ newBars }));
      dispatch(clearEditingSlot());
      dispatch(setEditingSlot({ barNumber: nextBarNumber, slotBeat: nextBeat }));
    }
  });

  function handleAppend() {
    dispatch(addBar());
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bars.findIndex((bar) => bar.id === active.id);
    const newIndex = bars.findIndex((bar) => bar.id === over.id);
    const newArray = arrayMove(bars, oldIndex, newIndex).map((bar, index) => ({
      ...bar,
      barNumber: index + 1,
    }));

    dispatch(reorderBars({ newBars: newArray }));
  };

  const sensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });

  return (
    <div className="relative flex flex-col gap-6 text-gray-200 xl:flex-row xl:items-start">
      <div className="lex-wrap -right-[3rem] mb-6 flex shrink flex-row justify-center gap-4 xl:absolute xl:order-2 xl:flex-col">
        {editingStore.allowedEditingModes.map((mode) => {
          const Component = modeToIcon[mode];
          return (
            <button
              key={mode}
              data-tooltip={mode}
              onClick={() => dispatch(setEditingMode(mode))}
              className={`relative rounded p-2 ${
                editingStore.editingMode === mode ? "bg-[#1f1f1f]" : ""
              }`}
            >
              <Component className="h-6 w-6" />
            </button>
          );
        })}
        {editingStore.editingMode == "melody" &&
          allowedNoteTime.map((duration) => (
            <button
              key={duration}
              data-tooltip={duration}
              onClick={() =>
                dispatch(
                  updateInputDuration({
                    newInputTime: duration,
                    baseBeat: score.baseBeat,
                  })
                )
              }
              className={`rounded p-2 ${insertNoteTime === duration ? "bg-[#1f1f1f]" : ""}`}
            >
              {noteIcons[duration]({ className: "w-6 h-6 " })}
            </button>
          ))}
        {editingStore.editingMode == "melody" && (
          <button
            data-tooltip="Dotted"
            onClick={() => dispatch(toggleDotted())}
            className={`rounded p-2 ${editingStore.isdotted ? "bg-[#1f1f1f]" : ""}`}
          >
            {Dotted({
              className: ` w-6  h-6   }`,
            })}
          </button>
        )}
      </div>

      {/* 乐谱渲染 */}
      <div className="min-h-[700px] w-full rounded-md bg-gradient-to-b from-[#212121] to-[#121212] px-8 py-12 xl:px-24">
        {/* 顶部信息栏 */}
        <h2 className="mb-2 min-h-16 text-center text-3xl font-bold">{sheetMetadata.title}</h2>
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg">
            <KeySelector />
            <div className="grid grid-flow-row grid-cols-[80px_50px]">
              <p>Tempo:</p>
              <p className="px-2">{score.tempo}</p>{" "}
            </div>
          </div>
          <div className="grid grid-cols-[100px_100px] text-left">
            <p>Singer:</p>
            <p> {sheetMetadata.singers?.join(", ")}</p>
            <p>Upload:</p>
            <p> {sheetMetadata.uploader}</p>
            <p>Composer:</p>
            <p> {sheetMetadata.composers?.join(", ")}</p>
          </div>
        </div>

        {/* 乐谱区域 */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={[sensor]}>
          <SortableContext items={bars.map((bar) => bar.id)}>
            <ul className="grid grid-cols-2 gap-4 rounded-lg px-6 py-4 md:grid-cols-4">
              {bars.map((bar) => (
                <li key={bar.id} className={`${bar.slots.length > 8 ? "col-span-2" : ""}`}>
                  <SortableBar bar={bar} />
                </li>
              ))}
              <div
                className="z-1 transition-color group flex min-h-[100px] cursor-pointer items-center justify-center rounded-lg duration-500 hover:bg-[#1f1f1f]"
                onClick={handleAppend}
              >
                <PlusIcon className="opacity h-6 w-6 text-gray-400 opacity-0 transition-opacity duration-500 group-hover:opacity-75" />
              </div>
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
