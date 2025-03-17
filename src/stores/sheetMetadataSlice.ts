// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SheetMetaData } from "../types/sheet";

const initialState: SheetMetaData = {
  id:"",
  title: "",
  composers: [],
  singers: [],
  uploader: "",
  uploaderId : -1,
  coverImage: "",
}

const sheetMetadataSlice = createSlice({
  name: "sheetMetadata",
  initialState,
  reducers: {
    setSheetMetadata(_, action: PayloadAction<SheetMetaData>) {
      return action.payload;
    },
    resetSheetMetadata: () => {
      return initialState;
    }
  },
});

export const { setSheetMetadata,resetSheetMetadata } = sheetMetadataSlice.actions;
export default sheetMetadataSlice.reducer;
