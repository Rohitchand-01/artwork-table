import type { ApiResponse } from '../types/artwork';

const BASE_URL = 'https://api.artic.edu/api/v1/artworks';

export const fetchArtworks = async (page: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${BASE_URL}?page=${page}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching artworks:', error);
    throw error;
  }
};
