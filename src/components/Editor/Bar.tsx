import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { TrashIcon } from "@heroicons/react/20/solid";
import { removeBar } from "@stores/scoreSlice";
import { setEditingSlot, updateNoteInput, clearEditingSlot } from "@stores/editingSlice";
import { BarData, Slot } from "@/types/sheet";
import { calculateDegree } from "@utils/theory/Note";

interface BarProps {
  bar: BarData;
}

export default function Bar({ bar }: BarProps) {
  const dispatch = useDispatch();
  const timeSignature = useSelector((state: RootState) => state.score.timeSignature);
  const beatsPerBar = Number(timeSignature.split("/")[0]);
  const key = useSelector((state: RootState) => state.score.key);
  
  const barNumber = useSelector((state: RootState) => state.editing.barNumber);
  const editingSlotBeat = useSelector((state: RootState) => state.editing.slotBeat);
  const noteInput = useSelector((state: RootState) => state.editing.noteInput);
  const editingDuration = useSelector((state: RootState) => state.editing.insertedDuration);



  const onDelete = (id: string) => dispatch(removeBar( {barId: id})); 

  const { slots } = bar;
  const minDuration = Math.min(...slots.map((slot) => slot.duration));
  const totalColumns = beatsPerBar / minDuration;

  // When a slot is clicked, update the global editing slot state.
  const handleSlotClick = (slot: Slot) => {
    dispatch(setEditingSlot({ barNumber: bar.barNumber, slotBeat: slot.beat}));
  };

  // Handler for input changes: update the global editing state.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateNoteInput(e.target.value));
    
  };

  // Handler to finish editing (on blur or Enter key).
  const finishEditing = () => {
    console.log('inputed',noteInput,'at',barNumber,'beat',editingSlotBeat,'duration',editingDuration)
    dispatch(clearEditingSlot());
  };

  return (
    <div
      style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)` }}
      className="relative group grid items-end min-h-[4rem] min-w-[16rem] pt-[2rem] p-2 rounded-md outline-x-2"
    >
      <h3 className="absolute top-0 left-0 ">{bar.barNumber}</h3>

      {slots.map((slot) => {
        const { beat, note, chord, lyric, duration } = slot;
        // Convert beat and duration into grid units.
        const gridStart = beat / minDuration + 1;
        const gridSpan = duration / minDuration;

        // Determine if this slot is being edited based on the global editing state.
        const isEditing =
          barNumber === bar.barNumber && editingSlotBeat === beat;
        console.log(barNumber,editingSlotBeat)
        return (
          <div
            key={beat}
            className="flex items-center justify-center   cursor-pointer"
            style={{ gridColumn: `${gridStart} / span ${gridSpan}` }}
            onClick={() => handleSlotClick(slot)}
          >
            <div className="flex flex-col items-center">
              <p>{chord}</p>
              <p>{calculateDegree(key, note, "number")}</p>
              <p>{lyric}</p>
              {isEditing && (
                <input
                  type="text"
                  value={noteInput}
                  onChange={handleInputChange}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEditing();
                  }}
                  className="mt-1 p-1 border rounded"
                  autoFocus
                />
              )}
            </div>
          </div>
        );
      })}

      <button
        className="absolute top-[50%] right-0 -translate-y-[50%] hidden group-hover:block"
        onClick={() => onDelete(bar.id)}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}


function splitSlot(slot:Slot, insertedNote:string, insertedDuration:number, allowedDurations:number[]):Slot[] {
  // Calculate the remaining duration after the inserted note.
  let gap = slot.duration - insertedDuration;
  // We'll build the list of durations to fill the gap.
  let restDurations = [];
  
  // Greedy selection: fill the gap with the largest allowed durations.
  while (gap > 0) {
    // Find the largest allowed duration that is <= gap.
    const d = allowedDurations.find(val => val <= gap);
    if (d === undefined) {
      // If none found, break (should not happen if allowedDurations contains very small values)
      break;
    }
    restDurations.push(d);
    gap -= d;
  }
  
  // The greedy algorithm built pieces from the end (largest first).
  // Reverse so that they line up in chronological order right after the inserted note.
  restDurations.reverse();
  
  // Build the new slots.
  let newSlots:Slot[] = [];
  // Inserted note slot:
  newSlots.push({
    beat: slot.beat, 
    duration: insertedDuration, 
    note: insertedNote, 
    chord: "", 
    lyric: ""
  });
  
  // Fill the remainder with rest slots.
  let currentBeat = slot.beat + insertedDuration;
  for (let d of restDurations) {
    newSlots.push({
      beat: currentBeat,
      duration: d,
      note: slot.note,
      chord: slot.chord,
      lyric: slot.lyric
    });
    currentBeat += d;
  }
  
  return newSlots;
}
