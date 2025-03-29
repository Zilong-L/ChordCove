import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { splitNotesIntoBars, breakDownNotesWithinBar, type BarView } from "@utils/theory/barView";
import { setEditingBeat, setEditingTrack } from "@stores/editingSlice";
import { useMemo, useCallback } from "react";
import React from "react";
import type { Score, Track, TrackType } from "@stores/scoreSlice";
import { SlotController } from "./SlotView";

// Bar component to handle individual bars
const Bar = React.memo(
  ({
    bar,
    isFirstTrack,
    trackType,
    editingBeat,
    onNoteClick,
  }: {
    bar: BarView;
    isFirstTrack: boolean;
    trackType: TrackType;
    editingBeat: number;
    onNoteClick: (beat: number) => void;
  }) => {
    const { playingBeat } = useSelector((state: RootState) => state.editing);
    const slots = useMemo(() => breakDownNotesWithinBar(bar.notes), [bar.notes]);

    // Calculate total duration of the bar
    const totalDuration = useMemo(() => {
      return slots.reduce((sum, slot) => sum + slot.duration, 0) || 4; // Default to 4 if empty
    }, [slots]);

    return (
      <div className="flex min-w-[100px]">
        {slots.map((slot, index) => {
          const isEditing = editingBeat === slot.beat;
          const isPlaying = playingBeat === slot.beat;

          // Calculate width percentage based on duration
          const widthPercentage = (slot.duration / totalDuration) * 100;

          return (
            <div
              key={`${slot.beat}-${index}`}
              className={`relative flex cursor-pointer items-center px-0.5 py-0.5 text-sm hover:bg-[var(--bg-hover)] ${
                isEditing ? "bg-[var(--bg-active)]" : ""
              } ${isPlaying ? "text-[var(--text-accent)]" : ""}`}
              style={{ width: `${widthPercentage}%` }}
              onClick={() => onNoteClick(slot.originalBeat)}
            >
              <SlotController slot={slot} isFirstTrack={isFirstTrack} trackType={trackType} />
            </div>
          );
        })}
      </div>
    );
  }
);

// BarGroup component to handle all tracks' bars at a specific position
const BarGroup = React.memo(
  ({
    barIndex,
    tracks,
    editingTrack,
    editingBeat,
    onNoteClick,
    colSpan,
    showBarNumber,
  }: {
    barIndex: number;
    tracks: Track[];
    editingTrack: number;
    editingBeat: number;
    onNoteClick: (trackIndex: number, beat: number) => void;
    colSpan: number;
    showBarNumber: boolean;
  }) => {
    const trackBars = useMemo(() => {
      return tracks.map((track, trackIndex) => {
        const bars = splitNotesIntoBars(track.slots);

        if (track.type === "notes" && bars[barIndex]) {
          const originalbar = bars[barIndex];
          console.log("original", originalbar);
          const newNotes = originalbar.notes.reduce((acc, cur) => {
            const existingSlot = acc.find((slot) => slot.beat === cur.beat);
            const { note, ...withoutNote } = cur;
            // if (note === "") return acc;
            if (existingSlot) {
              existingSlot.notes.push(note);
            } else {
              acc.push({ ...withoutNote, notes: [cur.note] });
            }
            return acc;
          }, []);
          // Group notes by beat
          console.log(newNotes);
          return {
            track,
            bar: { ...bars[barIndex], notes: newNotes },
            trackIndex,
          };
        } else if (track.type === "accompaniment") {
          console.log(bars[barIndex]);
        }
        return {
          track,
          bar: bars[barIndex],
          trackIndex,
        };
      });
    }, [tracks, barIndex]);

    return (
      <div
        className="] relative rounded border border-[var(--border-primary)]"
        style={{
          gridColumn: `span ${colSpan}`,
        }}
      >
        <div className="grid gap-1 p-2">
          {trackBars.map(({ track, bar, trackIndex }) => (
            <div key={track.id} className={`relative`}>
              {bar ? (
                <Bar
                  bar={bar}
                  editingBeat={editingTrack === trackIndex ? editingBeat : -1}
                  onNoteClick={(beat) => onNoteClick(trackIndex, beat)}
                  isFirstTrack={trackIndex === 0}
                  trackType={track.type}
                />
              ) : (
                <div className="min-w-[100px] p-1 opacity-0">
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]">
                    1
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

// Main BarView component
export default function BarView() {
  const dispatch = useDispatch();
  const { editingBeat, editingTrack } = useSelector((state: RootState) => state.editing);
  const score = useSelector((state: RootState) => state.score as Score);

  // Calculate the maximum number of bars across all tracks
  const maxBarsPerTrack = useMemo(() => {
    return Math.max(
      ...score.tracks.map((track) => {
        const bars = splitNotesIntoBars(track.slots);
        return bars.length;
      })
    );
  }, [score.tracks]);

  // Calculate which bars should span 2 columns
  const barSpans = useMemo(() => {
    const spans: number[] = Array(maxBarsPerTrack).fill(1);

    score.tracks.forEach((track) => {
      const bars = splitNotesIntoBars(track.slots);
      bars.forEach((bar, index) => {
        const brokenDownNotes = breakDownNotesWithinBar(bar.notes);
        if (brokenDownNotes.length > 16) {
          spans[index] = 2;
        }
      });
    });

    return spans;
  }, [score.tracks, maxBarsPerTrack]);
  const handleNoteClick = useCallback(
    (trackIndex: number, beat: number) => {
      dispatch(setEditingTrack(trackIndex));
      dispatch(setEditingBeat(beat));
    },
    [dispatch]
  );

  // Create array of bar indices
  const barIndices = Array.from({ length: maxBarsPerTrack }, (_, i) => i);

  return (
    <div className="w-full overflow-x-visible p-4">
      <div className="relative grid auto-rows-fr grid-cols-4 gap-2">
        {barIndices.map((barIndex) => (
          <BarGroup
            key={barIndex}
            barIndex={barIndex}
            tracks={score.tracks}
            editingTrack={editingTrack}
            editingBeat={editingBeat}
            onNoteClick={handleNoteClick}
            colSpan={barSpans[barIndex]}
            showBarNumber={barIndex % 4 === 0}
          />
        ))}
      </div>
    </div>
  );
}
