import { missionTelemetry, signalKeys, type Signal, type Telemetry } from '../data/nasaMissionData';

interface Distribution { mean: number; deviation: number; }
type Baseline = Record<Signal, Distribution>;

const initialBaseline: Baseline = {
  hrv_rmssd: { mean: 52, deviation: 8.5 },
  resting_hr: { mean: 67, deviation: 6 },
  sleep_efficiency: { mean: 84, deviation: 12 },
  radiation_dose: { mean: .55, deviation: .44 },
  cabin_co2: { mean: 1.95, deviation: .96 },
  ared_compliance: { mean: 95, deviation: 6 },
  delta_bmd: { mean: 0, deviation: .46 },
  core_temp: { mean: 36.8, deviation: .12 },
};

// Demo scale floors keep the pre-update z-score stable on near-constant signals.
const minScale: Record<Signal, number> = {
  hrv_rmssd: 7.21, resting_hr: 4, sleep_efficiency: 12.6, radiation_dose: .437,
  cabin_co2: .96, ared_compliance: 5, delta_bmd: .46, core_temp: .12,
};

const signalRecord = <T,>(map: (key: Signal) => T): Record<Signal, T> =>
  Object.fromEntries(signalKeys.map(key => [key, map(key)])) as Record<Signal, T>;

const scale = (key: Signal, baseline: Baseline) => Math.max(baseline[key].deviation, minScale[key]);

export const driverDefinitions = [
  { id: 'autonomic', label: 'Autonomic vagal suppression', color: '#a2b8d3' },
  { id: 'radiation', label: 'Solar radiation exposure', color: '#c8a580' },
  { id: 'circadian', label: 'Circadian & CO₂ stress', color: '#778395' },
  { id: 'bone', label: 'Bone deconditioning', color: '#b0b9a5' },
] as const;

export function scoreTelemetry(sample: Telemetry, baseline: Baseline) {
  const z = signalRecord(key => (sample[key] - baseline[key].mean) / scale(key, baseline));
  const hrv = Math.max(0, -z.hrv_rmssd);
  const radiation = Math.max(0, z.radiation_dose);
  const sleep = Math.max(0, -z.sleep_efficiency);
  const co2 = Math.max(0, z.cabin_co2);
  const bone = Math.max(0, -z.delta_bmd);
  const autonomicRadiation = Math.sqrt(hrv * radiation);
  const sleepCO2 = .6 * Math.sqrt(sleep * co2);
  const coupling = autonomicRadiation + sleepCO2;
  const contribution = [
    .30 * hrv + .225 * autonomicRadiation,
    .22 * radiation + .225 * autonomicRadiation,
    .18 * sleep + .15 * co2 + .45 * sleepCO2,
    .15 * bone,
  ];
  const raw = contribution.reduce((sum, value) => sum + value, 0);
  const msci = Math.round(100 * -Math.expm1(-.42 * raw));
  const exact = contribution.map(value => raw ? 100 * value / raw : 0);
  const percentages = exact.map(Math.floor);
  const byRemainder = exact.map((value, index) => ({ index, remainder: value - percentages[index] }))
    .sort((a, b) => b.remainder - a.remainder);
  const remainder = raw ? 100 - percentages.reduce((sum, value) => sum + value, 0) : 0;
  for (const { index } of byRemainder.slice(0, remainder)) percentages[index]++;
  return {
    msci, z, raw, coupling,
    attribution: driverDefinitions.map((driver, index) => ({ ...driver, percent: percentages[index], exact: exact[index] })),
  };
}

export function statusFor(score: number) {
  if (score >= 65) return { label: 'Critical Intervention', tone: 'critical' } as const;
  if (score >= 35) return { label: 'Caution', tone: 'caution' } as const;
  return { label: 'Nominal', tone: 'nominal' } as const;
}

const acuteFixedAlert = (sample: Telemetry) => sample.resting_hr >= 100 || sample.core_temp >= 38;
function fixedAlerts(sample: Telemetry) {
  return Number(sample.hrv_rmssd < 45) + Number(sample.resting_hr > 72) + Number(sample.core_temp >= 38);
}

let baseline = initialBaseline;
export const mission = missionTelemetry.map(sample => {
  const prior = baseline;
  const score = scoreTelemetry(sample, prior);
  const alpha = sample.day <= 14 ? .25 : .12;
  baseline = signalRecord(key => {
    const { mean, deviation } = prior[key];
    const updatedMean = alpha * sample[key] + (1 - alpha) * mean;
    return {
      mean: updatedMean,
      deviation: Math.sqrt(alpha * (sample[key] - updatedMean) ** 2 + (1 - alpha) * deviation ** 2),
    };
  });
  const hrvCenter = prior.hrv_rmssd.mean;
  const hrvSpread = 1.8 * scale('hrv_rmssd', prior);
  return {
    ...sample, ...score, alpha, prior, baseline,
    hrvCenter, hrvBand: [hrvCenter - hrvSpread, hrvCenter + hrvSpread] as [number, number],
    fixedAlerts: fixedAlerts(sample), adaptiveAlerts: Number(score.msci >= 35),
  };
});

export type MissionSample = typeof mission[number];

const preEvent = missionTelemetry[40];
const peak = missionTelemetry[41];
const replayBaseline = mission[40].prior;

// Synthetic hourly interpolation supplements the daily replay for the early-warning comparison.
export const speReplay = Array.from({ length: 61 }, (_, index) => {
  const hour = index - 60;
  const mix = hour < -38 ? 0 : .23 + .77 * (hour + 38) / 38;
  const sample = { day: peak.day + hour / 24, ...signalRecord(key => preEvent[key] + (peak[key] - preEvent[key]) * mix) };
  sample.resting_hr = hour === 0 ? peak.resting_hr : preEvent.resting_hr + (96 - preEvent.resting_hr) * mix;
  const score = scoreTelemetry(sample, replayBaseline);
  return { hour, day: sample.day, msci: score.msci, adaptive: score.msci >= 35, fixed: acuteFixedAlert(sample) };
});

const early = speReplay.find(sample => sample.adaptive);
const acute = speReplay.find(sample => sample.fixed);
const adaptation = mission.slice(0, 14);
const fixedFalse = adaptation.reduce((sum, sample) => sum + sample.fixedAlerts, 0);
const adaptiveFalse = adaptation.reduce((sum, sample) => sum + sample.adaptiveAlerts, 0);

export const benchmark = {
  fixedFalse,
  adaptiveFalse,
  reduction: 100 * (1 - adaptiveFalse / fixedFalse),
  leadHours: early && acute ? acute.hour - early.hour : null,
  earlyDay: early?.day,
  acuteDay: acute?.day,
};
