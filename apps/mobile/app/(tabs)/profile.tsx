import { Alert, ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
import { selectLeaksClosedAnnual } from '../../src/store/selectors';
import { memberSinceLabel } from '../../src/viz/format';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Avatar } from '../../src/design/primitives/Avatar';
import { StatCol } from '../../src/design/primitives/StatCol';
import { HeaderPill } from '../../src/design/primitives/HeaderPill';
import { StatementCard } from '../../src/design/StatementCard';
import { formatGBP } from '@coast/core';
import { theme } from '../../src/design/theme';

export default function Profile() {
  const data = useCoastStore((s) => s.data);
  const router = useRouter();
  const latest = data.statements[0];
  const closed = selectLeaksClosedAnnual(data);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
          <AppText variant="label" muted>COAST</AppText>
          <HeaderPill label="Settings" onPress={() => Alert.alert('Settings', 'Settings arrive in a later update.')} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.lg, marginTop: theme.space.xl }}>
          <Avatar initial={data.profileName} />
          <View>
            <AppText variant="title">{data.profileName}</AppText>
            <AppText variant="body" muted>Spending less</AppText>
          </View>
        </View>

        <View style={{ marginTop: theme.space.xl }}>
          <StatCol label="ONGOING IMPACT" value={`+${formatGBP(closed)}/yr`} valueColor={theme.categoryColors.savings} />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space.xxl, marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
          <StatCol label="LEAKS CLOSED" value={`${formatGBP(closed)}/yr`} />
          <StatCol label="MEMBER SINCE" value={memberSinceLabel(data.memberSince)} />
        </View>

        {latest ? (
          <View style={{ marginTop: theme.space.xl }}>
            <StatementCard
              statement={latest}
              onOpen={() => router.push(`/statements/${latest.id}`)}
              onAll={() => router.push('/statements')}
            />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.xl }}>
          <AppText variant="label" muted>LATEST RECEIPT · {data.funds.length} SAVED</AppText>
          <AppText variant="label" style={{ color: theme.accent }}>See all</AppText>
        </View>
        <AppText variant="body" muted style={{ marginTop: theme.space.md }}>Your first receipt prints when a fund hits its goal.</AppText>

        <Pressable onPress={() => router.push('/automate')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Automate logging</AppText>
          <AppText variant="title" style={{ color: theme.accent }}>›</AppText>
        </Pressable>

        <Pressable onPress={() => router.push('/import')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Import transactions</AppText>
          <AppText variant="title" style={{ color: theme.accent }}>›</AppText>
        </Pressable>

        <Pressable onPress={() => router.push('/onboarding')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
          <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>Redo onboarding</AppText>
          <AppText variant="title" style={{ color: theme.accent }}>›</AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
