import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/store";

interface BaseSlotComponentProps {
  slot: {
    beat: number;
    originalBeat?: number;
    sustain?: boolean;
    lyrics?: string;
  };
  children: React.ReactNode;
}

export const BaseSlotComponent = React.memo(({ slot, children }: BaseSlotComponentProps) => {
  const playingBeat = useSelector((state: RootState) => state.editing.playingBeat);
  const isPlaying = playingBeat === slot.beat;

  return (
    <div className="relative w-full" data-slot-id={slot.beat}>
      <div className={`h-full w-full text-nowrap ${isPlaying ? "text-[var(--accent)]" : ""}`}>
        <div className="flex w-full flex-col items-center">{children}</div>
      </div>
    </div>
  );
});
