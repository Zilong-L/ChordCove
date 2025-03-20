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

export interface BarRow {
  bars: Bar[];
  rowNumber: number;
}

export function splitNotesIntoBars(notes: Note[], beatsPerBar: number = 4, barsPerRow: number = 4): BarRow[] {
  if (notes.length === 0) {
    // Return a single empty row with empty bars if there are no notes
    return [{
      rowNumber: 0,
      bars: Array.from({ length: barsPerRow }, (_, i) => ({
        notes: [],
        startBeat: i * beatsPerBar,
        barNumber: i + 1
      }))
    }];
  }

  // Sort notes by beat and find the last beat to determine total bars needed
  const sortedNotes = [...notes].sort((a, b) => a.beat - b.beat);
  const lastNote = sortedNotes[sortedNotes.length - 1];
  const lastBeat = lastNote.beat + lastNote.duration;
  const totalBars = Math.ceil(lastBeat / beatsPerBar);
  const totalRows = Math.ceil(totalBars / barsPerRow);

  // Pre-create all rows and bars
  const rows: BarRow[] = Array.from({ length: totalRows }, (_, rowIndex) => ({
    rowNumber: rowIndex,
    bars: Array.from({ length: Math.min(barsPerRow, totalBars - rowIndex * barsPerRow) }, (_, barIndex) => ({
      notes: [],
      startBeat: (rowIndex * barsPerRow + barIndex) * beatsPerBar,
      barNumber: rowIndex * barsPerRow + barIndex + 1
    }))
  }));

  // Distribute notes into bars
  for (const note of sortedNotes) {
    let remainingDuration = note.duration;
    let currentBeat = note.beat;
    let isFirst = true;

    while (remainingDuration > 0) {
      const currentBarIndex = Math.floor(currentBeat / beatsPerBar);
      const rowIndex = Math.floor(currentBarIndex / barsPerRow);
      const barInRowIndex = currentBarIndex % barsPerRow;
      
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
      if (rows[rowIndex] && rows[rowIndex].bars[barInRowIndex]) {
        rows[rowIndex].bars[barInRowIndex].notes.push(barNote);
      }

      // Update for next iteration
      remainingDuration -= durationInCurrentBar;
      currentBeat += durationInCurrentBar;
      isFirst = false;
    }
  }

  // Sort notes within each bar by beat
  rows.forEach(row => {
    row.bars.forEach(bar => {
      bar.notes.sort((a, b) => a.beat - b.beat);
    });
  });

  return rows;
}