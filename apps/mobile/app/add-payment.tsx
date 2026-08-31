import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Cadence } from '@coast/core';
import { useCoastStore } from '../src/store/store';
import { buildPayment, isValidPayment, PaymentInput } from '../src/store/addPayment';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { SegmentedToggle } from '../src/design/primitives/SegmentedToggle';
import { theme } from '../src/design/theme';

const PAYMENT_GROUPS = ['bills', 'savings', 'debt'];

export default function AddPayment() {
  const router = useRouter();
  const data = useCoastStore((s) => s.data);
  const addPayment = useCoastStore((s) => s.addPayment);

  const chips = data.categories.filter((c) => PAYMENT_GROUPS.includes(c.group));

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('1');
  const [cadence, setCadence] = useState<Cadence>('monthly');
  const [categoryId, setCategoryId] = useState(chips[0]?.id ?? 'rent');

  const input: PaymentInput = { name, amount, billingDay, cadence, categoryId };
  const canSave = isValidPayment(input);

  const onSave = () => {
    if (!canSave) return;
    addPayment(buildPayment(input, `pay_${Date.now()}`));
    router.back();
  };

  const fieldStyle = {
    fontFamily: theme.type.body.family,
    fontSize: theme.type.body.size,
    color: theme.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
    paddingVertical: theme.space.sm,
  } as const;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" muted>Cancel</AppText></Pressable>
        <AppText variant="label" muted>NEW PAYMENT</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>NAME</AppText>
        <TextInput value={name} onChangeText={setName} placeholder="Rent, Netflix…" placeholderTextColor={theme.textMuted} style={fieldStyle} />

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>AMOUNT</AppText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.textMuted}
          style={{ fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, paddingVertical: theme.space.sm }}
        />
        <AppText variant="body" muted>That's <Money pence={buildPayment(input, 'preview').amount} variant="body" /> per {cadence === 'weekly' ? 'week' : 'month'}</AppText>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>CADENCE</AppText>
        <View style={{ marginTop: theme.space.md }}>
          <SegmentedToggle
            options={['Weekly', 'Monthly']}
            value={cadence === 'weekly' ? 'Weekly' : 'Monthly'}
            onChange={(v) => setCadence(v === 'Weekly' ? 'weekly' : 'monthly')}
          />
        </View>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>BILLING DAY (OF MONTH)</AppText>
        <TextInput value={billingDay} onChangeText={setBillingDay} keyboardType="number-pad" placeholder="1" placeholderTextColor={theme.textMuted} style={fieldStyle} />

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

        <View style={{ marginTop: theme.space.xxl, opacity: canSave ? 1 : 0.4 }}>
          <PillButton label="SAVE PAYMENT" onPress={onSave} />
        </View>
      </ScrollView>
    </Screen>
  );
}
