import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '@stores/authSlice';
import { fetchApi } from '@utils/api';
import { LoginResponse } from '@/types/api';

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Using the new fetchApi utility to handle the .data property in the response
      const data = await fetchApi<LoginResponse>(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Store the token in Redux
      dispatch(setToken(data.accessToken));

      // Redirect to home page
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-dark text-white">
      {/* Center the login form exactly as in your screenshot */}
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center">
          {/* Sign in text moved outside the card */}
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-b from-[#878787] to-[#616161] text-transparent bg-clip-text ">
            Sign in
          </h2>
          
          <div className="w-full max-w-md p-8 rounded-lg bg-[#212121]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  {/* Label above input instead of placeholder */}
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-64 p-3 rounded bg-[#191919] focus:outline-none"
                  />
                </div>
                <div>
                  {/* Label above input instead of placeholder */}
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-64 p-3 rounded bg-[#191919] focus:outline-none"
                  />
                </div>
                {error && (
                  <div className="text-red-500 text-sm text-center mt-2">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-4 bg-[#dfdfdf] hover:bg-[#efefef] text-black rounded font-medium transition-colors"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 