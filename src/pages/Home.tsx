import { useEffect, useState } from "react";
import AlbumCard from "@components/basic/AlbumCard";
import ArtistRow from "@components/basic/ArtistRow";
import { SheetMetaData } from "@/types/sheet";
import { fetchApi } from "@utils/api";

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";

// 如果是在本地开发环境，使用 API_BACKEND_DEV，否则使用 API_BACKEND
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

export default function HomePage() {
  const [sheets, setSheets] = useState<SheetMetaData[] | null>(null);

  useEffect(() => {
    // Using the new fetchApi utility to handle the .data property in the response
    fetchApi<SheetMetaData[]>(`${API_BASE_URL}/api/recent-sheets`)
      .then((data) => setSheets(data))
      .catch((err) => console.error("Error fetching sheets:", err));
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-b from-[#313131] to-[#121212] text-white">
      {/* 左侧栏（占 20% 宽度） */}
      <aside className="w-1/5 border-r border-gray-700 p-4">
        <h2 className="mb-4 text-xl font-bold">Navigation</h2>
        <ul className="space-y-2">
          <li className="cursor-pointer rounded p-2 hover:bg-gray-800">All Sheets</li>
          <li className="cursor-pointer rounded p-2 hover:bg-gray-800">Popular</li>
          <li className="cursor-pointer rounded p-2 hover:bg-gray-800">Recent Uploads</li>
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
