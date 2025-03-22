import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTokens } from "@stores/authSlice";
import { fetchApi } from "@utils/api";
import { LoginResponse } from "#types/api";

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await fetchApi<LoginResponse>(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      dispatch(
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-grow items-center justify-center">
        <div className="flex flex-col items-center">
          <h2 className="mb-6 bg-gradient-to-b from-[var(--text-secondary)] to-[var(--text-tertiary)] bg-clip-text text-2xl font-bold text-transparent">
            登录
          </h2>

          <div className="w-[448px] rounded-lg bg-[var(--bg-secondary)] p-8">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[var(--text-tertiary)]"
                  >
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[var(--text-tertiary)]"
                  >
                    密码
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-primary)]"
                  />
                </div>
                {error && <div className="mt-2 text-center text-sm text-red-500">{error}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded bg-[var(--bg-button)] py-3 font-medium text-[var(--text-button)] transition-colors hover:bg-[var(--bg-button-hover)]"
                >
                  {loading ? "登录中..." : "登录"}
                </button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm text-[var(--text-tertiary)]">
              没有账号？{" "}
              <Link to="/register" className="text-[var(--text-primary)] hover:underline">
                创建账号
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
