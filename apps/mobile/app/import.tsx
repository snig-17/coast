import { useMemo, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useCoastStore } from '../src/store/store';
import {
  ImportSession,
  buildImportSession,
  toggleInclude,
  setRowCategory,
  summarize,
  commitRows,
} from '../src/store/importCsv';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { theme } from '../src/design/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (iso: string): string => {
  const [, m, d] = iso.split('-');
  const mi = parseInt(m, 10) - 1;
  return mi >= 0 && mi < 12 ? `${parseInt(d, 10)} ${MONTHS[mi]}` : iso;
};

const FORMAT_LABEL: Record<string, string> = { amex: 'Amex', revolut: 'Revolut', unknown: '' };

export default function Import() {
  const router = useRouter();
  const data = useCoastStore((s) => s.data);
  const addTransactions = useCoastStore((s) => s.addTransactions);

  const [session, setSession] = useState<ImportSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const summary = useMemo(() => (session ? summarize(session.rows) : null), [session]);
  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? id;
  const catColor = (id: string) => data.categories.find((c) => c.id === id)?.color ?? theme.textMuted;

  const pickFile = async () => {
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values', '*/*'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      const text = await new File(res.assets[0].uri).text();
      const next = buildImportSession(text, data.transactions);
      if (next.format === 'unknown' || next.rows.length === 0) {
        setSession(null);
        setError("That file didn't look like an Amex or Revolut export. Export a statement as CSV and try again.");
        return;
      }
      setPickerKey(null);
      setSession(next);
    } catch {
      setSession(null);
      setError("Couldn't read that file. Try exporting the statement again.");
    }
  };

  const onCommit = () => {
    if (!session) return;
    const now = Date.now();
    const txns = commitRows(session.rows, (_r, i) => `imp_${now}_${i}`);
    if (txns.length === 0) return;
    addTransactions(txns);
    router.back();
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.space.lg }}>
        <Pressable onPress={() => router.back()}><AppText variant="label" muted>Cancel</AppText></Pressable>
        <AppText variant="label" muted>IMPORT</AppText>
        <View style={{ width: 48 }} />
      </View>

      {!session ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ marginTop: theme.space.xxl }}>
            <AppText variant="hero">Bring in your spending.</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.md }}>
              Export a statement from Amex or Revolut as a CSV file, then choose it here. Coast reads it on your
              device — nothing leaves your phone.
            </AppText>
            {error ? (
              <AppText variant="body" style={{ color: theme.overPace, marginTop: theme.space.lg }}>{error}</AppText>
            ) : null}
            <View style={{ marginTop: theme.space.xxl }}>
              <PillButton label={error ? 'CHOOSE ANOTHER FILE' : 'CHOOSE CSV FILE'} onPress={pickFile} />
            </View>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={{ marginTop: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line, paddingBottom: theme.space.md }}>
            <AppText variant="label" muted>
              {FORMAT_LABEL[session.format]} · {summary!.included} OF {summary!.total} SELECTED
              {summary!.duplicates > 0 ? ` · ${summary!.duplicates} ALREADY ADDED` : ''}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: theme.space.sm, marginTop: theme.space.xs }}>
              <Money pence={summary!.includedAmount} variant="title" />
              <AppText variant="body" muted>to import</AppText>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {session.rows.map((row) => {
              const open = pickerKey === row.key;
              return (
                <View key={row.key} style={{ borderBottomWidth: 1, borderBottomColor: theme.line, paddingVertical: theme.space.md, opacity: row.include ? 1 : 0.45 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
                    <Pressable
                      onPress={() => setSession((s) => (s ? { ...s, rows: toggleInclude(s.rows, row.key) } : s))}
                      hitSlop={8}
                      style={{ width: 22, height: 22, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: row.include ? theme.accent : theme.line, backgroundColor: row.include ? theme.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {row.include ? <AppText variant="label" style={{ color: theme.onDark }}>✓</AppText> : null}
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <AppText variant="body" numberOfLines={1}>{row.merchant || 'Unknown'}</AppText>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginTop: 2 }}>
                        <AppText variant="label" muted>{shortDate(row.date)}</AppText>
                        {row.duplicate ? <AppText variant="label" style={{ color: theme.textMuted }}>· already added</AppText> : null}
                      </View>
                    </View>

                    <Money pence={row.amount} variant="body" />
                  </View>

                  <Pressable onPress={() => setPickerKey(open ? null : row.key)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, marginTop: theme.space.sm, marginLeft: 34 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catColor(row.categoryId) }} />
                    <AppText variant="label" style={{ color: theme.accent }}>{catName(row.categoryId)} {open ? '▲' : '▾'}</AppText>
                  </Pressable>

                  {open ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.sm, marginLeft: 34 }}>
                      {data.categories.map((c) => {
                        const selected = c.id === row.categoryId;
                        return (
                          <Pressable
                            key={c.id}
                            onPress={() => {
                              setSession((s) => (s ? { ...s, rows: setRowCategory(s.rows, row.key, c.id) } : s));
                              setPickerKey(null);
                            }}
                            style={{ borderRadius: theme.radius.pill, paddingVertical: theme.space.xs, paddingHorizontal: theme.space.md, backgroundColor: selected ? theme.text : theme.card }}
                          >
                            <AppText variant="label" style={{ color: selected ? theme.onDark : theme.text }}>{c.name}</AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={{ marginBottom: theme.space.lg, opacity: summary!.included > 0 ? 1 : 0.4 }}>
            <PillButton
              label={summary!.included > 0 ? `IMPORT ${summary!.included} TRANSACTION${summary!.included === 1 ? '' : 'S'}` : 'SELECT SOME ROWS'}
              onPress={onCommit}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
