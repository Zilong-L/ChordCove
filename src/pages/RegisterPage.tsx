import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchApi } from "@utils/api";

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";
const API_BASE_URL = window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "verification" | "success">("email");
  const [countdown, setCountdown] = useState(0);
  const [emailSentMessage, setEmailSentMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number;
    if (countdown > 0) {
      timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;

    setLoading(true);
    setError("");
    setEmailSentMessage("");

    try {
      await fetchApi(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      setStep("verification");
      setCountdown(60);
      setEmailSentMessage("验证码已发送到您的邮箱，请注意查收");
    } catch (err) {
      if (err instanceof Error && err.message.includes("Rate limit")) {
        setError("请稍后再试");
      } else {
        setError(err instanceof Error ? err.message : "发生错误");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetchApi(`${API_BASE_URL}/api/validate-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: verificationCode, password }),
      });

      // Show success message instead of redirecting
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="flex flex-grow items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-[448px] rounded-lg bg-[var(--bg-secondary)] p-8 text-center">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <h2 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">注册成功！</h2>
              <p className="mb-6 text-[var(--text-tertiary)]">
                您的账号已创建成功，现在可以登录使用了
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full rounded bg-[var(--bg-button)] py-3 font-medium text-[var(--text-button)] transition-colors hover:bg-[var(--bg-button-hover)]"
              >
                前往登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-grow items-center justify-center">
        <div className="flex flex-col items-center">
          <h2 className="mb-6 bg-gradient-to-b from-[var(--text-secondary)] to-[var(--text-tertiary)] bg-clip-text text-2xl font-bold text-transparent">
            创建账号
          </h2>

          <div className="w-[448px] rounded-lg bg-[var(--bg-secondary)] p-8">
            {step === "email" ? (
              <form onSubmit={handleSendCode}>
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
                  {error && <div className="mt-2 text-center text-sm text-red-500">{error}</div>}
                  <button
                    type="submit"
                    disabled={loading || countdown > 0}
                    className={`mt-4 w-full py-3 ${
                      loading || countdown > 0
                        ? "cursor-not-allowed bg-[var(--bg-button-disabled)] text-[var(--text-button-disabled)]"
                        : "bg-[var(--bg-button)] text-[var(--text-button)] hover:bg-[var(--bg-button-hover)]"
                    } rounded font-medium transition-colors`}
                  >
                    {loading
                      ? "发送中..."
                      : countdown > 0
                        ? `${countdown}秒后可重新发送`
                        : "发送验证码"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerification}>
                <div className="space-y-4">
                  {emailSentMessage && (
                    <div className="mb-4 text-center text-sm text-green-500">
                      {emailSentMessage}
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="code"
                      className="mb-2 block text-sm font-medium text-[var(--text-tertiary)]"
                    >
                      验证码
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        id="code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        className="flex-1 rounded bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-primary)]"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={loading || countdown > 0}
                        className={`px-4 py-2 ${
                          loading || countdown > 0
                            ? "cursor-not-allowed bg-[var(--bg-button-disabled)] text-[var(--text-button-disabled)]"
                            : "bg-[var(--bg-button)] text-[var(--text-button)] hover:bg-[var(--bg-button-hover)]"
                        } whitespace-nowrap rounded text-sm font-medium transition-colors`}
                      >
                        {countdown > 0 ? `${countdown}s` : "重新发送"}
                      </button>
                    </div>
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
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      密码需要包含大小写字母和数字，至少8位
                    </p>
                  </div>
                  {error && <div className="mt-2 text-center text-sm text-red-500">{error}</div>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full rounded bg-[var(--bg-button)] py-3 font-medium text-[var(--text-button)] transition-colors hover:bg-[var(--bg-button-hover)]"
                  >
                    {loading ? "创建中..." : "创建账号"}
                  </button>
                </div>
              </form>
            )}
            <div className="mt-4 text-center text-sm text-[var(--text-tertiary)]">
              已有账号？{" "}
              <Link to="/login" className="text-[var(--text-primary)] hover:underline">
                登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
