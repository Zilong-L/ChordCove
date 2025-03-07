import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '../types/sheet';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Sheet[]>([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const response = await fetch(`/api/search?query=${searchQuery}`);
    const results = await response.json();
    setSearchResults(results);
  };

  return (
    <div className="max-w-[90rem] mx-auto">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for sheets..."
        className="bg-gray-800 text-white border border-gray-700 rounded p-2"
      />
      <button 
        onClick={handleSearch}
        className="ml-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Search
      </button>
      <div className="mt-4">
        {searchResults.map((sheet) => (
          <div 
            key={sheet.id} 
            onClick={() => navigate(`/sheet/${sheet.id}`)}
            className="bg-gray-800 p-4 rounded-lg mb-2 cursor-pointer hover:bg-gray-700"
          >
            <h3 className="text-xl font-bold">{sheet.title}</h3>
            <p className="text-gray-400">{sheet.composer} - {sheet.singer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;