import { View, Pressable } from 'react-native';
import { Statement } from '@coast/core';
import { Card } from './primitives/Card';
import { AppText } from './primitives/Text';
import { theme } from './theme';

export function StatementCard({ statement, onOpen, onAll }: { statement: Statement; onOpen: () => void; onAll: () => void }) {
  const isNew = statement.status === 'readyToStamp';
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="label" style={{ color: theme.accent }}>WEEKLY STATEMENT</AppText>
        {isNew ? (
          <View style={{ backgroundColor: theme.accent, borderRadius: theme.radius.pill, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.md }}>
            <AppText variant="label" style={{ color: theme.onDark }}>NEW</AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="title" style={{ marginTop: theme.space.md }}>W{statement.issueNumber} is ready</AppText>
      <AppText variant="body" muted>4 pages · ready to read</AppText>
      <View style={{ flexDirection: 'row', gap: theme.space.xl, marginTop: theme.space.lg }}>
        <Pressable onPress={onOpen}><AppText variant="label" style={{ color: theme.accent }}>Open W{statement.issueNumber}</AppText></Pressable>
        <Pressable onPress={onAll}><AppText variant="label">All statements</AppText></Pressable>
      </View>
    </Card>
  );
}
