import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SheetDetails from './pages/SheetDetails';
import SheetEditor from './pages/SheetEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<SheetEditor />} />
        <Route path="/sheet/:id" element={<SheetDetails />} />
      </Routes>
    </Router>
    
  );
}

export default App;
