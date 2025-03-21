import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { toggleTheme, initializeTheme } from "@stores/themeSlice";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const isLightMode = useSelector((state: RootState) => state.theme.isLightMode);

  useEffect(() => {
    dispatch(initializeTheme());
  }, [dispatch]);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="rounded-lg p-2 transition-colors hover:bg-[var(--bg-hover)]"
      aria-label="Toggle theme"
    >
      {isLightMode ? (
        <MoonIcon className="h-5 w-5 text-[var(--text-primary)]" />
      ) : (
        <SunIcon className="h-5 w-5 text-[var(--text-primary)]" />
      )}
    </button>
  );
}
