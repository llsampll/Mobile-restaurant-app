# Nearby Eats

A React Native (Expo) mobile app that lists the restaurants around any GPS location, with a short description of each place and its Yelp rating.

## Features

- **Pick a location** — use your phone's GPS, type an address or city, or enter latitude/longitude directly.
- **Radius and sort** — search 1–25 miles around the point, sorted by best match, rating, distance, or review count.
- **Restaurant list** — photo, name, Yelp star rating and review count, price, distance, and a generated description. More results load as you scroll.
- **Detail view** — photo gallery, open/closed status, weekly hours, address and phone, review excerpts (when your Yelp plan includes them), and buttons for directions, calling, and opening the Yelp page.

## Setup

1. Get a Yelp Fusion API key at <https://www.yelp.com/developers/v3/manage_app>.
2. Add it to a git-ignored env file:
   ```bash
   cp .env.example .env.local
   # then edit .env.local and set EXPO_PUBLIC_YELP_API_KEY=...
   ```
3. Install and run:
   ```bash
   npm install
   npx expo start
   ```
   Scan the QR code with **Expo Go** on your phone, or press `i` / `a` for an iOS simulator / Android emulator.

> The app targets iOS and Android. The web build loads, but Yelp's API doesn't allow browser (CORS) requests, so searches fail there.

## Notes and limitations

- **Descriptions:** Yelp's API doesn't return a written description, so the app builds one from Yelp's data: cuisine categories, price level, neighborhood, rating, review count, and delivery/pickup options.
- **"All" restaurants:** Yelp returns at most 240 results per search. For dense areas, use a smaller radius to see everything.
- **API key security:** `EXPO_PUBLIC_*` variables are bundled into the app, so anyone with the app binary can extract the key. That's fine for personal use and development. Before publishing, move the Yelp calls behind your own small backend (for example a serverless function) and point `src/api/yelp.ts` at it.
- **Yelp display rules:** if you publish the app, check Yelp's [display requirements](https://docs.developer.yelp.com/docs/display-requirements); they may require Yelp's official star images and logo.

## Project layout

```
App.tsx                         Main screen: search panel + results list
src/api/yelp.ts                 Yelp Fusion client (search, details, reviews)
src/components/SearchPanel.tsx  GPS / address / coordinate input, radius & sort
src/components/RestaurantCard.tsx
src/components/RestaurantDetail.tsx
src/components/RatingStars.tsx
src/utils/format.ts             Description builder, hours/distance formatting
```

## Scripts

```bash
npm start           # Expo dev server
npm run typecheck   # TypeScript check
```
