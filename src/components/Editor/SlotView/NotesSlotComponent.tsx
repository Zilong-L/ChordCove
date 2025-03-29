import React, { useMemo } from "react";
import type { AccompanimentSlotView, NotesSlotView } from "@utils/theory/barView";

import { BaseSlotComponent } from "./BaseSlotComponent";
import { Chord, Note } from "tonal";
import { AccompanimentSlot, NoteSlot } from "@stores/scoreSlice";
import { ToanlWrapper } from "@utils/theory/ToanlWrapper";

export const NotesSlotComponent = React.memo(
  ({ slot, isFirstTrack = false }: { slot: AccompanimentSlotView; isFirstTrack?: boolean }) => {
    console.log(slot);
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
      console.log(detected.map(ToanlWrapper.simplifyChord));
      return detected.length > 0 ? detected[0] : "";
    }, [slot]);
    if (chordName === "" || slot.sustain) return <div></div>;
    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        <div className="relative flex w-full items-center">
          <span className="inline-block"> {chordName}</span>
        </div>
      </BaseSlotComponent>
    );
  }
);
