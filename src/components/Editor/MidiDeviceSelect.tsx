import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@stores/store";
import { setSelectedMidiInputId } from "@stores/editingSlice";

// Lightweight WebMIDI alias types to avoid DOM conflicts
type WMIDIInput = { id?: string; name: string };
type WMIDIInputMap = { forEach(cb: (value: WMIDIInput, key: string) => void): void };
type WMIDIAccess = {
  inputs: WMIDIInputMap;
  onstatechange: ((ev: { port: WMIDIInput | null }) => void) | null;
};

export default function MidiDeviceSelect() {
  const dispatch = useDispatch();
  const selectedId = useSelector((s: RootState) => s.editing.selectedMidiInputId);
  const [inputs, setInputs] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let access: WMIDIAccess | null = null;
    let mounted = true;
    const refresh = (a: WMIDIAccess) => {
      const arr: Array<{ id: string; name: string }> = [];
      a.inputs.forEach((input: WMIDIInput, id: string) => {
        arr.push({ id, name: input.name });
      });
      if (mounted) setInputs(arr);
    };

    if (!navigator.requestMIDIAccess) return;
    navigator.requestMIDIAccess().then((a) => {
      access = a as unknown as WMIDIAccess;
      refresh(access);
      access.onstatechange = () => refresh(access!);
    });
    return () => {
      mounted = false;
      if (access) access.onstatechange = null;
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[var(--text-secondary)]">MIDI Device</label>
      <select
        value={String(selectedId ?? "all")}
        onChange={(e) => dispatch(setSelectedMidiInputId(e.target.value as "all" | string))}
        className="rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
      >
        <option value="all">All devices</option>
        {inputs.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name || d.id}
          </option>
        ))}
      </select>
    </div>
  );
}
