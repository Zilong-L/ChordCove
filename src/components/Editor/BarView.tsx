import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import {
  splitNotesIntoBars,
  breakDownNotesWithinBar,
  type BarView,
  type AccompanimentSlotView,
} from "@utils/theory/barView";
import { setEditingBeat, setEditingTrack } from "@stores/editingSlice";
import { useMemo, useCallback } from "react";
import React from "react";
import type { Score, Track, TrackType } from "@stores/scoreSlice";
import { SlotController } from "./SlotView";
import { LyricsSlotComponent, LyricsSlotProvider } from "./SlotView/LyricsSlotComponent";

// Bar component to handle individual bars
const Bar = React.memo(
  ({
    bar,
    trackType,
    editingBeat,
    onNoteClick,
  }: {
    bar: BarView;
    trackType: TrackType;
    editingBeat: number;
    onNoteClick: (beat: number) => void;
  }) => {
    const { playingBeat } = useSelector((state: RootState) => state.editing);
    const slots = useMemo(() => breakDownNotesWithinBar(bar.notes), [bar.notes]);
    const lyricSpanUnitsMap = useMemo(() => {
      const map = new Map<number, number>();
      slots.forEach((slot) => {
        const units = Math.max(1, Math.round(slot.duration * 16));
        const existing = map.get(slot.originalBeat) ?? 0;
        map.set(slot.originalBeat, existing + units);
      });
      return map;
    }, [slots]);

    const slotEntries = useMemo(() => {
      return slots.map((slot) => {
        const spanUnits = Math.max(1, Math.round(slot.duration * 16));
        const lyricSpanUnits = lyricSpanUnitsMap.get(slot.originalBeat) ?? spanUnits;
        const startUnit = Math.round((slot.beat - bar.startBeat) * 16);
        return {
          slot: {
            ...slot,
            spanUnits,
            lyricSpanUnits,
          },
          spanUnits,
          lyricSpanUnits,
          startUnit,
        };
      });
    }, [slots, lyricSpanUnitsMap, bar.startBeat]);

    // Grid resolution: 16 subunits per beat
    const beatsPerBar = 4; // current editor default
    const unitsPerBar = beatsPerBar * 16;

    // Aggregate lyrics per originalBeat within this bar
    return (
      <div
        className="grid min-w-[160px] gap-y-1"
        style={{
          gridTemplateColumns: `repeat(${unitsPerBar}, 1fr)`,
          gridTemplateRows: "auto auto",
        }}
      >
        {slotEntries.map(({ slot, spanUnits, startUnit }, index) => {
          const isEditing = editingBeat === slot.originalBeat;
          const isPlaying = playingBeat === slot.beat;

          return (
            <div
              key={`n-${slot.beat}-${index}`}
              className={`relative flex cursor-pointer items-center px-0.5 py-0.5 text-sm hover:bg-[var(--bg-hover)] ${
                isEditing ? "bg-[var(--bg-active)]" : ""
              } ${isPlaying ? "text-[var(--text-accent)]" : ""}`}
              style={{
                gridColumn: `${startUnit + 1} / span ${spanUnits}`,
                gridRow: 1,
              }}
              onClick={() => onNoteClick(slot.originalBeat)}
            >
              <SlotController slot={slot} trackType={trackType} />
            </div>
          );
        })}

        {slotEntries
          .filter(({ slot }) => !slot.sustain)
          .map(({ slot, startUnit, lyricSpanUnits }) => (
            <div
              className="flex items-start px-0.5"
              style={
                {
                  gridColumn: `${startUnit + 1} / span ${lyricSpanUnits}`,
                  gridRow: 2,
                } as React.CSSProperties
              }
            >
              <LyricsSlotComponent slot={slot} />
            </div>
          ))}
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
    allowEditing,
  }: {
    barIndex: number;
    tracks: Track[];
    editingTrack: number;
    editingBeat: number;
    onNoteClick: (trackIndex: number, beat: number) => void;
    colSpan: number;
    allowEditing: boolean;
  }) => {
    const trackBars = useMemo(() => {
      return tracks.map((track, trackIndex) => {
        const bars = splitNotesIntoBars(track.slots);

        if (track.type === "accompaniment" && bars[barIndex]) {
          const originalbar = bars[barIndex];
          const newNotes = originalbar.notes.reduce<AccompanimentSlotView[]>((acc, cur) => {
            const existingSlot = acc.find((slot) => slot.beat === cur.beat);
            if ("notes" in cur) {
              if (existingSlot) {
                existingSlot.notes.push(...cur.notes);
              } else {
                acc.push({
                  ...cur,
                  notes: [...cur.notes],
                  // Preserve originalBeat from the source segment to support cross-bar grouping
                  originalBeat: cur.originalBeat,
                });
              }
            }
            return acc;
          }, []);

          return {
            track,
            bar: { ...bars[barIndex], notes: newNotes },
            trackIndex,
          };
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
                <LyricsSlotProvider
                  trackId={track.id}
                  trackIndex={trackIndex}
                  allowEditing={allowEditing}
                >
                  <Bar
                    bar={bar}
                    editingBeat={editingTrack === trackIndex ? editingBeat : -1}
                    onNoteClick={(beat) => onNoteClick(trackIndex, beat)}
                    trackType={track.type}
                  />
                </LyricsSlotProvider>
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
type BarViewProps = {
  allowEditing?: boolean;
};

export default function BarView({ allowEditing = true }: BarViewProps) {
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
            allowEditing={allowEditing}
          />
        ))}
      </div>
    </div>
  );
}
