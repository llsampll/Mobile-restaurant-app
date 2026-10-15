import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

interface Props {
  rating: number;
  reviewCount?: number;
  size?: number;
}

/** Five-star row with half-star support, matching Yelp's 0.5 rating increments. */
export function RatingStars({ rating, reviewCount, size = 16 }: Props) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <View style={styles.row} accessibilityLabel={`Yelp rating ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
        return (
          <View key={i} style={{ width: size, height: size * 1.2 }}>
            <Text style={[styles.star, { fontSize: size, color: colors.starEmpty }]}>★</Text>
            {fill > 0 && (
              <View style={[StyleSheet.absoluteFill, { width: size * fill, overflow: 'hidden' }]}>
                <Text style={[styles.star, { fontSize: size, color: colors.star }]}>★</Text>
              </View>
            )}
          </View>
        );
      })}
      <Text style={[styles.label, { fontSize: size * 0.85 }]}>
        {rating.toFixed(1)}
        {reviewCount != null ? ` (${reviewCount.toLocaleString()})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { includeFontPadding: false },
  label: { marginLeft: 6, color: colors.muted, fontWeight: '600' },
});
