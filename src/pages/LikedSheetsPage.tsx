import { useState, useEffect } from "react";
import { API_BASE_URL, fetchApi } from "@utils/api";
// import SheetCard from "@components/basic/sheet/SheetCard"; // No longer needed
import LikedSheetRow from "@components/basic/sheet/LikedSheetRow"; // Import the new component
import { SheetMetaData } from "#types/sheet";
import {
  // Import icons
  HandThumbUpIcon,
} from "@heroicons/react/24/solid";

export default function LikedSheetsPage() {
  const [sheets, setSheets] = useState<SheetMetaData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Fetch actual user data and playlist details
  const userName = "Hongdou Liu";
  const totalSongs = sheets.length; // Use fetched sheets length

  useEffect(() => {
    const loadLikedSheets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchApi<SheetMetaData[]>(`${API_BASE_URL}/api/likes/sheets`);
        setSheets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load liked sheets");
        console.error("Error fetching liked sheets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikedSheets();
  }, []);

  // Calculate total duration placeholder (very rough estimate)

  return (
    // Use flex for two-column layout, adjust padding/container as needed
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col gap-16 px-4 py-8 md:flex-row">
      {/* Left Panel */}
      <div className="flex w-64 flex-shrink-0 flex-col">
        {/* Liked Music Cover Image */}
        <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-700 p-6 shadow-lg">
          <HandThumbUpIcon className="h-full w-full text-white opacity-80" />
        </div>

        {/* Playlist Info */}
        <div className="mt-6 flex flex-col">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Liked Music</h1>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-gray-500"></div> {/* Placeholder avatar */}
            <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Auto playlist • {new Date().getFullYear()} {/* Dynamic year */}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{totalSongs} songs</p>
          <p className="mt-4 text-xs text-[var(--text-secondary)]">
            Music you like will show here.
          </p>
        </div>
      </div>

      {/* Right Panel (Scrollable Sheet List) */}
      <div className="flex-1 overflow-y-auto pr-2">
        {" "}
        {/* Added pr-2 for scrollbar */}
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-[var(--text-secondary)]">Loading...</p>
            {/* TODO: Add a more visually appealing Skeleton Loader */}
          </div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center rounded border border-red-500 bg-red-100 p-4 text-red-500">
            <p>Error loading sheets: {error}</p>
          </div>
        )}
        {!isLoading && !error && sheets.length === 0 && (
          <div className="flex h-full items-center justify-center p-8 text-center text-[var(--text-secondary)]">
            <p>You haven't liked any sheets yet.</p>
          </div>
        )}
        {!isLoading && !error && sheets.length > 0 && (
          // Use a simple div for vertical list, remove grid
          <div className="flex flex-col gap-1">
            {" "}
            {/* Reduced gap for tighter list */}
            {sheets.map((sheet) => (
              // Render the new LikedSheetRow component
              <LikedSheetRow key={sheet.id} sheet={sheet} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
