import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { 
  setSelectedDuration, 
  toggleDotted
} from "@stores/newScore/newEditingSlice";
import type { EditingSlotState } from "@stores/newScore/newEditingSlice";

// note icons
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";
import Dotted from "@assets/musicnotes/Dotted";

// Types
type NoteDuration = 1 | 2 | 4 | 8 | 16 | 32;

// Duration values in beats
const durationValues: Record<NoteDuration, number> = {
  1: 4,    // whole note = 4 beats
  2: 2,    // half note = 2 beats
  4: 1,    // quarter note = 1 beat (basic unit)
  8: 0.5,  // eighth note = 1/2 beat
  16: 0.25, // sixteenth note = 1/4 beat
  32: 0.125 // thirty-second note = 1/8 beat
} as const;

const noteIcons: Record<NoteDuration, typeof WholeNote> = {
  1: WholeNote,    // whole note
  2: HalfNote,     // half note
  4: QuarterNote,  // quarter note
  8: EighthNote,   // eighth note
  16: SixteenthNote, // sixteenth note
  32: ThirtySecondNote, // thirty-second note
} as const;

export default function EditorControlPanel() {
  const dispatch = useDispatch();
  
  const { selectedDuration, isDotted } = useSelector(
    (state: RootState) => state.newEditing as EditingSlotState
  );

  return (
    <div className="flex flex-row gap-4 p-4 bg-[#1f1f1f] rounded">
      {/* Note Duration Buttons */}
      {(Object.entries(noteIcons) as [string, typeof WholeNote][]).map(([durationStr, Icon]) => {
        const duration = Number(durationStr) as NoteDuration;
        return (
          <button
            key={duration}
            data-tooltip={`${duration === 1 ? 'Whole' : 
                          duration === 2 ? 'Half' :
                          duration === 4 ? 'Quarter' :
                          duration === 8 ? 'Eighth' :
                          duration === 16 ? 'Sixteenth' : 'Thirty-second'} note (${durationValues[duration]} beats)`}
            aria-label={`Set note duration to ${duration}`}
            onClick={() => dispatch(setSelectedDuration(duration))}
            className={`rounded p-2 ${selectedDuration === duration ? "bg-[#2f2f2f]" : ""}`}
          >
            <Icon className="w-6 h-6" />
          </button>
        );
      })}

      {/* Dotted Note Toggle */}
      <button
        data-tooltip="Dotted (1.5x duration)"
        aria-label="Toggle dotted note"
        onClick={() => dispatch(toggleDotted())}
        className={`rounded p-2 ${isDotted ? "bg-[#2f2f2f]" : ""}`}
      >
        <Dotted className="w-6 h-6" />
      </button>
    </div>
  );
}

// Export these for use in other components
export { durationValues, NoteDuration }; 