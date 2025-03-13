import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@pages/Home';
import SimpleSheetDetailsPage from '@pages/SimpleSheetDetailsPage';
import SimpleSheetEditorPage from '@pages/SimpleSheetEditorPage';
import Header from '@components/basic/Header';
import Demo from '@pages/Demo';
import FullSheetEditorPage from '@pages/FullSheetEditorPage';
import LoginPage from '@pages/LoginPage';
import ProtectedRoute from '@components/auth/ProtectedRoute';
import './App.css'

function App() {
  return (
    <div className=" bg-dark text-dark  flex flex-col">
      <Router>
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <SimpleSheetEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit"
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
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;