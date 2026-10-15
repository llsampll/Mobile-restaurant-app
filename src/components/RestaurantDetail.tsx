import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getBusinessDetails,
  getReviews,
  type YelpBusiness,
  type YelpBusinessDetails,
  type YelpReview,
} from '../api/yelp';
import { colors } from '../theme';
import { describeBusiness, formatDistance, formatHours } from '../utils/format';
import { RatingStars } from './RatingStars';

interface Props {
  business: YelpBusiness | null;
  onClose: () => void;
}

export function RestaurantDetail({ business, onClose }: Props) {
  const [details, setDetails] = useState<YelpBusinessDetails | null>(null);
  const [reviews, setReviews] = useState<YelpReview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    setDetails(null);
    setReviews([]);
    setLoading(true);
    // Details and reviews are extras on top of the search result, so a failure
    // here just means we show less, not an error screen.
    Promise.allSettled([getBusinessDetails(business.id), getReviews(business.id)]).then(
      ([d, r]) => {
        if (cancelled) return;
        if (d.status === 'fulfilled') setDetails(d.value);
        if (r.status === 'fulfilled') setReviews(r.value);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [business]);

  if (!business) return null;

  const b = details ?? business;
  const photos = details?.photos?.length ? details.photos : b.image_url ? [b.image_url] : [];
  const hours = formatHours(details?.hours);
  const openNow = details?.hours?.[0]?.is_open_now;
  const { latitude, longitude } = b.coordinates;
  const mapsUrl = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(b.name)}@${latitude},${longitude}`,
    default: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(b.name)})`,
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {b.name}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
              {photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          )}

          <View style={styles.section}>
            <RatingStars rating={b.rating} reviewCount={b.review_count} size={22} />
            <Text style={styles.meta}>
              {[b.price, b.categories.map((c) => c.title).join(', '), formatDistance(b.distance)]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {openNow != null && (
              <Text style={[styles.openNow, { color: openNow ? colors.success : colors.primary }]}>
                {openNow ? 'Open now' : 'Closed now'}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{describeBusiness(b)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & contact</Text>
            <Text style={styles.body}>{b.location.display_address.join('\n')}</Text>
            {b.display_phone ? <Text style={styles.body}>{b.display_phone}</Text> : null}
            <View style={styles.buttons}>
              {mapsUrl && <ActionButton label="Directions" onPress={() => Linking.openURL(mapsUrl)} />}
              {b.display_phone ? (
                <ActionButton
                  label="Call"
                  onPress={() => Linking.openURL(`tel:${b.display_phone.replace(/[^\d+]/g, '')}`)}
                />
              ) : null}
              <ActionButton label="View on Yelp" primary onPress={() => Linking.openURL(b.url)} />
            </View>
          </View>

          {hours.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hours</Text>
              {hours.map((line) => (
                <Text key={line} style={styles.body}>
                  {line}
                </Text>
              ))}
            </View>
          )}

          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What people say</Text>
              {reviews.map((r) => (
                <View key={r.id} style={styles.review}>
                  <RatingStars rating={r.rating} size={12} />
                  <Text style={styles.body}>“{r.text}”</Text>
                  <Text style={styles.reviewer}>— {r.user.name}</Text>
                </View>
              ))}
            </View>
          )}

          {loading && <ActivityIndicator style={styles.loading} color={colors.primary} />}
          <Text style={styles.attribution}>Ratings and data provided by Yelp</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ActionButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary && styles.buttonPrimary, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  close: { fontSize: 16, color: colors.primary, fontWeight: '600', marginLeft: 12 },
  content: { paddingBottom: 32 },
  photos: { paddingVertical: 12, paddingLeft: 16 },
  photo: { width: 260, height: 180, borderRadius: 10, marginRight: 10, backgroundColor: colors.border },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  openNow: { fontSize: 14, fontWeight: '700' },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  buttonTextPrimary: { color: '#fff' },
  review: { gap: 4, paddingVertical: 6 },
  reviewer: { fontSize: 13, color: colors.muted },
  loading: { marginTop: 16 },
  attribution: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});
