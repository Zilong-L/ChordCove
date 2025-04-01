import React, { useMemo } from "react";
import type { AccompanimentSlotView } from "@utils/theory/barView";
import type { AccompanimentSlot } from "@stores/scoreSlice";
import { Note } from "tonal";
import { BaseSlotComponent } from "./BaseSlotComponent";
import { ToanlWrapper } from "@utils/theory/ToanlWrapper";

export const AccompanimentSlotComponent = React.memo(
  ({ slot }: { slot: AccompanimentSlotView }) => {
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

      // Find matching chord
      const detected = ToanlWrapper.detect(notes);
      return detected.length > 0 ? ToanlWrapper.simplifyChord(detected[0]) : "";
    }, [slot]);
    return (
      <BaseSlotComponent slot={slot}>
        <div
          {...(slot.notes && slot.notes.length > 0
            ? {
                className: "data-tooltip relative flex w-full items-center justify-center",
                "data-tooltip": slot.notes,
              }
            : {
                className: "relative flex w-full items-center justify-center",
              })}
        >
          <div className="relative">
            <span className="inline-block">{slot.sustain ? "" : chordName || "?"}</span>
          </div>
        </div>
      </BaseSlotComponent>
    );
  }
);
