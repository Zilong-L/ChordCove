// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import scoreReducer from "./scoreSlice";
import editingReducer from "./editingSlice"; // Import the editing slice
import sheetMetadataReducer from "./sheetMetadataSlice";
import simpleScoreReducer from "./simpleScoreSlice";
import authReducer from "./authSlice";
import newScoreReducer from "./newScore/newScoreSlice";
import newEditingReducer from "./newScore/newEditingSlice";
import barViewReducer from "./newScore/barViewSlice";

const store = configureStore({
  reducer: {
    score: scoreReducer,
    simpleScore: simpleScoreReducer,
    editing: editingReducer, // Add the editing reducer here
    sheetMetadata: sheetMetadataReducer,
    auth: authReducer,
    newScore: newScoreReducer,
    newEditing: newEditingReducer,
    barView: barViewReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
