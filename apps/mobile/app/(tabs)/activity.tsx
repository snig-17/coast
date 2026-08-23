import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectPayCycleAtOffset, selectCycleSummaryAtOffset, selectCycleTransactions } from '../../src/store/cycleNav';
import { cycleLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { CategoryRow } from '../../src/design/primitives/CategoryRow';
import { SectionHeader } from '../../src/design/primitives/SectionHeader';
import { theme } from '../../src/design/theme';

const GROUP_NAMES: Record<string, string> = {
  discretionary: 'Discretionary',
  bills: 'Bills & Fixed',
  savings: 'Savings',
};

export default function Activity() {
  const data = useCoastStore((s) => s.data);
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const cycle = selectPayCycleAtOffset(data, now, offset);
  const summary = selectCycleSummaryAtOffset(data, now, offset);
  const txns = selectCycleTransactions(data, now, offset);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>ACTIVITY</AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.space.xl }}>
          <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={12}><AppText variant="title">‹</AppText></Pressable>
          <AppText variant="title" style={{ fontSize: 22, lineHeight: 26 }}>{cycleLabel(cycle)}</AppText>
          <Pressable onPress={() => setOffset((o) => o + 1)} hitSlop={12}><AppText variant="title">›</AppText></Pressable>
        </View>
        <AppText variant="label" muted style={{ textAlign: 'center' }}>Pay cycle activity</AppText>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>SPENT THIS PAY CYCLE</AppText>
        <Money pence={summary.totalSpent} variant="hero" />
        <AppText variant="body" muted>{pct(summary.pctOfIncome)} of monthly income</AppText>

        <View style={{ marginTop: theme.space.lg }}>
          {summary.groups.map((g) => (
            <CategoryRow
              key={g.group}
              color={theme.categoryColors[g.group]}
              name={GROUP_NAMES[g.group] ?? g.group}
              pence={g.spent}
              pctLabel={pct(g.pctOfIncome)}
              fraction={g.allocated > 0 ? g.spent / g.allocated : 0}
            />
          ))}
        </View>

        <SectionHeader label="TRANSACTIONS" right={`${txns.length} this period`} />
        {txns.length === 0 ? (
          <AppText variant="body" muted>No transactions for {cycleLabel(cycle)}.</AppText>
        ) : (
          txns.map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md }}>
              <AppText variant="body">{t.merchant ?? t.note ?? t.categoryId}</AppText>
              <Money pence={t.amount} variant="body" />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
