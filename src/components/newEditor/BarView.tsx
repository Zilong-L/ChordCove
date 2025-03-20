import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { splitNotesIntoBars, type BarNote, type Bar } from "@utils/barView";
import { setEditingBeat } from "@stores/newScore/newEditingSlice";
import { Note as TonalNote } from "tonal";
import { calculateDegree } from "@utils/theory/Note";
import { useMemo, useCallback } from "react";
import React from "react";

// Helper function to get color based on MIDI value (reused from newEditor.tsx)
function getMidiColor(midi: number, keyMidi: number): string {
  const distance = midi - keyMidi;
  const BASE_HUE = 210;  // Blue
  const BASE_SATURATION = 75;  // Vibrant but not too intense
  const MAX_DISTANCE = 12; // One octave
  const normalizedDistance = Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, distance)) / MAX_DISTANCE;
  const lightness = 50 + (normalizedDistance * 30);
  return `hsl(${BASE_HUE}, ${BASE_SATURATION}%, ${lightness}%)`;
}

// Helper function to format degree with octave indicator (reused from newEditor.tsx)
function formatDegree(note: string, keyNote: string): string {
  const degree = calculateDegree(keyNote, note, "number");
  if (!degree) return note;

  const noteMidi = TonalNote.get(note).midi;
  const keyMidi = TonalNote.get(keyNote + "4").midi;
  if (noteMidi === null || keyMidi === null) return degree;

  const octaveDiff = Math.floor((noteMidi - keyMidi) / 12);
  if (octaveDiff === 0) return degree;
  return octaveDiff > 0 ? degree + "•".repeat(octaveDiff) : degree + "₋".repeat(-octaveDiff);
}

// Note component to reduce re-renders
const Note = React.memo(({ 
  note, 
  keyNote, 
  isSelected, 
  onClick 
}: { 
  note: BarNote; 
  keyNote: string; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  const noteMidi = TonalNote.get(note.content).midi;
  const keyMidi = TonalNote.get(keyNote + "4").midi;
  const bgColor = noteMidi && keyMidi ? getMidiColor(noteMidi, keyMidi) : undefined;

  return (
    <div 
      className={`cursor-pointer p-2 rounded ${
        isSelected ? 'ring-2 ring-white' : 'hover:ring-1 ring-white/50'
      } ${note.sustain ? 'opacity-75' : ''}`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      <span className="mr-1 font-bold">
        {formatDegree(note.content, keyNote)}
      </span>
      <span className="text-xs text-gray-200/70">
        {note.duration}
        {note.sustain && '→'}
      </span>
    </div>
  );
});

// Bar component to reduce re-renders
const Bar = React.memo(({ 
  bar, 
  keyNote, 
  editingBeat,
  onNoteClick,
  barNumber
}: { 
  bar: Bar; 
  keyNote: string;
  editingBeat: number;
  onNoteClick: (beat: number) => void;
  barNumber: number;
}) => (
  <div className="flex-1 min-w-[200px] p-2 bg-[#1a1a1a] rounded border border-gray-800">
    <div className="text-xs text-gray-500 mb-1">Bar {barNumber}</div>
    <div className="flex flex-wrap gap-1">
      {bar.notes.map((note: BarNote, noteIndex: number) => (
        <Note
          key={`${bar.startBeat}-${noteIndex}`}
          note={note}
          keyNote={keyNote}
          isSelected={editingBeat === note.originalBeat}
          onClick={() => onNoteClick(note.originalBeat)}
        />
      ))}
    </div>
  </div>
));

export default function BarView() {
  const dispatch = useDispatch();
  const { editingBeat } = useSelector((state: RootState) => state.newEditing);
  const score = useSelector((state: RootState) => state.newScore);
  const currentTrack = score.tracks[0]; // For now, just show the first track

  // Memoize the bar view calculation
  const rows = useMemo(() => 
    splitNotesIntoBars(currentTrack.notes),
    [currentTrack.notes]
  );

  const handleNoteClick = useCallback((beat: number) => {
    dispatch(setEditingBeat(beat));
  }, [dispatch]);

  return (
    <div className="w-full space-y-4">
      {rows.map((row) => (
        <div key={row.rowNumber} className="flex gap-2">
          {row.bars.map((bar) => (
            <Bar
              key={bar.barNumber}
              bar={bar}
              keyNote={score.key}
              editingBeat={editingBeat}
              onNoteClick={handleNoteClick}
              barNumber={bar.barNumber}
            />
          ))}
        </div>
      ))}
    </div>
  );
} 