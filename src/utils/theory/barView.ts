import type { Slot, MelodySlot, AccompanimentSlot } from "@stores/scoreSlice";

// Create a union type for SlotView that includes originalBeat and sustain
interface SlotViewBase {
  originalBeat: number;
  originalDuration: number;
  sustain?: boolean;
  spanUnits?: number;
  lyricSpanUnits?: number;
}
export type MelodySlotView = MelodySlot & SlotViewBase;
export type AccompanimentSlotView = AccompanimentSlot & SlotViewBase;
export type SlotView = MelodySlotView | AccompanimentSlotView;

export interface BarView {
  startBeat: number;
  notes: SlotView[];
  barNumber: number;
}

export function splitNotesIntoBars(notes: Slot[], beatsPerBar: number = 4): BarView[] {
  if (notes.length === 0) {
    // Return a single empty bar if there are no notes
    return [
      {
        notes: [],
        startBeat: 0,
        barNumber: 1,
      },
    ];
  }

  // Sort notes by beat and find the last beat to determine total bars needed
  const sortedNotes = [...notes].sort((a, b) => a.beat - b.beat);
  const lastNote = sortedNotes[sortedNotes.length - 1];
  const lastBeat = lastNote.beat + lastNote.duration;
  const totalBars = Math.ceil(lastBeat / beatsPerBar);

  // Pre-create all bars
  const bars: BarView[] = Array.from({ length: totalBars }, (_, barIndex) => ({
    notes: [],
    startBeat: barIndex * beatsPerBar,
    barNumber: barIndex + 1,
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
      const durationInCurrentBar = Math.min(remainingDuration, currentBarEndBeat - currentBeat);

      // Create the note segment based on its type
      let slotView: SlotView;
      if ("note" in note) {
        slotView = {
          ...note,
          beat: currentBeat,
          duration: durationInCurrentBar,
          originalBeat: note.beat,
          originalDuration: durationInCurrentBar,
          sustain: !isFirst,
        } as MelodySlotView;
      } else if ("notes" in note) {
        slotView = {
          ...note,
          beat: currentBeat,
          duration: durationInCurrentBar,
          originalBeat: note.beat,
          originalDuration: durationInCurrentBar,
          sustain: !isFirst,
        } as AccompanimentSlotView;
      } else {
        // Handle chord type or any other types by mapping to a Notes-like view
        const chordLike = note as unknown as { beat: number; lyrics?: string };
        slotView = {
          beat: currentBeat,
          duration: durationInCurrentBar,
          originalBeat: chordLike.beat,
          originalDuration: durationInCurrentBar,
          sustain: !isFirst,
          notes: [],
          lyrics: chordLike.lyrics ?? "",
        } as AccompanimentSlotView;
      }

      // Add note to the appropriate bar
      if (bars[currentBarIndex]) {
        bars[currentBarIndex].notes.push(slotView);
      }

      // Update for next iteration
      remainingDuration -= durationInCurrentBar;
      currentBeat += durationInCurrentBar;
      isFirst = false;
    }
  }

  // Sort notes within each bar by beat
  bars.forEach((bar) => {
    bar.notes.sort((a, b) => a.beat - b.beat);
  });

  return bars;
}

// Basic durations in descending order for greedy algorithm
const basicDurations = [1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125];

function breakDownToBasicDurations(
  note: SlotView,
  startBeat: number,
  duration: number,
  isFirst: boolean
): SlotView[] {
  const result: SlotView[] = [];
  let remainingDuration = duration;
  let currentBeat = startBeat;
  let isFirstNote = isFirst;

  while (remainingDuration > 0) {
    // Find the largest basic duration that fits
    const fitDuration =
      basicDurations.find((d) => d <= remainingDuration) ||
      basicDurations[basicDurations.length - 1];

    result.push({
      ...note,
      beat: currentBeat,
      duration: fitDuration,
      sustain: !isFirstNote,
      originalBeat: note.originalBeat || note.beat,
      originalDuration: note.originalDuration ?? note.duration,
    });

    remainingDuration = Number((remainingDuration - fitDuration).toFixed(4)); // Handle floating point precision
    currentBeat += fitDuration;
    isFirstNote = false;
  }

  return result;
}

export function breakDownNotesWithinBar(notes: SlotView[]): SlotView[] {
  const result: SlotView[] = [];

  // Process each note
  notes.forEach((note) => {
    let remainingDuration = note.duration;
    let currentBeat = note.beat;
    let isFirst = true;

    // Step 1: Break down notes with duration >= 2 by continuously subtracting 1
    while (remainingDuration >= 2) {
      result.push({
        ...note,
        beat: currentBeat,
        duration: 1,
        sustain: !isFirst,
        originalBeat: note.originalBeat || note.beat,
        originalDuration: note.originalDuration ?? note.duration,
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
