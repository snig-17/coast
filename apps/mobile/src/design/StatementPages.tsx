import { View } from 'react-native';
import { WeeklyStatementView } from '@coast/engine';
import { Card } from './primitives/Card';
import { AppText } from './primitives/Text';
import { Money } from './primitives/Money';
import { PillButton } from './primitives/PillButton';
import { theme } from './theme';

function Header({ view }: { view: WeeklyStatementView }) {
  return (
    <View style={{ borderBottomWidth: 2, borderBottomColor: theme.text, paddingBottom: theme.space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="label" style={{ color: theme.accent }}>COAST</AppText>
        <AppText variant="label" muted>ISSUE {view.issueNumber}</AppText>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <AppText variant="title">WEEKLY STATEMENT</AppText>
        <AppText variant="label" muted>SPL-W{view.issueNumber}-2026</AppText>
      </View>
    </View>
  );
}

function Footer({ page }: { page: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.md, marginTop: theme.space.lg }}>
      <AppText variant="label" muted>NOT AN AMOUNT DUE</AppText>
      <AppText variant="label" muted>PAGE {page} OF 4</AppText>
    </View>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
      <AppText variant="label" muted>{label}</AppText>
      {children}
    </View>
  );
}

export function StatementCover({ view, stamped }: { view: WeeklyStatementView; stamped: boolean }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 01</AppText>
      <View style={{ marginTop: theme.space.md, alignSelf: 'flex-start', borderWidth: 2, borderColor: theme.accent, borderRadius: theme.radius.pill, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>{stamped ? 'STAMPED' : 'READY TO STAMP'}</AppText>
      </View>
      <View style={{ marginTop: theme.space.lg }}>
        <Line label="DAYS UNDER SPENDLINE"><AppText variant="title">{view.daysUnder} / {view.daysScored}</AppText></Line>
        <Line label="PLANNED SPEND"><Money pence={view.plannedSpend} variant="title" mode="exact" /></Line>
        <Line label="ACTUAL SPEND"><Money pence={view.actualSpend} variant="title" mode="exact" /></Line>
        <Line label="LEAKS SPOTTED"><Money pence={view.leaksSpotted} variant="title" mode="exact" /></Line>
        <Line label="MONEY MOVED FORWARD"><Money pence={view.movedForward} variant="title" mode="exact" /></Line>
      </View>
      <Footer page={1} />
    </Card>
  );
}

export function StatementLedger({ view }: { view: WeeklyStatementView }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 02</AppText>
      <AppText variant="title" style={{ marginTop: theme.space.sm }}>Daily ledger</AppText>
      <View style={{ marginTop: theme.space.md }}>
        {view.dailyLedger.map((d) => (
          <View key={d.day} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
            <AppText variant="body">{d.day}</AppText>
            <AppText variant="body" muted>{d.scored ? '' : 'NO ENTRY'}</AppText>
            <Money pence={d.amount} variant="body" mode="exact" />
          </View>
        ))}
      </View>
      <Line label="WEEKLY LINE"><Money pence={view.weeklyLine} variant="title" mode="exact" /></Line>
      <Line label="WEEKLY SPEND"><Money pence={view.weeklySpend} variant="title" mode="exact" /></Line>
      <Footer page={2} />
    </Card>
  );
}

export function StatementMovements({ view }: { view: WeeklyStatementView }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 03</AppText>
      <AppText variant="title" style={{ marginTop: theme.space.sm }}>Money movements</AppText>
      <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>
        {view.movedForward === 0 ? 'A quiet week. No envelope or savings movements were recorded.' : 'Savings moved forward this week.'}
      </AppText>
      <Line label="MOVED FORWARD"><Money pence={view.movedForward} variant="title" mode="exact" /></Line>
      <Footer page={3} />
    </Card>
  );
}

export function StatementStamp({ view, onStamp, stamped }: { view: WeeklyStatementView; onStamp: () => void; stamped: boolean }) {
  return (
    <Card>
      <Header view={view} />
      <AppText variant="label" style={{ color: theme.accent, marginTop: theme.space.lg }}>PAGE 04</AppText>
      <AppText variant="title" style={{ marginTop: theme.space.sm }}>Stamp your week.</AppText>
      <View style={{ marginTop: theme.space.md }}>
        <Line label="RESULT"><Money pence={view.result} variant="title" mode="exact" /></Line>
        <Line label="NEXT DAILY SPENDLINE"><Money pence={view.nextDailyLine} variant="title" /></Line>
        <Line label="CARRY IN / OUT"><Money pence={view.carry} variant="title" mode="exact" /></Line>
      </View>
      <View style={{ marginTop: theme.space.xl }}>
        <PillButton label={stamped ? 'STAMPED' : 'STAMP THIS STATEMENT'} onPress={stamped ? () => {} : onStamp} />
      </View>
      <Footer page={4} />
    </Card>
  );
}
