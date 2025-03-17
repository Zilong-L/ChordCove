import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Note } from "tonal";
import { RootState } from "@stores/store";
import { useSelector, useDispatch } from "react-redux";
import { setKey, updateBars } from "@stores/scoreSlice";
import { shiftNote } from "@utils/theory/Note";
import { Transition } from "@headlessui/react";

const midiRange = (startNote: string, endNote: string) => {
  const startMidi = Note.midi(startNote)!; // C3 -> 48
  const endMidi = Note.midi(endNote)!; // C5 -> 72
  return Array.from({ length: endMidi - startMidi + 1 }, (_, i) => startMidi + i).map((midi) => ({
    name: Note.fromMidi(midi)!,
    midi,
  }));
};

export default function KeySelector() {
  const score = useSelector((state: RootState) => state.score);
  const selectedKey = score.key;
  const dispatch = useDispatch();
  const setSelectedKey = (key: string) => dispatch(setKey(key));
  function handleKeyChange(key: string) {
    const barsCopy = structuredClone(score.bars);
    barsCopy.forEach((bar) => {
      bar.slots.forEach((slot) => {
        slot.note = shiftNote(slot.note, score.key, key) || slot.note;
      });
    });
    dispatch(updateBars({ newBars: barsCopy }));

    setSelectedKey(key);
  }
  const notes = midiRange("C3", "C5"); // 获取 C3-C5 之间所有音符
  return (
    <Transition show={true}>
      <div className="grid grid-flow-row grid-cols-[80px_50px]">
        Key:
        <Listbox value={selectedKey} onChange={handleKeyChange}>
          <div className="relative w-32">
            <ListboxButton className="w-full rounded px-2 text-left text-white">
              {selectedKey}
            </ListboxButton>
            <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded text-white shadow-lg backdrop-blur-md">
              {notes.map((note) => (
                <ListboxOption key={note.midi} value={note.name} className="cursor-pointer p-2">
                  {note.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
    </Transition>
  );
}
