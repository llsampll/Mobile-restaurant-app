import type { YelpBusiness, YelpHours } from '../api/yelp';

const METERS_PER_MILE = 1609.344;

export function formatDistance(meters?: number): string | null {
  if (meters == null) return null;
  const miles = meters / METERS_PER_MILE;
  return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(1)} mi`;
}

const PRICE_WORDS: Record<string, string> = {
  $: 'inexpensive',
  $$: 'moderately priced',
  $$$: 'pricey',
  $$$$: 'upscale',
};

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function ratingPhrase(rating: number): string {
  if (rating >= 4.5) return 'Highly rated';
  if (rating >= 4) return 'Well reviewed';
  if (rating >= 3) return 'Decently reviewed';
  return 'Mixed reviews';
}

/**
 * Yelp's API doesn't return a free-text description, so build a readable one
 * from the structured fields it does return.
 */
export function describeBusiness(b: YelpBusiness): string {
  const cuisines = b.categories.map((c) => c.title);
  const cuisineText = cuisines.length ? joinList(cuisines.slice(0, 3)) : 'restaurant';
  const priceText = b.price ? PRICE_WORDS[b.price] : undefined;
  const phrase = `${priceText ? `${priceText} ` : ''}${cuisineText} spot`;
  const area = b.location.display_address[b.location.display_address.length - 1];
  let sentence = `${/^[aeiou]/i.test(phrase) ? 'An' : 'A'} ${phrase}${area ? ` in ${area}` : ''}.`;

  if (b.review_count > 0) {
    sentence += ` ${ratingPhrase(b.rating)} with ${b.rating.toFixed(1)} stars across ${b.review_count.toLocaleString()} Yelp review${b.review_count === 1 ? '' : 's'}.`;
  } else {
    sentence += ' No Yelp reviews yet.';
  }

  const services = (b.transactions ?? []).map((t) => (t === 'restaurant_reservation' ? 'reservations' : t));
  if (services.length) {
    sentence += ` Offers ${joinList(services)}.`;
  }
  return sentence;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTime(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  const m = hhmm.slice(2);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === '00' ? `${h12}${suffix}` : `${h12}:${m}${suffix}`;
}

/** Collapse Yelp's hours array into one line per day, e.g. "Mon: 11am–2pm, 5pm–10pm". */
export function formatHours(hours?: YelpHours[]): string[] {
  const regular = hours?.[0];
  if (!regular) return [];
  return DAYS.map((day, i) => {
    const slots = regular.open
      .filter((o) => o.day === i)
      .map((o) => `${formatTime(o.start)}–${formatTime(o.end)}`);
    return `${day}: ${slots.length ? slots.join(', ') : 'Closed'}`;
  });
}

export function parseCoordinate(text: string, kind: 'lat' | 'lng'): number | null {
  const value = Number(text.trim());
  if (text.trim() === '' || !Number.isFinite(value)) return null;
  const limit = kind === 'lat' ? 90 : 180;
  return Math.abs(value) <= limit ? value : null;
}
