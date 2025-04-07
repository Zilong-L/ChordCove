import { useState, useEffect } from "react";
import { API_BASE_URL, fetchApi } from "@utils/api";
import SheetCard from "@components/basic/sheet/SheetCard";
import { SheetMetaData } from "#types/sheet";

export default function LikedSheetsPage() {
  const [sheets, setSheets] = useState<SheetMetaData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-[var(--text-primary)]">喜欢的乐谱</h1>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          {/* Add a spinner or loading text here */}
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500 bg-red-100 p-4 text-center text-red-500">
          <p>Error loading sheets: {error}</p>
        </div>
      )}

      {!isLoading && !error && sheets.length === 0 && (
        <div className="p-8 text-center text-[var(--text-secondary)]">
          <p>你还没有喜欢任何乐谱。</p>
          {/* Optional: Add a link back to the home page or sheet discovery */}
        </div>
      )}

      {!isLoading && !error && sheets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sheets.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} />
          ))}
        </div>
      )}
    </div>
  );
}
