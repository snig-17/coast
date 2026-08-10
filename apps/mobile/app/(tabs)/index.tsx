import { useCoastStore } from '../../src/store/store';
import { selectSpendRoom } from '../../src/store/selectors';
import { Screen } from '../../src/design/primitives/Screen';
import { AppText } from '../../src/design/primitives/Text';
import { Money } from '../../src/design/primitives/Money';

export default function Home() {
  const data = useCoastStore((s) => s.data);
  const room = selectSpendRoom(data, new Date());
  return (
    <Screen>
      <AppText variant="label" muted style={{ marginTop: 24 }}>TODAY'S SPEND ROOM</AppText>
      <Money pence={room.dailyRoom} variant="hero" />
      <AppText variant="body" muted>Coast shell — Home</AppText>
    </Screen>
  );
}
