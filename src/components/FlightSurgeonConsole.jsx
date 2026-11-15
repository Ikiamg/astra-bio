import React, { useState } from 'react';
import {
  ValidationBenchmarkChart,
  MultiLayerTelemetryCharts,
} from './ScientificCharts.jsx';
import {
  buildFhirTelemetryPacket,
  runMonteCarloBenchmark,
} from '../engine/astraBioEngine.js';

function download(content, fileName, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FlightSurgeonConsole({
  missionDays,
  speLeadSeries,
  selectedDay,
  onSelectDay,
  dayData,
  clinicalIntel,
  commsMode,
  pvtStats,
  breathingStats,
  checkedItems,
}) {
  const [hoverDay, setHoverDay] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [receivedDay, setReceivedDay] = useState(null);

  const isMarsDelay = commsMode === 'MARS_DELAY';
  const isBlackout = commsMode === 'BLACKOUT';
  const delivered = isMarsDelay && receivedDay === dayData.day;
  const transmission = isBlackout ? 'held' : isMarsDelay ? (delivered ? 'delivered' : 'queued') : 'immediate';
  const benchmark = runMonteCarloBenchmark();

  const fhirPacket = buildFhirTelemetryPacket(
    dayData,
    clinicalIntel,
    commsMode,
    pvtStats,
    breathingStats
  );
  fhirPacket.meta.deliveryState = transmission;
  fhirPacket.confirmedChecklist = clinicalIntel.countermeasures.flatMap(item => item.checklist)
    .filter(item => checkedItems[item.id]).map(item => item.id);
  const jsonString = JSON.stringify(fhirPacket, null, 2);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopyStatus('JSON copied');
    } catch {
      setCopyStatus('Clipboard unavailable. Use the JSON export.');
    }
  };

  const handleExportReport = () => {
    download(jsonString, `ASTRA-Bio_Clinical_Report_Day-${dayData.day}_FHIR-Lite.json`, 'application/json');
  };

  const exportTelemetry = () => {
    const columns = ['day', 'seed', 'hrv_rmssd', 'resting_hr', 'sleep_efficiency', 'radiation_dose', 'cumulative_radiation_msv', 'cabin_co2',
      'ared_load_compliance', 'delta_bmd_pct', 'sans_risk_index', 'core_temp', 'hrv_ewma', 'hrv_lower', 'hrv_upper',
      'hr_ewma', 'sleep_ewma', 'temp_ewma', 'msci', 'nonLinearSynergy', 'static_false_alarms', 'astra_false_alarms'];
    const csv = [columns.join(','), ...missionDays.map(row => columns.map(column => row[column]).join(','))].join('\r\n');
    download(csv, 'astra-bio-synthetic-mission-telemetry.csv', 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      <div className="ground-title">
        <div><h1>Flight Surgeon Console</h1><p>60-day synthetic mission · Day {dayData.day} of 60</p></div>
        <button className="text-button" onClick={exportTelemetry}>Export telemetry CSV</button>
      </div>
      {/* 1. Quantitative 30-Seed Monte Carlo Validation Benchmark KPI Cards */}
      <section aria-label="60-Day Validation Benchmark KPI Cards" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KPI Card 1: False Alarms Reduction (Computed from 30 Seeds) */}
          <div className="matte-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-gray">
                Days 1–14 Fluid Shift ({benchmark.numSeeds} Seeds)
              </span>
              <span className="matte-pill px-2.5 py-0.5 font-mono text-xs font-semibold text-white">
                -{benchmark.falseAlarmReductionPct}% False Alarms
              </span>
            </div>
            <h3 className="mt-1.5 text-sm font-semibold text-white">
              False Alarms in Days 1–14 (Mean &amp; Min–Max Range)
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="matte-card-sub p-3">
                <div className="text-xs text-muted-gray">
                  Fixed Earth Thresholds
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  {benchmark.staticFalseAlarms.mean} False Alarms
                </div>
                <div className="font-mono text-[11px] text-muted-gray mt-0.5">
                  Range: {benchmark.staticFalseAlarms.min}–{benchmark.staticFalseAlarms.max} ({benchmark.numSeeds} seeds)
                </div>
              </div>
              <div className="matte-card-sub p-3">
                <div className="text-xs text-muted-gray">
                  A.S.T.R.A.-Bio N-of-1
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  {benchmark.astraFalseAlarms.mean} False Alarms
                </div>
                <div className="font-mono text-[11px] text-muted-gray mt-0.5">
                  Range: {benchmark.astraFalseAlarms.min}–{benchmark.astraFalseAlarms.max} ({benchmark.numSeeds} seeds)
                </div>
              </div>
            </div>
          </div>

          {/* KPI Card 2: Early Detection Lead Time (Computed from 30 Seeds) */}
          <div className="matte-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-gray">
                Day-42 SPE Anomaly ({benchmark.numSeeds} Seeds)
              </span>
              <span className="matte-pill px-2.5 py-0.5 font-mono text-xs font-semibold text-white">
                +{benchmark.speLeadTimeHours.mean}h Lead Time
              </span>
            </div>
            <h3 className="mt-1.5 text-sm font-semibold text-white">
              Day-42 SPE Early Detection Lead Time (Hours)
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="matte-card-sub p-3">
                <div className="text-xs text-muted-gray">
                  Fixed Earth Thresholds
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  0h (Baseline Ref)
                </div>
                <div className="font-mono text-[11px] text-muted-gray mt-0.5">
                  Waits for fever/tachycardia
                </div>
              </div>
              <div className="matte-card-sub p-3">
                <div className="text-xs text-muted-gray">
                  A.S.T.R.A.-Bio MSCI
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-white">
                  +{benchmark.speLeadTimeHours.mean}h Early
                </div>
                <div className="font-mono text-[11px] text-muted-gray mt-0.5">
                  Range: {benchmark.speLeadTimeHours.min}–{benchmark.speLeadTimeHours.max}h ({benchmark.numSeeds} seeds)
                </div>
              </div>
            </div>
          </div>

          {/* KPI Card 3: Mathematical Model Audit & Z-Score State Vector */}
          <div className="matte-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-gray">
                  N-of-1 EWMA &amp; Coupling State
                </span>
                <span className="matte-pill px-2 py-0.5 font-mono text-[11px]">
                  Day {dayData.day} Z-Vector
                </span>
              </div>
              <div className="mt-2.5 matte-card-sub p-2.5 font-mono text-[11px] text-slate-200 space-y-1">
                <div>
                  μ<sub>i,t</sub>
                  <sup>EWMA</sup> = λ·x<sub>i,t</sub> + (1 − λ)·μ<sub>i,t-1</sub>
                  <sup>EWMA</sup> · Band ±2σ<sub>i,t</sub>
                </div>
                <div className="text-muted-gray">
                  MSCI<sub>t</sub> = Σ w<sub>i</sub>·Z<sub>i,t</sub> + γ·(Z<sub>env</sub> × Z<sub>vagal</sub> × Z<sub>circ</sub>)
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5 font-mono text-[11px]">
              <div className="matte-card-sub px-2 py-1.5">
                <span className="text-muted-gray">Z-HRV:</span>{' '}
                <strong className="text-white">{dayData.z_scores.hrv}σ</strong>
              </div>
              <div className="matte-card-sub px-2 py-1.5">
                <span className="text-muted-gray">Z-Rad:</span>{' '}
                <strong className="text-white">{dayData.z_scores.radiation}σ</strong>
              </div>
              <div className="matte-card-sub px-2 py-1.5">
                <span className="text-muted-gray">Z-CO₂:</span>{' '}
                <strong className="text-white">{dayData.z_scores.co2}σ</strong>
              </div>
              <div className="matte-card-sub px-2 py-1.5">
                <span className="text-muted-gray">Z-Temp:</span>{' '}
                <strong className="text-white">{dayData.z_scores.temp}σ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Visible Scientific Note for 30-Seed Monte Carlo Benchmark */}
        <div className="matte-card px-4 py-2.5 flex items-center gap-2 text-xs text-muted-gray">

          <span>Results come from a 30-seed synthetic simulation under our stated assumptions.</span>
        </div>
      </section>

      {/* 2. Primary 60-Day Validation Benchmark Interactive Chart */}
      <ValidationBenchmarkChart
        missionDays={missionDays}
        speLeadSeries={speLeadSeries}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        hoverDay={hoverDay}
        setHoverDay={setHoverDay}
        benchmark={benchmark}
      />

      {/* 3. Multi-Layer Synchronized 60-Day Telemetry Charts */}
      <MultiLayerTelemetryCharts
        missionDays={missionDays}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        hoverDay={hoverDay}
        setHoverDay={setHoverDay}
        benchmark={benchmark}
      />

      {/* 4. Mars Store-and-Forward Telemetry Packet Panel (22-min OWLT Mode) */}
      <section
        aria-label="Mars Store-and-Forward Telemetry Packet Panel"
        className="matte-card p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-matte-b pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="matte-pill px-2 py-0.5 font-mono text-[10px]">
                Mars Store-and-Forward Telemetry Architecture
              </span>
              <span className="font-mono text-xs text-muted-gray">
                {isBlackout ? 'Mars blackout' : isMarsDelay ? 'Mars / 22 min delay' : 'ISS / Real time'}
              </span>
            </div>
            <h3 className="mt-1.5 text-base font-semibold text-white">
              Onboard decisions and FHIR-inspired JSON downlink
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs matte-btn cursor-pointer"
            >
              Copy JSON Payload
            </button>

            <button
              type="button"
              onClick={handleExportReport}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs matte-btn-active cursor-pointer"
            >

              <span>Export Clinical Report (.JSON)</span>
            </button>
            <span className="text-xs text-muted-gray" role="status">{copyStatus}</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (5 Cols): Autonomous Edge Decisions Executed at T+0s (On-Board) */}
          <div className="lg:col-span-5 matte-card-sub p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-matte-b pb-2.5">
                <div className="flex items-center gap-2">

                  <span className="text-xs font-semibold text-white">
                    Simulated onboard decisions at T+0s
                  </span>
                </div>
                <span className="matte-pill px-2 py-0.5 font-mono text-[10px]">
                  0.00s Earth Wait
                </span>
              </div>

              <p className="mt-2.5 text-xs text-muted-gray leading-relaxed">
                The simulator evaluates crew signals and models the onboard response at T+0s.
              </p>

              <div className="mt-3 space-y-2">
                {clinicalIntel.edgeActionsLog.map((act, index) => (
                  <div
                    key={index}
                    className="rounded-lg border-matte bg-matte-main p-2.5 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">
                        [{act.time}] · SIMULATED ACTION
                      </span>
                      <span className="text-muted-gray text-[10px]">
                        {act.code}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-gray text-[11px] leading-snug">
                      {act.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border-matte bg-matte-main p-3 font-mono text-[11px] text-muted-gray">
              <div className="font-semibold text-white">
                Edge-CDSS Determinism Verification
              </div>
              <div className="mt-0.5">
                100% Client-Side Offline Inference · Mulberry32 30-Seed PRNG · Zero Cloud Dependency
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Compressed FHIR-Lite / JSON Telemetry Payload Queued for Earth Downlink */}
          <div className="lg:col-span-7 matte-card-sub p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-matte-b pb-2.5">
              <div className="flex items-center gap-2">

                <span className="text-xs font-semibold text-white">
                  FHIR-inspired telemetry packet
                </span>
              </div>
              <span role="status" className="matte-pill px-2 py-0.5 font-mono text-[10px]">
                {isBlackout ? 'Held onboard' : delivered ? 'Simulated receipt confirmed' : isMarsDelay ? 'Queued for Earth · ETA T+22 min' : 'Available to Earth · T+0.4 s'}
              </span>
            </div>

            {isMarsDelay && <button className="matte-btn mt-3 px-3 py-2 text-xs" onClick={() => setReceivedDay(delivered ? null : dayData.day)}>
              {delivered ? 'Replay downlink' : 'Advance mission clock by 22 min'}
            </button>}
            <pre aria-label="Clinical packet JSON" tabIndex={0} className="mt-3 max-h-[340px] overflow-auto rounded-lg border-matte bg-matte-main p-3.5 font-mono text-[11px] leading-relaxed text-slate-200">
              <code>{jsonString}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
