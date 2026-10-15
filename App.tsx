import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MAX_RESULTS, searchRestaurants, type Restaurant } from './src/api/places';
import { RestaurantCard } from './src/components/RestaurantCard';
import { RestaurantDetail } from './src/components/RestaurantDetail';
import { SearchPanel, type SearchQuery } from './src/components/SearchPanel';
import { colors } from './src/theme';

export default function App() {
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  // Bumped on each new search so responses from a superseded search are dropped.
  const searchId = useRef(0);

  const runSearch = useCallback(async (q: SearchQuery) => {
    const id = ++searchId.current;
    setQuery(q);
    setResults([]);
    setTruncated(false);
    setError(null);
    setLoading(true);
    try {
      const result = await searchRestaurants(q);
      if (id !== searchId.current) return;
      setResults(result.restaurants);
      setTruncated(result.truncated);
    } catch (e) {
      if (id === searchId.current) setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      if (id === searchId.current) setLoading(false);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.titleBar}>
          <Text style={styles.title}>Nearby Eats</Text>
          <Text style={styles.subtitle}>Restaurants around any GPS location</Text>
        </View>

        <FlatList
          data={results}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} onPress={setSelected} />}
          ListHeaderComponent={
            <>
              <SearchPanel searching={loading} onSearch={runSearch} />
              {query && !loading && !error && (
                <Text style={styles.count}>
                  {results.length === 0
                    ? 'No restaurants found in this area. Try a larger radius.'
                    : truncated
                      ? `Showing the ${MAX_RESULTS} closest restaurants. Use a smaller radius to narrow it down.`
                      : `${results.length} restaurant${results.length === 1 ? '' : 's'} found`}
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.spinner} size="large" color={colors.primary} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : !query ? (
              <Text style={styles.hint}>
                Use your location, an address, or enter coordinates to find restaurants nearby.
              </Text>
            ) : null
          }
          ListFooterComponent={
            results.length > 0 ? <Text style={styles.hint}>Data © OpenStreetMap contributors</Text> : null
          }
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
        />

        <RestaurantDetail restaurant={selected} onClose={() => setSelected(null)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titleBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.surface },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  list: { paddingBottom: 32 },
  count: { marginHorizontal: 16, marginVertical: 12, fontSize: 13, color: colors.muted, fontWeight: '600' },
  spinner: { marginVertical: 24 },
  hint: { textAlign: 'center', color: colors.muted, marginHorizontal: 32, marginVertical: 24, lineHeight: 20 },
  error: { textAlign: 'center', color: colors.primary, marginHorizontal: 24, marginVertical: 24 },
});
