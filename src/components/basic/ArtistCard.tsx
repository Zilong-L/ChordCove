import { Link } from "react-router-dom";
import PlayTriangle from "./PlayTriangle";

interface Artist {
  id: number;
  name: string;
  image: string;
  sheets: Array<{
    id: string;
    title: string;
    coverImage: string;
    role: string;
  }>;
}

interface ArtistCardProps {
  artist: Artist;
  imageClassName?: string;
}

export default function ArtistCard({ artist, imageClassName = "16rem" }: ArtistCardProps) {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className={`group/inner relative rounded-md p-4 text-center hover:bg-[var(--bg-hover)]`}
    >
      <PlayTriangle containerClassName="absolute bottom-6 group-hover/inner:opacity-100 group-hover/inner:translate-y-[15%] right-4 z-10" />
      <div className="relative z-0">
        {artist.image ? (
          <img
            src={artist.image}
            alt={artist.name}
            className={`mb-2 aspect-square w-full rounded-full object-cover transition-opacity ${imageClassName}`}
          />
        ) : (
          <div
            className={`mb-2 flex aspect-square w-full items-center justify-center rounded-full bg-[var(--bg-tertiary)] transition-colors ${imageClassName}`}
          >
            <span className="text-4xl text-[var(--text-primary)]">{artist.name[0]}</span>
          </div>
        )}
      </div>
      <h3 className="truncate px-2 font-medium text-[var(--text-primary)]">{artist.name}</h3>
      <p className="text-sm text-[var(--text-tertiary)]">
        {artist.sheets.length} {artist.sheets.length === 1 ? "sheet" : "sheets"}
      </p>
    </Link>
  );
}
