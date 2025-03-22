import { ApiResponse } from "#types/api";
import store from "@stores/store";
import { setAccessToken, logout } from "@stores/authSlice";

/**
 * Handles API responses with the new structure that includes a .data property
 * @param response The JSON response from the API
 * @returns The data from the response
 */
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || "An unknown error occurred");
  }

  return response.data as T;
}

const API_BACKEND_DEV = "http://localhost:8787";
const API_BACKEND = "https://chordcove-backend.875159954.workers.dev";

const R2_BACKEND_DEV = "https://pub-c7e649783b8e4779a0bd3717e8fa77e4.r2.dev";
const R2_BACKEND = "https://r2.barnman.cc";

// 如果是在本地开发环境，使用 API_BACKEND_DEV，否则使用 API_BACKEND
export const API_BASE_URL =
  window.location.hostname === "localhost" ? API_BACKEND_DEV : API_BACKEND;
export const R2_BASE_URL = window.location.hostname === "localhost" ? R2_BACKEND_DEV : R2_BACKEND;
interface RefreshResponse {
  accessToken: string;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = store.getState().auth.refreshToken;

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const jsonResponse = (await response.json()) as ApiResponse<RefreshResponse>;
    if (!jsonResponse.success) {
      throw new Error(jsonResponse.error || "Failed to refresh token");
    }

    store.dispatch(setAccessToken(jsonResponse.data?.accessToken || ""));
    return jsonResponse.data?.accessToken || null;
  } catch {
    store.dispatch(logout());
    return null;
  }
}

/**
 * Fetches data from the API and handles the response
 * @param url The URL to fetch from
 * @param options Fetch options
 * @returns The data from the response
 */
export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = store.getState().auth.token;

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  let response = await fetch(url, options);

  // If we get a 401, try to refresh the token
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      // Retry the original request with the new token
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      };
      response = await fetch(url, options);
    }
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const jsonResponse = (await response.json()) as ApiResponse<T>;
  return handleApiResponse(jsonResponse);
}
