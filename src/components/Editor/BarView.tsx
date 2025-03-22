import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import {
  splitNotesIntoBars,
  breakDownNotesWithinBar,
  type BarView,
  type SlotView,
} from "@utils/theory/barView";
import { setEditingBeat, setEditingTrack } from "@stores/editingSlice";
import { useMemo, useCallback } from "react";
import React from "react";
import type { Score, Track, TrackType } from "@stores/scoreSlice";
import {
  MelodySlotComponent,
  ChordSlotComponent,
  LyricsSlotComponent,
  AccompanimentSlotComponent,
} from "./SlotComponents";

// Helper component to render slot content
const SlotContent = React.memo(
  ({
    slot,
    isFirstTrack,
    trackType,
  }: {
    slot: SlotView;
    isFirstTrack: boolean;
    trackType: TrackType;
  }) => {
    const keyNote = useSelector((state: RootState) => state.score.key);
    switch (trackType) {
      case "melody":
        return <MelodySlotComponent keyNote={keyNote} slot={slot} isFirstTrack={isFirstTrack} />;
      case "chord":
        return <ChordSlotComponent slot={slot} isFirstTrack={isFirstTrack} />;
      case "lyrics":
        return <LyricsSlotComponent slot={slot} isFirstTrack={isFirstTrack} />;
      case "accompaniment":
        return <AccompanimentSlotComponent slot={slot} isFirstTrack={isFirstTrack} />;
      default:
        return null;
    }
  }
);

// Bar component to handle individual bars
const Bar = React.memo(
  ({
    bar,
    editingBeat,
    onNoteClick,
    isFirstTrack,
    trackType,
  }: {
    bar: BarView;
    editingBeat: number;
    onNoteClick: (beat: number) => void;
    isFirstTrack: boolean;
    trackType: TrackType;
  }) => {
    const { playingBeat, playbackStartBeat, playbackEndBeat } = useSelector(
      (state: RootState) => state.editing
    );
    const slots = useMemo(() => breakDownNotesWithinBar(bar.notes), [bar.notes]);

    return (
      <div
        className={`grid auto-cols-fr grid-flow-col ${slots.length > 16 ? "min-w-[200px]" : "min-w-[100px]"}`}
      >
        {slots.map((slot, index) => {
          const isEditing = editingBeat === slot.beat;
          const isPlaying = playingBeat === slot.beat;

          return (
            <div
              key={`${slot.beat}-${index}`}
              className={`relative flex cursor-pointer items-center px-0.5 py-0.5 text-sm hover:bg-[var(--bg-hover)] ${
                isEditing ? "bg-[var(--bg-active)]" : ""
              } ${isPlaying ? "text-[var(--text-accent)]" : ""}`}
              onClick={() => onNoteClick(slot.originalBeat)}
            >
              <SlotContent slot={slot} isFirstTrack={isFirstTrack} trackType={trackType} />
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
        return {
          track,
          bar: bars[barIndex],
          trackIndex,
        };
      });
    }, [tracks, barIndex]);

    if (trackBars.every(({ bar }) => !bar)) return null;

    return (
      <div
        className="relative rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
        style={{
          gridColumn: `span ${colSpan}`,
        }}
      >
        <div
          className="grid gap-1 p-2"
          style={{
            gridTemplateRows: `repeat(${tracks.length}, minmax(40px, auto))`,
          }}
        >
          {showBarNumber && (
            <div className="absolute -top-4 left-0 text-xs text-[var(--text-tertiary)]">
              {barIndex + 1}
            </div>
          )}
          {trackBars.map(({ track, bar, trackIndex }) => (
            <div key={track.id} className={`relative ${trackIndex === editingTrack ? "z-10" : ""}`}>
              {bar ? (
                <Bar
                  bar={bar}
                  editingBeat={editingTrack === trackIndex ? editingBeat : -1}
                  onNoteClick={(beat) => onNoteClick(trackIndex, beat)}
                  isFirstTrack={trackIndex === 0}
                  trackType={track.type}
                />
              ) : (
                <div className="min-w-[100px] p-1 opacity-50">
                  <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

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
      <div className="relative grid auto-rows-fr grid-cols-4 gap-4">
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
