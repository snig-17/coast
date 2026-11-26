import { Pressable } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

const SIZE = 60;

/**
 * Vertical strip the Fab occupies, measured from the bottom of its parent.
 * A screen that floats a Fab gives its scroll view this much bottom margin, so
 * the Fab lands beside the scroll area rather than on top of it — otherwise the
 * last rows sit under the button at rest and have to be scrolled out from
 * beneath it before they can be read.
 */
export const FAB_CLEARANCE = theme.space.xl + SIZE;

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        right: theme.space.xl,
        bottom: theme.space.xl,
        width: SIZE,
        height: SIZE,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="title" style={{ color: theme.onDark }}>+</AppText>
    </Pressable>
  );
}
