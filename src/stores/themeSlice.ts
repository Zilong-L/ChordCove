import { createSlice } from "@reduxjs/toolkit";

interface ThemeState {
  isLightMode: boolean;
}

const initialState: ThemeState = {
  isLightMode: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isLightMode = !state.isLightMode;
      // Update root class and localStorage
      if (state.isLightMode) {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
      localStorage.setItem("theme", state.isLightMode ? "light" : "dark");
    },
    initializeTheme: (state) => {
      // Check localStorage or system preference
      const savedTheme = localStorage.getItem("theme");
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      state.isLightMode = savedTheme ? savedTheme === "light" : !systemPrefersDark;

      if (state.isLightMode) {
        document.documentElement.classList.add("light");
      }
    },
  },
});

export const { toggleTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer;
