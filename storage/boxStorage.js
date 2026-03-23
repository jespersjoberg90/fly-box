import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@flybox/box_entries_v1';

export async function loadBox() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveBox(entries) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
