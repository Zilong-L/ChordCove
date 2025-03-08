import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { TrashIcon } from "@heroicons/react/20/solid";
import { removeBar,updateBars } from "@stores/scoreSlice";
import { setEditingSlot, updateNoteInput, clearEditingSlot } from "@stores/editingSlice";
import { BarData, Score, Slot } from "@/types/sheet";
import { calculateDegree } from "@utils/theory/Note";

interface BarProps {
  bar: BarData;
}

export default function Bar({ bar }: BarProps) {
  const dispatch = useDispatch();
  const timeSignature = useSelector((state: RootState) => state.score.timeSignature);
  const beatsPerBar = Number(timeSignature.split("/")[0]);
  const key = useSelector((state: RootState) => state.score.key);

  const editing = useSelector((state: RootState) => state.editing);
  
  const {barNumber, slotBeat, noteInput, insertedDuration, allowedDurations} = editing;
  const score = useSelector((state: RootState) => state.score);

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
    console.log('inputed',noteInput,'at',barNumber,'beat',slotBeat,'duration',insertedDuration)
    const {newBars,nextBarNumber,nextBeat} = insertScore(score,barNumber!,slotBeat!,noteInput,insertedDuration,allowedDurations)
    console.log(newBars)
    if(nextBarNumber===barNumber&&nextBeat===slotBeat){
      dispatch(clearEditingSlot());
      return;
    }
    dispatch(updateBars({newBars}));
    dispatch(clearEditingSlot());
    dispatch(setEditingSlot({barNumber:nextBarNumber,slotBeat:nextBeat}))
  };

  return (
    <div
      style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)` }}
      className="relative group grid items-end min-h-[4rem] min-w-[16rem] pt-[2rem] p-2 rounded-md outline-x-2"
    >
      {bar.barNumber%4==1&&<h3 className="absolute top-0 left-0 ">{bar.barNumber}</h3>
}
      {slots.map((slot) => {
        const { beat, note, chord, lyric, duration } = slot;
        // Convert beat and duration into grid units.
        const gridStart = beat / minDuration + 1;
        const gridSpan = duration / minDuration;

        // Determine if this slot is being edited based on the global editing state.
        const isEditing =
          barNumber === bar.barNumber && slotBeat === beat;
        console.log(barNumber,slotBeat)
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
                  className=" border rounded text-white bg-transparent  w-8 flex justify-center text-center"
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
function insertScore(score: Score, barNumber: number, slotBeat: number, note: string, duration: number, allowedDurations: number[]) {
  if(note==="") return {newBars:score.bars,nextBarNumber:barNumber,nextBeat:slotBeat}
  let [currentBarNumber, currentBeat] = [barNumber-1, slotBeat]
  let bars = structuredClone(score.bars)

  let remainingDuration = duration
  while(remainingDuration>0){
    let currentBar = bars[currentBarNumber].slots
    console.log('processing bar',currentBarNumber,'beat',currentBeat)
    const slot = currentBar.find(slot=>slot.beat===currentBeat)
    const result = splitSlot(slot!,note,remainingDuration,allowedDurations)
    const newSlots = result.newSlots
    bars[currentBarNumber].slots = currentBar.map(_slot=>slot===_slot?newSlots:_slot).flat(1)
    console.log(bars[currentBarNumber].slots)
    currentBeat = currentBeat + remainingDuration 
    remainingDuration = result.remainingDuration
    currentBeat -= remainingDuration

    if(currentBeat>=score.beatsPerBar){
      currentBeat = currentBeat - score.beatsPerBar
      currentBarNumber++
    } 
    if(currentBarNumber>=bars.length){
      // add a new bar
      bars.push({
        id: crypto.randomUUID(),
        barNumber: currentBarNumber+1,
        slots: [{
          beat: 0,
          duration: score.beatsPerBar,
          note: "",
          chord: "",
          lyric: ""
        }
      ]})
    }
  }
  return {newBars:bars,nextBarNumber:currentBarNumber+1,nextBeat:currentBeat}
}

function splitSlot(slot: Slot, insertedNote: string, insertedDuration: number, allowedDurations: number[]): { newSlots: Slot[], remainingDuration: number } {
  if (insertedDuration >= slot.duration) {
    return {
      newSlots: [{
        beat: slot.beat,
        duration: slot.duration,
        note: insertedNote,
        chord: "",
        lyric: ""
      }],
      remainingDuration: insertedDuration - slot.duration
    };
  }

  let gap = slot.duration - insertedDuration;
  let restDurations = [];

  while (gap > 0) {
    const d = allowedDurations.find(val => val <= gap);
    if (d === undefined) break;
    restDurations.push(d);
    gap -= d;
  }

  restDurations.reverse();

  let newSlots: Slot[] = [{
    beat: slot.beat,
    duration: insertedDuration,
    note: insertedNote,
    chord: "",
    lyric: ""
  }];

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

  return { newSlots, remainingDuration: 0 };
}
