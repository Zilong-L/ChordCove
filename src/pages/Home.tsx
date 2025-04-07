import { useEffect, useState } from "react";
// import { Link } from "react-router-dom"; // No longer needed here
// import { useSelector } from "react-redux"; // Moved to Sidebar
// import { RootState } from "@stores/store"; // Moved to Sidebar
// import { HeartIcon, PencilIcon } from "@heroicons/react/24/outline"; // Moved to Sidebar

import ArtistRow from "@components/basic/artist/ArtistRow";
import SheetRow from "@components/basic/sheet/SheetRow";
import { SheetMetaData } from "#types/sheet";
import { fetchApi } from "@utils/api";

import { API_BASE_URL } from "@utils/api";
// import { resetSheetMetadata } from "@stores/sheetMetadataSlice"; // Moved to Sidebar
// import { resetSimpleScore } from "@stores/simpleScoreSlice"; // Moved to Sidebar
// import { useDispatch } from "react-redux"; // Moved to Sidebar

export default function HomePage() {
  const [sheets, setSheets] = useState<SheetMetaData[] | null>(null);
  // const { isAuthenticated } = useSelector((state: RootState) => state.auth); // Moved
  // const dispatch = useDispatch(); // Moved

  useEffect(() => {
    fetchApi<SheetMetaData[]>(`${API_BASE_URL}/api/recent-sheets`)
      .then((data) => setSheets(data))
      .catch((err) => console.error("Error fetching sheets:", err));
  }, []);

  return (
    // Outer div removed, handled by Layout
    // <div className="flex h-[calc(100vh-4rem)] bg-[var(--bg-page)] text-[var(--text-primary)]">
    <>
      {/* Sidebar (<aside>) removed, handled by Layout/Sidebar */}

      {/* Main content area - wrapper changed from <main> to <div>, layout classes removed */}
      {/* Padding is now applied by Layout's main > div */}
      <div className="text-[var(--text-primary)]">
        {/* Background div remains relative to this container */}
        <div className="absolute left-[-400px] top-[-400px] h-[1000px] w-[1000px] bg-[radial-gradient(circle,_var(--bg-primary),var(--bg-page)_71%)]"></div>
        <SheetRow title="Recent Uploads" sheets={sheets} />
        <ArtistRow />
      </div>
    </>
    // </div>
  );
}
