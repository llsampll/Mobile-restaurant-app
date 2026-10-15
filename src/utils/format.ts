import type { Restaurant } from '../api/places';

const METERS_PER_MILE = 1609.344;

export function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  const miles = meters / METERS_PER_MILE;
  return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(1)} mi`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Use the place's own description when it has one; otherwise build one from its tags. */
export function describeRestaurant(r: Restaurant): string {
  if (r.description) return r.description;

  const cuisineText = r.cuisines.length ? joinList(r.cuisines.slice(0, 3)) : '';
  const phrase = cuisineText ? `${cuisineText} restaurant` : 'restaurant';
  let sentence = `${/^[aeiou]/i.test(phrase) ? 'An' : 'A'} ${phrase}`;
  sentence += r.address ? ` at ${r.address}.` : '.';
  if (r.features.length) sentence += ` Offers ${joinList(r.features)}.`;
  return sentence;
}

/** OSM opening_hours strings separate rules with ";", e.g. "Mo-Fr 11:00-22:00; Sa 12:00-23:00". */
export function formatOpeningHours(hours?: string): string[] {
  if (!hours) return [];
  return hours
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCoordinate(text: string, kind: 'lat' | 'lng'): number | null {
  const value = Number(text.trim());
  if (text.trim() === '' || !Number.isFinite(value)) return null;
  const limit = kind === 'lat' ? 90 : 180;
  return Math.abs(value) <= limit ? value : null;
}
