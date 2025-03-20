import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { 
  setSelectedDuration, 
  toggleDotted,
  toggleColors
} from "@stores/newScore/newEditingSlice";
import type { EditingSlotState } from "@stores/newScore/newEditingSlice";
import type { SVGProps } from "react";
import { SwatchIcon } from "@heroicons/react/24/outline";

// note icons
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";
import Dotted from "@assets/musicnotes/Dotted";

// Types
export type NoteDuration = 1 | 2 | 4 | 8 | 16 | 32;

export const durationValues: Record<NoteDuration, number> = {
  1: 4,   // whole note = 4 beats
  2: 2,   // half note = 2 beats
  4: 1,   // quarter note = 1 beat
  8: 0.5, // eighth note = 1/2 beat
  16: 0.25, // sixteenth note = 1/4 beat
  32: 0.125 // thirty-second note = 1/8 beat
};

type IconComponent = React.FC<SVGProps<SVGSVGElement>>;

const durationIcons: Record<NoteDuration, IconComponent> = {
  1: WholeNote as IconComponent,
  2: HalfNote as IconComponent,
  4: QuarterNote as IconComponent,
  8: EighthNote as IconComponent,
  16: SixteenthNote as IconComponent,
  32: ThirtySecondNote as IconComponent
};

export default function EditorControlPanel() {
  const dispatch = useDispatch();
  const { selectedDuration, isDotted, showColors } = useSelector((state: RootState) => state.newEditing as EditingSlotState);

  return (
    <div className="space-y-4">
      {/* Duration Selection */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Note Duration</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(durationIcons).map(([duration, Icon]) => {
            const durationNum = Number(duration) as NoteDuration;
            const isSelected = selectedDuration === durationNum;
            return (
              <button
                key={duration}
                onClick={() => dispatch(setSelectedDuration(durationNum))}
                className={`p-2 rounded flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-[#2a2a2a] hover:bg-[#333333] text-gray-300'
                }`}
                title={`${durationValues[durationNum]} beat${durationValues[durationNum] !== 1 ? 's' : ''}`}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Modifiers */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Note Modifiers</div>
        <div className="space-y-2">
          <button
            onClick={() => dispatch(toggleDotted())}
            className={`p-2 rounded flex items-center justify-center w-full transition-colors ${
              isDotted 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#2a2a2a] hover:bg-[#333333] text-gray-300'
            }`}
            title="Toggle dotted note"
          >
            <Dotted className="w-6 h-6" />
            <span className="ml-2">Dotted Note</span>
          </button>

          <button
            onClick={() => dispatch(toggleColors())}
            className={`p-2 rounded flex items-center justify-center w-full transition-colors ${
              showColors 
                ? 'bg-blue-500 text-white' 
                : 'bg-[#2a2a2a] hover:bg-[#333333] text-gray-300'
            }`}
            title="Toggle note colors"
          >
            <SwatchIcon className="w-6 h-6" />
            <span className="ml-2">Note Colors</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Keyboard Shortcuts</div>
        <div className="space-y-2 text-sm bg-[#212121] p-3 rounded">
          <div className="flex justify-between">
            <span>Q W E R T Y</span>
            <span className="text-gray-400">Duration</span>
          </div>
          <div className="flex justify-between">
            <span>D</span>
            <span className="text-gray-400">Toggle Dotted</span>
          </div>
          <div className="flex justify-between">
            <span>← →</span>
            <span className="text-gray-400">Navigate Notes</span>
          </div>
          <div className="flex justify-between">
            <span>↑ ↓</span>
            <span className="text-gray-400">Change Track</span>
          </div>
          <div className="flex justify-between">
            <span>Delete/Backspace</span>
            <span className="text-gray-400">Delete Note</span>
          </div>
        </div>
      </div>
    </div>
  );
} 