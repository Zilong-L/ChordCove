// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { BarData,  SimpleScore } from "../types/sheet";


// 🎼 初始状态
const initialTimeSignature = "4/4";

const initialState: SimpleScore = {
  key: "C3",
  tempo: 120,
  timeSignature: initialTimeSignature,
  content:"[I]你存在，我[IV]深深地脑海里"
  
};

const simpleScoreSlice = createSlice({
  name: "score",
  initialState,
  reducers: {
    setTempo: (state, action: PayloadAction<number>) => {
      state.tempo = action.payload;
    },
    setKey: (state, action: PayloadAction<string>) => {
      state.key = action.payload;
    }
    ,
    setTimeSignature: (state, action: PayloadAction<string>) => {
      state.timeSignature = action.payload;
    },
    setContent: (state, action: PayloadAction<string>) => {
        state.content = action.payload;
    },

  },
});

export const { setTempo, setTimeSignature,setKey ,setContent} = simpleScoreSlice.actions;
export default simpleScoreSlice.reducer;
