import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Restaurant } from '../api/places';
import { colors } from '../theme';
import { describeRestaurant, formatDistance, formatOpeningHours } from '../utils/format';

interface Props {
  restaurant: Restaurant | null;
  onClose: () => void;
}

export function RestaurantDetail({ restaurant: r, onClose }: Props) {
  if (!r) return null;

  const hours = formatOpeningHours(r.openingHours);
  const mapsUrl = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(r.name)}@${r.latitude},${r.longitude}`,
    default: `geo:0,0?q=${r.latitude},${r.longitude}(${encodeURIComponent(r.name)})`,
  });
  const website = r.website && !/^https?:\/\//i.test(r.website) ? `https://${r.website}` : r.website;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {r.name}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.meta}>
              {[r.cuisines.join(', '), formatDistance(r.distance)].filter(Boolean).join(' · ')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.body}>{describeRestaurant(r)}</Text>
            {r.description && r.features.length > 0 && (
              <Text style={styles.muted}>Offers: {r.features.join(', ')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & contact</Text>
            {r.address ? <Text style={styles.body}>{r.address}</Text> : null}
            {r.phone ? <Text style={styles.body}>{r.phone}</Text> : null}
            <View style={styles.buttons}>
              {mapsUrl && <ActionButton label="Directions" primary onPress={() => Linking.openURL(mapsUrl)} />}
              {r.phone ? (
                <ActionButton
                  label="Call"
                  onPress={() => Linking.openURL(`tel:${r.phone!.split(';')[0].replace(/[^\d+]/g, '')}`)}
                />
              ) : null}
              {website ? <ActionButton label="Website" onPress={() => Linking.openURL(website)} /> : null}
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

          <Pressable onPress={() => Linking.openURL(r.osmUrl)}>
            <Text style={styles.attribution}>
              Data © OpenStreetMap contributors · Missing or wrong info? Edit it on OpenStreetMap
            </Text>
          </Pressable>
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
  muted: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 14, color: colors.muted },
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
  attribution: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20, marginHorizontal: 24 },
});
