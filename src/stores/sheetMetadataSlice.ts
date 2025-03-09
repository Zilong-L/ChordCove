// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SheetMetaData } from "../types/sheet";

const initialState: SheetMetaData = {
  id:"",
  title: "",
  composer: "",
  singer: "",
  uploader: "",
  coverImage: "",
}

const sheetMetadataSlice = createSlice({
  name: "sheetMetadata",
  initialState,
  reducers: {
    setSheetMetadata(_, action: PayloadAction<SheetMetaData>) {
      return action.payload;
    },
  },
});

export const { setSheetMetadata } = sheetMetadataSlice.actions;
export default sheetMetadataSlice.reducer;
