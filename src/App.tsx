import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@pages/Home";
import SimpleSheetDetailsPage from "@pages/SimpleSheetDetailsPage";
import SimpleSheetEditorPage from "@pages/SimpleSheetEditorPage";
import ArtistPage from "@pages/ArtistPage";
import Header from "@components/basic/layout/Header";
import Demo from "@pages/Demo";
import FullSheetEditorPage from "@pages/FullSheetEditorPage";
import LoginPage from "@pages/LoginPage";
import RegisterPage from "@pages/RegisterPage";
import ProtectedRoute from "@components/auth/ProtectedRoute";
import HelpButton from "@components/HelpButton";
import LikedSheetsPage from "@pages/LikedSheetsPage";
import "./App.css";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)] text-[var(--text-primary)]">
      <Router>
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <SimpleSheetEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <SimpleSheetEditorPage />
                </ProtectedRoute>
              }
            />
            <Route path="/sheet/:id" element={<SimpleSheetDetailsPage />} />
            <Route
              path="/create/full"
              element={
                <ProtectedRoute>
                  <FullSheetEditorPage />
                </ProtectedRoute>
              }
            />
            <Route path="/sheet/full/:id" element={<SimpleSheetDetailsPage />} />
            <Route path="/demo" element={<Demo />} />
            <Route
              path="/liked"
              element={
                <ProtectedRoute>
                  <LikedSheetsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <HelpButton />
      </Router>
    </div>
  );
}

export default App;
