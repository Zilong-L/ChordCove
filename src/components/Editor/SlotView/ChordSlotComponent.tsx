import React from "react";
import type { ChordSlotView } from "@utils/theory/barView";
import { BaseSlotComponent } from "./BaseSlotComponent";

export const ChordSlotComponent = React.memo(
  ({ slot, isFirstTrack = false }: { slot: ChordSlotView; isFirstTrack?: boolean }) => {
    if (!slot.chord) {
      return (
        <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
          ♪
        </BaseSlotComponent>
      );
    }
    return (
      <BaseSlotComponent slot={slot} isFirstTrack={isFirstTrack}>
        {slot.chord}
      </BaseSlotComponent>
    );
  }
);
