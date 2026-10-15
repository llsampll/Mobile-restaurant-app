// Restaurant data from OpenStreetMap via the public Overpass API (free, no key).
// Docs: https://wiki.openstreetmap.org/wiki/Overpass_API

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/** Cap on results per search, to keep responses and the list a reasonable size. */
export const MAX_RESULTS = 500;

export type SortBy = 'distance' | 'name';

export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  /** Distance from the search point, in meters. */
  distance: number;
  cuisines: string[];
  /** Free-text description, when the OSM entry has one. */
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  /** Amenities such as takeout, delivery, outdoor seating. */
  features: string[];
  osmUrl: string;
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  sortBy: SortBy;
}

export interface SearchResult {
  restaurants: Restaurant[];
  /** True when the area had more than MAX_RESULTS restaurants. */
  truncated: boolean;
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export class PlacesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlacesError';
  }
}

export async function searchRestaurants(params: SearchParams): Promise<SearchResult> {
  const { latitude, longitude } = params;
  const radius = Math.round(params.radiusMeters);
  // Ask for one extra so we can tell whether the area was truncated.
  const query =
    `[out:json][timeout:25];` +
    `nwr["amenity"="restaurant"]["name"](around:${radius},${latitude},${longitude});` +
    `out center tags ${MAX_RESULTS + 1};`;

  let response: Response;
  try {
    response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: `data=${encodeURIComponent(query)}`,
    });
  } catch {
    throw new PlacesError('Network error. Check your connection and try again.');
  }
  if (response.status === 429 || response.status === 504) {
    throw new PlacesError('The map server is busy. Wait a moment and try again.');
  }
  if (!response.ok) {
    throw new PlacesError(`Restaurant search failed (${response.status}).`);
  }

  const body = (await response.json()) as { elements?: OverpassElement[] };
  const restaurants = (body.elements ?? [])
    .map((el) => toRestaurant(el, latitude, longitude))
    .filter((r): r is Restaurant => r !== null);

  // Overpass returns an arbitrary subset when truncated, so sort by distance
  // before cutting so the closest places are the ones kept.
  restaurants.sort((a, b) => a.distance - b.distance);
  const kept = restaurants.slice(0, MAX_RESULTS);
  if (params.sortBy === 'name') kept.sort((a, b) => a.name.localeCompare(b.name));
  return { restaurants: kept, truncated: restaurants.length > MAX_RESULTS };
}

const FEATURE_TAGS: [tag: string, label: string][] = [
  ['takeaway', 'takeout'],
  ['delivery', 'delivery'],
  ['outdoor_seating', 'outdoor seating'],
  ['reservation', 'reservations'],
  ['diet:vegetarian', 'vegetarian options'],
  ['diet:vegan', 'vegan options'],
  ['wheelchair', 'wheelchair access'],
];

export function toRestaurant(el: OverpassElement, fromLat: number, fromLng: number): Restaurant | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!tags.name || lat == null || lon == null) return null;

  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const cityLine = [tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(' ');
  const address = [street, cityLine].filter(Boolean).join(', ') || undefined;

  return {
    id: `${el.type}/${el.id}`,
    name: tags.name,
    latitude: lat,
    longitude: lon,
    distance: haversineMeters(fromLat, fromLng, lat, lon),
    cuisines: (tags.cuisine ?? '')
      .split(/[;,]/)
      .map((c) => c.trim().replace(/_/g, ' '))
      .filter(Boolean)
      .map((c) => c[0].toUpperCase() + c.slice(1)),
    description: tags.description,
    address,
    phone: tags.phone ?? tags['contact:phone'],
    website: tags.website ?? tags['contact:website'],
    openingHours: tags.opening_hours,
    features: FEATURE_TAGS.filter(([tag]) => ['yes', 'only', 'limited'].includes(tags[tag])).map(
      ([, label]) => label,
    ),
    osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
