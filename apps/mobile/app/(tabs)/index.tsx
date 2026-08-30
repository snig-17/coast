import { Alert, ScrollView, View } from 'react-native';
import { useCoastStore } from '../../src/store/store';
import { selectSpendRoom, selectPayCycle, selectLeaksAnnual } from '../../src/store/selectors';
import { weekdayLabel, paceLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { ProgressBar } from '../../src/design/primitives/ProgressBar';
import { SectionHeader } from '../../src/design/primitives/SectionHeader';
import { StatusDots } from '../../src/design/primitives/StatusDots';
import { PaydayDots } from '../../src/design/primitives/PaydayDots';
import { Fab } from '../../src/design/primitives/Fab';
import { formatGBP } from '@coast/core';
import { theme } from '../../src/design/theme';

export default function Home() {
  const data = useCoastStore((s) => s.data);
  const now = new Date();
  const room = selectSpendRoom(data, now);
  const cycle = selectPayCycle(data, now);
  const pace = paceLabel(room);
  const elapsed = cycle.cycleLengthDays - cycle.daysUntilPayday;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>{weekdayLabel(now)}</AppText>
        </View>

        <StatusDots onPace={room.onPace} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.xl }}>
          <AppText variant="label" muted>TODAY'S SPEND ROOM</AppText>
          <AppText variant="label" muted>What's this?</AppText>
        </View>
        <Money pence={room.dailyRoom} variant="hero" />
        <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>
          {formatGBP(room.leftUntilPayday)} left until payday
        </AppText>
        <AppText variant="body">{pace.text}</AppText>
        <AppText variant="body" muted>Bills and essentials protected.</AppText>

        <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>
          Spent today: <Money pence={room.spentToday} variant="body" /> of <Money pence={room.dailyRoom} variant="body" />
        </AppText>
        <View style={{ marginTop: theme.space.sm }}>
          <ProgressBar fraction={room.dailyRoom > 0 ? room.spentToday / room.dailyRoom : 0} />
        </View>

        <SectionHeader label="UNTIL PAYDAY" />
        <PaydayDots total={cycle.cycleLengthDays} elapsed={elapsed} />
        <AppText variant="title" style={{ marginTop: theme.space.md }}>Until payday — {cycle.daysUntilPayday} days left</AppText>

        <View style={{ marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Set aside</AppText>
          <AppText variant="body" muted>{data.funds.length === 0 ? 'Nothing set aside yet' : `${data.funds.length} funds`}</AppText>
        </View>
        <View style={{ marginTop: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Your leaks</AppText>
          <AppText variant="body" muted>{formatGBP(selectLeaksAnnual(data))}/yr total</AppText>
        </View>

        <SectionHeader label="RECENT" right="ALL ACTIVITY" />
        {data.transactions.length === 0 ? (
          <AppText variant="body" muted>Nothing logged yet.</AppText>
        ) : (
          data.transactions.slice(0, 5).map((t) => (
            <View key={t.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md }}>
              <AppText variant="body">{t.merchant ?? t.note ?? t.categoryId}</AppText>
              <Money pence={t.amount} variant="body" />
            </View>
          ))
        )}
      </ScrollView>
      <Fab onPress={() => Alert.alert('Quick add', 'Logging arrives in the next update.')} />
    </Screen>
  );
}
