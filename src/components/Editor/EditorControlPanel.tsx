import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import {
  setSelectedDuration,
  toggleDotted,
  toggleRelativePitch,
  setEditingTrack,
} from "@stores/editingSlice";
import type { EditingSlotState } from "@stores/editingSlice";
import { createEmptySlot, type TrackType } from "@stores/scoreSlice";
import { addTrack, removeTrack } from "@stores/scoreSlice";
import type { SVGProps } from "react";

// note icons
import WholeNote from "@assets/musicnotes/Whole";
import HalfNote from "@assets/musicnotes/Half";
import QuarterNote from "@assets/musicnotes/Quarter";
import EighthNote from "@assets/musicnotes/Eighth";
import SixteenthNote from "@assets/musicnotes/Sixteenth";
import ThirtySecondNote from "@assets/musicnotes/Thirtysecond";
import Dotted from "@assets/musicnotes/Dotted";
import { type NoteDuration, durationValues } from "#types/sheet";

type IconComponent = React.FC<SVGProps<SVGSVGElement>>;

const durationIcons: Record<NoteDuration, IconComponent> = {
  1: WholeNote as IconComponent,
  2: HalfNote as IconComponent,
  4: QuarterNote as IconComponent,
  8: EighthNote as IconComponent,
  16: SixteenthNote as IconComponent,
  32: ThirtySecondNote as IconComponent,
};

export default function EditorControlPanel() {
  const dispatch = useDispatch();
  const { selectedDuration, isDotted, editingTrack, useRelativePitch } = useSelector(
    (state: RootState) => state.editing as EditingSlotState
  );
  const score = useSelector((state: RootState) => state.score);
  const currentTrack = score.tracks[editingTrack];

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
    // Prevent removing the last track
    if (score.tracks.length <= 1) {
      return;
    }

    dispatch(removeTrack(trackIndex));
    // If we're removing the current track or one before it, update the editing track index
    if (editingTrack >= trackIndex) {
      // If we're removing the last track or the current track is the last one
      const newEditingTrack = Math.max(0, Math.min(editingTrack, score.tracks.length - 2));
      dispatch(setEditingTrack(newEditingTrack));
    }
  };

  return (
    <div className="rounded-md bg-[var(--bg-secondary)] p-4">
      {/* Duration Selection */}
      <div>
        <div className="mb-2 text-sm text-[var(--text-tertiary)]">Note Duration</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(durationIcons).map(([duration, Icon]) => {
            const durationNum = Number(duration) as NoteDuration;
            const isSelected = selectedDuration === durationNum;
            return (
              <button
                key={duration}
                onClick={() => handleDurationClick(durationNum)}
                className={`flex items-center justify-center rounded border border-[var(--border)] p-2 transition-colors ${
                  isSelected
                    ? "bg-[var(--bg-selected)] text-[var(--text-selected)]"
                    : "] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                }`}
                title={`${durationValues[durationNum]} beat${durationValues[durationNum] !== 1 ? "s" : ""}`}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm text-[var(--text-tertiary)]">Note Modifiers</div>
        <div className="space-y-2">
          <button
            onClick={handleDottedClick}
            className={`flex w-full items-center justify-center rounded-md border border-[var(--border)] p-2 transition-shadow duration-500 ${
              isDotted
                ? "bg-[var(--bg-selected)] text-[var(--text-selected)]"
                : "] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
            title="Toggle dotted note"
          >
            <Dotted className="h-6 w-6" />
            <span className="ml-2">Dotted Note</span>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div>
        <div className="mb-2 text-sm text-[var(--text-tertiary)]">Keyboard Shortcuts</div>
        <div className="space-y-2 rounded bg-[var(--bg-secondary)] p-3 text-sm">
          {currentTrack.type === "melody" && (
            <>
              <div className="flex justify-between">
                <span>Q W E R T Y</span>
                <span className="text-[var(--text-tertiary)]">Duration</span>
              </div>
              <div className="flex justify-between">
                <span>D</span>
                <span className="text-[var(--text-tertiary)]">Toggle Dotted</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>← →</span>
            <span className="text-[var(--text-tertiary)]">Navigate Slots</span>
          </div>
          <div className="flex justify-between">
            <span>Delete/Backspace</span>
            <span className="text-[var(--text-tertiary)]">Delete Content</span>
          </div>
          {currentTrack.type === "lyrics" && (
            <div className="flex justify-between">
              <span>Enter</span>
              <span className="text-[var(--text-tertiary)]">Add Lyrics</span>
            </div>
          )}
        </div>
      </div>

      {/* Notation Settings - Only show for melody tracks */}
      {currentTrack.type === "melody" && (
        <div>
          <div className="mb-2 text-sm text-[var(--text-tertiary)]">Notation Settings</div>
          <div className="space-y-2">
            <button
              className={`flex items-center gap-2 rounded border border-[var(--border)] px-3 py-2 ${
                useRelativePitch
                  ? "bg-[var(--bg-selected)] text-[var(--text-selected)]"
                  : "bg-[var(--bg-secondary)]"
              }`}
              onClick={() => dispatch(toggleRelativePitch())}
            >
              <span className="text-sm">Relative Pitch</span>
            </button>
          </div>
        </div>
      )}

      {/* Track Controls */}
      <div className="mt-4 rounded bg-[var(--bg-secondary)]">
        <div className="mb-2 text-sm text-[var(--text-tertiary)]">Tracks</div>
        <div className="mb-2 space-y-2">
          {score.tracks.map((track, index) => (
            <div
              key={track.id}
              className={`flex items-center justify-between rounded p-2 ${
                editingTrack === index
                  ? "bg-[var(--bg-selected)] text-[var(--text-selected)]"
                  : "bg-[var(--bg-secondary)]"
              }`}
            >
              <span className="text-sm capitalize">{track.type}</span>
              <button
                className="rounded border border-[var(--error)] bg-[var(--error)] px-2 py-1 text-xs text-[var(--text-selected)]"
                onClick={() => handleRemoveTrack(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="] rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-sm"
            onClick={() => handleAddTrack("melody")}
          >
            Add Melody
          </button>
          <button
            className="] rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-sm"
            onClick={() => handleAddTrack("chords")}
          >
            Add Chord
          </button>
          <button
            className="] rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-sm"
            onClick={() => handleAddTrack("lyrics")}
          >
            Add Lyrics
          </button>
        </div>
      </div>
    </div>
  );
}
