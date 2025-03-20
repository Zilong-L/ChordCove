import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { splitNotesIntoBars, type BarNote, type Bar, breakDownNotesWithinBar } from "@utils/barView";
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
const NoteDisplay = React.memo(({ 
  content, 
  underlineCount, 
  hasDot, 
  isLastInGroup 
}: { 
  content: string;
  underlineCount: number;
  hasDot: boolean;
  isLastInGroup: boolean;
}) => {
  return (
    <div className="relative w-full text-center">
      {/* Note content and dot */}
      <div className="relative inline-block">
        <span className="font-bold">{content}</span>
        {hasDot && <span className="absolute -right-2 top-0">.</span>}
      </div>
      
      {/* Underlines container - absolutely positioned */}
      {underlineCount > 0 && (
        <div className="absolute left-0 right-0" style={{ 
          top: '100%',
          width: isLastInGroup ? '100%' : 'calc(100% + 4px)',
          height: `${underlineCount * 3}px`,
          pointerEvents: 'none'
        }}>
          {Array.from({ length: underlineCount }).map((_, i) => (
            <div 
              key={i}
              className="absolute w-full bg-white"
              style={{
                height: '1px',
                top: `${i * 3}px`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Note component to reduce re-renders
const Note = React.memo(({ 
  notesInBar,
  note, 
  keyNote, 
  isSelected, 
  onClick,
  showColors,
  isLastInGroup 
}: { 
  notesInBar: number;
  note: BarNote; 
  keyNote: string; 
  isSelected: boolean;
  onClick: () => void;
  showColors: boolean;
  isLastInGroup: boolean;
}) => {
  const noteMidi = TonalNote.get(note.content).midi;
  const keyMidi = TonalNote.get(keyNote).midi;
  const bgColor = showColors && noteMidi && keyMidi ? getMidiColor(noteMidi, keyMidi) : undefined;
  const underlineCount = getUnderlineCount(note.duration);
  const hasDot = isDotted(note.duration);

  // Calculate width as a percentage of the bar
  const widthPercentage = (1/notesInBar) * 100;
  
  // Calculate the display content
  const displayContent = note.content === '0' ? '0' : 
                        note.sustain ? '-' : 
                        (calculateDegree(keyNote, note.content, "number") ?? note.content).toString();
  
  return (
    <div 
      className={`cursor-pointer relative flex items-center justify-center ${
        isSelected ? "bg-slate-600" : ""
      } ${note.sustain ? 'opacity-75' : ''}`}
      style={{ 
        backgroundColor: bgColor,
        width: `${widthPercentage}%`,
      }}
      onClick={onClick}
    >
      <NoteDisplay
        content={displayContent}
        underlineCount={underlineCount}
        hasDot={hasDot}
        isLastInGroup={isLastInGroup}
      />
    </div>
  );
});

// Bar component to reduce re-renders
const Bar = React.memo(({ 
  bar, 
  keyNote, 
  editingBeat,
  onNoteClick,
  barNumber,
  showColors
}: { 
  bar: Bar; 
  keyNote: string;
  editingBeat: number;
  onNoteClick: (beat: number) => void;
  barNumber: number;
  showColors: boolean;
}) => {
  // Break down notes into basic units
  const brokenDownNotes = useMemo(() => 
    breakDownNotesWithinBar(bar.notes),
    [bar.notes]
  );

  return (
    <div 
      className={`min-w-[200px] p-2 bg-[#1a1a1a] overflow-y-scroll rounded border border-gray-800 ${
        brokenDownNotes.length > 16 ? "col-span-2" : ""
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">Bar {barNumber}</div>
      <div className="flex items-end ">
        {brokenDownNotes.map((note: BarNote, noteIndex: number) => {
          // Check if next note has same underline count to determine if this is last in group
          const nextNote = brokenDownNotes[noteIndex + 1];
          const currentUnderlines = getUnderlineCount(note.duration);
          const nextUnderlines = nextNote ? getUnderlineCount(nextNote.duration) : -1;
          const isLastInGroup = currentUnderlines !== nextUnderlines;

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
            />
          );
        })}
      </div>
    </div>
  );
});

export default function BarView() {
  const dispatch = useDispatch();
  const { editingBeat, showColors } = useSelector((state: RootState) => state.newEditing);
  const score = useSelector((state: RootState) => state.newScore);
  const currentTrack = score.tracks[0]; // For now, just show the first track

  // Memoize the bars calculation
  const bars = useMemo(() => 
    splitNotesIntoBars(currentTrack.notes),
    [currentTrack.notes]
  );

  const handleNoteClick = useCallback((beat: number) => {
    dispatch(setEditingBeat(beat));
  }, [dispatch]);

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
          />
        ))}
      </div>
    </div>
  );
} 