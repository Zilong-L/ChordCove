import { NoteInfoSet, useMidi } from "@hooks/useMidi";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { Score, setSlot } from "@stores/scoreSlice";
import { useEffect, useState } from "react";
import { EditingSlotState, setEditingBeat, setLastInputNote } from "@stores/editingSlice";
import { durationValues, type NoteDuration } from "#types/sheet";
import { NoteInfo } from "@hooks/useMidi";
export default function useMidiInputs() {
  const { recentlyPressedNote, activeNotes, allReleased } = useMidi();
  const score = useSelector((state: RootState) => state.score as Score);
  const edit = useSelector((state: RootState) => state.editing as EditingSlotState);
  const { selectedDuration, isDotted } = edit;

  const [flipNote, setFlipNote] = useState<NoteInfo | null>(null);
  const [flipNotes, setFlipNotes] = useState<NoteInfoSet>(new NoteInfoSet());
  const dispatch = useDispatch();

  const currentTrack = score.tracks[edit.editingTrack];
  const currentBeat = edit.editingBeat;

  useEffect(() => {
    const trackType = currentTrack.type;
    if (trackType !== "melody") return;
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot) return;
    const finalNote = flipNote?.noteName;
    if (!finalNote) return;
    const baseDuration = durationValues[selectedDuration as NoteDuration];
    const duration = isDotted ? baseDuration * 1.5 : baseDuration;

    // Update the slot with new content based on track type
    const updatedSlot = {
      ...existingSlot,
      beat: currentBeat,
      duration,
    };

    Object.assign(updatedSlot, { note: finalNote });
    // Update last input note for melody
    dispatch(setLastInputNote(finalNote));
    dispatch(
      setSlot({
        trackId: currentTrack.id,
        slot: updatedSlot,
      })
    );
    dispatch(setEditingBeat(currentBeat + duration));
    setFlipNote(null);
  }, [flipNote, currentTrack, currentBeat, selectedDuration, isDotted, dispatch]);

  useEffect(() => {
    setFlipNote(recentlyPressedNote);
  }, [recentlyPressedNote]);
  useEffect(() => {
    setFlipNotes(activeNotes);
  }, [activeNotes]);
  useEffect(() => {
    if (allReleased) {
      console.log("allReleased");
    }
  }, [allReleased]);
  useEffect(() => {
    console.log("activeNotes", activeNotes);
  }, [activeNotes]);
}
