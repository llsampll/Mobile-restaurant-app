import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { searchRestaurants, YELP_MAX_RESULTS, type YelpBusiness } from './src/api/yelp';
import { RestaurantCard } from './src/components/RestaurantCard';
import { RestaurantDetail } from './src/components/RestaurantDetail';
import { SearchPanel, type SearchQuery } from './src/components/SearchPanel';
import { colors } from './src/theme';

export default function App() {
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [results, setResults] = useState<YelpBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<YelpBusiness | null>(null);
  // Bumped on each new search so responses from a superseded search are dropped.
  const searchId = useRef(0);

  const runSearch = useCallback(async (q: SearchQuery) => {
    const id = ++searchId.current;
    setQuery(q);
    setResults([]);
    setTotal(0);
    setError(null);
    setLoading(true);
    try {
      const page = await searchRestaurants(q);
      if (id !== searchId.current) return;
      setResults(page.businesses);
      setTotal(page.total);
    } catch (e) {
      if (id === searchId.current) setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      if (id === searchId.current) setLoading(false);
    }
  }, []);

  // Yelp only pages through the first 240 matches of any search.
  const reachable = Math.min(total, YELP_MAX_RESULTS);
  const hasMore = results.length < reachable;

  const loadMore = useCallback(async () => {
    if (!query || loading || loadingMore || !hasMore) return;
    const id = searchId.current;
    setLoadingMore(true);
    try {
      const page = await searchRestaurants({ ...query, offset: results.length });
      if (id !== searchId.current) return;
      setResults((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...page.businesses.filter((b) => !seen.has(b.id))];
      });
    } catch (e) {
      if (id === searchId.current) setError(e instanceof Error ? e.message : 'Could not load more.');
    } finally {
      setLoadingMore(false);
    }
  }, [query, loading, loadingMore, hasMore, results.length]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.titleBar}>
          <Text style={styles.title}>Nearby Eats</Text>
          <Text style={styles.subtitle}>Restaurants around any GPS location, rated by Yelp</Text>
        </View>

        <FlatList
          data={results}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <RestaurantCard business={item} onPress={setSelected} />}
          ListHeaderComponent={
            <>
              <SearchPanel searching={loading} onSearch={runSearch} />
              {query && !loading && !error && (
                <Text style={styles.count}>
                  {total === 0
                    ? 'No restaurants found in this area.'
                    : `${total.toLocaleString()} restaurant${total === 1 ? '' : 's'} found` +
                      (total > YELP_MAX_RESULTS ? ` (Yelp shows the top ${YELP_MAX_RESULTS})` : '')}
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
            results.length > 0 ? (
              loadingMore ? (
                <ActivityIndicator style={styles.spinner} color={colors.primary} />
              ) : error ? (
                <Text style={styles.error}>{error}</Text>
              ) : !hasMore ? (
                <Text style={styles.hint}>That's everything Yelp returned for this area.</Text>
              ) : null
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
        />

        <RestaurantDetail business={selected} onClose={() => setSelected(null)} />
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
