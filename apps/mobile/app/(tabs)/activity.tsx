import { useCoastStore } from '../../src/store/store';
import { selectCycleSummary } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { theme } from '../../src/design/theme';

export default function Activity() {
  const data = useCoastStore((s) => s.data);
  const summary = selectCycleSummary(data, new Date());
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>SPENT THIS PAY CYCLE</AppText>
      <Money pence={summary.totalSpent} variant="hero" />
      <AppText variant="body" muted>Coast shell — Activity</AppText>
    </Screen>
  );
}
