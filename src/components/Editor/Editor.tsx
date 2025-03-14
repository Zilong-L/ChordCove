// dnd
import {
  DndContext,
  closestCenter,
  useSensor,
  PointerSensor
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";

// redux states
import { useSelector, useDispatch } from "react-redux";
import { addBar, reorderBars, updateBars } from "../../stores/scoreSlice";
import { updateLastInputNote, updateInputDuration, clearEditingSlot, setEditingSlot, toggleDotted, setEditingMode } from "../../stores/editingSlice";
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
import { PlusIcon, DocumentTextIcon, MusicalNoteIcon, ChatBubbleBottomCenterIcon, HomeIcon } from "@heroicons/react/20/solid";
// Import react-hotkeys-hook and your theory helpers
import { useHotkeys } from "react-hotkeys-hook";
import { getNoteInKey, findCloestNote, keyMap } from "@utils/theory/Note";

// Components
import { SortableBar } from "./SortableBar";
import KeySelector from "./KeySelector";
import { useEffect, useState } from "react";

const noteIcons = {
  1: WholeNote,
  2: HalfNote,
  4: QuarterNote,
  8: EighthNote,
  16: SixteenthNote,
  32: ThirtySecondNote,
};


const modeToIcon: any = {
  "chord": HomeIcon,
  "lyric": DocumentTextIcon,
  "extrainfo": ChatBubbleBottomCenterIcon,
  "melody": MusicalNoteIcon
}
export default function Editor() {
  const dispatch = useDispatch();

  const score = useSelector((state: RootState) => state.score);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const editingStore = useSelector((state: RootState) => state.editing);
  const rotatedScale = getNoteInKey(score.key);
  const { allowedNoteTime, insertNoteTime } = editingStore;
  const bars = score.bars;
  const [flatSlots, setFlatSlots] = useState<Array<{ bar: number, beat: number }>>([]);
  const [flatSlotsIdx, setFlatSlotsIdx] = useState(0);
  useEffect(() => {
    const flatSlots = [];
    for (const bar of bars) {
      for (const slot of bar.slots) {
        flatSlots.push({ bar: bar.barNumber, beat: slot.beat });
      }
    }
    setFlatSlots(flatSlots);
    console.log(flatSlots,flatSlotsIdx);
  },[bars,flatSlotsIdx])
  useEffect(() => {
    for (let i = 0; i < flatSlots.length; i++) {
      const slot = flatSlots[i];
      if (slot.bar === editingStore.barNumber && slot.beat === editingStore.slotBeat) {
        console.log(i)
        setFlatSlotsIdx(i);
        break;
      }
    }
  }, [flatSlots, editingStore.barNumber, editingStore.slotBeat])
  useHotkeys(
    Object.entries(keyMap).join(","),
    (event, handler) => {
      event.preventDefault();
      let pressedKey = handler.keys![0];
      if (handler.ctrl && handler.alt) {
        pressedKey = "ctrl+alt+" + pressedKey;
      }
      const degreeIndex = keyMap[pressedKey];

      const targetNoteLetter = rotatedScale[degreeIndex];
      let { barNumber, slotBeat, allowedDurations, isdotted, insertedDuration, lastInputNote, editingMode } = editingStore;
      if (editingMode !== 'melody') return;

      const finalNote = findCloestNote(lastInputNote, targetNoteLetter);
      if (finalNote) {
        dispatch(updateLastInputNote(finalNote));

        if (isdotted) {
          insertedDuration = insertedDuration * 1.5;
        }

        const { newBars, nextBarNumber, nextBeat } = insertScore(score, barNumber!, slotBeat!, finalNote, insertedDuration, allowedDurations);
        dispatch(updateBars({ newBars }));
        dispatch(clearEditingSlot());
        dispatch(setEditingSlot({ barNumber: nextBarNumber, slotBeat: nextBeat }));
      }
    }
  );

  function handleAppend() {
    dispatch(addBar());
  }

  const handleDragEnd = (event: any) => {
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

    <div className="flex flex-col xl:flex-row gap-6 xl:items-start  text-gray-200 relative ">
      <div className="xl:absolute flex flex-row xl:flex-col shrink xl:order-2 lex-wrap justify-center gap-4 mb-6 -right-[3rem]">
        {editingStore.allowedEditingModes.map((mode) => {
          const Component = modeToIcon[mode];
          return (
            <button
              key={mode}
              data-tooltip={mode}
              onClick={() =>
                dispatch(
                  setEditingMode(mode)
                )
              }
              className={`p-2  relative rounded ${editingStore.editingMode === mode ? "bg-[#1f1f1f]" : ""
                }`}
            >
              <Component className="w-6 h-6" />
            </button>
          )
        })
        }
        {editingStore.editingMode == 'melody' && allowedNoteTime.map((duration) => (
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
            className={`p-2 rounded ${insertNoteTime === duration ? "bg-[#1f1f1f]" : ""
              }`}
          >
            {noteIcons[duration]({ className: "w-6 h-6 " })}
          </button>
        )
        )}
        {editingStore.editingMode == 'melody' && <button
          data-tooltip="Dotted"
          onClick={() => dispatch(toggleDotted())}
          className={` p-2 rounded ${editingStore.isdotted ? "bg-[#1f1f1f]" : ""}`}
        >
          {
            Dotted({
              className: ` w-6  h-6   }`,
            })}
        </button>
        }
      </div>


      {/* 乐谱渲染 */}
      <div className="bg-gradient-to-b w-full from-[#212121] to-[#121212] rounded-md py-12 px-8 xl:px-24  min-h-[700px]">
        {/* 顶部信息栏 */}
        <h2 className="text-3xl font-bold text-center mb-2 min-h-16">{sheetMetadata.title}</h2>
        <div className="flex justify-between items-center  mb-6">
          <div className="text-lg">
            <KeySelector />
            <div className="grid-flow-row grid grid-cols-[80px_50px]"><p>Tempo:</p><p className="px-2 ">{score.tempo}</p> </div>
          </div>
          <div className="text-left grid grid-cols-[100px_100px]">
            <p >Singer:</p><p> {sheetMetadata.singer}</p>
            <p >Upload:</p><p> {sheetMetadata.uploader}</p>
            <p >Composer:</p><p> {sheetMetadata.composer}</p>
          </div>
        </div>



        {/* 乐谱区域 */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={[sensor]}>
          <SortableContext items={bars.map((bar) => bar.id)}>
            <ul className="grid grid-cols-2 md:grid-cols-4 px-6 py-4 gap-4  rounded-lg">
              {bars.map((bar) => (
                <li key={bar.id} className={`${bar.slots.length > 8 ? "col-span-2" : ""}`}>
                  <SortableBar bar={bar} />
                </li>
              ))}
              <div
                className="z-1 group min-h-[100px] flex items-center justify-center transition-color duration-500 hover:bg-[#1f1f1f] cursor-pointer rounded-lg"
                onClick={handleAppend}
              >
                <PlusIcon className="w-6 h-6 opacity-0 group-hover:opacity-75 opacity transition-opacity duration-500  text-gray-400" />
              </div>
            </ul>
          </SortableContext>
        </DndContext>
      </div>

    </div>
  );
}
