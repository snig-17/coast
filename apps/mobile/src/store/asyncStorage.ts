import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyValueStore } from './persistence';

export const asyncStorageKV: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
