import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import catalog from '../data/troutFlies.json';
import { useFlyBox } from '../context/FlyBoxContext';
import { catalogTheme as t } from '../constants/catalogTheme';
import { classifyFlyType } from '../utils/classifyFlyType';

export default function CatalogFlyListScreen({ route }) {
  const { flyType } = route.params;
  const { ready, addFromCatalog, hasInBox } = useFlyBox();

  const items = useMemo(() => {
    const list = catalog.filter((row) => classifyFlyType(row) === flyType);
    return list.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [flyType]);

  if (!ready) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.catalogId}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="file-tray-outline" size={44} color={t.textMuted} />
          <Text style={styles.empty}>Inga flugor i den här kategorin.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.gridCell}>
          <FlyCard
            item={item}
            inBox={hasInBox(item.catalogId)}
            onAdd={() => addFromCatalog(item.catalogId)}
          />
        </View>
      )}
    />
  );
}

function FlyCard({ item, inBox, onAdd }) {
  return (
    <View style={styles.card}>
      <View style={styles.accentTop} />
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={3}>
          {item.name}
        </Text>
        {item.hatch ? (
          <Text style={styles.meta} numberOfLines={2}>
            {item.hatch}
          </Text>
        ) : null}
        {item.hookSize != null && item.hookSize !== '' && (
          <View style={styles.hookRow}>
            <Ionicons name="link-outline" size={13} color={t.textMuted} />
            <Text style={styles.hook}> Krok {item.hookSize}</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            inBox && styles.buttonDisabled,
            pressed && !inBox && styles.buttonPressed,
          ]}
          onPress={onAdd}
          disabled={inBox}
        >
          <Text style={[styles.buttonLabel, inBox && styles.buttonLabelDisabled]}>
            {inBox ? 'I asken' : 'Lägg till'}
          </Text>
          {!inBox ? (
            <Ionicons name="add" size={16} color={t.onPrimary} style={styles.buttonIcon} />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: t.bg,
  },
  gridRow: {
    marginBottom: 12,
    gap: 12,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: t.card,
    borderWidth: 1,
    borderColor: t.cardBorder,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  accentTop: {
    height: 4,
    backgroundColor: t.primaryLight,
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: t.text,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: t.textSecondary,
    marginTop: 6,
    lineHeight: 16,
  },
  hookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  hook: {
    fontSize: 12,
    color: t.textMuted,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.primary,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 11,
    marginTop: 12,
    gap: 4,
  },
  buttonPressed: {
    backgroundColor: t.primaryLight,
  },
  buttonDisabled: {
    backgroundColor: t.accentSoft,
  },
  buttonLabel: {
    color: t.onPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  buttonLabelDisabled: {
    color: t.textMuted,
  },
  buttonIcon: {
    marginLeft: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    width: '100%',
  },
  empty: {
    textAlign: 'center',
    color: t.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
});
