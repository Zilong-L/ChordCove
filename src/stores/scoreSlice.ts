// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BarData, Score } from "../types/sheet";

// Helper: parse a time signature string into beatsPerBar and baseBeat
const parseTimeSignature = (ts: string): { beatsPerBar: number; baseBeat: number } => {
  const [beats, base] = ts.split("/").map(Number);
  return { beatsPerBar: beats, baseBeat: base };
};

// 🎼 初始状态
const initialTimeSignature = "4/4";
const { beatsPerBar, baseBeat } = parseTimeSignature(initialTimeSignature);
const initialState: Score = {
  key: "C3",
  tempo: 120,
  timeSignature: initialTimeSignature,
  beatsPerBar,
  baseBeat,
  bars: [
    {
      id: crypto.randomUUID(),
      barNumber: 1,
      slots: [
        { beat: 0, duration: 1, note: "C4", chord: "C", lyric: "1" },
      ]
    },
    {
      id: crypto.randomUUID(),
      barNumber: 2,
      slots: [
        { beat: 0, duration: 4, note: "C4", chord: "C", lyric: "1" },
      ]
    }
  ],
};

const scoreSlice = createSlice({
  name: "score",
  initialState,
  reducers: {
    setTempo: (state, action: PayloadAction<number>) => {
      state.tempo = action.payload;
    },
    setTimeSignature: (state, action: PayloadAction<string>) => {
      state.timeSignature = action.payload;
      const { beatsPerBar, baseBeat } = parseTimeSignature(action.payload);
      state.beatsPerBar = beatsPerBar;
      state.baseBeat = baseBeat;
    },
    // 📌 Add a bar to the score
    addBar: (state) => {
      state.bars.push({
        id: crypto.randomUUID(),
        barNumber: state.bars.length + 1,
        slots: [
          { beat: 0, duration: state.beatsPerBar, note: "C4", chord: "C", lyric: "没填" },
        ],
      });
    },
    // ❌ Remove a bar from the score
    removeBar: (state, action: PayloadAction<{ barId: string }>) => {
      state.bars = state.bars.filter((bar) => bar.id !== action.payload.barId);
      // Renumber bars
      state.bars.forEach((bar, index) => (bar.barNumber = index + 1));
    },
    // 🔀 Reorder bars (e.g., via drag-and-drop)
    reorderBars: (state, action: PayloadAction<{ newBars: BarData[] }>) => {
      state.bars = action.payload.newBars;
    },
  },
});

export const { setTempo, setTimeSignature, addBar, removeBar, reorderBars } = scoreSlice.actions;
export default scoreSlice.reducer;
