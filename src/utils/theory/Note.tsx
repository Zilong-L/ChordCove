import { Note } from "tonal";

const RomanDegrees = ["I", "bII", "II", "bIII", "III", "IV", "bV", "V", "bVI", "VI", "bVII", "VII"];
const numberDegrees = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
function calculateDegree(key: string | null, note: string | null, mode: string) {
  if (key === null || note === null) return;
  const keyMidi = Note.get(key).midi;
  const noteMidi = Note.get(note).midi;

  if (keyMidi === null || noteMidi === null) {
    return;
  }
  const distance = (((noteMidi! - keyMidi!) % 12) + 12) % 12;
  if (mode === "number") return numberDegrees[distance];
  return RomanDegrees[distance];
}
const NoteInKey = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
function getNoteInKey(key: string) {
  const index = NoteInKey.indexOf(key);
  if (index === -1) return NoteInKey; // Fallback if key not found

  return [...NoteInKey.slice(index), ...NoteInKey.slice(0, index)];
}
function findCloestNote(lastInput: string, note: string) {
  const noteOctaves = ["0", "1", "2", "3", "4", "5", "6", "7", "8"].map((octave) => note + octave);
  let lastInputMidi = Note.get(lastInput).midi;
  if (lastInputMidi === null) {
    lastInputMidi = 60;
  }
  let cloestNote = null;
  let cloestDistance = Infinity;
  for (const note of noteOctaves) {
    const noteMidi = Note.get(note).midi;
    if (noteMidi === null) continue;
    if (Math.abs(noteMidi - lastInputMidi) < cloestDistance) {
      cloestDistance = Math.abs(noteMidi - lastInputMidi);
      cloestNote = note;
    }
  }
  return cloestNote;
}
const keyMap: Record<string, number> = {
  "1": 0,
  "2": 2,
  "3": 4,
  "4": 5,
  "5": 7,
  "6": 9,
  "7": 11,
  "ctrl+alt+1": 1,
  "ctrl+alt+2": 3,
  "ctrl+alt+4": 6,
  "ctrl+alt+5": 8,
  "ctrl+alt+6": 10,
};

function shiftNote(note: string, currentKey: string, targetKey: string) {
  const currentNote = Note.get(note).midi;
  const currentKeyMidi = Note.get(currentKey).midi;
  const targetKeyMidi = Note.get(targetKey).midi;
  if (currentNote === null || currentKeyMidi === null || targetKeyMidi === null) return;
  const distance = targetKeyMidi - currentKeyMidi;
  return Note.fromMidi(currentNote + distance);
}

export { calculateDegree, getNoteInKey, findCloestNote, keyMap, shiftNote };
