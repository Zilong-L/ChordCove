import React, { useState, useEffect } from "react";
import { API_BASE_URL, fetchApi } from "@utils/api";
import { SheetMetaData } from "#types/sheet";
import SheetCard from "@components/basic/sheet/SheetCard";
import { Link } from "react-router-dom";

const MySheetsPage: React.FC = () => {
  const [sheets, setSheets] = useState<SheetMetaData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserSheets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchApi<SheetMetaData[]>(`${API_BASE_URL}/api/user/sheets`);
        setSheets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your sheets");
        console.error("Error fetching user sheets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSheets();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 aspect-square rounded-lg bg-[var(--bg-tertiary)]"></div>
              <div className="mb-1 h-4 w-3/4 rounded bg-[var(--bg-tertiary)]"></div>
              <div className="h-4 w-1/2 rounded bg-[var(--bg-tertiary)]"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-64 items-center justify-center rounded border border-red-300 bg-red-50 p-4 text-red-500">
          Error: {error}
        </div>
      );
    }

    if (sheets.length === 0) {
      return (
        <div className="py-10 text-center text-[var(--text-secondary)]">
          <p>You haven't uploaded any sheets yet.</p>
          <Link
            to="/create"
            className="mt-4 inline-block rounded bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Upload Your First Sheet
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {sheets.map((sheet) => (
          <SheetCard key={sheet.id} sheet={sheet} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-[var(--text-primary)]">我的谱子</h1>
      {renderContent()}
    </div>
  );
};

export default MySheetsPage;
