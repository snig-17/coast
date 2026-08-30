import { View } from 'react-native';
import { monthGrid } from '../viz/calendar';
import { AppText } from './primitives/Text';
import { theme } from './theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthCalendar({
  year, month0, todayIso, markedIsos = [],
}: { year: number; month0: number; todayIso?: string; markedIsos?: string[] }) {
  const cells = monthGrid(year, month0);
  const marked = new Set(markedIsos);
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: theme.space.sm }}>
            <AppText variant="label" muted>{w}</AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((c, i) => {
          const isToday = c.iso != null && c.iso === todayIso;
          const isMarked = c.iso != null && marked.has(c.iso);
          return (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              {c.day != null ? (
                <View style={{ width: 36, height: 36, borderRadius: theme.radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: isToday ? 2 : 0, borderColor: theme.text }}>
                  <AppText variant="body">{c.day}</AppText>
                  {isMarked ? (
                    <View style={{ position: 'absolute', bottom: 2, width: 5, height: 5, borderRadius: theme.radius.pill, backgroundColor: theme.accent }} />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
