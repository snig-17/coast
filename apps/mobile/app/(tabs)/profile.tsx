import { useCoastStore } from '../../src/store/store';
import { selectLeaksAnnual } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';
import { theme } from '../../src/design/theme';

export default function Profile() {
  const data = useCoastStore((s) => s.data);
  return (
    <Screen>
      <AppText variant="title" style={{ marginTop: theme.space.xl }}>{data.profileName}</AppText>
      <AppText variant="label" muted>YOUR LEAKS</AppText>
      <Money pence={selectLeaksAnnual(data)} variant="stat" />
      <AppText variant="body" muted>Coast shell — Profile</AppText>
    </Screen>
  );
}
