import { useCoastStore } from '../../src/store/store';
import { selectPlanBreakdown } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { theme } from '../../src/design/theme';

export default function Plan() {
  const data = useCoastStore((s) => s.data);
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>MONTHLY PLAN</AppText>
      <Money pence={selectPlanBreakdown(data).total} variant="hero" />
      <AppText variant="body" muted>Coast shell — Plan</AppText>
    </Screen>
  );
}
