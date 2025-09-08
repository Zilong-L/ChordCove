import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Note } from "tonal";
import { RootState } from "@stores/store";
import { useSelector, useDispatch } from "react-redux";
import { setKey } from "@stores/scoreSlice";
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
    setSelectedKey(key);
  }
  const notes = midiRange("C3", "C5"); // 获取 C3-C5 之间所有音符
  return (
    <Transition show={true}>
      <div className="grid grid-flow-row grid-cols-[80px_50px]">
        Key:
        <Listbox value={selectedKey} onChange={handleKeyChange}>
          <div className="relative w-32">
            <ListboxButton className="w-full rounded px-2 text-left text-[var(--text-primary)]">
              {selectedKey}
            </ListboxButton>
            <div className="relative">
              <ListboxOptions className="ring-opacity-5 absolute z-50 mt-1 w-full rounded bg-[var(--bg-secondary)] py-1 text-[var(--text-primary)] shadow-lg ring-1 ring-black focus:outline-none [&::-webkit-scrollbar]:hidden">
                {notes.map((note) => (
                  <ListboxOption
                    key={note.midi}
                    value={note.name}
                    className="relative cursor-pointer py-2 pr-9 pl-3 select-none hover:bg-[var(--bg-hover)]"
                  >
                    {note.name}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </div>
        </Listbox>
      </div>
    </Transition>
  );
}
