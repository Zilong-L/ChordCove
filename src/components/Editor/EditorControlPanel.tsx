import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import {
  setSelectedDuration,
  toggleDotted,
  toggleRelativePitch,
  setEditingTrack,
  setShowLyrics,
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
  const { selectedDuration, isDotted, editingTrack, useRelativePitch, showLyrics } = useSelector(
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

  const handleRemoveTrack = (trackIndex: number) => (event: React.MouseEvent) => {
    // Stop event propagation to prevent track selection
    event.stopPropagation();

    // Prevent removing the last track
    if (score.tracks.length <= 1) {
      return;
    }

    // Calculate new editing track index
    let newEditingTrack = editingTrack;
    if (trackIndex === editingTrack) {
      // If removing current track, move to previous track or first track
      newEditingTrack = Math.max(0, editingTrack - 1);
    } else if (trackIndex < editingTrack) {
      // If removing track before current track, adjust index down
      newEditingTrack = editingTrack - 1;
    }

    // Update editing track first
    dispatch(setEditingTrack(newEditingTrack));

    // Then remove the track
    dispatch(removeTrack(trackIndex));
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
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
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
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            }`}
            title="Toggle dotted note"
          >
            <Dotted className="h-6 w-6" />
            <span className="ml-2">Dotted Note</span>
          </button>
        </div>
      </div>

      {/* Notation Settings - Only show for melody tracks */}
      <div>
        <div className="mb-2 text-sm text-[var(--text-tertiary)]">Notation Settings</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`flex items-center justify-center rounded border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)] ${
              useRelativePitch
                ? "bg-[var(--bg-selected)] text-[var(--text-selected)]"
                : "bg-[var(--bg-secondary)]"
            }`}
            onClick={() => dispatch(toggleRelativePitch())}
          >
            <span className="text-sm">Relative Pitch</span>
          </button>
          <button
            className={`flex items-center justify-center rounded border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)] ${
              showLyrics
                ? "bg-[var(--bg-selected)] text-[var(--text-selected)]"
                : "bg-[var(--bg-secondary)]"
            }`}
            onClick={() => dispatch(setShowLyrics(!showLyrics))}
          >
            <span className="text-sm">Show Lyrics</span>
          </button>
        </div>
      </div>

      {/* Track Controls */}
      <div className="mt-4 rounded bg-[var(--bg-secondary)]">
        <div className="mb-2 text-sm text-[var(--text-tertiary)]">Tracks</div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-sm text-[var(--text-secondary)]"
            onClick={() => handleAddTrack("melody")}
          >
            Add Melody
          </button>
          <button
            className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-sm text-[var(--text-secondary)]"
            onClick={() => handleAddTrack("accompaniment")}
          >
            Add Accompaniment
          </button>
        </div>
        <div className="space-y-2">
          {score.tracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => dispatch(setEditingTrack(index))}
              className={`flex items-center justify-between rounded p-2 ${editingTrack === index ? "bg-[var(--bg-selected)] text-[var(--text-selected)]" : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"}`}
            >
              {track.type}
              <button
                className="rounded border border-[var(--error)] bg-[var(--error)] px-2 py-1 text-xs text-[var(--color-white)]"
                onClick={handleRemoveTrack(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
