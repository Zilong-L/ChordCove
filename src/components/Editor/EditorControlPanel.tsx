import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import {
  setSelectedDuration,
  toggleDotted,
  setEditingMode,
  toggleRelativePitch,
  type EditingMode,
} from "@stores/editingSlice";
import type { EditingSlotState } from "@stores/editingSlice";
import type { SVGProps } from "react";
import { MusicalNoteIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import { createEmptySlot, type TrackType } from "@stores/scoreSlice";
import { addTrack, removeTrack } from "@stores/scoreSlice";

// note icons
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";
import Dotted from "@assets/musicnotes/Dotted";

// Types
export const durationValues = {
  1: 4, // whole note
  2: 2, // half note
  4: 1, // quarter note
  8: 0.5, // eighth note
  16: 0.25, // sixteenth note
  32: 0.125, // thirty-second note
} as const;

export type NoteDuration = keyof typeof durationValues;

type IconComponent = React.FC<SVGProps<SVGSVGElement>>;

const durationIcons: Record<NoteDuration, IconComponent> = {
  1: WholeNote as IconComponent,
  2: HalfNote as IconComponent,
  4: QuarterNote as IconComponent,
  8: EighthNote as IconComponent,
  16: SixteenthNote as IconComponent,
  32: ThirtySecondNote as IconComponent,
};

const editingModes: { mode: EditingMode; label: string; icon: IconComponent }[] = [
  { mode: "notes", label: "Notes", icon: MusicalNoteIcon },
  { mode: "lyrics", label: "Lyrics", icon: ChatBubbleBottomCenterTextIcon },
  { mode: "chords", label: "Chords", icon: MusicalNoteIcon },
  { mode: "comments", label: "Comments", icon: ChatBubbleBottomCenterTextIcon },
];

export default function EditorControlPanel() {
  const dispatch = useDispatch();
  const { selectedDuration, isDotted, editingMode, editingTrack, useRelativePitch } = useSelector(
    (state: RootState) => state.editing as EditingSlotState
  );
  const score = useSelector((state: RootState) => state.score);

  const handleDurationClick = (duration: NoteDuration) => {
    dispatch(setSelectedDuration(duration));
  };

  const handleDottedClick = () => {
    dispatch(toggleDotted());
  };

  const handleAddTrack = (type: TrackType) => {
    dispatch(
      addTrack({
        id: `${type}${Date.now()}`,
        type,
        slots: [createEmptySlot(type, 0, 4)],
      })
    );
  };

  const handleRemoveTrack = (trackIndex: number) => {
    dispatch(removeTrack(trackIndex));
  };

  return (
    <div className="space-y-4">
      {/* Editing Mode Selection */}
      <div>
        <div className="mb-2 text-sm text-gray-400">Editing Mode</div>
        <div className="grid grid-cols-2 gap-2">
          {editingModes.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => dispatch(setEditingMode(mode))}
              className={`flex items-center justify-center rounded p-2 transition-colors ${
                editingMode === mode
                  ? "bg-blue-500 text-white"
                  : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]"
              }`}
            >
              <Icon className="mr-2 h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection - Only show when editing notes */}
      {editingMode === "notes" && (
        <div>
          <div className="mb-2 text-sm text-gray-400">Note Duration</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(durationIcons).map(([duration, Icon]) => {
              const durationNum = Number(duration) as NoteDuration;
              const isSelected = selectedDuration === durationNum;
              return (
                <button
                  key={duration}
                  onClick={() => handleDurationClick(durationNum)}
                  className={`flex items-center justify-center rounded p-2 transition-colors ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]"
                  }`}
                  title={`${durationValues[durationNum]} beat${durationValues[durationNum] !== 1 ? "s" : ""}`}
                >
                  <Icon className="h-6 w-6" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Note Modifiers - Only show when editing notes */}
      {editingMode === "notes" && (
        <div>
          <div className="mb-2 text-sm text-gray-400">Note Modifiers</div>
          <div className="space-y-2">
            <button
              onClick={handleDottedClick}
              className={`flex w-full items-center justify-center rounded-md p-2 transition-shadow duration-500 ${
                isDotted
                  ? "bg-blue-500 text-white"
                  : "bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]"
              }`}
              title="Toggle dotted note"
            >
              <Dotted className="h-6 w-6" />
              <span className="ml-2">Dotted Note</span>
            </button>
          </div>
        </div>
      )}

      {/* Track Controls */}
      <div className="rounded bg-[#212121] p-3">
        <div className="mb-2 text-sm text-gray-400">Tracks</div>
        <div className="mb-2 space-y-2">
          {score.tracks.map((track, index) => (
            <div
              key={track.id}
              className={`flex items-center justify-between rounded p-2 ${
                editingTrack === index ? "bg-blue-500" : "bg-[#2a2a2a]"
              }`}
            >
              <span className="text-sm">
                {track.type} {index + 1}
              </span>
              <button
                className="rounded bg-red-500 px-2 py-1 text-xs hover:bg-red-600"
                onClick={() => handleRemoveTrack(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded bg-[#2a2a2a] p-2 text-sm hover:bg-[#333]"
            onClick={() => handleAddTrack("melody")}
          >
            Add Melody
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div>
        <div className="mb-2 text-sm text-gray-400">Keyboard Shortcuts</div>
        <div className="space-y-2 rounded bg-[#212121] p-3 text-sm">
          {editingMode === "notes" && (
            <>
              <div className="flex justify-between">
                <span>Q W E R T Y</span>
                <span className="text-gray-400">Duration</span>
              </div>
              <div className="flex justify-between">
                <span>D</span>
                <span className="text-gray-400">Toggle Dotted</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>← →</span>
            <span className="text-gray-400">Navigate Slots</span>
          </div>
          <div className="flex justify-between">
            <span>Delete/Backspace</span>
            <span className="text-gray-400">Delete Content</span>
          </div>
          {editingMode === "lyrics" && (
            <div className="flex justify-between">
              <span>Enter</span>
              <span className="text-gray-400">Add Lyrics</span>
            </div>
          )}
        </div>
      </div>

      {/* Notation Settings */}
      <div>
        <div className="mb-2 text-sm text-gray-400">Notation Settings</div>
        <div className="space-y-2">
          <button
            className={`flex items-center gap-2 rounded px-3 py-2 ${
              useRelativePitch ? "bg-blue-600" : "bg-gray-700"
            }`}
            onClick={() => dispatch(toggleRelativePitch())}
          >
            <span className="text-sm">Relative Pitch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
