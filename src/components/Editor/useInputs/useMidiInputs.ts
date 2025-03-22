import { useMidi } from "@hooks/useMidi";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { createSlot, setSlot, type Score } from "@stores/scoreSlice";
import { useEffect } from "react";
import { EditingSlotState } from "@stores/editingSlice";

function useMidiInputs() {
  const { recentlyPressedNote, activeNotes, midiInputs, hasWebMidi } = useMidi();
  const score = useSelector((state: RootState) => state.score as Score);
  const edit = useSelector((state: RootState) => state.editing as EditingSlotState);
  const currentTrack = score.tracks[edit.editingTrack];
  const currentBeat = edit.editingBeat;

  useEffect(() => {
    if (!hasWebMidi) return;
    const trackType = currentTrack.type;
    switch (trackType) {
      case "melody":
        break;
      case "accompaniment":
        break;
      case "lyrics":
        break;
      case "chords":
        break;
      default:
        break;
    }
  }, [recentlyPressedNote, currentTrack, currentBeat, hasWebMidi]);
}
