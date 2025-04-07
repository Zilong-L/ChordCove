import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@pages/Home";
import SimpleSheetDetailsPage from "@pages/SimpleSheetDetailsPage";
import SimpleSheetEditorPage from "@pages/SimpleSheetEditorPage";
import ArtistPage from "@pages/ArtistPage";
import Layout from "@components/layout/Layout";
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
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/demo" element={<Demo />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
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
          <Route
            path="/liked"
            element={
              <ProtectedRoute>
                <LikedSheetsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <HelpButton />
    </Router>
  );
}

export default App;
