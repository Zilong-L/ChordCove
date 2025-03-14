import { ApiResponse } from '@/types/api';

/**
 * Handles API responses with the new structure that includes a .data property
 * @param response The JSON response from the API
 * @returns The data from the response
 */
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || 'An unknown error occurred');
  }
  
  return response.data as T;
}

/**
 * Fetches data from the API and handles the response
 * @param url The URL to fetch from
 * @param options Fetch options
 * @returns The data from the response
 */
export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const jsonResponse = await response.json() as ApiResponse<T>;
  
  if (!response.ok) {
    throw new Error(jsonResponse.error || 'An unknown error occurred');
  }
  
  return handleApiResponse(jsonResponse);
} 