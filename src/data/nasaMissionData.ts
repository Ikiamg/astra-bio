export const nasaCabinCO2Limit = 3;
export const marsDelayMinutes = 22;

export const signalKeys = [
  'hrv_rmssd', 'resting_hr', 'sleep_efficiency', 'radiation_dose',
  'cabin_co2', 'ared_compliance', 'delta_bmd', 'core_temp',
] as const;

export type Signal = typeof signalKeys[number];
export type Telemetry = Record<Signal, number> & { day: number };
export type MissionDay = 25 | 42 | 55;

export const scenarioDays = [25, 42, 55] as const;
export const scenarios = {
  25: {
    name: 'Nominal Deep-Space Transit',
    short: 'Nominal Transit',
    phase: 'Deep-space transit',
    description: 'Crew physiology and cabin conditions are tracking within the expected range for this phase of flight.',
    explanation: 'Autonomic recovery is steady and environmental exposure remains within the simulated mission range. Continue scheduled monitoring and countermeasures.',
  },
  42: {
    name: 'Solar Particle Event',
    short: 'Solar Particle Event',
    phase: 'Solar particle event',
    description: 'Radiation and cabin CO₂ are elevated while heart rate variability and sleep efficiency have fallen.',
    explanation: 'HRV dropped from approximately 52 ms to 25 ms while radiation rose to 2.15 mSv/day. Higher cabin CO₂ and poorer sleep add to the coupled risk score.',
  },
  55: {
    name: 'Osteo-Cardiovascular & SANS Risk',
    short: 'Bone & SANS Risk',
    phase: 'Long-duration adaptation',
    description: 'Reduced resistive exercise and sustained cabin CO₂ warrant a review of bone and neuro-ocular risk.',
    explanation: 'ARED completion is 58% and projected bone mineral density is down 1.6%. Sustained cabin CO₂ adds environmental strain. The simulation flags the profile for review.',
  },
} satisfies Record<MissionDay, { name: string; short: string; phase: string; description: string; explanation: string }>;

const adaptationHRV = [47, 43, 42, 41, 42, 43, 42, 43, 44, 46, 47, 49, 50, 51];
const adaptationHR = [74, 75, 76, 76, 75, 75, 74, 74, 73.5, 73, 72, 71, 70, 69];

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function simulateDay(day: number): Telemetry {
  const gradualLoad = Math.max(0, Math.min(day - 47, 8)) / 8;
  const data: Telemetry = {
    day,
    hrv_rmssd: adaptationHRV[day - 1] ?? round(52.2 + 1.1 * Math.sin(day * .52) - gradualLoad * 3.5),
    resting_hr: adaptationHR[day - 1] ?? round(67.5 + 1.4 * Math.sin(day * .46) + gradualLoad * 3.2),
    sleep_efficiency: round(82.5 + 2.1 * Math.sin(day * .61) - gradualLoad * 3.5),
    radiation_dose: round(.55 + .045 * Math.sin(day * .63) + .013 * Math.cos(day * 1.49)),
    cabin_co2: round(1.92 + .11 * Math.sin(day * .38) + gradualLoad * .65),
    ared_compliance: round(93 + 2.5 * Math.sin(day * .49) - gradualLoad * 23),
    delta_bmd: round(day < 47 ? Math.max(-.27, -.012 * day) : -.27 - gradualLoad * .53),
    core_temp: round(36.85 + .06 * Math.sin(day * .35)),
  };
  const events: Partial<Record<number, Partial<Telemetry>>> = {
    8: { sleep_efficiency: 67, cabin_co2: 2.96, radiation_dose: .89 },
    25: { hrv_rmssd: 48.85, resting_hr: 68, sleep_efficiency: 78.3, radiation_dose: .65, cabin_co2: 2.33, ared_compliance: 94, core_temp: 36.9 },
    41: { hrv_rmssd: 52, core_temp: 36.85 },
    42: { hrv_rmssd: 25, resting_hr: 104, sleep_efficiency: 61, radiation_dose: 2.15, cabin_co2: 3.9, ared_compliance: 82, core_temp: 37.25 },
    43: { hrv_rmssd: 35, resting_hr: 85, sleep_efficiency: 68, radiation_dose: 1.43, cabin_co2: 3.16, ared_compliance: 85, core_temp: 37.06 },
    44: { hrv_rmssd: 45, resting_hr: 73, sleep_efficiency: 76, radiation_dose: .83, cabin_co2: 2.52 },
    54: { cabin_co2: 3.4 },
    55: { hrv_rmssd: 44, resting_hr: 75, sleep_efficiency: 74, radiation_dose: .56, cabin_co2: 3.4, ared_compliance: 58, delta_bmd: -1.6 },
    56: { cabin_co2: 3.4, ared_compliance: 64, delta_bmd: -1.52 },
  };
  return { ...data, ...events[day] };
}

export const missionTelemetry = Array.from({ length: 60 }, (_, index) => simulateDay(index + 1));

export const protocolIds = ['habitat', 'exercise', 'recovery'] as const;
export type ProtocolId = typeof protocolIds[number];
export interface Protocol { id: ProtocolId; title: string; system: string; detail: string; }

export function protocolsFor(day: MissionDay): Protocol[] {
  return [
    {
      id: 'habitat', system: 'ENVIRONMENTAL', title: day === 42 ? 'Storm shelter & CO₂ control' : 'Cabin atmosphere & shielding',
      detail: {
        25: 'Verify dosimeter, cabin ventilation, and CDRA scrubber status.',
        42: 'Move to the shielded shelter and simulate enhanced CO₂ removal with CDRA / LiOH.',
        55: 'Review ventilation and CO₂ removal after sustained readings above 3.0 mmHg.',
      }[day],
    },
    {
      id: 'exercise', system: 'MUSCULOSKELETAL', title: 'ARED / LBNP protocol',
      detail: {
        25: 'Log scheduled resistive exercise and review load adherence.',
        42: 'Log the simulated 30% reduction in peak eccentric ARED load.',
        55: 'Log the simulated resistive load increase and 25-minute LBNP session.',
      }[day],
    },
    {
      id: 'recovery', system: 'CIRCADIAN', title: 'Circadian & autonomic recovery',
      detail: day === 25 ? 'Confirm the scheduled lighting transition and hydration check.' :
        'Simulate the SSLA lighting transition (480 nm daytime, reduced blue at night) and confirm the hydration check.',
    },
  ];
}
