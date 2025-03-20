import type { Note } from "@stores/newScore/newScoreSlice";

export interface BarNote extends Note {
  originalBeat: number;  // Reference to the original note's beat
  sustain: boolean;     // Whether this note is a continuation
}

export interface Bar {
  notes: BarNote[];
  startBeat: number;
  barNumber: number;
}

export function splitNotesIntoBars(notes: Note[], beatsPerBar: number = 4): Bar[] {
  if (notes.length === 0) {
    // Return a single empty bar if there are no notes
    return [{
      notes: [],
      startBeat: 0,
      barNumber: 1
    }];
  }

  // Sort notes by beat and find the last beat to determine total bars needed
  const sortedNotes = [...notes].sort((a, b) => a.beat - b.beat);
  const lastNote = sortedNotes[sortedNotes.length - 1];
  const lastBeat = lastNote.beat + lastNote.duration;
  const totalBars = Math.ceil(lastBeat / beatsPerBar);

  // Pre-create all bars
  const bars: Bar[] = Array.from({ length: totalBars }, (_, barIndex) => ({
    notes: [],
    startBeat: barIndex * beatsPerBar,
    barNumber: barIndex + 1
  }));

  // Distribute notes into bars
  for (const note of sortedNotes) {
    let remainingDuration = note.duration;
    let currentBeat = note.beat;
    let isFirst = true;

    while (remainingDuration > 0) {
      const currentBarIndex = Math.floor(currentBeat / beatsPerBar);
      
      // Calculate how much of the note fits in the current bar
      const currentBarEndBeat = (currentBarIndex + 1) * beatsPerBar;
      const durationInCurrentBar = Math.min(
        remainingDuration,
        currentBarEndBeat - currentBeat
      );

      // Create the note segment
      const barNote: BarNote = {
        beat: currentBeat,
        duration: durationInCurrentBar,
        content: note.content,
        originalBeat: note.beat,
        sustain: !isFirst
      };

      // Add note to the appropriate bar
      if (bars[currentBarIndex]) {
        bars[currentBarIndex].notes.push(barNote);
      }

      // Update for next iteration
      remainingDuration -= durationInCurrentBar;
      currentBeat += durationInCurrentBar;
      isFirst = false;
    }
  }

  // Sort notes within each bar by beat
  bars.forEach(bar => {
    bar.notes.sort((a, b) => a.beat - b.beat);
  });

  return bars;
}

// Basic durations in descending order for greedy algorithm
const basicDuration = [1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125];

function breakDownToBasicDurations(note: BarNote, startBeat: number, duration: number, isFirst: boolean): BarNote[] {
  const result: BarNote[] = [];
  let remainingDuration = duration;
  let currentBeat = startBeat;
  let isFirstNote = isFirst;

  while (remainingDuration > 0) {
    // Find the largest basic duration that fits
    const fitDuration = basicDuration.find(d => d <= remainingDuration) || basicDuration[basicDuration.length - 1];
    
    result.push({
      ...note,
      beat: currentBeat,
      duration: fitDuration,
      sustain: note.sustain || !isFirstNote
    });

    remainingDuration = Number((remainingDuration - fitDuration).toFixed(4)); // Handle floating point precision
    currentBeat += fitDuration;
    isFirstNote = false;
  }

  return result;
}

export function breakDownNotesWithinBar(notes: BarNote[]): BarNote[] {
  const result: BarNote[] = [];
  
  // Process each note
  notes.forEach(note => {
    let remainingDuration = note.duration;
    let currentBeat = note.beat;
    let isFirst = true;

    // Step 1: Break down notes with duration >= 2 by continuously subtracting 1
    while (remainingDuration >= 2) {
      result.push({
        ...note,
        beat: currentBeat,
        duration: 1,
        sustain: note.sustain || !isFirst
      });
      remainingDuration = Number((remainingDuration - 1).toFixed(4));
      currentBeat += 1;
      isFirst = false;
    }

    // Step 2: Break down remaining duration into basic durations
    if (remainingDuration > 0) {
      result.push(...breakDownToBasicDurations(note, currentBeat, remainingDuration, isFirst));
    }
  });

  return result.sort((a, b) => a.beat - b.beat);
}

// TODO: Step 2 - Implement greedy function to handle durations < 2

export interface NoteDisplay {
  content: string;        // The note content (e.g., "1", "2", "3")
  hasDot: boolean;       // Whether the note has a dot
  underlineCount: number; // Number of underlines (0-3)
  sustain: boolean;      // Whether it's a sustained note ("-")
}

export interface BarNoteWithDisplay extends BarNote {
  display: NoteDisplay;
}

function getNoteDisplay(note: BarNote): NoteDisplay {
  if (note.sustain) {
    return {
      content: '-',
      hasDot: false,
      underlineCount: 0,
      sustain: true
    };
  }

  // Determine underlines and dots based on duration
  let underlineCount = 0;
  let hasDot = false;

  // Dotted durations
  if (note.duration === 1.5) {
    hasDot = true;
    underlineCount = 0;
  } else if (note.duration === 0.75) {
    hasDot = true;
    underlineCount = 1;
  } else if (note.duration === 0.375) {
    hasDot = true;
    underlineCount = 2;
  } else if (note.duration === 0.1875) {
    hasDot = true;
    underlineCount = 3;
  }
  // Plain durations
  else if (note.duration === 1) {
    underlineCount = 0;
  } else if (note.duration === 0.5) {
    underlineCount = 1;
  } else if (note.duration === 0.25) {
    underlineCount = 2;
  } else if (note.duration === 0.125) {
    underlineCount = 3;
  }

  return {
    content: note.content,
    hasDot,
    underlineCount,
    sustain: false
  };
}

export function processNotesWithDisplay(notes: BarNote[]): BarNoteWithDisplay[] {
  // First break down the notes into basic durations
  const brokenDownNotes = breakDownNotesWithinBar(notes);
  
  // Then add display information
  return brokenDownNotes.map(note => ({
    ...note,
    display: getNoteDisplay(note)
  }));
}

