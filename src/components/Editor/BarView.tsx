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
import type { Score, Track } from "@stores/scoreSlice";
import { MelodySlotComponent, ChordSlotComponent, LyricsSlotComponent } from "./SlotComponents";

// Helper function to render slot content
function renderSlotContent(slot: SlotView) {
  switch (slot.type) {
    case "melody":
      return <MelodySlotComponent slot={slot} />;
    case "chord":
      return <ChordSlotComponent slot={slot} />;
    case "lyrics":
      return <LyricsSlotComponent slot={slot} />;
  }
}

// Note component to reduce re-renders
const Note = React.memo(
  ({
    notesInBar,
    note,
    isSelected,
    onClick,
    isLastInGroup,
  }: {
    notesInBar: number;
    note: SlotView;
    isSelected: boolean;
    onClick: () => void;
    isLastInGroup: boolean;
  }) => {
    // Calculate width as a percentage of the bar
    const widthPercentage = (1 / notesInBar) * 100;

    // Get display content using the slot's toComponent method
    const displayContent = useMemo(() => renderSlotContent(note), [note]);
    const underlineCount = getUnderlineCount(note.duration);
    const hasDot = isDotted(note.duration);

    return (
      <div
        className={`relative flex cursor-pointer flex-col items-center ${
          isSelected ? "bg-slate-600" : ""
        } ${note.sustain ? "opacity-75" : ""}`}
        style={{
          width: `${widthPercentage}%`,
        }}
        onClick={onClick}
      >
        <div className="relative w-full text-center">
          {/* Note content and dot */}
          <div className="relative inline-block">
            <div className="flex flex-col items-center">{displayContent}</div>
            {hasDot && <span className="absolute -right-2 top-1/2 -translate-y-1/2">.</span>}
          </div>

          {/* Underlines container - absolutely positioned */}
          {underlineCount > 0 && (
            <div
              className="absolute left-0 right-0"
              style={{
                top: "100%",
                width: isLastInGroup ? "100%" : "calc(100% + 4px)",
                height: `${underlineCount * 3}px`,
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: underlineCount }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full bg-white"
                  style={{
                    height: "1px",
                    top: `${i * 3}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Bar component to handle individual bars
const Bar = React.memo(
  ({
    bar,
    editingBeat,
    onNoteClick,
  }: {
    bar: BarView;
    editingBeat: number;
    onNoteClick: (beat: number) => void;
  }) => {
    const slots = useMemo(() => breakDownNotesWithinBar(bar.notes), [bar.notes]);

    return (
      <div
        className={`grid auto-cols-fr grid-flow-col ${slots.length > 16 ? "min-w-[200px]" : "min-w-[100px]"}`}
      >
        {slots.map((slot, index) => (
          <div
            key={`${slot.beat}-${index}`}
            className={`flex cursor-pointer items-center justify-center px-0.5 py-0.5 text-sm hover:bg-gray-800 ${editingBeat === slot.beat ? "bg-blue-900" : ""}`}
            onClick={() => onNoteClick(slot.beat)}
          >
            {renderSlotContent(slot)}
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
        className="relative rounded border border-gray-800 bg-[#1a1a1a]"
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
            <div className="absolute -top-5 left-0 text-xs text-gray-500">Bar {barIndex + 1}</div>
          )}
          {trackBars.map(({ track, bar, trackIndex }) => (
            <div key={track.id} className={`relative ${trackIndex === editingTrack ? "z-10" : ""}`}>
              {bar ? (
                <Bar
                  bar={bar}
                  editingBeat={editingTrack === trackIndex ? editingBeat : -1}
                  onNoteClick={(beat) => onNoteClick(trackIndex, beat)}
                />
              ) : (
                <div className="min-w-[100px] p-1 opacity-50">
                  <div className="flex h-full items-center justify-center text-xs text-gray-500">
                    Empty
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
    <div className="w-full overflow-x-auto p-4">
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
