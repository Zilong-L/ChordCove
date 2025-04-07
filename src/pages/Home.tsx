import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { HeartIcon } from "@heroicons/react/24/outline";

import ArtistRow from "@components/basic/artist/ArtistRow";
import SheetRow from "@components/basic/sheet/SheetRow";
import { SheetMetaData } from "#types/sheet";
import { fetchApi } from "@utils/api";

import { API_BASE_URL } from "@utils/api";

export default function HomePage() {
  const [sheets, setSheets] = useState<SheetMetaData[] | null>(null);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

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
          {isAuthenticated && (
            <li>
              <Link
                to="/liked"
                className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-[var(--bg-hover)]"
              >
                <HeartIcon className="h-5 w-5" />
                喜欢
              </Link>
            </li>
          )}
        </ul>
      </aside>

      {/* 右侧栏（占 80% 宽度） */}
      <main className="w-4/5 overflow-scroll overflow-x-hidden p-6">
        <SheetRow title="Recent Uploads" sheets={sheets} />
        <ArtistRow />
      </main>
    </div>
  );
}
