import { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, TextInput, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { parseAmount } from '@coast/core';
import { planBreakdown } from '@coast/engine';
import { useCoastStore } from '../src/store/store';
import { Screen } from '../src/design/primitives/Screen';
import { AppText } from '../src/design/primitives/Text';
import { Money } from '../src/design/primitives/Money';
import { PillButton } from '../src/design/primitives/PillButton';
import { ProgressBar } from '../src/design/primitives/ProgressBar';
import { DonutChart } from '../src/design/DonutChart';
import { WaveLine } from '../src/design/primitives/WaveLine';
import { Shell } from '../src/design/primitives/Shell';
import { SCRIPT_FAMILY } from '../src/design/fonts';
import { theme } from '../src/design/theme';
import {
  Flow, initialFlow, buildPlanFromFlow, Frequency, FREQUENCIES, ruleLabel,
  ESSENTIAL_CATS, LIFESTYLE_CATS, SUB_PRESETS, GOALS, PACE_META, Pace, CatDef,
  incomeMonthly, homeMonthly, billsMonthly, essentialsMonthly, lifestyleMonthly,
  subsMonthly, fixedMonthly, leftToMap, availableForSavings, paceAmount, CategoryEntry, cadenceToMonthly,
} from '../src/onboarding/model';
import { Eyebrow, ContextBar, ChipRow, Chip, DayCarousel, MoneySheet, SegTwo, MapRow, OptionRow } from '../src/onboarding/parts';

const LAST = 15; // Leaks / start
const PHASE_LABEL = (s: number) => (s <= 5 ? 'YOUR MONEY' : s <= 10 ? 'YOUR PLAN' : 'YOUR PLAN');

function AmountField({ value, onChangeText, placeholder = '0.00', prefix }: { value: string; onChangeText: (t: string) => void; placeholder?: string; prefix?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: theme.line }}>
      {prefix ? <AppText variant="title" muted style={{ paddingBottom: theme.space.sm }}>{prefix}</AppText> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={{ flex: 1, fontFamily: theme.type.title.family, fontSize: theme.type.title.size, color: theme.text, paddingVertical: theme.space.sm }}
      />
    </View>
  );
}

function LabeledAmount({ label, value, onChangeText }: { label: string; value: string; onChangeText: (t: string) => void }) {
  return (
    <View style={{ marginTop: theme.space.lg }}>
      <AppText variant="label" muted>{label}</AppText>
      <AmountField value={value} onChangeText={onChangeText} />
    </View>
  );
}

function PhaseBars({ step }: { step: number }) {
  // three phases: money-in+fixed (1-5), flexible (6-10), savings+result (11-15)
  const frac = (lo: number, hi: number) => Math.max(0, Math.min(1, (step - lo + 1) / (hi - lo + 1)));
  const phases = [frac(1, 5), frac(6, 10), frac(11, 15)];
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.sm, marginTop: theme.space.lg }}>
      {phases.map((f, i) => (
        <View key={i} style={{ flex: 1 }}><ProgressBar fraction={f} color={theme.sea} /></View>
      ))}
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useCoastStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState<Flow>(() => initialFlow());
  const [sheet, setSheet] = useState<{ pool: 'essentials' | 'lifestyle'; def: CatDef } | null>(null);
  const [bd, setBd] = useState<Record<string, string>>({});

  const patch = (p: Partial<Flow>) => setFlow((f) => ({ ...f, ...p }));
  const setCat = (pool: 'essentials' | 'lifestyle', key: string, entry: CategoryEntry) =>
    setFlow((f) => ({ ...f, [pool]: { ...f[pool], [key]: entry } }));

  const incomeM = incomeMonthly(flow);
  const built = buildPlanFromFlow(flow);

  // building screen auto-advances
  useEffect(() => {
    if (step !== 13) return;
    const t = setTimeout(() => setStep(14), 1600);
    return () => clearTimeout(t);
  }, [step]);

  const canProceed = (() => {
    if (step === 1) return incomeM > 0;
    return true;
  })();

  const nextLabel = step === 0 ? 'Get started'
    : step === 6 ? 'Start with essentials'
    : step === 7 ? 'Continue to lifestyle'
    : step === 8 ? "Show me what's left"
    : step === 12 ? 'Build my plan'
    : step === 14 ? "Show me what's hidden"
    : step === LAST ? 'Start Coast'
    : 'Continue';

  const onNext = () => {
    if (!canProceed) return;
    if (step === 12) { setStep(13); return; } // -> building
    if (step === LAST) {
      completeOnboarding(built.income, built.plan);
      router.replace('/');
      return;
    }
    setStep((s) => Math.min(s + 1, LAST));
  };

  const entryLabel = (e: CategoryEntry) => {
    if (e.skipped) return 'skipped';
    const m = cadenceToMonthly(parseAmount(e.amount), e.cadence);
    return m > 0 ? `£${Math.round(m / 100)}` : 'Add';
  };

  return (
    <Screen>
      {step === 13 ? null : (
        <>
          <PhaseBars step={step} />
          <View style={{ alignItems: 'center', marginTop: theme.space.sm }}>
            <AppText variant="label" style={{ color: theme.sea, letterSpacing: 2 }}>{PHASE_LABEL(step)}</AppText>
            <View style={{ marginTop: 3 }}><WaveLine width={64} height={9} color={theme.sea} strokeWidth={1.5} /></View>
          </View>
        </>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}>
        {/* 0 — Welcome */}
        {step === 0 && (
          <View style={{ marginTop: 72, alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ fontFamily: SCRIPT_FAMILY, fontSize: 148, lineHeight: 172, color: theme.sea }}>coast</Text>
            <View style={{ marginTop: theme.space.xs }}><WaveLine width={170} height={16} color={theme.sea} strokeWidth={1.8} /></View>
            <AppText variant="body" muted style={{ marginTop: theme.space.xl, textAlign: 'center' }}>
              A few honest questions and Coast builds your plan from your real month — what's safe to spend today, and every next move.
            </AppText>
          </View>
        )}

        {/* 1 — Income */}
        {step === 1 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="MONEY IN" color={theme.accent} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>Let's find what you can plan with.</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>After tax — the amount that actually lands in your account.</AppText>
            {flow.incomes.map((inc, i) => (
              <View key={i} style={{ marginTop: theme.space.lg }}>
                {i > 0 ? <AppText variant="label" muted>EXTRA INCOME {i}</AppText> : null}
                <AmountField value={inc.amount} prefix="£" onChangeText={(t) => setFlow((f) => ({ ...f, incomes: f.incomes.map((x, idx) => (idx === i ? { ...x, amount: t } : x)) }))} />
                <ChipRow options={FREQUENCIES} value={inc.freq} onChange={(v) => setFlow((f) => ({ ...f, incomes: f.incomes.map((x, idx) => (idx === i ? { ...x, freq: v as Frequency } : x)) }))} />
              </View>
            ))}
            <Pressable onPress={() => setFlow((f) => ({ ...f, incomes: [...f.incomes, { amount: '', freq: 'monthly' }] }))} style={{ marginTop: theme.space.xl }}>
              <AppText variant="label" style={{ color: theme.accent }}>+ Add another income</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.xs }}>Side work, benefits, freelance or a second salary</AppText>
            </Pressable>
            {incomeM > 0 ? <AppText variant="body" muted style={{ marginTop: theme.space.xl }}>That's <Money pence={incomeM} mode="whole" variant="body" /> a month to work with.</AppText> : null}
          </View>
        )}

        {/* 2 — Payday */}
        {step === 2 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="MONEY IN" color={theme.accent} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>When does your money land?</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Coast builds each plan payday to payday — not from the 1st.</AppText>
            <AppText variant="label" muted style={{ marginTop: theme.space.xl }}>HOW ARE YOU PAID?</AppText>
            <ChipRow options={FREQUENCIES} value={flow.payFreq} onChange={(v) => patch({ payFreq: v as Frequency })} />
            <AppText variant="body" muted style={{ marginTop: theme.space.xl }}>Or use a rule that follows the calendar.</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.md }}>
              <Chip label="First working day" selected={flow.payday.kind === 'firstWorkingDay'} onPress={() => patch({ payday: { kind: 'firstWorkingDay' } })} />
              <Chip label="Last working day" selected={flow.payday.kind === 'lastWorkingDay'} onPress={() => patch({ payday: { kind: 'lastWorkingDay' } })} />
              <Chip label="Last day of month" selected={flow.payday.kind === 'lastDay'} onPress={() => patch({ payday: { kind: 'lastDay' } })} />
              <Chip label="Last Friday" selected={flow.payday.kind === 'lastFriday'} onPress={() => patch({ payday: { kind: 'lastFriday' } })} />
            </View>
            <DayCarousel dom={flow.payday.kind === 'day' ? flow.payday.dom : 25} onChange={(d) => patch({ payday: { kind: 'day', dom: d } })} />
            <AppText variant="body" muted style={{ marginTop: theme.space.xl, textAlign: 'center' }}>Paid on <AppText variant="body">{ruleLabel(flow.payday)}</AppText>.</AppText>
          </View>
        )}

        {/* 3 — Home */}
        {step === 3 && (
          <View style={{ marginTop: theme.space.lg }}>
            <ContextBar label="IN EACH MONTH" pence={incomeM} note={`PAID ${ruleLabel(flow.payday).toUpperCase()}`} fraction={0} color={theme.accent} />
            <View style={{ marginTop: theme.space.xl }}>
              <Eyebrow text="FIXED FIRST" color={theme.accent} />
              <AppText variant="title" style={{ marginTop: theme.space.sm }}>What does home cost each month?</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>We reserve this before Coast works out what's safe to spend.</AppText>
              <View style={{ marginTop: theme.space.lg }}>
                <SegTwo a="Rent" b="Mortgage" value={flow.home.kind === 'mortgage' ? 'Mortgage' : 'Rent'} onChange={(v) => patch({ home: { ...flow.home, kind: v === 'Mortgage' ? 'mortgage' : 'rent' } })} />
              </View>
              {flow.home.kind !== 'none' && <View style={{ marginTop: theme.space.lg }}><AmountField value={flow.home.amount} prefix="£" onChangeText={(t) => patch({ home: { ...flow.home, amount: t } })} /></View>}
              <Pressable onPress={() => patch({ home: { kind: flow.home.kind === 'none' ? 'rent' : 'none', amount: '' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginTop: theme.space.lg }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: flow.home.kind === 'none' ? theme.accent : theme.line, backgroundColor: flow.home.kind === 'none' ? theme.accent : 'transparent' }} />
                <AppText variant="body">I don't pay for housing</AppText>
              </Pressable>
            </View>
          </View>
        )}

        {/* 4 — Bills */}
        {step === 4 && (
          <View style={{ marginTop: theme.space.lg }}>
            <ContextBar label="LEFT AFTER HOME" pence={Math.max(0, incomeM - homeMonthly(flow))} note="HOME RESERVED" fraction={homeMonthly(flow) / Math.max(1, incomeM)} color={theme.accent} />
            <View style={{ marginTop: theme.space.xl }}>
              <Eyebrow text="PROTECT THE BILLS" color={theme.accent} />
              <AppText variant="title" style={{ marginTop: theme.space.sm }}>What else has to be paid each month?</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Council tax, energy, water, internet, phone and insurance. A close estimate is enough.</AppText>
              <View style={{ marginTop: theme.space.lg }}>
                <SegTwo a="Quick total" b="Break it down" value={flow.bills.mode === 'breakdown' ? 'Break it down' : 'Quick total'} onChange={(v) => patch({ bills: { ...flow.bills, mode: v === 'Break it down' ? 'breakdown' : 'quick', skipped: false } })} />
              </View>
              {flow.bills.mode === 'quick' ? (
                <View style={{ marginTop: theme.space.lg }}><AmountField value={flow.bills.amount} prefix="£" onChangeText={(t) => patch({ bills: { ...flow.bills, amount: t, skipped: false } })} /></View>
              ) : (
                <View>
                  {['Council tax', 'Energy', 'Water', 'Internet', 'Phone', 'Insurance'].map((label) => (
                    <LabeledAmount key={label} label={label.toUpperCase()} value={bd[label] ?? ''} onChangeText={(t) => {
                      const next = { ...bd, [label]: t };
                      setBd(next);
                      const total = Object.values(next).reduce((s, v) => s + parseAmount(v), 0);
                      patch({ bills: { ...flow.bills, amount: String(Math.round(total / 100)), skipped: false } });
                    }} />
                  ))}
                  <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>Adds up to <Money pence={billsMonthly(flow)} mode="whole" variant="body" /> a month.</AppText>
                </View>
              )}
              <Pressable onPress={() => patch({ bills: { ...flow.bills, skipped: !flow.bills.skipped, amount: '' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, marginTop: theme.space.lg }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: flow.bills.skipped ? theme.accent : theme.line, backgroundColor: flow.bills.skipped ? theme.accent : 'transparent' }} />
                <AppText variant="body">I don't pay these directly</AppText>
              </Pressable>
            </View>
          </View>
        )}

        {/* 5 — Debt */}
        {step === 5 && (
          <View style={{ marginTop: theme.space.lg }}>
            <ContextBar label="LEFT AFTER FIXED" pence={Math.max(0, incomeM - homeMonthly(flow) - billsMonthly(flow))} note="BILLS RESERVED" fraction={(homeMonthly(flow) + billsMonthly(flow)) / Math.max(1, incomeM)} color={theme.accent} />
            <View style={{ marginTop: theme.space.xl }}>
              <Eyebrow text="PROTECT THE MINIMUMS" color={theme.categoryColors.debt} />
              <AppText variant="title" style={{ marginTop: theme.space.sm }}>What does debt need each month?</AppText>
              <OptionRow name="I have repayments" hint="Protect minimums and plan the rest" selected={flow.debt.has} onPress={() => patch({ debt: { ...flow.debt, has: true } })} />
              <OptionRow name="I don't have any debt" hint="Keep every spare pound working forward" selected={!flow.debt.has} onPress={() => patch({ debt: { has: false, amount: '' } })} />
              {flow.debt.has && <View style={{ marginTop: theme.space.lg }}><AppText variant="label" muted>MINIMUM REPAYMENTS / MONTH</AppText><AmountField value={flow.debt.amount} prefix="£" onChangeText={(t) => patch({ debt: { ...flow.debt, amount: t } })} /></View>}
            </View>
          </View>
        )}

        {/* 6 — Flexible intro */}
        {step === 6 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="YOUR FLEXIBLE MONEY" color={theme.overPace} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>Now give the rest a job.</AppText>
            <AppText variant="hero" style={{ fontSize: 52, lineHeight: 56, marginTop: theme.space.lg }}>{`£${Math.round(leftToMap(flow) / 100).toLocaleString('en-GB')}`}</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Left after fixed costs and debt minimums.</AppText>
            <View style={{ marginTop: theme.space.xl, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: theme.space.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="label" muted>PROTECTED</AppText>
                <AppText variant="label" muted>TO MAP</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.space.xs }}>
                <Money pence={fixedMonthly(flow)} mode="whole" variant="body" />
                <Money pence={leftToMap(flow)} mode="whole" variant="body" />
              </View>
            </View>
          </View>
        )}

        {/* 7 — Essentials mapping */}
        {step === 7 && (
          <View style={{ marginTop: theme.space.lg }}>
            <ContextBar index="01" label="ESSENTIALS" pence={Math.max(0, leftToMap(flow) - essentialsMonthly(flow))} note="LEFT TO MAP" fraction={essentialsMonthly(flow) / Math.max(1, leftToMap(flow))} />
            <View style={{ marginTop: theme.space.xl }}>
              <AppText variant="title">Protect your essentials.</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Everyday essentials not already covered by your bills.</AppText>
              {ESSENTIAL_CATS.map((c) => (
                <MapRow key={c.key} name={c.name} hint={c.hint} valueLabel={entryLabel(flow.essentials[c.key])} onPress={() => setSheet({ pool: 'essentials', def: c })} />
              ))}
            </View>
          </View>
        )}

        {/* 8 — Lifestyle mapping */}
        {step === 8 && (
          <View style={{ marginTop: theme.space.lg }}>
            <ContextBar index="02" label="LIFESTYLE" pence={Math.max(0, leftToMap(flow) - essentialsMonthly(flow) - lifestyleMonthly(flow))} note="LEFT TO MAP" fraction={(essentialsMonthly(flow) + lifestyleMonthly(flow)) / Math.max(1, leftToMap(flow))} />
            <View style={{ marginTop: theme.space.xl }}>
              <AppText variant="title">Map what can flex.</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Rough amounts for the spending that changes month to month. This is the number Coast paces daily.</AppText>
              {LIFESTYLE_CATS.map((c) => (
                <MapRow key={c.key} name={c.name} hint={c.hint} valueLabel={entryLabel(flow.lifestyle[c.key])} onPress={() => setSheet({ pool: 'lifestyle', def: c })} />
              ))}
            </View>
          </View>
        )}

        {/* 9 — Subscriptions */}
        {step === 9 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="SUBSCRIPTIONS" color={theme.overPace} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>Any subscriptions to protect?</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Recurring payments you want on your plan. Skip if you have none.</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, marginTop: theme.space.lg }}>
              {SUB_PRESETS.map((p) => {
                const on = flow.subs.some((s) => s.name === p.name);
                return (
                  <Chip key={p.name} label={`${p.name} £${(p.pence / 100).toFixed(2)}`} selected={on} onPress={() => patch({ subs: on ? flow.subs.filter((s) => s.name !== p.name) : [...flow.subs, p] })} />
                );
              })}
            </View>
            {subsMonthly(flow) > 0 ? <AppText variant="body" muted style={{ marginTop: theme.space.xl }}>Protecting <Money pence={subsMonthly(flow)} variant="body" /> a month.</AppText> : null}
          </View>
        )}

        {/* 10 — Joy */}
        {step === 10 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="JOY" color={theme.overPace} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>What's worth keeping?</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Joy is spending you choose on purpose. Coast still counts it, but never calls it a leak or suggests cutting it first.</AppText>
            <View style={{ marginTop: theme.space.lg, borderLeftWidth: 3, borderLeftColor: theme.overPace, paddingLeft: theme.space.md }}>
              <AppText variant="body">Your subscriptions are already protected as Joy. Everything else stays flexible.</AppText>
            </View>
            {subsMonthly(flow) > 0
              ? <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>{flow.subs.map((s) => s.name).join(', ')} — <Money pence={subsMonthly(flow)} variant="body" />/mo, never flagged.</AppText>
              : <AppText variant="body" muted style={{ marginTop: theme.space.lg }}>You haven't added any protected spending yet. That's completely fine.</AppText>}
          </View>
        )}

        {/* 11 — Savings goals */}
        {step === 11 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="GIVE IT A JOB" color={theme.categoryColors.savings} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>What should your savings build first?</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Choose what matters. We'll work out realistic amounts next.</AppText>
            <AppText variant="label" style={{ color: theme.categoryColors.savings, marginTop: theme.space.lg }}>{String(flow.goals.length).padStart(2, '0')} SELECTED</AppText>
            {GOALS.map((g) => (
              <OptionRow key={g.key} icon={g.icon} name={g.name} hint={g.hint} recommended={g.rec} selected={flow.goals.includes(g.key)} onPress={() => patch({ goals: flow.goals.includes(g.key) ? flow.goals.filter((x) => x !== g.key) : [...flow.goals, g.key] })} />
            ))}
          </View>
        )}

        {/* 12 — Savings pace */}
        {step === 12 && (
          <View style={{ marginTop: theme.space.lg }}>
            <ContextBar index="03" label="SAVINGS" pence={availableForSavings(flow)} note="AVAILABLE" fraction={0.66} color={theme.categoryColors.savings} />
            <View style={{ marginTop: theme.space.xl }}>
              <AppText variant="title">Choose your monthly pace.</AppText>
              <AppText variant="body" muted style={{ marginTop: theme.space.sm }}><Money pence={availableForSavings(flow)} mode="whole" variant="body" /> is free after the life you mapped.</AppText>
              <AppText variant="hero" style={{ fontSize: 52, lineHeight: 56, color: theme.categoryColors.savings, marginTop: theme.space.lg }}>{`£${Math.round(paceAmount(flow, flow.pace) / 100).toLocaleString('en-GB')}`}</AppText>
              <AppText variant="body" muted>Leaves <Money pence={availableForSavings(flow) - paceAmount(flow, flow.pace)} mode="whole" variant="body" /> breathing room each month.</AppText>
              <View style={{ marginTop: theme.space.lg }}>
                {PACE_META.map((p) => (
                  <OptionRow key={p.key} name={p.name} hint={p.hint} recommended={p.rec} rightLabel={`£${Math.round(paceAmount(flow, p.key) / 100).toLocaleString('en-GB')}`} selected={flow.pace === p.key} onPress={() => patch({ pace: p.key as Pace })} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 13 — Building */}
        {step === 13 && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 120 }}>
            <AppText variant="label" style={{ color: theme.sea, letterSpacing: 2 }}>BUILDING YOUR PLAN</AppText>
            <View style={{ marginTop: theme.space.xl }}><Shell size={120} color={theme.sea} strokeWidth={2} /></View>
            <View style={{ marginTop: theme.space.xl }}><WaveLine width={120} height={16} color={theme.sea} strokeWidth={2} /></View>
            <AppText variant="label" muted style={{ marginTop: theme.space.xxl }}>CALCULATING</AppText>
            <AppText variant="title" style={{ marginTop: theme.space.xs }}>Building your money profile</AppText>
          </View>
        )}

        {/* 14 — Result donut */}
        {step === 14 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="YOUR PLAN" color={theme.overPace} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>Every pound has a place.</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>Here's the plan built from your real month.</AppText>
            <View style={{ alignItems: 'center', marginTop: theme.space.lg }}>
              <DonutChart breakdown={planBreakdown(built.plan)} topLabel="PER MONTH" centerPence={planBreakdown(built.plan).total} />
            </View>
            {[
              ['Bills & fixed', built.plan.bills, theme.categoryColors.bills],
              ['Savings', built.plan.savings, theme.categoryColors.savings],
              ['Spending money', built.plan.lifestyle, theme.categoryColors.discretionary],
              ['Debt', built.plan.debt, theme.categoryColors.debt],
            ].map(([label, pence, color]) => (
              <View key={label as string} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.space.md, borderBottomWidth: 1, borderBottomColor: theme.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color as string }} />
                  <AppText variant="body">{label as string}</AppText>
                </View>
                <Money pence={pence as number} mode="whole" variant="body" />
              </View>
            ))}
          </View>
        )}

        {/* 15 — Leaks check */}
        {step === 15 && (
          <View style={{ marginTop: theme.space.xl }}>
            <Eyebrow text="NOTHING HIDDEN" color={theme.overPace} />
            <AppText variant="title" style={{ marginTop: theme.space.sm }}>Your spending already looks intentional.</AppText>
            <AppText variant="body" muted style={{ marginTop: theme.space.sm }}>We couldn't find an obvious lifestyle leak in what you mapped.</AppText>
            <View style={{ marginTop: theme.space.lg, backgroundColor: theme.card, borderRadius: theme.radius.lg, padding: theme.space.xl }}>
              <AppText variant="label" muted>COAST CHECK</AppText>
              <AppText variant="hero" style={{ fontSize: 40, lineHeight: 44, color: theme.categoryColors.savings, marginTop: theme.space.md }}>£0 obvious leaks</AppText>
              <AppText variant="body" style={{ marginTop: theme.space.md }}>Your answers look deliberate. Coast will keep watching the real data for anything that changes.</AppText>
            </View>
            <View style={{ marginTop: theme.space.lg, flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.categoryColors.debt }} />
              <AppText variant="body" muted>Your Joy spending is protected — never treated as a leak.</AppText>
            </View>
          </View>
        )}
      </ScrollView>

      {step !== 13 && (
        <View style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.lg, marginTop: theme.space.sm }}>
          {step > 0 ? (
            <Pressable onPress={() => setStep((s) => Math.max(0, s - 1))} style={{ justifyContent: 'center', paddingHorizontal: theme.space.lg }}>
              <AppText variant="label" muted>Back</AppText>
            </Pressable>
          ) : null}
          <View style={{ flex: 1, opacity: canProceed ? 1 : 0.4 }}>
            <PillButton label={nextLabel} onPress={onNext} />
          </View>
        </View>
      )}

      {sheet && (
        <MoneySheet
          key={`${sheet.pool}:${sheet.def.key}`}
          visible
          title={sheet.def.name}
          hint={sheet.def.hint}
          entry={flow[sheet.pool][sheet.def.key]}
          skipLabel={`I don't pay for ${sheet.def.name.toLowerCase()}`}
          onClose={() => setSheet(null)}
          onSave={(e) => { setCat(sheet.pool, sheet.def.key, e); setSheet(null); }}
        />
      )}
    </Screen>
  );
}
