import { useState } from 'react';
import { View, Pressable, ScrollView, Modal, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { AppText } from '../design/primitives/Text';
import { Money } from '../design/primitives/Money';
import { ProgressBar } from '../design/primitives/ProgressBar';
import { PillButton } from '../design/primitives/PillButton';
import { theme } from '../design/theme';
import { parseAmount, formatGBP } from '@coast/core';
import { Cadence2, CategoryEntry } from './model';

// ---------------------------------------------------------------------------
// Eyebrow — coloured bar + caps label (e.g. "MONEY IN", "FIXED FIRST")
// ---------------------------------------------------------------------------
export function Eyebrow({ text, color = theme.overPace }: { text: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
      <View style={{ width: 4, height: 18, backgroundColor: color, borderRadius: 2 }} />
      <AppText variant="label" style={{ color }}>{text}</AppText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Context bar — "NN · LABEL" + "£X leftLabel" + progress rail
// ---------------------------------------------------------------------------
export function ContextBar({ index, label, pence, note, fraction, color = theme.overPace }: {
  index?: string; label: string; pence: number; note: string; fraction: number; color?: string;
}) {
  return (
    <View style={{ marginTop: theme.space.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <AppText variant="label" style={{ color }}>{index ? `${index} · ` : ''}{label}</AppText>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="title" style={{ fontSize: 22, lineHeight: 26 }}>{formatGBP(pence, 'whole')}</AppText>
          <AppText variant="label" muted>{note}</AppText>
        </View>
      </View>
      <View style={{ marginTop: theme.space.md }}>
        <ProgressBar fraction={fraction} color={color} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chip + ChipRow (single-select wrap)
// ---------------------------------------------------------------------------
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: theme.space.sm + 2,
        paddingHorizontal: theme.space.lg,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.accent : 'transparent',
        borderWidth: 1,
        borderColor: selected ? theme.accent : theme.line,
      }}
    >
      <AppText variant="label" style={{ color: selected ? theme.onDark : theme.text }}>{label}</AppText>
    </Pressable>
  );
}

export function ChipRow<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md }}>
      {options.map((o) => (
        <Chip key={o.key} label={o.label} selected={value === o.key} onPress={() => onChange(o.key)} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Horizontal day carousel  … 23 – 24 – [25] – 26 …
// ---------------------------------------------------------------------------
const DAY_W = 84;
export function DayCarousel({ dom, onChange }: { dom: number; onChange: (d: number) => void }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const initial = Math.max(0, dom - 1);
  const [active, setActive] = useState(initial);
  const idxFrom = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.max(0, Math.min(days.length - 1, Math.round(e.nativeEvent.contentOffset.x / DAY_W)));
  return (
    <View style={{ marginTop: theme.space.lg }}>
      <AppText variant="label" style={{ color: theme.accent, textAlign: 'center' }}>CHOOSE A DAY</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={DAY_W}
        decelerationRate="fast"
        contentOffset={{ x: initial * DAY_W, y: 0 }}
        contentContainerStyle={{ paddingHorizontal: 160 }}
        scrollEventThrottle={16}
        onScroll={(e) => { const i = idxFrom(e); if (i !== active) setActive(i); }}
        onMomentumScrollEnd={(e) => onChange(days[idxFrom(e)])}
        style={{ marginTop: theme.space.md }}
      >
        {days.map((d, i) => {
          const on = i === active;
          return (
            <View key={d} style={{ width: DAY_W, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
              <AppText variant="title" style={{ fontSize: on ? 34 : 24, color: on ? theme.text : theme.textMuted, opacity: on ? 1 : 0.4 }}>{d}</AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Money sheet — bottom modal with week/month toggle, keypad, skip
// ---------------------------------------------------------------------------
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export function MoneySheet({ visible, title, hint, entry, onSave, onClose, skipLabel }: {
  visible: boolean; title: string; hint: string; entry: CategoryEntry;
  onSave: (e: CategoryEntry) => void; onClose: () => void; skipLabel?: string;
}) {
  const [amount, setAmount] = useState(entry.amount);
  const [cadence, setCadence] = useState<Cadence2>(entry.cadence);
  const [skipped, setSkipped] = useState(entry.skipped);

  const press = (k: string) => {
    setSkipped(false);
    if (k === '⌫') { setAmount((a) => a.slice(0, -1)); return; }
    if (k === '.' && amount.includes('.')) return;
    setAmount((a) => (a + k).slice(0, 12));
  };

  const monthly = cadence === 'week' ? Math.round((parseAmount(amount) * 52) / 12) : parseAmount(amount);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.bg, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg, padding: theme.space.xl, paddingBottom: theme.space.xxl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="label" muted>{skipLabel ? skipLabel.toUpperCase() : 'AMOUNT'}</AppText>
            <Pressable onPress={onClose} hitSlop={12}><AppText variant="title" muted>×</AppText></Pressable>
          </View>
          <AppText variant="title" style={{ marginTop: theme.space.xs }}>{title}</AppText>
          <AppText variant="body" muted style={{ marginTop: theme.space.xs }}>{hint}</AppText>

          <View style={{ marginTop: theme.space.lg }}>
            <SegTwo a="PER WEEK" b="PER MONTH" value={cadence === 'week' ? 'PER WEEK' : 'PER MONTH'} onChange={(v) => setCadence(v === 'PER WEEK' ? 'week' : 'month')} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: theme.space.xl }}>
            <AppText variant="hero" style={{ fontSize: 44, lineHeight: 48, color: amount ? theme.text : theme.textMuted }}>£{amount || '0'}</AppText>
            <AppText variant="label" muted>/ {cadence === 'week' ? 'WEEK' : 'MONTH'}</AppText>
          </View>
          {cadence === 'week' && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.sm, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.sm }}>
              <AppText variant="label" muted>MONTHLY PLAN</AppText>
              <Money pence={monthly} mode="whole" variant="body" />
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.space.lg }}>
            {KEYS.map((k) => (
              <Pressable key={k} onPress={() => press(k)} style={{ width: '33.33%', paddingVertical: theme.space.md, alignItems: 'center' }}>
                <View style={{ backgroundColor: theme.card, borderRadius: theme.radius.md, width: '92%', paddingVertical: theme.space.md, alignItems: 'center' }}>
                  <AppText variant="title" style={{ fontSize: 24 }}>{k}</AppText>
                </View>
              </Pressable>
            ))}
          </View>

          {skipLabel && (
            <Pressable onPress={() => { setSkipped((s) => !s); setAmount(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginTop: theme.space.md }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: skipped ? theme.accent : theme.line, backgroundColor: skipped ? theme.accent : 'transparent' }} />
              <AppText variant="body">{skipLabel}</AppText>
            </Pressable>
          )}

          <View style={{ marginTop: theme.space.lg, opacity: amount || skipped ? 1 : 0.4 }}>
            <PillButton label="Save" onPress={() => onSave({ amount: skipped ? '' : amount, cadence, skipped })} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Two-option segmented toggle (labels can be long, unlike the shared 2-opt one)
// ---------------------------------------------------------------------------
export function SegTwo({ a, b, value, onChange }: { a: string; b: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: theme.radius.pill, padding: 4 }}>
      {[a, b].map((opt) => {
        const on = value === opt;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={{ flex: 1, paddingVertical: theme.space.md, alignItems: 'center', borderRadius: theme.radius.pill, backgroundColor: on ? theme.text : 'transparent' }}>
            <AppText variant="label" style={{ color: on ? theme.onDark : theme.text }}>{opt}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// MapRow — category row that opens a MoneySheet
// ---------------------------------------------------------------------------
export function MapRow({ name, hint, valueLabel, onPress }: { name: string; hint: string; valueLabel: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line }}>
      <View style={{ flex: 1 }}>
        <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>{name}</AppText>
        <AppText variant="body" muted style={{ marginTop: 2 }}>{hint}</AppText>
      </View>
      <AppText variant="label" style={{ color: theme.accent }}>{valueLabel}</AppText>
      <AppText variant="title" muted style={{ marginLeft: theme.space.sm }}>›</AppText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// OptionRow — selectable row (goals, debt choice, pace)
// ---------------------------------------------------------------------------
export function OptionRow({ name, hint, icon, selected, onPress, recommended, rightLabel }: {
  name: string; hint?: string; icon?: string; selected?: boolean; onPress: () => void; recommended?: boolean; rightLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.space.lg, borderBottomWidth: 1, borderBottomColor: theme.line }}>
      {icon ? <AppText variant="title" style={{ fontSize: 26, marginRight: theme.space.md }}>{icon}</AppText> : null}
      <View style={{ flex: 1 }}>
        {recommended ? <AppText variant="label" style={{ color: theme.accent, marginBottom: 2 }}>RECOMMENDED</AppText> : null}
        <AppText variant="title" style={{ fontSize: 20, lineHeight: 24 }}>{name}</AppText>
        {hint ? <AppText variant="body" muted style={{ marginTop: 2 }}>{hint}</AppText> : null}
      </View>
      {rightLabel ? <AppText variant="body" style={{ marginRight: theme.space.md }}>{rightLabel}</AppText> : null}
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selected ? theme.accent : theme.line, backgroundColor: selected ? theme.accent : 'transparent' }} />
    </Pressable>
  );
}
