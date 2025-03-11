import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SimpleSheetDetailsPage from './pages/SimpleSheetDetailsPage';
import SimpleSheetEditorPage from './pages/SimpleSheetEditorPage';
import Header from './components/basic/Header';
import Demo from './pages/Demo';
import FullSheetEditorPage from './pages/FullSheetEditorPage';
import './App.css'
function App() {
  return (
    <div className="min-h-screen bg-dark text-dark">
      <Router>
        <Header />
        <main className="">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<SimpleSheetEditorPage />} />
            <Route path="/edit" element={<SimpleSheetEditorPage />} />
            <Route path="/sheet/:id" element={<SimpleSheetDetailsPage />} />
            <Route path="/create/full" element={<FullSheetEditorPage />} />
            <Route path="/sheet/full/:id" element={<SimpleSheetDetailsPage />} />
            <Route path="/demo" element={<Demo />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;