// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import scoreReducer from "./scoreSlice";
import editingReducer from "./editingSlice";
import sheetMetadataReducer from "./sheetMetadataSlice";
import simpleScoreReducer from "./simpleScoreSlice";
import authReducer from "./authSlice";
import themeReducer from "./themeSlice";

const store = configureStore({
  reducer: {
    score: scoreReducer,
    simpleScore: simpleScoreReducer,
    editing: editingReducer,
    sheetMetadata: sheetMetadataReducer,
    auth: authReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
