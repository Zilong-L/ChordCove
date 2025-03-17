import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AlbumCard from "@components/basic/AlbumCard";
import { fetchApi,API_BASE_URL } from "@utils/api";
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
      <div className="min-h-screen bg-gradient-to-b from-[#313131] to-[#121212] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-32 w-32 bg-gray-700 rounded-full mb-4"></div>
            <div className="h-8 w-64 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 w-96 bg-gray-700 rounded mb-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313131] to-[#121212] text-white p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error || "Artist not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#313131] to-[#121212] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-6 mb-8">
          {artist.image ? (
            <img
              src={artist.image}
              alt={artist.name}
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-4xl">{artist.name[0]}</span>
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
            {artist.description && (
              <p className="text-gray-300">{artist.description}</p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Sheets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {artist.sheets.map((sheet) => (
              <AlbumCard key={sheet.id} sheet={sheet} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 