import { ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
import { selectStatementList } from '../../src/store/statement';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { theme } from '../../src/design/theme';

export default function StatementsList() {
  const data = useCoastStore((s) => s.data);
  const router = useRouter();
  const statements = selectStatementList(data);

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={{ marginTop: theme.space.lg }}>
        <AppText variant="label" style={{ color: theme.accent }}>‹ Back</AppText>
      </Pressable>
      <AppText variant="title" style={{ marginTop: theme.space.md }}>Statements</AppText>
      <ScrollView style={{ marginTop: theme.space.lg }} showsVerticalScrollIndicator={false}>
        {statements.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/statements/${s.id}`)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line }}
          >
            <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>W{s.issueNumber} is ready</AppText>
            <AppText variant="label" muted>{s.status === 'stamped' ? 'STAMPED' : 'READY'}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
