import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import catalog from '../data/troutFlies.json';
import { useFlyBox } from '../context/FlyBoxContext';

const catalogById = Object.fromEntries(catalog.map((c) => [c.catalogId, c]));

export default function BoxScreen() {
  const { entries, ready, removeEntry } = useFlyBox();

  const rows = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt),
    );
  }, [entries]);

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Min ask</Text>
        <Text style={styles.subtitle}>
          {entries.length === 0
            ? 'Inga flugor än – lägg till från katalogen.'
            : `${entries.length} ${entries.length === 1 ? 'fluga' : 'flugor'}`}
        </Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          rows.length === 0 ? styles.emptyList : styles.listContent
        }
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            Gå till fliken Katalog och tryck Lägg till på de flugor du vill ha här.
          </Text>
        }
        renderItem={({ item }) => {
          const meta = catalogById[item.catalogId];
          const name = meta?.name ?? item.catalogId;
          const hook = meta?.hookSize;
          const flyType = meta?.flyType;
          const hatch = meta?.hatch;
          return (
            <View style={styles.card}>
              <View style={styles.cardMain}>
                <Text style={styles.name}>{name}</Text>
                {(flyType || hatch) && (
                  <Text style={styles.meta}>
                    {[flyType, hatch].filter(Boolean).join(' · ')}
                  </Text>
                )}
                {hook != null && hook !== '' && (
                  <Text style={styles.hook}>Krok: {hook}</Text>
                )}
              </View>
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeEntry(item.id)}
                hitSlop={8}
              >
                <Text style={styles.removeLabel}>Ta bort</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#636366',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyHint: {
    textAlign: 'center',
    color: '#636366',
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMain: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  meta: {
    fontSize: 14,
    color: '#636366',
    marginTop: 4,
  },
  hook: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 4,
  },
  removeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  removeLabel: {
    color: '#ff3b30',
    fontWeight: '600',
    fontSize: 16,
  },
});
