import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/store";

export const BaseSlotComponent = React.memo(
  ({ slot, children }: { slot: { beat: number }; children: React.ReactNode }) => {
    const playingBeat = useSelector((state: RootState) => state.editing.playingBeat);
    const isPlaying = playingBeat === slot.beat;

    return (
      <div className="relative w-full" data-slot-id={slot.beat}>
        <div className={`h-full w-full text-nowrap ${isPlaying ? "text-[var(--accent)]" : ""}`}>
          {children}
        </div>
      </div>
    );
  }
);
