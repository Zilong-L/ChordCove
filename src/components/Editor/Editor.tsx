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
import { updateLastInputNote, updateInputDuration, clearEditingSlot, setEditingSlot, toggleDotted } from "../../stores/editingSlice";
import { RootState } from "../../stores/store";
import { insertScore } from "./modifyScore";

// icons
import { PlusIcon } from "@heroicons/react/20/solid";
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";
import Dotted from "@assets/musicnotes/Dotted";

// Import react-hotkeys-hook and your theory helpers
import { useHotkeys } from "react-hotkeys-hook";
import { getNoteInKey, findCloestNote, keyMap } from "@utils/theory/Note";

// Components
import { SortableBar } from "./SortableBar";
import KeySelector from "./KeySelector";
const noteIcons = {
  1: WholeNote,
  2: HalfNote,
  4: QuarterNote,
  8: EighthNote,
  16: SixteenthNote,
  32: ThirtySecondNote,
};
export default function Editor() {
  const dispatch = useDispatch();

  const score = useSelector((state: RootState) => state.score);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  const editingStore = useSelector((state: RootState) => state.editing);
  const rotatedScale = getNoteInKey(score.key);
  const { allowedNoteTime, insertNoteTime } = editingStore;
  const bars = score.bars;

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
      let { barNumber, slotBeat, allowedDurations, isdotted, insertedDuration, lastInputNote } = editingStore;

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

    <div className="flex flex-col xl:flex-row gap-6 xl:items-start">
      <div className="flex flex-row xl:flex-col shrink xl:order-2 lex-wrap justify-center gap-4 mb-6">
        {allowedNoteTime.map((duration) => (
          <button
            key={duration}
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
            {noteIcons[duration]({ className: "w-12 h-12 text-white" })}
          </button>
        ))}
        <button onClick={() => dispatch(toggleDotted())}>
          {Dotted({
            className: `w-12 h-12 text-white ${editingStore.isdotted ? "bg-gray-200" : ""}`,
          })}
        </button>
      </div>


      {/* 乐谱渲染 */}
      <div className="bg-gradient-to-b from-[#212121] to-[#121212] min-h-screen px-12 py-8 grow">
        {/* 顶部信息栏 */}
        <h2 className="text-3xl font-bold text-center mb-2 min-h-16">{sheetMetadata.title}</h2>
        <div className="flex justify-between items-center text-white mb-6">
          <div className="text-lg">
            <KeySelector />
            <p className="grid-flow-row grid grid-cols-[80px_50px]"><p>Tempo:</p><p className="px-2 ">{score.tempo}</p> </p>
          </div>
          <div className="text-right">
            <p>Uploader: {sheetMetadata.uploader}</p>
            <p>Singer: {sheetMetadata.singer}</p>
            <p>Composer: {sheetMetadata.composer}</p>
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
                className="z-1 group min-h-[100px] flex items-center justify-center hover:bg-[#1f1f1f] cursor-pointer rounded-lg"
                onClick={handleAppend}
              >
                <PlusIcon className="w-6 h-6 text-white hidden group-hover:block" />
              </div>
            </ul>
          </SortableContext>
        </DndContext>
      </div>

    </div>
  );
}
