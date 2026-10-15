import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { YelpBusiness } from '../api/yelp';
import { colors } from '../theme';
import { describeBusiness, formatDistance } from '../utils/format';
import { RatingStars } from './RatingStars';

interface Props {
  business: YelpBusiness;
  onPress: (business: YelpBusiness) => void;
}

export function RestaurantCard({ business, onPress }: Props) {
  const distance = formatDistance(business.distance);
  const meta = [business.price, distance].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => onPress(business)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {business.image_url ? (
        <Image source={{ uri: business.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {business.name}
        </Text>
        <RatingStars rating={business.rating} reviewCount={business.review_count} size={14} />
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.description} numberOfLines={3}>
          {describeBusiness(business)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  image: { width: 88, height: 88, borderRadius: 8, backgroundColor: colors.border },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 32 },
  body: { flex: 1, marginLeft: 12, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  description: { fontSize: 13, color: colors.text, lineHeight: 18 },
});
