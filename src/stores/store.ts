// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import scoreReducer from "./scoreSlice";
import editingReducer from "./editingSlice";  // Import the editing slice

const store = configureStore({
  reducer: {
    score: scoreReducer,
    editing: editingReducer, // Add the editing reducer here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
