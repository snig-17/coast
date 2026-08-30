import { Alert, ScrollView, View } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectRecurringTotal } from '../../src/store/selectors';
import { billingsForMonth, upcomingBillings } from '../../src/store/payments';
import { MonthCalendar } from '../../src/design/MonthCalendar';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { PillButton } from '../../src/design/primitives/PillButton';
import { formatGBP } from '@coast/core';
import { theme } from '../../src/design/theme';

export default function Payments() {
  const data = useCoastStore((s) => s.data);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month0 = now.getUTCMonth();
  const total = selectRecurringTotal(data);
  const billings = billingsForMonth(data.payments, year, month0);
  const upcoming = upcomingBillings(data.payments, year, month0, now.getUTCDate());
  const todayIso = `${year}-${String(month0 + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <AppText variant="label" muted style={{ marginTop: theme.space.lg }}>PAYMENTS</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm }}>
          <Money pence={total} variant="hero" />
          <AppText variant="title">/mo</AppText>
        </View>
        <AppText variant="body" muted>{formatGBP(total)} protected · {formatGBP(0)} possible savings</AppText>

        <View style={{ marginTop: theme.space.lg }}>
          <PillButton label="+ ADD PAYMENT" onPress={() => Alert.alert('Add payment', 'Adding payments arrives in the next update.')} />
        </View>

        <View style={{ marginTop: theme.space.xl }}>
          <MonthCalendar year={year} month0={month0} todayIso={todayIso} markedIsos={billings.map((b) => b.iso)} />
        </View>

        <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>UPCOMING BILLINGS</AppText>
        {upcoming.length === 0 ? (
          <AppText variant="body" muted>Nothing left to bill this month.</AppText>
        ) : (
          upcoming.map((b) => (
            <View key={b.payment.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
              <AppText variant="body">{b.payment.name}</AppText>
              <View style={{ flexDirection: 'row', gap: theme.space.md }}>
                <AppText variant="body" muted>day {b.day}</AppText>
                <Money pence={b.payment.amount} variant="body" />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
