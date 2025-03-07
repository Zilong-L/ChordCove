import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SheetDetails from './pages/SheetDetailsPage';
import SheetEditor from './pages/SheetEditorPage';
import Header from './components/Header';
import Demo from './pages/Demo';
function App() {
  return (
    <div className="min-h-screen bg-dark text-dark">
      <Router>
        <Header />
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<SheetEditor />} />
            <Route path="/sheet/:id" element={<SheetDetails />} />
            <Route path="/demo" element={<Demo />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;