import KeySelector from "../Editor/KeySelector";
import { getNoteInKey, findCloestNote, keyMap, calculateDegree } from "@utils/theory/Note";
import { useHotkeys } from "react-hotkeys-hook";
import { Note as TonalNote } from "tonal";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { setNote } from "@stores/newScore/newScoreSlice";
import type { Note, NewScore } from "@stores/newScore/newScoreSlice";
import { 
  setSelectedDuration, 
  toggleDotted, 
  setLastInputNote, 
  setEditingBeat,
  setEditingTrack
} from "@stores/newScore/newEditingSlice";
import type { EditingSlotState } from "@stores/newScore/newEditingSlice";
import EditorControlPanel, { durationValues, type NoteDuration } from "./EditorControlPanel";
import BarView from "./BarView";

// note icons

// Helper function to get color based on MIDI value
function getMidiColor(midi: number, keyMidi: number): string {
  const distance = midi - keyMidi;
  const BASE_HUE = 210;  // Blue
  const BASE_SATURATION = 75;  // Vibrant but not too intense
  const MAX_DISTANCE = 12; // One octave
  const normalizedDistance = Math.max(-MAX_DISTANCE, Math.min(MAX_DISTANCE, distance)) / MAX_DISTANCE;
  const lightness = 50 + (normalizedDistance * 30);
  return `hsl(${BASE_HUE}, ${BASE_SATURATION}%, ${lightness}%)`;
}

// Helper function to format degree with octave indicator
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

export default function SimpleEditor() {
  const dispatch = useDispatch();
  
  // Get states from Redux
  const {
    editingTrack,
    editingBeat,
    selectedDuration,
    isDotted,
    lastInputNote
  } = useSelector((state: RootState) => state.newEditing as EditingSlotState);

  const score = useSelector((state: RootState) => state.newScore as NewScore);
  const currentTrack = score.tracks[editingTrack];

  // Calculate current beat position
  const currentBeat = editingBeat;

  // Handle note input via keyboard with accidentals
  useHotkeys(Object.entries(keyMap).join(","), (event, handler) => {
    event.preventDefault();
    let pressedKey = handler.keys![0];
    if (handler.ctrl && handler.alt) {
      pressedKey = "ctrl+alt+" + pressedKey;
    }
    const degreeIndex = keyMap[pressedKey];
    if (degreeIndex === undefined) return;
    const rotatedScale = getNoteInKey(score.key);
    const targetNoteLetter = rotatedScale[degreeIndex];
    
    if (!targetNoteLetter) return;

    const finalNote = findCloestNote(lastInputNote, targetNoteLetter);
    if (!finalNote) return;

    // Calculate actual duration in beats
    const baseDuration = durationValues[selectedDuration as NoteDuration];
    const duration = isDotted ? baseDuration * 1.5 : baseDuration;
    
    // Add new note using Redux actions
    dispatch(setNote({
      trackIndex: editingTrack,
      note: {
        beat: currentBeat,
        duration,
        content: finalNote
      }
    }));

    dispatch(setLastInputNote(finalNote));
    dispatch(setEditingBeat(currentBeat+duration));
  });

  // Add keyboard shortcuts for durations
  useHotkeys('q,w,e,r,t,y', (event, handler) => {
    event.preventDefault();
    const durationMap: Record<string, NoteDuration> = {
      'q': 1,  // whole note
      'w': 2,  // half note
      'e': 4,  // quarter note
      'r': 8,  // eighth note
      't': 16, // sixteenth note
      'y': 32  // thirty-second note
    };
    const pressedKey = handler.keys![0];
    dispatch(setSelectedDuration(durationMap[pressedKey]));
  });

  // Add keyboard shortcut for dotted notes
  useHotkeys('d', () => {
    dispatch(toggleDotted());
  });

  // Add keyboard shortcuts for navigation
  useHotkeys('left', (event) => {
    event.preventDefault();
    const currentIndex = currentTrack.notes.findIndex(note => note.beat === editingBeat);
    const previousIndex = currentIndex - 1;
    if (previousIndex >= 0) {
      dispatch(setEditingBeat(currentTrack.notes[previousIndex].beat));
    }
  });

  useHotkeys('right', (event) => {
    event.preventDefault();
    const currentIndex = currentTrack.notes.findIndex(note => note.beat === editingBeat);
    const nextIndex = currentIndex + 1;
    if (nextIndex < currentTrack.notes.length) {
      dispatch(setEditingBeat(currentTrack.notes[nextIndex].beat));
    }
  });

  useHotkeys('up', (event) => {
    event.preventDefault();
    if (editingTrack > 0) {
      dispatch(setEditingTrack(editingTrack - 1));
    }
  });

  useHotkeys('down', (event) => {
    event.preventDefault();
    if (editingTrack < score.tracks.length - 1) {
      dispatch(setEditingTrack(editingTrack + 1));
    }
  });

  // Add keyboard shortcut for deleting notes
  useHotkeys('backspace,delete', (event) => {
    event.preventDefault();
    dispatch(setNote({
      trackIndex: editingTrack,
      note: {
        beat: editingBeat,
        duration: 0,
        content: ''
      }
    }));
  });

  return (
    <div className="relative flex flex-col gap-6 text-gray-200">
      {/* Control Panel */}
      <EditorControlPanel />

      {/* Score Display */}
      <div className="w-full rounded-md bg-gradient-to-b from-[#212121] to-[#121212] p-8">
        {/* Header Info */}
        <div className="mb-6 flex items-center gap-4">
          <KeySelector />
          <div className="flex items-center gap-2">
            <span>Tempo:</span>
            <span>{score.tempo}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Current Position:</span>
            <span>Beat {currentBeat}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Current Duration:</span>
            <span>{durationValues[selectedDuration as NoteDuration]} {isDotted ? '(dotted)' : ''} beats</span>
          </div>
        </div>

        {/* Bar View */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Bar View</h3>
          <BarView />
        </div>

        {/* Linear View */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Linear View</h3>
          <div className="flex flex-wrap gap-1 p-4 bg-[#1a1a1a] rounded min-h-[100px]">
            {currentTrack.notes.map((note: Note, index: number) => {
              const noteMidi = TonalNote.get(note.content).midi;
              const keyMidi = TonalNote.get(score.key + "4").midi;
              const bgColor = noteMidi && keyMidi ? getMidiColor(noteMidi, keyMidi) : undefined;
              
              return (
                <div 
                  key={index}
                  className={`cursor-pointer p-2 rounded ${
                    editingBeat === note.beat ? 'ring-2 ring-white' : 'hover:ring-1 ring-white/50'
                  }`}
                  style={{ backgroundColor: bgColor }}
                  onClick={() => dispatch(setEditingBeat(note.beat))}
                >
                  <span className="mr-1 font-bold">
                    {formatDegree(note.content, score.key)}
                  </span>
                  <span className="text-xs text-gray-200/70">{note.duration}</span>
                </div>
              );
            })}

            {/* Current input position indicator */}
            <div 
              className={`cursor-pointer p-2 rounded border border-dashed border-gray-700 ${
                editingBeat === currentTrack.notes.length ? 'bg-[#2f2f2f30]' : ''
              }`}
            >
              <span className="text-gray-500">|</span>
            </div>
          </div>
        </div>

        {/* Key Color Legend */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span>Pitch Height:</span>
          <div className="flex gap-1">
            {[-12, -8, -4, 0, 4, 8, 12].map(offset => {
              const midi = TonalNote.get(score.key + "4").midi;
              if (!midi) return null;
              return (
                <div
                  key={offset}
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: getMidiColor(midi + offset, midi) }}
                >
                  <span className="text-white/80">{offset >= 0 ? `+${offset}` : offset}</span>
                </div>
              );
            })}
          </div>
          <span className="text-sm text-gray-400 ml-2">Lower ← Middle → Higher</span>
        </div>
      </div>
    </div>
  );
}