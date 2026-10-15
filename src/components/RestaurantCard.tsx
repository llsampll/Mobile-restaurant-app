import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Restaurant } from '../api/places';
import { colors } from '../theme';
import { describeRestaurant, formatDistance } from '../utils/format';

interface Props {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onPress }: Props) {
  const meta = [restaurant.cuisines.slice(0, 2).join(', '), formatDistance(restaurant.distance)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() => onPress(restaurant)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>🍽️</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <Text style={styles.description} numberOfLines={3}>
          {describeRestaurant(restaurant)}
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
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 26 },
  body: { flex: 1, marginLeft: 12, gap: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  description: { fontSize: 13, color: colors.text, lineHeight: 18 },
});
