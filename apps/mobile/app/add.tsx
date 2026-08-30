import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCoastStore } from '../src/store/store';
import { parseAddParams, buildTransaction } from '../src/store/addEntry';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { theme } from '../src/design/theme';

let seq = 0;

const one = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

export default function AddEntry() {
  const params = useLocalSearchParams<{ amount?: string; category?: string; note?: string; merchant?: string }>();
  const router = useRouter();
  const data = useCoastStore((s) => s.data);
  const addTransaction = useCoastStore((s) => s.addTransaction);

  const [amount, setAmount] = useState(one(params.amount) ?? '');
  const [note, setNote] = useState(one(params.note) ?? '');
  const [categoryId, setCategoryId] = useState(
    () => parseAddParams({ amount: one(params.amount), category: one(params.category), note: one(params.note), merchant: one(params.merchant) }, data.categories).categoryId,
  );

  const chips = data.categories.filter((c) => c.group === 'discretionary');
  const parsed = parseAddParams({ amount, category: categoryId, note, merchant: one(params.merchant) }, data.categories);
  const canSave = parsed.amount > 0;

  const onSave = () => {
    if (!canSave) return;
    const now = new Date();
    const dateIso = now.toISOString().slice(0, 10);
    const id = `t_${now.getTime()}_${seq++}`;
    addTransaction(buildTransaction(parsed, dateIso, id));
    router.back();
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" muted>Cancel</AppText></Pressable>
        <AppText variant="label" muted>NEW ENTRY</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>AMOUNT</AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.textMuted}
          style={{ fontFamily: theme.type.hero.family, fontSize: theme.type.hero.size, color: theme.text, paddingVertical: theme.space.sm }}
        />
        <AppText variant="body" muted>That's <Money pence={parsed.amount} variant="body" /></AppText>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>CATEGORY</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.sm }}>
          {chips.map((c) => {
            const selected = c.id === categoryId;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={{ borderRadius: theme.radius.pill, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg, backgroundColor: selected ? theme.text : theme.card }}
              >
                <AppText variant="label" style={{ color: selected ? theme.onDark : theme.text }}>{c.name}</AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>NOTE</AppText>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional"
          placeholderTextColor={theme.textMuted}
          style={{ fontFamily: theme.type.body.family, fontSize: theme.type.body.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
        />

        <View style={{ marginTop: theme.space.xxl, opacity: canSave ? 1 : 0.4 }}>
          <PillButton label="SAVE ENTRY" onPress={onSave} />
        </View>
      </ScrollView>
    </Screen>
  );
}
