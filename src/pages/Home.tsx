import { useEffect, useState } from "react";
import AlbumCard from "@components/basic/AlbumCard";
import ArtistRow from "@components/basic/ArtistRow";
import { SheetMetaData } from "#types/sheet";
import { fetchApi } from "@utils/api";

import { API_BASE_URL } from "@utils/api";

export default function HomePage() {
  const [sheets, setSheets] = useState<SheetMetaData[] | null>(null);

  useEffect(() => {
    // Using the new fetchApi utility to handle the .data property in the response
    fetchApi<SheetMetaData[]>(`${API_BASE_URL}/api/recent-sheets`)
      .then((data) => setSheets(data))
      .catch((err) => console.error("Error fetching sheets:", err));
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] text-[var(--text-primary)]">
      {/* 左侧栏（占 20% 宽度） */}
      <aside className="w-1/5 border-r border-[var(--border-primary)] p-4">
        <h2 className="mb-4 text-xl font-bold">Navigation</h2>
        <ul className="space-y-2">
          <li className="cursor-pointer rounded p-2 hover:bg-[var(--bg-hover)]">All Sheets</li>
          <li className="cursor-pointer rounded p-2 hover:bg-[var(--bg-hover)]">Popular</li>
          <li className="cursor-pointer rounded p-2 hover:bg-[var(--bg-hover)]">Recent Uploads</li>
        </ul>
      </aside>

      {/* 右侧栏（占 80% 宽度） */}
      <main className="w-4/5 overflow-scroll overflow-x-hidden p-6">
        <h1 className="mb-6 text-3xl font-bold hover:cursor-pointer hover:underline">
          {" "}
          Recent Uploads
        </h1>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
          {!sheets && Array.from({ length: 3 }).map((_, i) => <AlbumCard key={i} />)}
          {sheets !== null && sheets.map((sheet) => <AlbumCard key={sheet.id} sheet={sheet} />)}
        </div>

        <ArtistRow />
      </main>
    </div>
  );
}
