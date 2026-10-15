# Nearby Eats

A React Native (Expo) mobile app that lists the restaurants around any GPS location, with a short description of each place. Restaurant data comes from [OpenStreetMap](https://www.openstreetmap.org), so it's free and needs no API key.

## Features

- **Pick a location** — use your phone's GPS, type an address or city, or enter latitude/longitude directly.
- **Radius and sort** — search 0.5–10 miles around the point, sorted by distance or name.
- **Restaurant list** — name, cuisine, distance, and a description.
- **Detail view** — description, address, phone, opening hours, and buttons for directions, calling, and the restaurant's website.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone (Camera app on iPhone, Expo Go's scanner on Android), or press `i` / `a` for an iOS simulator / Android emulator. If your phone can't connect, use `npx expo start --tunnel`. The web build (`w`) works too, except for address search.

## Notes

- **Descriptions:** when an OpenStreetMap entry has its own description, the app shows it. Otherwise it builds one from the place's cuisine, address, and amenities (takeout, delivery, outdoor seating, vegetarian options and so on).
- **Coverage:** OpenStreetMap is edited by volunteers. Cities are usually well mapped, but some restaurants may be missing or have little detail. Anyone can add or fix them at openstreetmap.org; the detail screen links to each place's entry.
- **Result cap:** a search returns at most the 500 closest restaurants.
- **Server limits:** searches use the free public Overpass API (`overpass-api.de`). It's rate-limited and can be slow at busy times; for a published app with many users, consider a paid or self-hosted Overpass instance.
- **Attribution:** OpenStreetMap's license requires crediting "© OpenStreetMap contributors", which the app does.

## Project layout

```
App.tsx                         Main screen: search panel + results list
src/api/places.ts               OpenStreetMap / Overpass restaurant search
src/components/SearchPanel.tsx  GPS / address / coordinate input, radius & sort
src/components/RestaurantCard.tsx
src/components/RestaurantDetail.tsx
src/utils/format.ts             Description builder, hours/distance formatting
```

## Scripts

```bash
npm start           # Expo dev server
npm run typecheck   # TypeScript check
```
