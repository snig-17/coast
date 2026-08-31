import { useState } from 'react';
import { ScrollView, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { parseAmount } from '@coast/core';
import { useCoastStore } from '../src/store/store';
import { buildOnboarding, OnboardingInput, Cadence } from '../src/store/onboarding';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { SegmentedToggle } from '../src/design/primitives/SegmentedToggle';
import { theme } from '../src/design/theme';

const STEPS = ['Welcome', 'Income', 'Essentials', 'Extras', 'Savings & Debt', 'Review'] as const;

function AmountField({ value, onChangeText, placeholder = '0.00' }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      style={{ fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
    />
  );
}

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useCoastStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState('');
  const [payday, setPayday] = useState('25');
  const [essAmount, setEssAmount] = useState('');
  const [essCad, setEssCad] = useState<Cadence>('monthly');
  const [extAmount, setExtAmount] = useState('');
  const [extCad, setExtCad] = useState<Cadence>('monthly');
  const [savings, setSavings] = useState('');
  const [debt, setDebt] = useState('');

  const clampDay = (n: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), 1), 31) : 1);

  const input: OnboardingInput = {
    incomeMonthly: parseAmount(income),
    paydayDom: clampDay(parseInt(payday || '1', 10)),
    essentials: { amount: parseAmount(essAmount), cadence: essCad },
    extras: { amount: parseAmount(extAmount), cadence: extCad },
    savingsMonthly: parseAmount(savings),
    debtMonthly: parseAmount(debt),
  };
  const { plan } = buildOnboarding(input);

  const canProceed = step !== 1 || input.incomeMonthly > 0;
  const isLast = step === STEPS.length - 1;

  const onNext = () => {
    if (!canProceed) return;
    if (isLast) {
      const { income: inc, plan: p } = buildOnboarding(input);
      completeOnboarding(inc, p);
      router.replace('/');
    } else {
      setStep((s) => s + 1);
    }
  };

  const cad = (value: Cadence, onChange: (c: Cadence) => void) => (
    <View style={{ marginTop: theme.space.md }}>
      <SegmentedToggle
        options={['Weekly', 'Monthly']}
        value={value === 'weekly' ? 'Weekly' : 'Monthly'}
        onChange={(v) => onChange(v === 'Weekly' ? 'weekly' : 'monthly')}
      />
    </View>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <AppText variant="label" muted>COAST</AppText>
        <AppText variant="label" muted>STEP {step + 1} OF {STEPS.length}</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        {step === 0 && (
          <View style={{ marginTop: theme.space.xxl }}>
            <AppText variant="hero">Welcome to Coast.</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.md }}>
              A few numbers and Coast will show what's safe to spend today — built from your money, not a demo.
            </AppText>
          </View>
        )}

        {step === 1 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Your monthly income</AppText>
            <AmountField value={income} onChangeText={setIncome} />
            <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>PAYDAY (DAY OF MONTH)</AppText>
            <TextInput
              value={payday}
              onChangeText={setPayday}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={theme.textMuted}
              style={{ fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.sm }}
            />
          </View>
        )}

        {step === 2 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Essentials & bills</AppText>
            <AppText variant="body" muted>Rent, utilities, groceries — the necessary stuff.</AppText>
            <AmountField value={essAmount} onChangeText={setEssAmount} />
            {cad(essCad, setEssCad)}
          </View>
        )}

        {step === 3 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Everyday extras</AppText>
            <AppText variant="body" muted>Eating out, fun, the flexible spending Coast watches daily.</AppText>
            <AmountField value={extAmount} onChangeText={setExtAmount} />
            {cad(extCad, setExtCad)}
          </View>
        )}

        {step === 4 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Savings & debt</AppText>
            <AppText variant="body" muted>Optional monthly targets. Leave blank for none.</AppText>
            <AppText variant="label" muted style={{ marginTop: theme.space.lg }}>SAVINGS / MONTH</AppText>
            <AmountField value={savings} onChangeText={setSavings} />
            <AppText variant="label" muted style={{ marginTop: theme.space.lg }}>DEBT / MONTH</AppText>
            <AmountField value={debt} onChangeText={setDebt} />
          </View>
        )}

        {step === 5 && (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="title">Your plan</AppText>
            {[
              ['Income', input.incomeMonthly],
              ['Bills & Fixed', plan.bills],
              ['Discretionary', plan.discretionary],
              ['Savings', plan.savings],
              ['Debt', plan.debt],
            ].map(([label, pence]) => (
              <View key={label as string} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
                <AppText variant="body">{label as string}</AppText>
                <Money pence={pence as number} variant="body" />
              </View>
            ))}
            <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>
              Daily spend room comes from your Lifestyle slice (<Money pence={plan.lifestyle} variant="body" />/mo).
            </AppText>
            <Pressable onPress={() => router.push('/import')} style={{ marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
              <AppText variant="label" style={{ color: theme.accent }}>Import past transactions ›</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.xs }}>Optional — pull in spending from an Amex or Revolut CSV.</AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.lg }}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={{ justifyContent: 'center', paddingHorizontal: theme.space.lg }}>
            <AppText variant="label" muted>Back</AppText>
          </Pressable>
        ) : null}
        <View style={{ flex: 1, opacity: canProceed ? 1 : 0.4 }}>
          <PillButton label={isLast ? 'START COAST' : 'CONTINUE'} onPress={onNext} />
        </View>
      </View>
    </Screen>
  );
}
