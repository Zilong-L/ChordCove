import React, { useMemo } from "react";
import type { AccompanimentSlotView } from "@utils/theory/barView";
import type { AccompanimentSlot } from "@stores/scoreSlice";
import { Note, Chord } from "tonal";
import { BaseSlotComponent } from "./BaseSlotComponent";

export const AccompanimentSlotComponent = React.memo(
  ({ slot, isFirstTrack = false }: { slot: AccompanimentSlotView; isFirstTrack?: boolean }) => {
    // Detect chord from notes
    const chordName = useMemo(() => {
      if (!("notes" in slot)) return "";
      const accompanimentSlot = slot as AccompanimentSlot & {
        originalBeat: number;
        sustain?: boolean;
      };
      if (!accompanimentSlot.notes || accompanimentSlot.notes.length === 0) return "";

      // Get the root note and notes without octave for chord detection
      const notes = accompanimentSlot.notes.map((note: string) => Note.get(note).pc || "");
      const root = notes[0];
      if (!root) return "";

      // Find matching chord
      const detected = Chord.detect(notes);
      return detected.length > 0 ? detected[0] : "";
    }, [slot]);

    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        <div className="relative flex w-full items-center">
          <div className="relative">
            <span className="inline-block">{slot.sustain ? "-" : chordName || "..."}</span>
          </div>
        </div>
      </BaseSlotComponent>
    );
  }
);
