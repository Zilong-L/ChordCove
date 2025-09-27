import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import type { SlotView, MelodySlotView, AccompanimentSlotView } from "@utils/theory/barView";
import { MelodySlotComponent } from "./MelodySlotComponent";
import { AccompanimentSlotComponent } from "./AccompanimentSlotComponent";

type TrackType = "melody" | "accompaniment" | "notes";

export const SlotController = React.memo(
  ({ slot, trackType }: { slot: SlotView; trackType: TrackType }) => {
    const keyNote = useSelector((state: RootState) => state.score.key);

    const slotComponent = (() => {
      switch (trackType) {
        case "melody":
          return <MelodySlotComponent keyNote={keyNote} slot={slot as MelodySlotView} />;
        case "accompaniment":
          return <AccompanimentSlotComponent slot={slot as AccompanimentSlotView} />;
        default:
          return null;
      }
    })();

    if (!slotComponent) return null;

    return slotComponent;
  }
);
