import type { ArtworkResponse } from '../types/artwork';

const API_BASE_URL = 'https://api.artic.edu/api/v1/artworks';
const ITEMS_PER_PAGE = 12;

export const fetchArtworks = async (page: number = 1): Promise<ArtworkResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    fields: 'id,title,place_of_origin,artist_display,inscriptions,date_start,date_end' 
  });

  const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data: ArtworkResponse = await response.json();
  return data;
};