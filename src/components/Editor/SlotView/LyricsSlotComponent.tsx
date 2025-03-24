import React from "react";
import { useDispatch } from "react-redux";
import type { LyricsSlotView } from "@utils/theory/barView";
import { getUnderlineCount, isDotted } from "@utils/theory/duration";
import { setEditingBeat, setLyricsEditing, setLyricsInputValue } from "@stores/editingSlice";
import { BaseSlotComponent } from "./BaseSlotComponent";

export const LyricsSlotComponent = React.memo(
  ({ slot, isFirstTrack = false }: { slot: LyricsSlotView; isFirstTrack?: boolean }) => {
    const dispatch = useDispatch();

    // Use slot's own duration to display underlines and dots
    const underlineCount = getUnderlineCount(slot.duration);
    const hasDot = isDotted(slot.duration);

    const handleClick = () => {
      dispatch(setEditingBeat(slot.originalBeat));
      dispatch(setLyricsInputValue(slot.text || ""));
      dispatch(setLyricsEditing(true));
    };

    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        <div className="relative flex w-full items-center">
          <div className="relative min-w-[20px]" onClick={handleClick}>
            <span className="inline-block">
              {!slot.text ? "歌" : slot.sustain ? "-" : slot.text}
            </span>
            {hasDot && <span className="absolute -right-2 top-1/2 -translate-y-1/2">.</span>}
            {/* Underlines container */}
            {underlineCount > 0 && (
              <div
                className="absolute left-0 right-0"
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
                    style={{
                      top: `${i * 3}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </BaseSlotComponent>
    );
  }
);
