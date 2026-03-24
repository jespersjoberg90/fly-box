import { useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { PieChart } from 'react-native-chart-kit';
import flies from './data/troutFlies.json';
import { theme } from './theme';
import { fetchOpenWeatherSummary } from './services';
import { getRecommendedFlies } from './hatchGuide';
import { identifyFliesFromImage } from './lib/vision';
import { mapToInternalFlyCategory } from './lib/flyCategoryMap';

const Tab = createBottomTabNavigator();

function classifyFlyType(item) {
  const name = `${item.name} ${item.catalogId}`.toLowerCase();
  if (/caddis|elk|sedge|klink|emerger/.test(name)) return 'Caddis';
  if (/mayfly|dun|adams|spinner|ephemer/.test(name)) return 'Mayfly';
  if (/nymph|perdigon|pheasant|stone|scud/.test(name)) return 'Nymph';
  if (/streamer|woolly|zonker/.test(name)) return 'Streamer';
  return 'Other';
}

export default function App() {
  const [flyBoxes, setFlyBoxes] = useState([
    { id: '1', name: 'Öringask Vår', lastScanAt: null, detected: [] },
    { id: '2', name: 'Nymfask Älv', lastScanAt: null, detected: [] },
  ]);
  const [logs, setLogs] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    { id: 'm1', role: 'assistant', text: 'Hej! Fråga mig om ask, loggbok eller hatch-guide.' },
  ]);

  const appState = useMemo(
    () => ({
      flyBoxes,
      logs,
      chatHistory,
      addChatMessage: (message) =>
        setChatHistory((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ...message }]),
      saveLog: (entry) =>
        setLogs((prev) => [{ id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString(), ...entry }, ...prev]),
      saveScan: (boxId, detected) =>
        setFlyBoxes((prev) =>
          prev.map((box) =>
            box.id === boxId ? { ...box, lastScanAt: new Date().toISOString(), detected } : box,
          ),
        ),
    }),
    [flyBoxes, logs, chatHistory],
  );

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: theme.text,
            tabBarInactiveTintColor: theme.textMuted,
            tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
            tabBarIcon: ({ color, size }) => {
              const icons = {
                Index: 'chatbubbles-outline',
                FlyBox: 'cube-outline',
                Log: 'book-outline',
                Stats: 'stats-chart-outline',
              };
              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Index">{() => <IndexScreen state={appState} />}</Tab.Screen>
          <Tab.Screen name="FlyBox">{() => <FlyBoxScreen state={appState} />}</Tab.Screen>
          <Tab.Screen name="Log">{() => <LogScreen state={appState} />}</Tab.Screen>
          <Tab.Screen name="Stats">{() => <StatsScreen state={appState} />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

function ScreenWrap({ children }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

function IndexScreen({ state }) {
  const [input, setInput] = useState('');
  const recommendations = getRecommendedFlies({ month: new Date().getMonth() + 1, weatherMain: 'Clear' });

  const send = () => {
    const text = input.trim();
    if (!text) return;
    state.addChatMessage({ role: 'user', text });
    const reply = `Du har ${state.flyBoxes.length} askar, ${state.logs.length} loggar och hatch-guide tips: ${recommendations.join(', ')}.`;
    state.addChatMessage({ role: 'assistant', text: reply });
    setInput('');
  };

  return (
    <ScreenWrap>
      <Text style={styles.title}>Index (AI Hub)</Text>
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {state.chatHistory.map((msg) => (
          <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
            <Text style={styles.bubbleText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Fråga appens AI-hub..."
          placeholderTextColor={theme.textMuted}
          style={styles.input}
        />
        <Pressable style={styles.btn} onPress={send}>
          <Text style={styles.btnText}>Skicka</Text>
        </Pressable>
      </View>
    </ScreenWrap>
  );
}

function FlyBoxScreen({ state }) {
  const [selectedBoxId, setSelectedBoxId] = useState(state.flyBoxes[0]?.id ?? null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);
  const current = state.flyBoxes.find((box) => box.id === selectedBoxId);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Kamera saknas', 'Tillåt kamera för att skanna ask.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const snap = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      const uri = snap?.uri;
      if (!uri) return;

      const detected = await identifyFliesFromImage(uri);
      const internalCategories = [
        ...new Set(detected.map((item) => mapToInternalFlyCategory(item.category))),
      ];

      state.saveScan(selectedBoxId, internalCategories);
      setShowCamera(false);
      Alert.alert(
        'Skanning klar',
        detected.length
          ? detected
              .map(
                (item) =>
                  `${item.name} (${item.category} -> ${mapToInternalFlyCategory(item.category)})`,
              )
              .join('\n')
          : 'Inga tydliga flugor hittades.',
      );
    } catch (error) {
      Alert.alert(
        'Skanning misslyckades',
        error instanceof Error ? error.message : 'Okänt fel vid AI-analys.',
      );
    }
  };

  if (showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View style={styles.cameraActions}>
          <Pressable style={styles.btn} onPress={takePicture}>
            <Text style={styles.btnText}>Ta bild</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => setShowCamera(false)}>
            <Text style={styles.btnText}>Stäng</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScreenWrap>
      <Text style={styles.title}>FlyBox (Lager)</Text>
      {state.flyBoxes.map((box) => (
        <Pressable key={box.id} onPress={() => setSelectedBoxId(box.id)} style={[styles.card, selectedBoxId === box.id && styles.cardSelected]}>
          <Text style={styles.cardTitle}>{box.name}</Text>
          <Text style={styles.cardMeta}>
            {box.lastScanAt ? `Senast skannad: ${new Date(box.lastScanAt).toLocaleString()}` : 'Inte skannad ännu'}
          </Text>
          <Text style={styles.cardMeta}>
            Innehåll: {box.detected.length ? box.detected.join(', ') : 'okänt'}
          </Text>
        </Pressable>
      ))}
      <Pressable style={styles.btn} onPress={openCamera}>
        <Text style={styles.btnText}>Skanna ask</Text>
      </Pressable>
      {current ? <Text style={styles.footerHint}>Vald ask: {current.name}</Text> : null}
    </ScreenWrap>
  );
}

function LogScreen({ state }) {
  const [species, setSpecies] = useState('');
  const [flyType, setFlyType] = useState('');
  const [count, setCount] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      let coords = null;
      let weather = 'Ingen API-nyckel (placeholder).';
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({});
        coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        weather = await fetchOpenWeatherSummary(coords.lat, coords.lon);
      }
      state.saveLog({
        species: species || 'Okänd art',
        flyType: flyType || 'Okänd fluga',
        count: Number(count) || 1,
        notes,
        coords,
        weather,
      });
      setSpecies('');
      setFlyType('');
      setCount('1');
      setNotes('');
      Alert.alert('Sparat', 'Fiskeresultat sparat i loggboken.');
    } catch (err) {
      Alert.alert('Fel', err.message || 'Kunde inte spara logg.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrap>
      <Text style={styles.title}>Log (Loggbok)</Text>
      <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholder="Fiskart" placeholderTextColor={theme.textMuted} />
      <TextInput style={styles.input} value={flyType} onChangeText={setFlyType} placeholder="Flugtyp (t.ex. Caddis)" placeholderTextColor={theme.textMuted} />
      <TextInput style={styles.input} value={count} onChangeText={setCount} keyboardType="number-pad" placeholder="Antal" placeholderTextColor={theme.textMuted} />
      <TextInput
        style={[styles.input, { height: 90 }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Anteckningar"
        placeholderTextColor={theme.textMuted}
        multiline
      />
      <Pressable style={styles.btn} onPress={save} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Sparar...' : 'Spara logg'}</Text>
      </Pressable>
      <Text style={styles.footerHint}>Hatch Guide offline är aktiv i appen.</Text>
    </ScreenWrap>
  );
}

function StatsScreen({ state }) {
  const { width } = useWindowDimensions();
  const data = useMemo(() => {
    const counts = { Caddis: 0, Mayfly: 0, Nymph: 0, Streamer: 0, Other: 0 };
    flies.slice(0, 180).forEach((fly) => {
      counts[classifyFlyType(fly)] += 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const colors = {
      Caddis: '#3B7D33',
      Mayfly: '#5C9A54',
      Nymph: '#7AB06F',
      Streamer: '#96C087',
      Other: '#A9A9A9',
    };
    return Object.entries(counts).map(([name, value]) => ({
      name,
      population: value,
      color: colors[name],
      legendFontColor: theme.text,
      legendFontSize: 12,
      percent: `${Math.round((value / total) * 100)}%`,
    }));
  }, []);

  return (
    <ScreenWrap>
      <Text style={styles.title}>Stats</Text>
      <Text style={styles.cardMeta}>Exempel: {data[0]?.percent} {data[0]?.name}</Text>
      <PieChart
        data={data}
        width={Math.max(320, width - 16)}
        height={220}
        chartConfig={{
          backgroundColor: theme.bg,
          backgroundGradientFrom: theme.bg,
          backgroundGradientTo: theme.bg,
          color: () => '#ffffff',
          labelColor: () => '#ffffff',
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="12"
        hasLegend
      />
      <Text style={styles.footerHint}>Byggt med react-native-chart-kit.</Text>
    </ScreenWrap>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 14, paddingBottom: 16 },
  title: { color: theme.text, fontSize: 26, fontWeight: '700', marginBottom: 12 },
  chatArea: { flex: 1, marginBottom: 10 },
  chatContent: { gap: 10, paddingBottom: 8 },
  bubble: { maxWidth: '86%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  bubbleUser: { backgroundColor: theme.primary, alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: theme.surfaceAlt, alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.border },
  bubbleText: { color: theme.text, fontSize: 15, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: theme.surface,
    color: theme.text,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  btn: { backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: '700' },
  card: { backgroundColor: theme.surfaceAlt, borderRadius: 12, borderColor: theme.border, borderWidth: 1, padding: 12, marginBottom: 10 },
  cardSelected: { borderColor: theme.primary, borderWidth: 2 },
  cardTitle: { color: theme.text, fontSize: 17, fontWeight: '700' },
  cardMeta: { color: theme.textMuted, marginTop: 4 },
  footerHint: { color: theme.textMuted, marginTop: 12 },
  cameraActions: { position: 'absolute', bottom: 24, width: '100%', paddingHorizontal: 20 },
});
