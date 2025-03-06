import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    // Replace with your Cloudflare Worker endpoint that queries D1
    const response = await fetch(`/api/search?query=${searchQuery}`);
    const results = await response.json();
    setSearchResults(results);
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for sheets..."
      />
      <button onClick={handleSearch}>Search</button>
      <div>
        {searchResults.map((sheet) => (
          <div key={sheet.id} onClick={() => navigate(`/sheet/${sheet.id}`)}>
            <h3>{sheet.title}</h3>
            <p>{sheet.composer} - {sheet.singer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
