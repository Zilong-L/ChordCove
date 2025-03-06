import { useState } from 'react';
import '../App.css'
import SheetRenderer from '../components/SheetRenderer';
export default function SheetDetails() {
  const [song, setSong] = useState(null);

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
    <div className="p-4 h-screen w-screen flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold">获取和弦谱</h1>
      <div className='flex items-center mt-4'>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        onClick={() => fetchChordSheet('天空之城')}
      >
        读取《天空之城》
      </button>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={() => fetchChordSheet('我们的歌')}
      >
        读取《我的歌》
      </button>
        </div>
      {song && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-lg font-bold">{song.title}</h2>
          <p>作曲：{song.composer}</p>
          <p>演唱：{song.singer}</p>
          <p>制谱：{song.creator}</p>
          <pre className="bg-gray-100 p-2 mt-2">{song.content}</pre>
        </div>
      )}
      {song&&<SheetRenderer lyrics={song.content} />}
    </div>
  );
}
