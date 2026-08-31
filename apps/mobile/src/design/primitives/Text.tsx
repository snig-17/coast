import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { theme } from '../theme';

type Variant = keyof typeof theme.type;

export function AppText({ variant = 'body', muted, style, ...rest }: TextProps & { variant?: Variant; muted?: boolean }) {
  const t = theme.type[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: t.family,
          fontSize: t.size,
          lineHeight: t.line,
          color: muted ? theme.textMuted : theme.text,
          letterSpacing: 'letter' in t ? (t as { letter: number }).letter : 0,
          fontWeight: 'weight' in t ? (t as { weight: string }).weight as '400' : undefined,
        },
        style,
      ]}
    />
  );
}

export const styles = StyleSheet.create({});
