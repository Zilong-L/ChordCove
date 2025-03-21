import { Link } from "react-router-dom";
import { SheetMetaData } from "@/types/sheet";
import PlayTriangle from "./PlayTriangle";

interface AlbumCardProps {
  sheet?: SheetMetaData;
}

export default function AlbumCard({ sheet }: AlbumCardProps) {
  if (!sheet) {
    return (
      <div className="animate-pulse">
        <div className="mb-2 aspect-square rounded-lg bg-[var(--bg-tertiary)]"></div>
        <div className="mb-2 h-4 w-3/4 rounded bg-[var(--bg-tertiary)]"></div>
        <div className="h-4 w-1/2 rounded bg-[var(--bg-tertiary)]"></div>
      </div>
    );
  }

  return (
    <Link
      to={`/sheet/${sheet.id}`}
      className="group relative rounded-lg p-4 hover:bg-[var(--bg-hover)]"
    >
      <PlayTriangle containerClassName="absolute bottom-20 group-hover:translate-y-[15%] right-4 z-10" />
      <div className="relative z-0">
        <img
          src={sheet.coverImage || "/default-cover.jpg"}
          alt={sheet.title}
          className="mb-2 aspect-square rounded-lg object-cover"
        />
      </div>
      <h3 className="truncate font-medium text-[var(--text-primary)]">{sheet.title}</h3>
      <p className="truncate text-sm text-[var(--text-tertiary)]">
        {sheet.singers?.map((singer) => singer.name).join(", ") || "Unknown Singer"}
      </p>
    </Link>
  );
}
