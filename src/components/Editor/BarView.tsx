import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import {
  splitNotesIntoBars,
  type BarNote,
  type Bar,
  breakDownNotesWithinBar,
} from "@utils/theory/barView";
import { setEditingBeat } from "@stores/newScore/newEditingSlice";
import { Note as TonalNote } from "tonal";
import { calculateDegree } from "@utils/theory/Note";
import { useMemo, useCallback } from "react";
import React from "react";
import type { Score, Slot } from "@stores/newScore/newScoreSlice";

// Helper function to get color based on MIDI value (reused from newEditor.tsx)
function getMidiColor(midi: number, keyMidi: number): string {
  const distance = midi - keyMidi;
  const BASE_HUE = 210; // Blue
  const BASE_SATURATION = 75; // Vibrant but not too intense
  const MAX_DISTANCE = 12; // One octave
  const normalizedDistance =
    Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, distance)) / MAX_DISTANCE;
  const lightness = 50 + normalizedDistance * 30;
  return `hsl(${BASE_HUE}, ${BASE_SATURATION}%, ${lightness}%)`;
}

// Helper function to get underline count based on duration
function getUnderlineCount(duration: number): number {
  if (duration === 1 || duration === 1.5) return 0;
  if (duration === 0.5 || duration === 0.75) return 1;
  if (duration === 0.25 || duration === 0.375) return 2;
  if (duration === 0.125 || duration === 0.1875) return 3;
  return 0;
}

// Helper function to check if duration is dotted
function isDotted(duration: number): boolean {
  return [1.5, 0.75, 0.375, 0.1875].includes(duration);
}

// Custom NoteDisplay component for handling note content and underlines
const NoteDisplay = React.memo(
  ({
    content,
    underlineCount,
    hasDot,
    isLastInGroup,
  }: {
    content: string[];
    underlineCount: number;
    hasDot: boolean;
    isLastInGroup: boolean;
  }) => {
    return (
      <div className="relative w-full text-center">
        {/* Note content and dot */}
        <div className="relative inline-block">
          <div className="flex flex-col items-center">
            {content.map((note, index) => (
              <span key={index} className="font-bold">
                {note}
              </span>
            ))}
          </div>
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
    );
  }
);

// Note component to reduce re-renders
const Note = React.memo(
  ({
    notesInBar,
    note,
    keyNote,
    isSelected,
    onClick,
    showColors,
    isLastInGroup,
    lyrics,
  }: {
    notesInBar: number;
    note: BarNote;
    keyNote: string;
    isSelected: boolean;
    onClick: () => void;
    showColors: boolean;
    isLastInGroup: boolean;
    lyrics?: string;
  }) => {
    // Get the highest note's MIDI value for coloring
    const noteMidi = note.content.length > 0 ? TonalNote.get(note.content[0]).midi : null;
    const keyMidi = TonalNote.get(keyNote).midi;
    const bgColor = showColors && noteMidi && keyMidi ? getMidiColor(noteMidi, keyMidi) : undefined;
    const underlineCount = getUnderlineCount(note.duration);
    const hasDot = isDotted(note.duration);

    // Calculate width as a percentage of the bar
    const widthPercentage = (1 / notesInBar) * 100;

    // Calculate the display content
    const displayContent =
      note.content.length === 0 || (note.content.length === 1 && note.content[0] === "0")
        ? ["0"]
        : note.sustain
          ? ["-"]
          : note.content.map((noteContent: string) =>
              (calculateDegree(keyNote, noteContent, "number") ?? noteContent).toString()
            );

    return (
      <div
        className={`relative flex cursor-pointer flex-col items-center ${
          isSelected ? "bg-slate-600" : ""
        } ${note.sustain ? "opacity-75" : ""}`}
        style={{
          backgroundColor: bgColor,
          width: `${widthPercentage}%`,
        }}
        onClick={onClick}
      >
        {/* Chord section */}
        <div className="flex items-center justify-center py-1">
          <div className="invisible max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-300">
            ♪
          </div>
        </div>

        {/* Notes section */}
        <div className="flex items-center justify-center py-1">
          <NoteDisplay
            content={displayContent}
            underlineCount={underlineCount}
            hasDot={hasDot}
            isLastInGroup={isLastInGroup}
          />
        </div>

        {/* Lyrics section */}
        <div className="flex items-center justify-center py-1">
          <div
            className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs ${lyrics ? "text-gray-300" : "text-transparent"}`}
          >
            {lyrics || "♪"} {/* Use musical note as placeholder */}
          </div>
        </div>
      </div>
    );
  }
);

// Bar component to reduce re-renders
const Bar = React.memo(
  ({
    bar,
    keyNote,
    editingBeat,
    onNoteClick,
    barNumber,
    showColors,
    slots,
  }: {
    bar: Bar;
    keyNote: string;
    editingBeat: number;
    onNoteClick: (beat: number) => void;
    barNumber: number;
    showColors: boolean;
    slots: Slot[];
  }) => {
    // Break down notes into basic units
    const brokenDownNotes = useMemo(() => breakDownNotesWithinBar(bar.notes), [bar.notes]);

    return (
      <div
        className={`min-w-[200px] overflow-hidden rounded border border-gray-800 bg-[#1a1a1a] p-2 ${
          brokenDownNotes.length > 16 ? "col-span-2" : ""
        }`}
      >
        <div className="mb-1 text-xs text-gray-500">Bar {barNumber}</div>
        <div className="flex">
          {brokenDownNotes.map((note: BarNote, noteIndex: number) => {
            // Check if next note has same underline count to determine if this is last in group
            const nextNote = brokenDownNotes[noteIndex + 1];
            const currentUnderlines = getUnderlineCount(note.duration);
            const nextUnderlines = nextNote ? getUnderlineCount(nextNote.duration) : -1;
            const isLastInGroup = currentUnderlines !== nextUnderlines;

            // Find the corresponding slot for lyrics
            const slot = slots.find((s) => s.beat === note.originalBeat);

            return (
              <Note
                notesInBar={bar.notes.length}
                key={`${bar.startBeat}-${noteIndex}`}
                note={note}
                keyNote={keyNote}
                isSelected={editingBeat === note.originalBeat}
                onClick={() => onNoteClick(note.originalBeat)}
                showColors={showColors}
                isLastInGroup={isLastInGroup}
                lyrics={slot?.lyrics}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

export default function BarView() {
  const dispatch = useDispatch();
  const { editingBeat, showColors } = useSelector((state: RootState) => state.newEditing);
  const score = useSelector((state: RootState) => state.newScore as Score);
  const currentTrack = score.track;

  // Convert slots to note format for compatibility
  const convertedNotes = useMemo(
    () =>
      currentTrack.slots.map((slot: Slot) => ({
        beat: slot.beat,
        duration: slot.duration,
        content: slot.notes,
      })),
    [currentTrack.slots]
  );

  // Memoize the bars calculation
  const bars = useMemo(() => splitNotesIntoBars(convertedNotes), [convertedNotes]);

  const handleNoteClick = useCallback(
    (beat: number) => {
      dispatch(setEditingBeat(beat));
    },
    [dispatch]
  );

  return (
    <div className="w-full p-4">
      <div className="grid grid-cols-4 gap-2">
        {bars.map((bar) => (
          <Bar
            key={bar.barNumber}
            bar={bar}
            keyNote={score.key}
            editingBeat={editingBeat}
            onNoteClick={handleNoteClick}
            barNumber={bar.barNumber}
            showColors={showColors}
            slots={currentTrack.slots}
          />
        ))}
      </div>
    </div>
  );
}
