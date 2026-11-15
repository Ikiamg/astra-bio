import React, { useState } from 'react';
import ResonantBreathingPacer from './ResonantBreathingPacer.jsx';
import PvtReactionTest from './PvtReactionTest.jsx';
import {
  runMonteCarloBenchmark,
  ADAPTIVE_NOF1_CONFIG,
} from '../engine/astraBioEngine.js';

/**
 * Renders a subtle inline SVG sparkline for a telemetry metric across the 14-day window up to currentDay.
 */
function InlineSparkline({ series, stroke = '#8b949e' }) {
  if (!series || series.length < 2) return null;
  const width = 108;
  const height = 28;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(0.001, max - min);

  const points = series
    .map((val, idx) => {
      const x = (idx / (series.length - 1)) * (width - 6) + 3;
      const y = height - 4 - ((val - min) / span) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastVal = series[series.length - 1];
  const lastX = width - 3;
  const lastY = height - 4 - ((lastVal - min) / span) * (height - 8);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#f0f6fc" />
    </svg>
  );
}

function MarsVikingMosaicVisual() {
  return <figure className="mission-photo">
    <img src="/viking-mars.webp" alt="The Valles Marineris hemisphere of Mars, imaged by the Viking orbiters" width="880" height="880" />
    <figcaption>Mars from Viking orbiters. NASA/JPL-Caltech</figcaption>
  </figure>;
}

export default function AstronautCockpit({
  dayData,
  clinicalIntel,
  commsMode,
  checkedItems,
  onToggleChecklistItem,
  breathingStats,
  onUpdateBreathingStats,
  pvtStats,
  onUpdatePvtStats,
  onSwitchToSurgeonView,
}) {
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const isMarsDelay = commsMode === 'MARS_DELAY';
  const benchmark = runMonteCarloBenchmark();
  const allDays = benchmark.primaryDays;

  // Extract 14-day trailing window for sparklines up to dayData.day
  const windowStartIdx = Math.max(0, dayData.day - 14);
  const trailingDays = allDays.slice(windowStartIdx, dayData.day);

  // Calculate how many countermeasure checklist items are completed and resulting MSCI risk mitigation
  const allChecklistItems = clinicalIntel.countermeasures.flatMap((c) => c.checklist);
  const completedCount = allChecklistItems.filter((item) => checkedItems[item.id]).length;
  const completionRatio =
    allChecklistItems.length > 0 ? completedCount / allChecklistItems.length : 0;

  const totalPossibleMsciReduction = clinicalIntel.countermeasures.reduce(
    (acc, c) => acc + Math.abs(c.impactMsciDelta),
    0
  );
  const breathingMsciBonus = Math.round(breathingStats.hrvBoostMs * 0.8);
  const mitigatedMsci = Math.max(
    4,
    Math.round(
      dayData.msci - totalPossibleMsciReduction * completionRatio - breathingMsciBonus
    )
  );

  // Radial gauge parameters (color permitted on the MSCI circular progress ring)
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const rawStrokeOffset = circumference - (dayData.msci / 100) * circumference;

  const gaugeColor =
    dayData.msci >= 65 ? '#ed9b92' : dayData.msci >= 45 ? '#e7c691' : '#c0d3c0';

  // 4 Primary "Crew telemetry" metric cards
  const primaryCrewTelemetryCards = [
    {
      id: 'hrv',
      label: 'Heart rate variability (RMSSD)',
      value: `${(dayData.hrv_rmssd + breathingStats.hrvBoostMs).toFixed(1)}`,
      unit: 'ms',
      sub: `EWMA ${dayData.hrv_ewma} ms · ±2σ [${dayData.hrv_lower}–${dayData.hrv_upper}]`,
      series: trailingDays.map((d) => d.hrv_rmssd),
    },
    {
      id: 'rad',
      label: 'Radiation dose rate',
      value: `${dayData.radiation_dose}`,
      unit: 'mSv/day',
      sub: `Cumulative ${dayData.cumulative_radiation_msv} mSv · GCR + SPE`,
      series: trailingDays.map((d) => d.radiation_dose),
    },
    {
      id: 'co2',
      label: 'Cabin ppCO2',
      value: `${dayData.cabin_co2}`,
      unit: 'mmHg',
      sub: `NASA-STD-3001 Req. V2 6004 ≤ ${dayData.co2_nasa_limit.toFixed(1)} mmHg`,
      series: trailingDays.map((d) => d.cabin_co2),
    },
    {
      id: 'sleep',
      label: 'Sleep efficiency',
      value: `${dayData.sleep_efficiency}`,
      unit: '%',
      sub: `EWMA ${dayData.sleep_ewma}% · Circadian REM/Deep`,
      series: trailingDays.map((d) => d.sleep_efficiency),
    },
  ];

  // Secondary telemetry strip preserving the remaining 3 core physiological channels
  const secondaryTelemetryMetrics = [
    {
      id: 'hr',
      label: 'Resting heart rate',
      value: `${dayData.resting_hr} bpm`,
      sub: `EWMA ${dayData.hr_ewma} bpm (Z = ${dayData.z_scores.hr}σ)`,
    },
    {
      id: 'ared',
      label: 'ARED compliance & SANS index',
      value: `${dayData.ared_load_compliance}% load`,
      sub: `ΔBMD ${dayData.delta_bmd_pct}% · SANS risk ${dayData.sans_risk_index}%`,
    },
    {
      id: 'temp',
      label: 'Basal core temperature',
      value: `${dayData.core_temp} °C`,
      sub: `EWMA ${dayData.temp_ewma} °C (${
        dayData.core_temp >= dayData.temp_ewma ? '+' : ''
      }${(dayData.core_temp - dayData.temp_ewma).toFixed(2)} °C)`,
    },
  ];

  const { weights, synergyGamma, synergyExponent } = ADAPTIVE_NOF1_CONFIG.msci;
  const { lambdaAcclimatization, lambdaCruise, lambdaAnomalyGated } = ADAPTIVE_NOF1_CONFIG.ewma;

  return (
    <div className="space-y-5 w-full" style={{ width: '100%' }}>
      {/* 1. HERO BANNER DE ANCHO COMPLETO (grid-template-columns: 1.3fr 1fr; width: 100%; align-items: stretch) */}
      <section
        className="mission-hero matte-card overflow-hidden w-full"
        style={{ width: '100%', overflow: 'hidden' }}
        aria-label="Mission Scenario Hero Banner"
      >
        <div
          className="cockpit-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          {/* COLUMNA IZQUIERDA (padding: 32px, texto horizontal normal sin comprimir) */}
          <div
            className="cockpit-hero-left"
            style={{
              padding: '32px',
              width: '100%',
              maxWidth: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
            }}
          >
            <div>
              {/* Top Breadcrumb: CREW HEALTH DASHBOARD | Day X of 60 */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    color: '#8b949e',
                  }}
                >
                  CREW HEALTH DASHBOARD &nbsp;|&nbsp; Day {dayData.day} of 60
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="matte-pill px-2.5 py-0.5 font-mono text-xs">
                    {clinicalIntel.leadTimeBadge}
                  </span>
                </div>
              </div>

              {/* Título grande en blanco (font-size: 3rem; font-weight: 700) */}
              <h1
                className="cockpit-hero-title"
                style={{
                  fontSize: '3rem',
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: '-0.025em',
                  color: '#ffffff',
                  margin: '0 0 14px 0',
                }}
              >
                {clinicalIntel.scenarioTitle}
              </h1>

              {/* Párrafo descriptivo ocupando todo el ancho de la columna izquierda */}
              <p
                style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  color: '#8b949e',
                  margin: 0,
                  width: '100%',
                  maxWidth: 'none',
                }}
              >
                {clinicalIntel.crewPlainExplanation}
              </p>
            </div>

            {/* Abajo: Aro circular del MSCI junto al texto de estado */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Aro circular del MSCI */}
                <div
                  style={{
                    position: 'relative',
                    width: '82px',
                    height: '82px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="82"
                    height="82"
                    viewBox="0 0 82 82"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    <circle
                      cx="41"
                      cy="41"
                      r={radius}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="41"
                      cy="41"
                      r={radius}
                      stroke={gaugeColor}
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={rawStrokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{ transition: 'stroke-dashoffset 450ms ease' }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#ffffff',
                        lineHeight: 1.1,
                      }}
                    >
                      {dayData.msci}%
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '9px',
                        color: '#8b949e',
                        letterSpacing: '0.06em',
                        marginTop: '2px',
                      }}
                    >
                      MSCI
                    </span>
                  </div>
                </div>

                {/* Texto de estado junto al aro MSCI */}
                <div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      lineHeight: 1.3,
                    }}
                  >
                    {clinicalIntel.statusLevel}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#8b949e',
                      marginTop: '3px',
                    }}
                  >
                    {commsMode === 'BLACKOUT'
                      ? 'Earth link unavailable. Local monitoring active.'
                      : isMarsDelay
                      ? 'Earth link delayed (22m OWLT). Local autonomous monitoring active.'
                      : 'Real-time LEO telemetry link active. Post-action target: '}{' '}
                    <span className="font-mono text-slate-300">
                      ({mitigatedMsci}% simulated post-action MSCI)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onSwitchToSurgeonView}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium matte-btn cursor-pointer"
              >

                <span>
                  Flight Surgeon Console (+{benchmark.speLeadTimeHours.mean}h lead)
                </span>
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: Mosaico real de Marte de los orbitadores Viking */}
          <MarsVikingMosaicVisual />
        </div>
      </section>

      {/* 2. FILA HORIZONTAL DE 4 TARJETAS DE CREW TELEMETRY (grid-template-columns: repeat(4, minmax(0, 1fr))) */}
      <section aria-label="Crew telemetry" className="w-full" style={{ width: '100%' }}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-gray">
            Crew telemetry
          </h2>
          <button className="text-button" aria-expanded={showAllSignals} onClick={() => setShowAllSignals(!showAllSignals)}>
            {showAllSignals ? 'Hide signal table' : 'All signals'}
          </button>
        </div>

        <div
          className="cockpit-telemetry-grid-4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '14px',
            width: '100%',
          }}
        >
          {primaryCrewTelemetryCards.map((card) => (
            <button key={card.id} type="button" className="signal-card matte-card p-4 flex flex-col justify-between"
              aria-label={`Inspect ${card.label}`} aria-expanded={selectedSignal === card.id}
              onClick={() => setSelectedSignal(selectedSignal === card.id ? null : card.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-muted-gray">
                    {card.label}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold text-white tracking-tight">
                      {card.value}
                    </span>
                    <span className="font-mono text-xs text-muted-gray">
                      {card.unit}
                    </span>
                  </div>
                </div>
                <InlineSparkline series={card.series} stroke="#8b949e" />
              </div>
              <div className="mt-3 pt-2 border-matte-t font-mono text-[11px] text-muted-gray">
                {card.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Secondary Compact Telemetry Row (Resting HR, ARED/BMD/SANS, Basal Core Temp) */}
        <div
          className="mt-3 secondary-telemetry"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '12px',
            width: '100%',
          }}
        >
          {secondaryTelemetryMetrics.map((item) => (
            <div
              key={item.id}
              className="matte-card px-4 py-2.5 flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs text-muted-gray">{item.label}</div>
                <div className="font-mono text-[11px] text-muted-gray mt-0.5">
                  {item.sub}
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-white shrink-0">
                {item.value}
              </div>
            </div>
          ))}
        </div>
        {selectedSignal && (() => {
          const card = primaryCrewTelemetryCards.find(item => item.id === selectedSignal);
          return <div className="matte-card p-4 mt-3" aria-live="polite">
            <h3 className="text-sm font-semibold">{card.label}</h3>
            <p className="text-xs text-muted-gray mt-2">{card.sub}</p>
            <p className="text-xs font-mono mt-2">Trailing range: {Math.min(...card.series)} to {Math.max(...card.series)} {card.unit}</p>
          </div>;
        })()}
        {showAllSignals && <div className="matte-card p-4 mt-3 overflow-x-auto">
          <table className="signals-table">
            <caption>Simulated telemetry · day {dayData.day}</caption>
            <thead><tr><th scope="col">Signal</th><th scope="col">Reading</th><th scope="col">Reference</th></tr></thead>
            <tbody>{[
              ['HRV (RMSSD)', `${dayData.hrv_rmssd} ms`, `EWMA ${dayData.hrv_ewma} ms`],
              ['Resting heart rate', `${dayData.resting_hr} bpm`, `EWMA ${dayData.hr_ewma} bpm`],
              ['Sleep efficiency', `${dayData.sleep_efficiency}%`, `EWMA ${dayData.sleep_ewma}%`],
              ['Radiation dose rate', `${dayData.radiation_dose} mSv/day`, `Cumulative ${dayData.cumulative_radiation_msv} mSv`],
              ['Cabin ppCO₂', `${dayData.cabin_co2} mmHg`, 'NASA reference: 3.0 mmHg over 1 hour'],
              ['ARED load compliance', `${dayData.ared_load_compliance}%`, 'Simulated exercise load'],
              ['Bone mineral density change', `${dayData.delta_bmd_pct}%`, 'Synthetic estimate'],
              ['SANS risk index', `${dayData.sans_risk_index}%`, 'Synthetic score'],
              ['Core temperature', `${dayData.core_temp} °C`, `EWMA ${dayData.temp_ewma} °C`],
            ].map(([name, value, reference]) => <tr key={name}><th scope="row">{name}</th><td>{value}</td><td>{reference}</td></tr>)}</tbody>
          </table>
        </div>}
      </section>

      {/* 3. RISK ATTRIBUTION Y ONBOARD RESPONSE LADO A LADO EN 2 COLUMNAS (grid-template-columns: 1fr 1fr) */}
      <div
        className="cockpit-two-col-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          width: '100%',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN (1fr): Risk attribution */}
        <div className="space-y-5 w-full">
          <div className="matte-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Risk attribution
                </h2>
                <p className="text-xs text-muted-gray mt-0.5">
                  What drives the multi-system coupling index on Day {dayData.day} (Synergy: +{dayData.nonLinearSynergy} pts · Σ = 100%)
                </p>
              </div>
              <span className="matte-pill px-2.5 py-1 font-mono text-xs">
                MSCI {dayData.msci}%
              </span>
            </div>

            {/* Thin 4-Segment Risk Attribution Bar */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-matte-main p-0.5 gap-1">
              {clinicalIntel.xaiBreakdown.map((seg) => (
                <div
                  key={seg.id}
                  style={{
                    width: `${seg.pct}%`,
                    backgroundColor: seg.color,
                  }}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                  title={`${seg.label}: ${seg.pct}%`}
                />
              ))}
            </div>

            {/* Clean List / Grid of the 4 Risk Attribution Domains */}
            <div className="mt-4 space-y-2.5">
              {clinicalIntel.xaiBreakdown.map((seg) => (
                <div key={seg.id} className="matte-card-sub p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-medium text-white">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span>{seg.label}</span>
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {seg.pct}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-muted-gray">
                    <span>Observed: {seg.metricTag}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-gray leading-snug">
                    {seg.rationale}
                  </p>
                </div>
              ))}
            </div>

            {/* Expandable <details> section: "How the index is calculated" */}
            <details className="matte-details mt-4 p-3.5">
              <summary className="flex items-center justify-between text-xs font-medium text-white">
                <span>How the index is calculated</span>
              </summary>
              <div className="mt-3 pt-3 border-matte-t space-y-2.5 text-xs text-muted-gray leading-relaxed">
                <div>
                  <div className="font-medium text-white mb-1">
                    1. Phase-Aware N-of-1 Exponentially Weighted Moving Average (EWMA)
                  </div>
                  <code className="block rounded bg-matte-main p-2 font-mono text-[11px] text-slate-200 overflow-x-auto">
                    μ_i(t) = λ · x_i(t) + (1 - λ) · μ_i(t-1),   σ_i²(t) = λ · (x_i(t) - μ_i(t-1))² + (1 - λ) · σ_i²(t-1)
                  </code>
                  <p className="mt-1 text-[11px] text-muted-gray">
                    The directional z-score uses the previous mean and a minimum standard deviation. The learning rate is {lambdaAcclimatization} during acclimation, {lambdaCruise} during cruise, and {lambdaAnomalyGated} when anomaly gating is active.
                  </p>
                </div>
                <div>
                  <div className="font-medium text-white mb-1">
                    2. Multi-System Coupling Index (MSCI) &amp; Normalized Attribution
                  </div>
                  <code className="block rounded bg-matte-main p-2 font-mono text-[11px] text-slate-200 overflow-x-auto">
                    MSCI(t) = clip( Σ_i w_i·Z_i(t) + γ · [ max(Z_rad, 0.85·Z_co2) · (Z_hrv + 0.45·Z_temp + 0.25·Z_hr) · (1 + 0.35·max(Z_sleep, 0.9·Z_osteo)) ]^{synergyExponent}, 4, 99 )
                  </code>
                  <p className="mt-1 text-[11px] text-muted-gray">
                    Active weights: w_hrv={weights.hrv}, w_rad={weights.radiation}, w_co2={weights.co2}, w_sleep={weights.sleep}, w_temp={weights.temp}, w_osteo={weights.osteo}, w_hr={weights.hr}, synergy γ={synergyGamma}. Each domain’s percentage is dynamically normalized as C_k(t) = 100% × D_k(t) / Σ_j D_j(t).
                  </p>
                </div>
              </div>
            </details>

            {/* Autonomous Edge Bus Execution Log */}
            <div className="mt-4 matte-card-sub p-3.5">
              <div className="flex items-center justify-between text-xs text-muted-gray mb-2">
                <span className="flex items-center gap-1.5 font-medium text-white">

                  <span>Simulated onboard bus log (T+0s)</span>
                </span>
                <span className="font-mono text-[11px]">
                  {commsMode === 'BLACKOUT' ? 'Blackout' : isMarsDelay ? 'OWLT 22 min' : 'LEO direct'}
                </span>
              </div>
              <div className="space-y-1.5">
                {clinicalIntel.edgeActionsLog.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded border-matte bg-matte-main px-2.5 py-1.5 font-mono text-[11px]"
                  >
                    <span className="text-muted-gray shrink-0">
                      [{entry.time}]
                    </span>
                    <span className="text-white font-semibold shrink-0">
                      {entry.code}
                    </span>
                    <span className="text-muted-gray">{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1fr): Onboard response */}
        <div className="matte-card p-5 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2 border-matte-b pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">

                <span>Onboard response</span>
              </h2>
              <p className="text-xs text-muted-gray mt-0.5">
                Closed-loop operational countermeasures mapped to ECLSS/CDRA, ARED/LBNP, and SSLA hardware buses.
              </p>
            </div>
            <span className="matte-pill px-2.5 py-1 font-mono text-xs">
              Checklist {completedCount}/{allChecklistItems.length}
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            {clinicalIntel.countermeasures.map((cm, idx) => (
              <div key={cm.id} className="matte-card-sub p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="matte-pill px-2 py-0.5 font-mono text-xs font-semibold">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-white">
                      {cm.category}
                    </span>
                    <span className="font-mono text-[11px] text-muted-gray">
                      · {cm.subsystem}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="matte-pill px-2 py-0.5 font-mono text-[11px]">
                      {cm.impactMsciDelta}% MSCI
                    </span>
                    <span className="matte-pill px-2 py-0.5 font-mono text-[11px]">
                      {cm.urgency}
                    </span>
                  </div>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-white">
                  {cm.title}
                </h3>
                <p className="mt-1 text-xs text-muted-gray leading-relaxed">
                  {cm.description}
                </p>

                {/* Interactive Checklist */}
                <div className="mt-3 space-y-1.5 border-matte-t pt-2.5">
                  {cm.checklist.map((item) => {
                    const isChecked = Boolean(checkedItems[item.id]);
                    return (
                      <label
                        key={item.id}
                        className="flex items-start gap-2.5 rounded-md border-matte bg-matte-main p-2 text-xs transition-all cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleChecklistItem(item.id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded accent-emerald-400 cursor-pointer"
                        />
                        <span
                          className={
                            isChecked
                              ? 'line-through text-muted-gray'
                              : 'text-slate-200'
                          }
                        >
                          {item.text}
                        </span>
                        {isChecked && (
                          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-gray">
                            Executed
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE CREW MICRO-ASSESSMENT SUITE IN 2-COLUMN (1fr 1fr) GRID */}
      <section id="assessments" tabIndex={-1} aria-label="Interactive Crew Micro-Assessment Suite" className="w-full" style={{ width: '100%' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-gray">
            Interactive Neuro-Autonomic Micro-Assessments (0.1 Hz Resonant Pacer &amp; 15s PVT)
          </h2>
          <span className="font-mono text-[11px] text-muted-gray">
            Simulated breathing response and measured reaction times
          </span>
        </div>
        <div
          className="cockpit-two-col-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            width: '100%',
            alignItems: 'start',
          }}
        >
          <ResonantBreathingPacer
            key={`breathing-${dayData.day}`}
            baseHrvRmssd={dayData.hrv_rmssd}
            breathingStats={breathingStats}
            onUpdateBreathingStats={onUpdateBreathingStats}
          />
          <PvtReactionTest
            key={`pvt-${dayData.day}`}
            pvtStats={pvtStats}
            onUpdatePvtStats={onUpdatePvtStats}
            cabinCo2={dayData.cabin_co2}
          />
        </div>
      </section>
    </div>
  );
}
