import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTokens } from '@stores/authSlice';
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
      const data = await fetchApi<LoginResponse>(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      dispatch(setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-dark text-white">
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-b from-[#878787] to-[#616161] text-transparent bg-clip-text">
            登录
          </h2>
          
          <div className="w-[448px] p-8 rounded-lg bg-[#212121]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-3 rounded bg-[#191919] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 rounded bg-[#191919] focus:outline-none"
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
                  {loading ? '登录中...' : '登录'}
                </button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm text-gray-400">
              没有账号？{' '}
              <Link to="/register" className="text-white hover:underline">
                创建账号
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 