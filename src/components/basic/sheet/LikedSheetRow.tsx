import { SheetMetaData } from "#types/sheet";
import LikeButton from "@components/basic/sheet/LikeButton";
import { Link } from "react-router-dom";

interface LikedSheetRowProps {
  sheet: SheetMetaData;
}

// Helper function to get primary artist name
const getArtistName = (sheet: SheetMetaData): string => {
  if (sheet.singers && sheet.singers.length > 0 && sheet.singers[0]) {
    return sheet.singers[0].name;
  }
  if (sheet.composers && sheet.composers.length > 0 && sheet.composers[0]) {
    return sheet.composers[0].name;
  }
  // TODO: Handle uploader name if artists are empty?
  return "Unknown Artist";
};

export default function LikedSheetRow({ sheet }: LikedSheetRowProps) {
  const artistName = getArtistName(sheet);
  const sheetDetailUrl =
    sheet.sheetType === "full" ? `/sheet/full/${sheet.id}` : `/sheet/simple/${sheet.id}`;

  return (
    <Link
      to={sheetDetailUrl}
      className="flex cursor-pointer items-center justify-between gap-4 rounded px-2 py-2 transition-colors duration-150 hover:bg-[var(--bg-hover)]"
    >
      <div className="flex flex-1 items-center gap-4 overflow-hidden">
        <img
          src={sheet.coverImage} // Add a placeholder
          alt={`${sheet.title} cover`}
          className="h-10 w-10 rounded object-cover"
          onError={(e) => {
            e.currentTarget.src = ""; // Fallback placeholder
          }}
        />
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{sheet.title}</p>
          <p className="truncate text-xs text-[var(--text-secondary)]">{artistName}</p>
          {/* Can add album or other info here */}
        </div>
      </div>
      <div className="flex-shrink-0">
        {/* Using existing LikeButton, style might differ slightly from the image's thumb */}
        <LikeButton sheetId={sheet.id} initialState={true} />
        {/* TODO: Add duration if available */}
      </div>
    </Link>
  );
}
