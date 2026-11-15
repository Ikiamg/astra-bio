import React, { useState } from 'react';
import { runMonteCarloBenchmark } from '../engine/astraBioEngine.js';

/**
 * Helper to convert a series of (xIndex, value) into an SVG polyline points string
 */
function buildPolylinePoints(data, getValue, width, height, padLeft, padRight, padTop, padBottom, minVal, maxVal) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = Math.max(1, data.length - 1);
  return data
    .map((item, idx) => {
      const x = padLeft + (idx / n) * plotW;
      const raw = getValue(item);
      const clamped = Math.max(minVal, Math.min(maxVal, raw));
      const y = padTop + plotH - ((clamped - minVal) / (maxVal - minVal || 1)) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * Helper to build a closed SVG polygon path for an adaptive +/- 2 sigma tolerance band ribbon
 */
function buildBandPolygonPoints(data, getUpper, getLower, width, height, padLeft, padRight, padTop, padBottom, minVal, maxVal) {
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = Math.max(1, data.length - 1);

  const upperPts = data.map((item, idx) => {
    const x = padLeft + (idx / n) * plotW;
    const val = Math.max(minVal, Math.min(maxVal, getUpper(item)));
    const y = padTop + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lowerPts = [...data]
    .reverse()
    .map((item, revIdx) => {
      const idx = data.length - 1 - revIdx;
      const x = padLeft + (idx / n) * plotW;
      const val = Math.max(minVal, Math.min(maxVal, getLower(item)));
      const y = padTop + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

  return [...upperPts, ...lowerPts].join(' ');
}

export function ValidationBenchmarkChart({
  missionDays,
  speLeadSeries,
  selectedDay,
  onSelectDay,
  hoverDay,
  setHoverDay,
  benchmark: passedBenchmark,
}) {
  const [viewMode, setViewMode] = useState('60_DAY_BENCHMARK'); // '60_DAY_BENCHMARK' | '72H_LEAD_ZOOM'
  const benchmark = passedBenchmark || runMonteCarloBenchmark();

  const width = 920;
  const height = 250;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const activeDayObj =
    missionDays.find((d) => d.day === (hoverDay || selectedDay)) ||
    missionDays[selectedDay - 1];

  const msciPoints = buildPolylinePoints(
    missionDays,
    (d) => d.msci,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    0,
    100
  );

  const dayToX = (dayNum) => padLeft + ((dayNum - 1) / 59) * plotW;
  const valToY = (val) => padTop + plotH - (val / 100) * plotH;

  return (
    <div className="rounded-2xl border border-cyan-500/35 bg-slate-950/95 p-5 shadow-xl">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              PRIMARY SCIENTIFIC BENCHMARK ({benchmark.numSeeds}-SEED MONTE CARLO)
            </span>
            <span className="font-mono text-xs text-emerald-400 font-semibold">
              • -{benchmark.falseAlarmReductionPct}% False Alarm Reduction &amp; +{benchmark.speLeadTimeHours.mean}h Mean Early Detection
            </span>
          </div>
          <h2 className="mt-1 text-base font-bold text-white">
            60-Day Validation Benchmark: Static Terrestrial Thresholds vs. A.S.T.R.A.-Bio N-of-1 Digital Twin
          </h2>
        </div>

        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setViewMode('60_DAY_BENCHMARK')}
            className={`rounded px-3 py-1 font-mono text-xs font-semibold transition-all cursor-pointer ${
              viewMode === '60_DAY_BENCHMARK'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            60-Day Mission Benchmark
          </button>
          <button
            type="button"
            onClick={() => setViewMode('72H_LEAD_ZOOM')}
            className={`rounded px-3 py-1 font-mono text-xs font-semibold transition-all cursor-pointer ${
              viewMode === '72H_LEAD_ZOOM'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Day 42 SPE (+{benchmark.speLeadTimeHours.mean}h Lead Zoom)
          </button>
        </div>
      </div>

      {viewMode === '60_DAY_BENCHMARK' ? (
        <div className="mt-4">
          {/* Interactive Legend & Hovered Day Readout */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-mono text-[11px]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span className="inline-block h-2.5 w-5 rounded bg-cyan-400" />
                A.S.T.R.A.-Bio MSCI Risk Coupling (0–100%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
                Static Terrestrial False Alarms (Mean {benchmark.staticFalseAlarms.mean}, Range {benchmark.staticFalseAlarms.min}–{benchmark.staticFalseAlarms.max})
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="inline-block h-0.5 w-5 border-b border-dashed border-amber-400" />
                Clinical Action Threshold (65% MSCI)
              </span>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-200">
              Inspecting <strong className="text-cyan-300">Day {activeDayObj.day}</strong> ({activeDayObj.phase}) • MSCI:{' '}
              <strong className="text-white">{activeDayObj.msci}%</strong> • HRV:{' '}
              <strong className="text-emerald-300">{activeDayObj.hrv_rmssd} ms</strong>
            </div>
          </div>

          {/* SVG 60-Day Validation Chart */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none bg-slate-900/50 rounded-xl border border-slate-800/90"
            >
              {/* Shaded Zone 1: Days 1-14 Microgravity Fluid Shift Acclimatization */}
              <rect
                x={dayToX(1)}
                y={padTop}
                width={dayToX(14) - dayToX(1)}
                height={plotH}
                fill="rgba(6, 182, 212, 0.07)"
              />
              <text
                x={dayToX(1) + 8}
                y={padTop + 14}
                fill="#67e8f9"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                DAYS 1–14: FLUID SHIFT ACCLIMATIZATION ({benchmark.staticFalseAlarms.mean} Static vs. {benchmark.astraFalseAlarms.mean} N-of-1 Mean False Alarms)
              </text>

              {/* Shaded Zone 2: Days 40-43 SPE Radiation Storm */}
              <rect
                x={dayToX(40)}
                y={padTop}
                width={dayToX(43.5) - dayToX(40)}
                height={plotH}
                fill="rgba(244, 63, 94, 0.12)"
              />
              <text
                x={dayToX(40) - 36}
                y={padTop + 14}
                fill="#fda4af"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                DAY 41–42 SPE (+{benchmark.speLeadTimeHours.mean}h Mean Early Detection)
              </text>

              {/* Shaded Zone 3: Days 49-57 Osteo & SANS Deconditioning */}
              <rect
                x={dayToX(49)}
                y={padTop}
                width={dayToX(57) - dayToX(49)}
                height={plotH}
                fill="rgba(245, 158, 11, 0.09)"
              />
              <text
                x={dayToX(48.5)}
                y={padTop + 28}
                fill="#fcd34d"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                DAY 55: OSTEO &amp; SANS
              </text>

              {/* Horizontal Grid Lines (0%, 25%, 50%, 75%, 100%) */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = valToY(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* 65% MSCI Clinical Action Threshold Line */}
              <line
                x1={padLeft}
                y1={valToY(65)}
                x2={width - padRight}
                y2={valToY(65)}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />

              {/* MSCI Trajectory Polyline */}
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.8"
                points={msciPoints}
              />

              {/* Static Terrestrial False Alarm Markers in Days 1-14 */}
              {missionDays.slice(0, 14).map((d) => {
                if (!d.static_false_alarms) return null;
                const cx = dayToX(d.day);
                const cy = Math.max(padTop + 14, valToY(d.msci) - 14);
                return (
                  <g key={`fa-${d.day}`}>
                    <circle cx={cx} cy={cy} r="5.5" fill="#ef4444" opacity="0.9" />
                    <text
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {d.static_false_alarms}
                    </text>
                  </g>
                );
              })}

              {/* Key Milestone Callout Nodes (Computed dynamically from missionDays) */}
              {[
                { day: 25, color: '#10b981' },
                { day: 41, color: '#f59e0b' },
                { day: 42, color: '#f43f5e' },
                { day: 55, color: '#fbbf24' },
              ].map((node) => {
                const dObj = missionDays[node.day - 1];
                const cx = dayToX(node.day);
                const cy = valToY(dObj.msci);
                return (
                  <g key={node.day}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5.5"
                      fill={node.color}
                      stroke="#020617"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Selected / Hovered Day Crosshair */}
              <line
                x1={dayToX(activeDayObj.day)}
                y1={padTop}
                x2={dayToX(activeDayObj.day)}
                y2={height - padBottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <circle
                cx={dayToX(activeDayObj.day)}
                cy={valToY(activeDayObj.msci)}
                r="6.5"
                fill="#22d3ee"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* X-Axis Day Ticks */}
              {[1, 7, 14, 20, 25, 30, 35, 42, 48, 55, 60].map((dTick) => (
                <text
                  key={dTick}
                  x={dayToX(dTick)}
                  y={height - 10}
                  textAnchor="middle"
                  fill={dTick === selectedDay ? '#22d3ee' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={dTick === selectedDay ? 'bold' : 'normal'}
                >
                  D{dTick}
                </text>
              ))}

              {/* Invisible interactive hit columns for smooth hover & click across all 60 days */}
              {missionDays.map((d) => {
                const colW = plotW / 60;
                const x = dayToX(d.day) - colW / 2;
                return (
                  <rect
                    key={d.day}
                    x={x}
                    y={padTop}
                    width={colW}
                    height={plotH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverDay(d.day)}
                    onMouseLeave={() => setHoverDay(null)}
                    onClick={() => onSelectDay(d.day)}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* 72-Hour High-Resolution SPE Lead-Time Zoom View (T-54h to T+18h) */
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-mono text-xs">
            <span className="text-rose-300 font-semibold">
              72-Hour High-Resolution Window Around Day 42 SPE Anomaly: Mean +{benchmark.speLeadTimeHours.mean}h Lead Time (Range {benchmark.speLeadTimeHours.min}–{benchmark.speLeadTimeHours.max}h)
            </span>
            <span className="text-cyan-300">
              Seed #1 Trigger: <strong>T{benchmark.primarySpe.firstAstraAlertHour}h (MSCI ≥ 65%)</strong> vs. Static Monitor: <strong>T+{benchmark.primarySpe.firstStaticAlertHour}h (Fever/Tachycardia)</strong>
            </span>
          </div>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none bg-slate-900/60 rounded-xl border border-rose-500/30"
            >
              {(() => {
                const n = speLeadSeries.length - 1;
                const idxTrigger = Math.max(
                  0,
                  speLeadSeries.findIndex((p) => p.isAstraTrigger)
                );
                const idxStatic = Math.max(
                  idxTrigger + 1,
                  speLeadSeries.findIndex((p) => p.isStaticTrigger)
                );
                const xTrigger = padLeft + (idxTrigger / n) * plotW;
                const xStatic = padLeft + (idxStatic / n) * plotW;

                const leadPolyline = buildPolylinePoints(
                  speLeadSeries,
                  (p) => p.msci,
                  width,
                  height,
                  padLeft,
                  padRight,
                  padTop,
                  padBottom,
                  0,
                  100
                );

                return (
                  <>
                    <rect
                      x={xTrigger}
                      y={padTop}
                      width={Math.max(10, xStatic - xTrigger)}
                      height={plotH}
                      fill="rgba(16, 185, 129, 0.14)"
                    />
                    <text
                      x={(xTrigger + xStatic) / 2}
                      y={padTop + 18}
                      textAnchor="middle"
                      fill="#6ee7b7"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ◄─── +{benchmark.primarySpe.leadTimeHours}h SEED #1 LEAD WINDOW (30-Seed Mean: +{benchmark.speLeadTimeHours.mean}h) ───►
                    </text>

                    {/* 65% Action Threshold */}
                    <line
                      x1={padLeft}
                      y1={valToY(65)}
                      x2={width - padRight}
                      y2={valToY(65)}
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />

                    {/* MSCI Curve */}
                    <polyline
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="3"
                      points={leadPolyline}
                    />

                    {/* A.S.T.R.A.-Bio Trigger Vertical Marker */}
                    <line
                      x1={xTrigger}
                      y1={padTop}
                      x2={xTrigger}
                      y2={height - padBottom}
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <circle
                      cx={xTrigger}
                      cy={valToY(speLeadSeries[idxTrigger].msci)}
                      r="6"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={xTrigger + 6}
                      y={valToY(speLeadSeries[idxTrigger].msci) - 10}
                      textAnchor="start"
                      fill="#6ee7b7"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      A.S.T.R.A.-Bio Alert (T{speLeadSeries[idxTrigger].tOffsetHours}h)
                    </text>

                    {/* Static Terrestrial Monitor Trigger Vertical Marker */}
                    <line
                      x1={xStatic}
                      y1={padTop}
                      x2={xStatic}
                      y2={height - padBottom}
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                    <circle
                      cx={xStatic}
                      cy={valToY(speLeadSeries[idxStatic].msci)}
                      r="6"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={xStatic - 8}
                      y={valToY(speLeadSeries[idxStatic].msci) + 18}
                      textAnchor="end"
                      fill="#fda4af"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      Static Alert (T+{speLeadSeries[idxStatic].tOffsetHours}h)
                    </text>

                    {/* X-Axis Hour Offsets */}
                    {speLeadSeries
                      .filter((_, i) => i % 4 === 0)
                      .map((pt) => {
                        const idx = speLeadSeries.indexOf(pt);
                        const x = padLeft + (idx / n) * plotW;
                        return (
                          <text
                            key={pt.tOffsetHours}
                            x={x}
                            y={height - 10}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {pt.tOffsetHours >= 0 ? `T+${pt.tOffsetHours}h` : `T${pt.tOffsetHours}h`}
                          </text>
                        );
                      })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Multi-Layer Synchronized 60-Day Telemetry Charts
 */
export function MultiLayerTelemetryCharts({
  missionDays,
  selectedDay,
  onSelectDay,
  hoverDay,
  setHoverDay,
}) {
  const width = 920;
  const height = 168;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const activeDay = hoverDay || selectedDay;
  const activeDayObj =
    missionDays.find((d) => d.day === activeDay) || missionDays[selectedDay - 1];

  const dayToX = (dayNum) => padLeft + ((dayNum - 1) / 59) * plotW;
  const mapY = (val, minV, maxV) =>
    padTop + plotH - ((Math.max(minV, Math.min(maxV, val)) - minV) / (maxV - minV || 1)) * plotH;

  // Track 1: HRV RMSSD (20..65 ms) + N-of-1 EWMA Band
  const hrvBandPolygon = buildBandPolygonPoints(
    missionDays,
    (d) => d.hrv_upper,
    (d) => d.hrv_lower,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    20,
    65
  );
  const hrvEwmaPoints = buildPolylinePoints(
    missionDays,
    (d) => d.hrv_ewma,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    20,
    65
  );
  const hrvRawPoints = buildPolylinePoints(
    missionDays,
    (d) => d.hrv_rmssd,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    20,
    65
  );

  // Track 2: Cabin CO2 (1.5..4.3 mmHg) & Radiation Dose (0..2.5 mSv/day scaled onto 1.5..4.3)
  const co2Points = buildPolylinePoints(
    missionDays,
    (d) => d.cabin_co2,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    1.5,
    4.3
  );
  const radScaledPoints = buildPolylinePoints(
    missionDays,
    (d) => 1.5 + (d.radiation_dose / 2.4) * (4.3 - 1.5),
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    1.5,
    4.3
  );

  // Track 3: Sleep Efficiency (45..100%) & ARED Load Compliance (45..100%)
  const sleepPoints = buildPolylinePoints(
    missionDays,
    (d) => d.sleep_efficiency,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    45,
    100
  );
  const aredPoints = buildPolylinePoints(
    missionDays,
    (d) => d.ared_load_compliance,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    45,
    100
  );

  const renderInteractiveOverlay = () =>
    missionDays.map((d) => {
      const colW = plotW / 60;
      const x = dayToX(d.day) - colW / 2;
      return (
        <rect
          key={d.day}
          x={x}
          y={padTop}
          width={colW}
          height={plotH}
          fill="transparent"
          className="cursor-pointer"
          onMouseEnter={() => setHoverDay(d.day)}
          onMouseLeave={() => setHoverDay(null)}
          onClick={() => onSelectDay(d.day)}
        />
      );
    });

  const staticHrvCutoff = activeDayObj.hrv_static_limit;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            SYNCHRONIZED MULTI-LAYER 60-DAY TELEMETRY &amp; BAYESIAN EWMA BANDS
          </span>
          <h3 className="text-sm font-bold text-white">
            Autonomic HRV RMSSD, Radiation + Cabin ppCO₂, and Circadian/ARED Coupling Tracks
          </h3>
        </div>
        <div className="font-mono text-xs text-slate-300 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1">
          Synchronized Cursor: <strong className="text-cyan-300">Day {activeDayObj.day}</strong> |
          HRV <strong className="text-emerald-300">{activeDayObj.hrv_rmssd} ms</strong> (EWMA{' '}
          {activeDayObj.hrv_ewma}±{(activeDayObj.hrv_upper - activeDayObj.hrv_ewma).toFixed(1)}) |
          Rad <strong className="text-amber-300">{activeDayObj.radiation_dose} mSv/d</strong> | CO₂{' '}
          <strong className="text-rose-300">{activeDayObj.cabin_co2} mmHg</strong>
        </div>
      </div>

      {/* TRACK 1: HRV RMSSD (ms) + N-of-1 EWMA Band + Static Limit */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between font-mono text-[11px] px-1">
          <span className="font-bold text-emerald-300">
            1. AUTONOMIC VAGAL TONE: HRV RMSSD (ms) vs. N-of-1 EWMA Adaptive Band (μ ± 2σ)
          </span>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-emerald-300">● Observed HRV ({activeDayObj.hrv_rmssd} ms)</span>
            <span className="text-cyan-300">--- N-of-1 EWMA Mean ({activeDayObj.hrv_ewma} ms)</span>
            <span className="text-rose-400">··· Static Terrestrial Cutoff ({staticHrvCutoff} ms)</span>
          </div>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none bg-slate-900/50 rounded-xl border border-slate-800"
        >
          {/* +/- 2 sigma N-of-1 Adaptive Tolerance Band Ribbon */}
          <polygon points={hrvBandPolygon} fill="rgba(6, 182, 212, 0.16)" />
          {/* Static Terrestrial Fixed Cutoff */}
          <line
            x1={padLeft}
            y1={mapY(staticHrvCutoff, 20, 65)}
            x2={width - padRight}
            y2={mapY(staticHrvCutoff, 20, 65)}
            stroke="#f43f5e"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          {/* N-of-1 EWMA Adaptive Mean */}
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.8"
            strokeDasharray="5 3"
            points={hrvEwmaPoints}
          />
          {/* Raw HRV RMSSD Curve */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            points={hrvRawPoints}
          />
          {/* Early Detection Point on Day 41 */}
          <circle
            cx={dayToX(41)}
            cy={mapY(missionDays[40].hrv_rmssd, 20, 65)}
            r="5"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={dayToX(41) - 8}
            y={mapY(missionDays[40].hrv_rmssd, 20, 65) - 8}
            textAnchor="end"
            fill="#fcd34d"
            fontSize="9.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Day 41 Early Detection ({missionDays[40].hrv_rmssd} ms &lt; EWMA -2σ)
          </text>
          {/* Synchronized Vertical Cursor */}
          <line
            x1={dayToX(activeDayObj.day)}
            y1={padTop}
            x2={dayToX(activeDayObj.day)}
            y2={height - padBottom}
            stroke="#38bdf8"
            strokeWidth="1.4"
          />
          <circle
            cx={dayToX(activeDayObj.day)}
            cy={mapY(activeDayObj.hrv_rmssd, 20, 65)}
            r="5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {[25, 40, 55].map((v) => (
            <text
              key={v}
              x={padLeft - 6}
              y={mapY(v, 20, 65) + 3}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="9.5"
              fontFamily="monospace"
            >
              {v}ms
            </text>
          ))}
          {renderInteractiveOverlay()}
        </svg>
      </div>

      {/* TRACK 2: RADIATION DOSE (mSv/day) & CABIN ppCO2 (mmHg) */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between font-mono text-[11px] px-1">
          <span className="font-bold text-amber-300">
            2. ENVIRONMENTAL &amp; HABITAT STRESSORS: Solar/GCR Radiation (mSv/d) &amp; Cabin ppCO₂ (mmHg)
          </span>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-cyan-300">● Cabin ppCO₂ ({activeDayObj.cabin_co2} mmHg)</span>
            <span className="text-amber-300">● Radiation Dose ({activeDayObj.radiation_dose} mSv/d)</span>
            <span className="text-rose-400">--- NASA-STD-3001 CO₂ Alert (&gt;{activeDayObj.co2_nasa_limit.toFixed(1)} mmHg)</span>
          </div>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none bg-slate-900/50 rounded-xl border border-slate-800"
        >
          {/* NASA-STD-3001 3.0 mmHg CO2 Alert Threshold */}
          <line
            x1={padLeft}
            y1={mapY(activeDayObj.co2_nasa_limit, 1.5, 4.3)}
            x2={width - padRight}
            y2={mapY(activeDayObj.co2_nasa_limit, 1.5, 4.3)}
            stroke="#f43f5e"
            strokeWidth="1.4"
            strokeDasharray="5 4"
          />
          <text
            x={width - padRight - 6}
            y={mapY(activeDayObj.co2_nasa_limit, 1.5, 4.3) - 5}
            textAnchor="end"
            fill="#fda4af"
            fontSize="9.5"
            fontFamily="monospace"
          >
            NASA-STD-3001 Limit: {activeDayObj.co2_nasa_limit.toFixed(1)} mmHg ppCO₂
          </text>

          {/* Cabin CO2 Curve */}
          <polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.4"
            points={co2Points}
          />
          {/* Radiation Curve */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.4"
            points={radScaledPoints}
          />

          {/* Synchronized Vertical Cursor */}
          <line
            x1={dayToX(activeDayObj.day)}
            y1={padTop}
            x2={dayToX(activeDayObj.day)}
            y2={height - padBottom}
            stroke="#38bdf8"
            strokeWidth="1.4"
          />
          <circle
            cx={dayToX(activeDayObj.day)}
            cy={mapY(activeDayObj.cabin_co2, 1.5, 4.3)}
            r="5"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {[2.0, 3.0, 4.0].map((v) => (
            <text
              key={v}
              x={padLeft - 6}
              y={mapY(v, 1.5, 4.3) + 3}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="9.5"
              fontFamily="monospace"
            >
              {v.toFixed(1)}
            </text>
          ))}
          {renderInteractiveOverlay()}
        </svg>
      </div>

      {/* TRACK 3: CIRCADIAN SLEEP EFFICIENCY (%) & ARED RESISTIVE COMPLIANCE (%) */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between font-mono text-[11px] px-1">
          <span className="font-bold text-cyan-300">
            3. CIRCADIAN &amp; MUSCULOSKELETAL: Sleep Efficiency (%) &amp; ARED Resistive Load Compliance (%)
          </span>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-purple-300">● Sleep Efficiency ({activeDayObj.sleep_efficiency}%)</span>
            <span className="text-amber-300">● ARED Load Compliance ({activeDayObj.ared_load_compliance}%)</span>
            <span className="text-rose-300">
              Core Temp: {activeDayObj.core_temp}°C | ΔBMD: {activeDayObj.delta_bmd_pct}% | SANS: {activeDayObj.sans_risk_index}%
            </span>
          </div>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none bg-slate-900/50 rounded-xl border border-slate-800"
        >
          {/* Sleep Efficiency Curve */}
          <polyline
            fill="none"
            stroke="#c084fc"
            strokeWidth="2.4"
            points={sleepPoints}
          />
          {/* ARED Load Compliance Curve */}
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.2"
            strokeDasharray="5 3"
            points={aredPoints}
          />

          {/* Synchronized Vertical Cursor */}
          <line
            x1={dayToX(activeDayObj.day)}
            y1={padTop}
            x2={dayToX(activeDayObj.day)}
            y2={height - padBottom}
            stroke="#38bdf8"
            strokeWidth="1.4"
          />
          <circle
            cx={dayToX(activeDayObj.day)}
            cy={mapY(activeDayObj.sleep_efficiency, 45, 100)}
            r="5"
            fill="#c084fc"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {[55, 75, 95].map((v) => (
            <text
              key={v}
              x={padLeft - 6}
              y={mapY(v, 45, 100) + 3}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="9.5"
              fontFamily="monospace"
            >
              {v}%
            </text>
          ))}
          {[1, 10, 20, 25, 30, 42, 50, 55, 60].map((dTick) => (
            <text
              key={dTick}
              x={dayToX(dTick)}
              y={height - 7}
              textAnchor="middle"
              fill={dTick === activeDayObj.day ? '#22d3ee' : '#64748b'}
              fontSize="9.5"
              fontFamily="monospace"
            >
              Day {dTick}
            </text>
          ))}
          {renderInteractiveOverlay()}
        </svg>
      </div>
    </div>
  );
}
