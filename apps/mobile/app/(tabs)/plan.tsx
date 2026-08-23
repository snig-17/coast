import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectPlanBreakdown } from '../../src/store/selectors';
import { monthLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { SegmentedToggle } from '../../src/design/primitives/SegmentedToggle';
import { InfoCard } from '../../src/design/primitives/InfoCard';
import { DonutChart } from '../../src/design/DonutChart';
import { theme } from '../../src/design/theme';

const GROUP_NAMES: Record<string, string> = {
  bills: 'Bills & Fixed',
  savings: 'Savings',
  debt: 'Debt',
  discretionary: 'Discretionary',
};

const PLAN_BODY =
  'Your income splits four ways — bills, savings, debt and flexible spending. Inside flexible spending, Essentials are tracked monthly so daily wobbles don’t punish you. Lifestyle is what your daily safe-to-spend watches. Joy is protected.';

export default function Plan() {
  const data = useCoastStore((s) => s.data);
  const [tab, setTab] = useState('Budget');
  const [showInfo, setShowInfo] = useState(true);
  const now = new Date();
  const breakdown = selectPlanBreakdown(data);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>PLAN</AppText>
        </View>

        <View style={{ marginTop: theme.space.lg }}>
          <SegmentedToggle options={['Budget', 'Income']} value={tab} onChange={setTab} />
        </View>

        {tab === 'Budget' ? (
          <>
            {showInfo ? (
              <View style={{ marginTop: theme.space.lg }}>
                <InfoCard title="HOW YOUR PLAN WORKS" body={PLAN_BODY} onDismiss={() => setShowInfo(false)} />
              </View>
            ) : null}

            <View style={{ alignItems: 'center', marginTop: theme.space.xl }}>
              <DonutChart breakdown={breakdown} topLabel={monthLabel(now)} centerPence={breakdown.total} />
            </View>

            <View style={{ marginTop: theme.space.xl }}>
              {breakdown.segments.map((s) => (
                <View key={s.group} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.space.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
                    <View style={{ width: 12, height: 12, borderRadius: theme.radius.pill, backgroundColor: theme.categoryColors[s.group] }} />
                    <AppText variant="body">{GROUP_NAMES[s.group] ?? s.group}</AppText>
                  </View>
                  <Money pence={s.amount} variant="body" />
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={{ marginTop: theme.space.xl }}>
            <AppText variant="label" muted>MONTHLY INCOME</AppText>
            <Money pence={data.income.monthly} variant="hero" />
            <AppText variant="body" muted>Paid on day {data.income.paydayDom} each month.</AppText>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
