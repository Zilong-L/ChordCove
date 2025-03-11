import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SheetDetails from './pages/SheetDetailsPage';
import SheetEditor from './pages/SimpleSheetEditorPage';
import Header from './components/Header';
import Demo from './pages/Demo';
import FullSheetEditorPage from './pages/FullSheetEditorPage';
function App() {
  return (
    <div className="min-h-screen bg-dark text-dark">
      <Router>
        <Header />
        <main className="">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<SheetEditor />} />
            <Route path="/create/full" element={<FullSheetEditorPage />} />
            <Route path="/sheet/:id" element={<SheetDetails />} />
            <Route path="/demo" element={<Demo />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;