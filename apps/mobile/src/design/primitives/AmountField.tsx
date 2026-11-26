import { StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { AppText } from './Text';
import { theme } from '../theme';

type Scale = 'hero' | 'title';

/**
 * The one decimal-pad money input. Every screen that takes a £ amount uses this
 * so the keyboard, placeholder and muted-placeholder colour stay identical; the
 * only things a caller picks are the type scale, an optional currency prefix
 * and whether the field sits on an underline.
 */
export function AmountField({
  value,
  onChangeText,
  prefix,
  placeholder = '0.00',
  scale = 'title',
  underline = false,
  containerStyle,
  ...rest
}: Omit<TextInputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (t: string) => void;
  prefix?: string;
  scale?: Scale;
  underline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const t = theme.type[scale];
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'flex-end' },
        underline ? { borderBottomWidth: 1, borderBottomColor: theme.line } : null,
        containerStyle,
      ]}
    >
      {prefix ? (
        <AppText variant={scale} muted style={{ paddingBottom: theme.space.sm }}>
          {prefix}
        </AppText>
      ) : null}
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={{
          flex: 1,
          fontFamily: t.family,
          fontSize: t.size,
          color: theme.text,
          paddingVertical: theme.space.sm,
        }}
      />
    </View>
  );
}
