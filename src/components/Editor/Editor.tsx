// Editor.tsx
import {
  DndContext,
  closestCenter,
  useSensor,
  PointerSensor
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { useSelector, useDispatch } from "react-redux";
import { addBar, reorderBars,updateBars } from "../../stores/scoreSlice";
import { updateLastInputNote, updateInputDuration,clearEditingSlot,setEditingSlot, toggleDotted } from "../../stores/editingSlice";
import { RootState } from "../../stores/store";
import { SortableBar } from "./SortableBar";

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
import {  getNoteInKey, findCloestNote, keyMap } from "@utils/theory/Note";
import { insertScore } from "./modifyScore";
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

  // Get Redux state
  const score = useSelector((state: RootState) => state.score);
  
  const rotatedScale = getNoteInKey(score.key);
  const editingStore = useSelector((state: RootState) => state.editing);
  const { allowedNoteTime, insertNoteTime } = editingStore;
  const bars = score.bars;

  // Local state to track the most recent note input (for octave placement)

  // (For now, hardcode the current key; later you can manage this in Redux or local state)

  // --- Bind hotkeys using react-hotkeys-hook ---
  useHotkeys(
    Object.entries(keyMap).join(","),
    (event, handler) => {
      event.preventDefault();
      // The pressed key (e.g. "1" or "ctrl+1") is available in handler.key
      let pressedKey = handler.keys![0];
      if(handler.ctrl&&handler.alt){
        pressedKey = "ctrl+alt+"+pressedKey;
      }
      const degreeIndex = keyMap[pressedKey];


      const targetNoteLetter = rotatedScale[degreeIndex];
      let {barNumber,slotBeat,allowedDurations,isdotted,insertedDuration,lastInputNote} = editingStore;
      // Determine the closest note (with octave) relative to the last input
      const finalNote = findCloestNote(lastInputNote, targetNoteLetter);
      if (finalNote) {
        dispatch(updateLastInputNote(finalNote));
        
        if(isdotted){
          insertedDuration = insertedDuration*1.5;
        }

        const {newBars,nextBarNumber,nextBeat} = insertScore(score,barNumber!,slotBeat!,finalNote,insertedDuration,allowedDurations);
        dispatch(updateBars({newBars}));
        dispatch(clearEditingSlot());
        dispatch(setEditingSlot({barNumber:nextBarNumber,slotBeat:nextBeat}))
      }
    }
  );

  // --- DnD and Bar operations ---
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
    <div className="bg-gradient-to-b from-[#212121] to-[#121212] min-h-[400px] ">
      <h2 className="text-2xl text-white">{score.tempo}bpm</h2>
      <h2 className="text-2xl text-white">{score.timeSignature}</h2>
      <div className="flex flex-wrap">
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
            style={{
              backgroundColor:
                insertNoteTime === duration ? "#4a5568" : "#2d3748",
            }}
          >
            {noteIcons[duration]({ className: "w-12 h-12 text-white" })}
          </button>
        ))}
        <button onClick={() => dispatch(toggleDotted())}>
          {Dotted({ className: `w-12 h-12 text-white ${editingStore.isdotted?"bg-gray-200":""}` })}
        </button>
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={[sensor]}
      >
        <SortableContext items={bars.map((bar) => bar.id)}>
          <ul className="w-[1280px] grid grid-cols-4 px-24 py-4 content-start gap-4">
            {bars.map((bar) => (
              <li key={bar.id} className={`${bar.slots.length>8?"col-span-2":""}`}>
                <SortableBar bar={bar} />
              </li>
            ))}
            <div
              className="z-1 group min-h-[4rem] relative hover:bg-[#232323]"
              onClick={handleAppend}
            >
              <PlusIcon className="w-6 h-6 text-white hidden group-hover:block absolute right-4 top-[50%] -translate-y-[50%]" />
            </div>
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
