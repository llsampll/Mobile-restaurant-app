// Thin client for the Yelp Fusion API.
// Docs: https://docs.developer.yelp.com/reference/v3_business_search

const YELP_BASE_URL = 'https://api.yelp.com/v3';

/** Yelp rejects requests where offset + limit exceeds this value. */
export const YELP_MAX_RESULTS = 240;
/** Largest search radius Yelp accepts, in meters. */
export const YELP_MAX_RADIUS_METERS = 40000;
export const YELP_PAGE_SIZE = 50;

export type SortBy = 'best_match' | 'rating' | 'review_count' | 'distance';

export interface YelpCategory {
  alias: string;
  title: string;
}

export interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  is_closed: boolean;
  review_count: number;
  rating: number;
  price?: string;
  categories: YelpCategory[];
  coordinates: { latitude: number; longitude: number };
  location: { display_address: string[] };
  display_phone: string;
  /** Distance from the search point, in meters. */
  distance?: number;
  transactions?: string[];
}

export interface YelpHours {
  is_open_now: boolean;
  open: { day: number; start: string; end: string; is_overnight: boolean }[];
}

export interface YelpBusinessDetails extends YelpBusiness {
  photos?: string[];
  hours?: YelpHours[];
}

export interface YelpReview {
  id: string;
  text: string;
  rating: number;
  time_created: string;
  user: { name: string };
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  sortBy: SortBy;
  offset?: number;
}

export interface SearchResult {
  businesses: YelpBusiness[];
  total: number;
}

export class YelpError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'YelpError';
  }
}

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_YELP_API_KEY;
  if (!key) {
    throw new YelpError(
      'Missing Yelp API key. Add EXPO_PUBLIC_YELP_API_KEY to .env.local and restart Expo.',
    );
  }
  return key;
}

async function yelpGet<T>(path: string, query: Record<string, string | number> = {}): Promise<T> {
  const qs = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const response = await fetch(`${YELP_BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${getApiKey()}`, Accept: 'application/json' },
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.description ?? '';
    } catch {
      // Body wasn't JSON; fall back to the status text.
    }
    if (response.status === 401) {
      throw new YelpError('Yelp rejected the API key. Check EXPO_PUBLIC_YELP_API_KEY.', 401);
    }
    if (response.status === 429) {
      throw new YelpError('Yelp rate limit reached. Try again later.', 429);
    }
    throw new YelpError(detail || `Yelp request failed (${response.status})`, response.status);
  }
  return (await response.json()) as T;
}

export async function searchRestaurants(params: SearchParams): Promise<SearchResult> {
  const offset = params.offset ?? 0;
  const limit = Math.min(YELP_PAGE_SIZE, YELP_MAX_RESULTS - offset);
  if (limit <= 0) return { businesses: [], total: 0 };

  const result = await yelpGet<SearchResult>('/businesses/search', {
    latitude: params.latitude,
    longitude: params.longitude,
    radius: Math.min(Math.round(params.radiusMeters), YELP_MAX_RADIUS_METERS),
    categories: 'restaurants',
    sort_by: params.sortBy,
    limit,
    offset,
  });
  return { businesses: result.businesses ?? [], total: result.total ?? 0 };
}

export function getBusinessDetails(id: string): Promise<YelpBusinessDetails> {
  return yelpGet<YelpBusinessDetails>(`/businesses/${encodeURIComponent(id)}`);
}

/** Review excerpts aren't available on every Yelp plan, so callers should treat failure as "no reviews". */
export async function getReviews(id: string): Promise<YelpReview[]> {
  const result = await yelpGet<{ reviews: YelpReview[] }>(
    `/businesses/${encodeURIComponent(id)}/reviews`,
    { limit: 3, sort_by: 'yelp_sort' },
  );
  return result.reviews ?? [];
}
