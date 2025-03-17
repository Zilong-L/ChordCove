import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AlbumCard from "@components/basic/AlbumCard";
import { fetchApi, API_BASE_URL } from "@utils/api";
import { SheetMetaData } from "@/types/sheet";

interface Artist {
  id: number;
  name: string;
  description: string;
  image: string;
  created_at: string;
  sheets: SheetMetaData[];
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const data = await fetchApi<Artist>(`${API_BASE_URL}/api/artist-sheets/${id}`);
        setArtist(data);
      } catch (err) {
        setError("Failed to load artist data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313131] to-[#121212] p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="mb-4 h-32 w-32 rounded-full bg-gray-700"></div>
            <div className="mb-4 h-8 w-64 rounded bg-gray-700"></div>
            <div className="mb-8 h-4 w-96 rounded bg-gray-700"></div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-48 rounded bg-gray-700"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313131] to-[#121212] p-8 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-2xl font-bold">Error</h1>
          <p>{error || "Artist not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#313131] to-[#121212] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-6">
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-700">
              <span className="text-4xl">{artist.name[0]}</span>
            </div>
          )}
          <div>
            <h1 className="mb-2 text-4xl font-bold">{artist.name}</h1>
            {artist.description && <p className="text-gray-300">{artist.description}</p>}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">Sheets</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {artist.sheets.map((sheet) => (
              <AlbumCard key={sheet.id} sheet={sheet} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
