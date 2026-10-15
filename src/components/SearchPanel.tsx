import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { YELP_MAX_RADIUS_METERS, type SortBy } from '../api/yelp';
import { colors } from '../theme';
import { parseCoordinate } from '../utils/format';

export interface SearchQuery {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  sortBy: SortBy;
}

const RADIUS_MILES = [1, 3, 5, 10, 25];
const SORTS: { value: SortBy; label: string }[] = [
  { value: 'best_match', label: 'Best match' },
  { value: 'rating', label: 'Rating' },
  { value: 'distance', label: 'Distance' },
  { value: 'review_count', label: 'Most reviewed' },
];

interface Props {
  searching: boolean;
  onSearch: (query: SearchQuery) => void;
}

export function SearchPanel({ searching, onSearch }: Props) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [address, setAddress] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [sortBy, setSortBy] = useState<SortBy>('best_match');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const radiusMeters = Math.min(radiusMiles * 1609.344, YELP_MAX_RADIUS_METERS);

  function submit(latitude: number, longitude: number) {
    setError(null);
    onSearch({ latitude, longitude, radiusMeters, sortBy });
  }

  async function useMyLocation() {
    setError(null);
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission was denied. Enter coordinates instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
      submit(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  }

  async function lookUpAddress() {
    if (!address.trim()) return;
    setError(null);
    setLocating(true);
    try {
      const [match] = await Location.geocodeAsync(address.trim());
      if (!match) {
        setError(`Couldn't find "${address.trim()}".`);
        return;
      }
      setLat(match.latitude.toFixed(6));
      setLng(match.longitude.toFixed(6));
      submit(match.latitude, match.longitude);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Address lookup failed.');
    } finally {
      setLocating(false);
    }
  }

  function searchCoordinates() {
    const latitude = parseCoordinate(lat, 'lat');
    const longitude = parseCoordinate(lng, 'lng');
    if (latitude == null || longitude == null) {
      setError('Enter a latitude between -90 and 90 and a longitude between -180 and 180.');
      return;
    }
    submit(latitude, longitude);
  }

  const busy = searching || locating;

  return (
    <View style={styles.panel}>
      <Pressable
        onPress={useMyLocation}
        disabled={busy}
        style={({ pressed }) => [styles.primaryButton, (pressed || busy) && styles.dimmed]}
        accessibilityRole="button"
      >
        {locating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>📍 Use my current location</Text>
        )}
      </Pressable>

      {/* Address geocoding is only provided by the native iOS/Android location services. */}
      {Platform.OS !== 'web' && (
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="Or search an address or city"
            placeholderTextColor={colors.muted}
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={lookUpAddress}
            returnKeyType="search"
          />
          <SmallButton label="Go" onPress={lookUpAddress} disabled={busy} />
        </View>
      )}

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder="Latitude"
          placeholderTextColor={colors.muted}
          value={lat}
          onChangeText={setLat}
          keyboardType="numbers-and-punctuation"
        />
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder="Longitude"
          placeholderTextColor={colors.muted}
          value={lng}
          onChangeText={setLng}
          keyboardType="numbers-and-punctuation"
          onSubmitEditing={searchCoordinates}
          returnKeyType="search"
        />
        <SmallButton label="Search" onPress={searchCoordinates} disabled={busy} />
      </View>

      <ChipRow
        label="Radius"
        options={RADIUS_MILES.map((m) => ({ value: m, label: `${m} mi` }))}
        selected={radiusMiles}
        onSelect={setRadiusMiles}
      />
      <ChipRow label="Sort" options={SORTS} selected={sortBy} onSelect={setSortBy} />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function SmallButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.smallButton, (pressed || disabled) && styles.dimmed]}
      accessibilityRole="button"
    >
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function ChipRow<T extends string | number>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      <Text style={styles.chipLabel}>{label}</Text>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onSelect(o.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  smallButton: {
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dimmed: { opacity: 0.6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chipLabel: { fontSize: 13, color: colors.muted, fontWeight: '600', width: 48 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  error: { color: colors.primary, fontSize: 13 },
});
