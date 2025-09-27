import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import type { MelodySlotView } from "@utils/theory/barView";
import { calculateDegree, getRelativePitchNotation } from "@utils/theory/Note";
import { getUnderlineCount, isDotted } from "@utils/theory/duration";
import { BaseSlotComponent } from "./BaseSlotComponent";

export const MelodySlotComponent = React.memo(
  ({ keyNote, slot }: { keyNote: string; slot: MelodySlotView }) => {
    const useRelativePitch = useSelector((state: RootState) => state.editing.useRelativePitch);
    const underlineCount = getUnderlineCount(slot.duration);
    const hasDot = isDotted(slot.duration);

    const content = (() => {
      if (slot.sustain) return "-";
      if (!slot.note) return "0";

      if (useRelativePitch) {
        return calculateDegree(keyNote, slot.note, "number");
      }
      return slot.note;
    })();

    const octaveIndicator = (() => {
      if (slot.sustain || !slot.note || !useRelativePitch) return null;
      const { octaveDots } = getRelativePitchNotation(slot.note, keyNote);
      if (octaveDots === 0) return null;

      const dots = Array(Math.abs(octaveDots)).fill("•").join("");
      return (
        <span
          className={`absolute ${
            octaveDots > 0 ? "top-[-1em]" : "bottom-[-1em]"
          } left-1/2 -translate-x-1/2 text-[0.6em]`}
        >
          {dots}
        </span>
      );
    })();

    return (
      <BaseSlotComponent slot={slot}>
        <div className="relative">
          <span className="inline-block">{content}</span>
          {octaveIndicator}
          {hasDot && <span className="absolute top-1/2 -right-2 -translate-y-1/2">.</span>}

          {underlineCount > 0 && (
            <div
              className="absolute right-0 left-0"
              style={{
                top: "calc(100% - 2px)",
                height: `${underlineCount * 3}px`,
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: underlineCount }).map((_, i) => (
                <div
                  key={i}
                  className="absolute h-[1px] w-full bg-[var(--text-primary)]"
                  style={{ top: `${i * 3}px` }}
                />
              ))}
            </div>
          )}
        </div>
      </BaseSlotComponent>
    );
  }
);
