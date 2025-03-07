import { useState } from 'react';
import '../App.css'
import SheetDisplay from '../components/SheetDisplay';
import ReadOnlyMetadataForm from '../components/ReadOnlyMetadataForm';
import { Sheet } from '../types/sheet';

export default function SheetDetails() {
  const [song, setSong] = useState<Sheet|null>(null);

  const fetchChordSheet = async (id:string) => {
    try {
      const response = await fetch(
        `https://pub-3751f443e1d547acbc7549439ef50504.r2.dev/${id}.json`
      );
      const data = await response.json();
      setSong(data);
    } catch (error) {
      console.error('Error fetching chord sheet:', error);
    }
  };

  return (
    <div className="max-w-[90rem] mx-auto">
      <div className='flex items-center mb-4'>
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
          onClick={() => fetchChordSheet('天空之城')}
        >
          读取《天空之城》
        </button>
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
          onClick={() => fetchChordSheet('我们的歌')}
        >
          读取《我的歌》
        </button>
      </div>

      {song && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/4">
            <ReadOnlyMetadataForm
              title={song.title}
              composer={song.composer}
              singer={song.singer}
              uploader={song.uploader}
              coverImage={null}
            />
          </div>

          <div className="lg:w-3/4">
            <SheetDisplay lyrics={song.content} />
          </div>
        </div>
      )}
    </div>
  );
}