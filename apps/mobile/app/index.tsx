import { Text, View } from 'react-native';
import { formatGBP } from '@coast/core';

export default function Boot() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E4D8' }}>
      <Text style={{ fontSize: 48, fontWeight: '800', color: '#1A1A1A' }}>{formatGBP(813)}</Text>
      <Text style={{ color: '#0F6E6E' }}>Coast shell — packages wired</Text>
    </View>
  );
}
