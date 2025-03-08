import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { TrashIcon } from "@heroicons/react/20/solid";
import { removeBar } from "@stores/scoreSlice";
import { setEditingSlot  } from "@stores/editingSlice";
import { BarData,  Slot } from "@/types/sheet";
import { calculateDegree } from "@utils/theory/Note";

interface BarProps {
  bar: BarData;
}
const underlineDouble = "underline  underline-offset-4 decoration-1 decoration-double decoration-white" 
const underline = "underline  underline-offset-4 decoration-1 decoration-white"
export default function Bar({ bar }: BarProps) {
  const dispatch = useDispatch();
  const timeSignature = useSelector((state: RootState) => state.score.timeSignature);
  const beatsPerBar = Number(timeSignature.split("/")[0]);
  const key = useSelector((state: RootState) => state.score.key);

  const editing = useSelector((state: RootState) => state.editing);
  
  const {barNumber, slotBeat} = editing;

  const onDelete = (id: string) => dispatch(removeBar( {barId: id})); 

  const { slots } = bar;
  const minDuration = Math.min(...slots.map((slot) => slot.duration));
  const totalColumns = beatsPerBar / minDuration;

  // When a slot is clicked, update the global editing slot state.
  const handleSlotClick = (slot: Slot) => {
    dispatch(setEditingSlot({ barNumber: bar.barNumber, slotBeat: slot.beat}));
  };

  

  return (
    <div
      style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)` }}
      className="relative group grid items-end min-h-[4rem] min-w-[10rem] pt-[2rem] p-2 rounded-md outline-x-2 text-xl "
    >
      {<h3 className="absolute top-0 left-0 text-xl hidden group-hover:block">{bar.barNumber}</h3>}
      {slots.map((slot) => {
        const { beat, note, chord, lyric, duration } = slot;
        // Convert beat and duration into grid units.
        const gridStart = Math.floor(beat / minDuration + 1);
        const gridSpan = Math.floor(duration / minDuration);

        // Determine if this slot is being edited based on the global editing state.
        const isEditing =
          barNumber === bar.barNumber && slotBeat === beat;
        return (
          <div
            key={beat}
            className="flex  items-center justify-center   cursor-pointer"
            style={{ gridColumn: `${gridStart} / span ${gridSpan}` }}
            onClick={() => handleSlotClick(slot)}
          >
            <div className={`box-border block w-full p-2  ${isEditing?"bg-[#323232]":""}` }>
              <p>{chord}</p>
              <p className={`${duration==0.5||duration==0.75?underline:duration==0.25?underlineDouble:""}`}>{!slot.sustain?calculateDegree(key, note, "number")+((duration==1.5||duration==0.75)?'.':''):'-'}</p>
              <p>{lyric}</p>
             
            </div>
          </div>
        );
      })}

      <button
        className="absolute top-[20%] right-[0%] -translate-y-[50%] hidden group-hover:block"
        onClick={() => onDelete(bar.id)}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
