/**
 * A.S.T.R.A.-Bio — Clinical Thresholds, N-of-1 EWMA & MSCI Model Configuration
 * Every threshold and parameter is explicitly documented with its aerospace/clinical reference source.
 */

export const MONTE_CARLO_CONFIG = {
  numSeeds: 30,
  seeds: Array.from({ length: 30 }, (_, i) => i + 1), // Deterministic seeds 1..30 (Mulberry32 PRNG)
  defaultDisplaySeed: 1,
  missionDays: 60,
  acclimatizationDays: 14,
};

/**
 * Fixed Terrestrial & Standard Habitat Thresholds
 * Used as the baseline comparator (Static Monitor) in the 30-seed Monte Carlo validation benchmark.
 */
export const FIXED_TERRESTRIAL_THRESHOLDS = {
  hrv_rmssd_min_ms: {
    value: 43.5,
    unit: 'ms',
    direction: 'below',
    source: 'Synthetic simulation parameter',
    notes: 'Static terrestrial lower bound; crossed during benign Days 1–14 microgravity cephalad fluid shift.',
  },
  resting_hr_min_bpm: {
    value: 55.5,
    unit: 'bpm',
    direction: 'below',
    source: 'Synthetic simulation parameter',
    notes: 'Crossed during Gauer-Henry baroreceptor reflex bradycardia in early microgravity (Days 1–14).',
  },
  resting_hr_max_bpm: {
    value: 70.0,
    unit: 'bpm',
    direction: 'above',
    source: 'Synthetic simulation parameter',
    notes: 'Crossed during transient baroreceptor oscillations and sympathetic shifts.',
  },
  resting_hr_acute_decompensation_bpm: {
    value: 80.0,
    unit: 'bpm',
    direction: 'above',
    source: 'Synthetic simulation parameter',
    notes: 'Used by static monitor to flag overt clinical decompensation during acute SPE storm.',
  },
  sleep_efficiency_min_pct: {
    value: 80.0,
    unit: '%',
    direction: 'below',
    source: 'Synthetic simulation parameter',
    notes: 'Static sleep efficiency cutoff; crossed during initial microgravity adaptation nights.',
  },
  core_temp_subfebrile_c: {
    value: 37.22,
    unit: '°C',
    direction: 'above',
    source: 'Synthetic simulation parameter',
    notes: 'Static monitor waits for overt thermal elevation (>= 37.22°C) before flagging febrile stress.',
  },
  cabin_co2_alert_mmhg: {
    value: 3.0,
    unit: 'mmHg',
    direction: 'above',
    source: 'NASA-STD-3001 Vol. 2 Rev. F, V2 6004',
    notes: 'Partial pressure of CO2 above 3.0 mmHg impairs cognitive vigilance and induces cerebral vasodilation (SANS).',
  },
  radiation_daily_alara_msv: {
    value: 1.84,
    unit: 'mSv/day',
    direction: 'above',
    source: 'Synthetic simulation parameter',
    notes: 'Acute solar particle event flux exceeding nominal deep-space cruise GCR dose equivalent.',
  },
  ared_compliance_min_pct: {
    value: 75.0,
    unit: '%',
    direction: 'below',
    source: 'Synthetic simulation parameter',
    notes: 'Minimum daily resistive load adherence required to attenuate femoral/lumbar trabecular bone loss.',
  },
  pvt_lapse_threshold_ms: {
    value: 355,
    unit: 'ms',
    direction: 'above',
    source: 'Synthetic simulation parameter',
    notes: 'Visual reaction latency > 355 ms is counted as a lapse by this simulation.',
  },
};

/**
 * Adaptive N-of-1 EWMA Digital Twin & Multi-System Coupling Index (MSCI) Parameters
 */
export const ADAPTIVE_NOF1_CONFIG = {
  ewma: {
    lambdaAcclimatization: 0.28, // Days 1–14: tracks cephalad fluid shift & baroreceptor resetting (OSD-946)
    lambdaCruise: 0.08, // Days 15–60: steady-state homeostatic tracking
    lambdaAnomalyGated: 0.012, // Gated during acute environmental/unloading anomalies to prevent baseline corruption
    bandSigmaMultiplier: 2.0, // +/- 2 sigma adaptive tolerance band
    minSigmaFloors: {
      hrv_rmssd: 2.5,
      resting_hr: 2.2,
      sleep_efficiency: 2.3,
      core_temp: 0.06,
      cabin_co2: 0.15,
    },
    acclimatizationFalseAlarmZCutoff: 2.55,
  },
  msci: {
    weights: {
      hrv: 7.2, // Autonomic vagal withdrawal (NASA OSDR OSD-570 / ESA Autonomic Standard)
      hr: 3.4, // Sympathetic resting HR drift (CSA Bio-Monitor Standard)
      temp: 4.8, // Basal core thermal / cytokine shift (NASA OSDR OSD-570)
      radiation: 6.6, // Galactic / Solar proton flux (NASA-STD-3001 V1 4030 / PDS MSL-RAD / JAXA Kibo)
      co2: 5.1, // Habitat ppCO2 stress (NASA-STD-3001 Vol. 2, Rev. F, Req. V2 6004)
      sleep: 4.1, // Circadian sleep fragmentation (NASA HRP SSLA / ESA)
      osteo: 4.9, // Musculoskeletal ARED unloading & BMD drift (NASA HRP ARED)
    },
    synergyGamma: 2.15, // Non-linear coupling coefficient (Z_env * Z_autonomic * Z_circadian_osteo)
    synergyExponent: 0.68,
    clinicalActionThresholdPct: 65, // MSCI >= 65% triggers autonomous closed-loop edge countermeasure alert
  },
};

/**
 * Full Parameter & Source Table for Scientific Traceability & README Documentation
 */
export const CLINICAL_PARAMETERS_TABLE = [
  {
    parameter: 'cabin_co2 (Habitat ppCO₂)',
    terrestrialFixedLimit: '> 3.0 mmHg (1-hr mean)',
    adaptiveNof1Rule: 'Coupled Z-score (Z_CO2, w=5.1) + SANS vasodilation weight',
    source: 'NASA-STD-3001 Vol. 2 Rev. F, V2 6004',
  },
  {
    parameter: 'radiation_dose (GCR & SPE Flux)',
    terrestrialFixedLimit: '1.84 ± 0.33 mSv/day published cruise context',
    adaptiveNof1Rule: 'Coupled Z-score (Z_rad, w=6.6) + ARED load auto-throttling gate',
    source: 'Synthetic simulation parameter',
  },
  {
    parameter: 'Days 1–14 Acclimation Curve',
    terrestrialFixedLimit: 'Static cutoffs ignore 14-day fluid shift',
    adaptiveNof1Rule: 'Phase-gated EWMA (λ=0.28 acclimation, 0.08 cruise, 0.012 anomaly)',
    source: 'Synthetic simulation parameter',
  },
  {
    parameter: 'hrv_rmssd & core_temp (Autonomic / Immune)',
    terrestrialFixedLimit: 'RMSSD < 43.5 ms; Temp ≥ 37.22 °C',
    adaptiveNof1Rule: 'EWMA μ_t ± 2σ_t (w_hrv=7.2, w_temp=4.8) non-linear coupling',
    source: 'Synthetic simulation parameter',
  },
  {
    parameter: 'resting_hr (Cardiovascular Drift)',
    terrestrialFixedLimit: '< 55.5 bpm or > 70.0 bpm (80.0 bpm acute)',
    adaptiveNof1Rule: 'EWMA μ_t ± 2σ_t with Gauer-Henry baroreflex adaptation (w=3.4)',
    source: 'Synthetic simulation parameter',
  },
  {
    parameter: 'ared_load_compliance & ΔBMD / SANS',
    terrestrialFixedLimit: '< 75.0% ARED Load Compliance',
    adaptiveNof1Rule: 'Coupled Z_osteo (w=4.9) + LBNP (-40 mmHg) & SANS Risk Index',
    source: 'Synthetic simulation parameter',
  },
  {
    parameter: 'sleep_efficiency & PVT Vigilance',
    terrestrialFixedLimit: 'Sleep < 80.0%; PVT Lapse > 355 ms',
    adaptiveNof1Rule: 'EWMA μ_t − 2σ_t (w=4.1) + SSLA 480nm LED & 15s Micro-PVT',
    source: 'Synthetic simulation parameter',
  },
];
