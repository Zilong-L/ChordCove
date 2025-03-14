/**
 * API response interface that matches the backend structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  userId: number;
  accessToken: string;
  refreshToken: string;
} 