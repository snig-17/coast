import { useCoastStore } from '../../src/store/store';
import { selectRecurringTotal } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { theme } from '../../src/design/theme';

export default function Payments() {
  const data = useCoastStore((s) => s.data);
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>RECURRING</AppText>
      <Money pence={selectRecurringTotal(data)} variant="hero" />
      <AppText variant="body" muted>Coast shell — Payments</AppText>
    </Screen>
  );
}
