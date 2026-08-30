import { useState } from 'react';
import { Dimensions, ScrollView, View, Pressable, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCoastStore } from '../../src/store/store';
import { selectStatementView } from '../../src/store/statement';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { StatementCover, StatementLedger, StatementMovements, StatementStamp } from '../../src/design/StatementPages';
import { theme } from '../../src/design/theme';

export default function StatementViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useCoastStore((s) => s.data);
  const stampStatement = useCoastStore((s) => s.stampStatement);
  const router = useRouter();
  const [page, setPage] = useState(0);
  const width = Dimensions.get('window').width - theme.space.xl * 2;

  const statement = data.statements.find((s) => s.id === id);
  if (!statement) {
    return (
      <Screen>
        <AppText variant="title" style={{ marginTop: theme.space.xl }}>Statement not found.</AppText>
      </Screen>
    );
  }
  const view = selectStatementView(data, statement, new Date());
  const stamped = statement.status === 'stamped';

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const pages = [
    <StatementCover key="1" view={view} stamped={stamped} />,
    <StatementLedger key="2" view={view} />,
    <StatementMovements key="3" view={view} />,
    <StatementStamp key="4" view={view} stamped={stamped} onStamp={() => stampStatement(statement.id)} />,
  ];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" style={{ color: theme.accent }}>‹ Invoices</AppText></Pressable>
        <AppText variant="label" style={{ color: theme.accent }}>W{view.issueNumber}</AppText>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ marginTop: theme.space.lg }}
      >
        {pages.map((p, i) => (
          <View key={i} style={{ width }}>{p}</View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.space.sm, marginTop: theme.space.lg }}>
        {pages.map((_, i) => (
          <View key={i} style={{ width: i === page ? 20 : 8, height: 8, borderRadius: theme.radius.pill, backgroundColor: i === page ? theme.text : theme.line }} />
        ))}
      </View>
    </Screen>
  );
}
