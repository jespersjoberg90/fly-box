import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import catalog from '../data/troutFlies.json';
import { useFlyBox } from '../context/FlyBoxContext';
import { catalogTheme as t, categoryIconName } from '../constants/catalogTheme';
import {
  classifyFlyType,
  FLY_TYPE_ORDER,
  groupByFlyType,
} from '../utils/classifyFlyType';

function normalize(s) {
  return s.toLowerCase().trim();
}

export default function CatalogCategoriesScreen({ navigation }) {
  const { ready } = useFlyBox();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return catalog;
    return catalog.filter((row) => {
      const type = classifyFlyType(row);
      const blob = [row.name, type, row.hatch, row.hookSize ?? '']
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [query]);

  const categories = useMemo(() => {
    const groups = groupByFlyType(filtered);
    return FLY_TYPE_ORDER.filter((ty) => (groups.get(ty)?.length ?? 0) > 0).map(
      (flyType) => ({
        flyType,
        count: groups.get(flyType).length,
      }),
    );
  }, [filtered]);

  if (!ready) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <Ionicons name="fish-outline" size={16} color={t.primaryLight} />
            <Text style={styles.heroBadgeText}>Öring</Text>
          </View>
        </View>
        <Text style={styles.title}>Katalog</Text>
        <Text style={styles.subtitle}>
          Bläddra per flugtyp – allt du behöver vid vattnet.
        </Text>
        <View style={styles.searchWrap}>
          <Ionicons
            name="search"
            size={20}
            color={t.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Sök namn eller typ…"
            placeholderTextColor={t.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.flyType}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="trail-sign-outline" size={48} color={t.textMuted} />
            <Text style={styles.empty}>Inga träffar. Prova ett annat sökord.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridCell}>
            <Pressable
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
              ]}
              onPress={() =>
                navigation.navigate('CatalogFlyList', { flyType: item.flyType })
              }
            >
              <View style={styles.iconCircle}>
                <Ionicons
                  name={categoryIconName(item.flyType)}
                  size={28}
                  color={t.primary}
                />
              </View>
              <Text style={styles.categoryTitle} numberOfLines={2}>
                {item.flyType}
              </Text>
              <Text style={styles.categoryCount}>
                {item.count} {item.count === 1 ? 'fluga' : 'flugor'}
              </Text>
              <View style={styles.categoryFooter}>
                <Text style={styles.categoryCta}>Visa</Text>
                <Ionicons name="chevron-forward" size={16} color={t.primaryLight} />
              </View>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: t.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: t.iconBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.cardBorder,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.primary,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: t.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: t.textSecondary,
    marginBottom: 18,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.searchBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.cardBorder,
    paddingLeft: 14,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 14,
    fontSize: 16,
    color: t.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  gridRow: {
    marginBottom: 12,
    gap: 12,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  categoryCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: t.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 168,
    borderWidth: 1,
    borderColor: t.cardBorder,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: t.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: t.text,
    letterSpacing: -0.2,
    textAlign: 'center',
    width: '100%',
  },
  categoryCount: {
    fontSize: 13,
    color: t.textMuted,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 12,
    gap: 4,
  },
  categoryCta: {
    fontSize: 13,
    fontWeight: '600',
    color: t.primaryLight,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  empty: {
    textAlign: 'center',
    color: t.textSecondary,
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
  },
});
