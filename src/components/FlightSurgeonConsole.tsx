import { useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { marsDelayMinutes, nasaCabinCO2Limit, protocolsFor, scenarios, type MissionDay, type ProtocolId } from '../data/nasaMissionData';
import { benchmark, mission, statusFor, type MissionSample } from '../engine/astraBioEngine';
import { MissionHero, RiskAttribution } from './AstronautCockpit';
import { downloadFile, Panel } from './shared';
import type { CommsMode } from './MissionTopBar';

const ticks = [1, 10, 20, 30, 40, 50, 60];
const tooltip = {
  contentStyle: { background: '#0d1626', border: '1px solid #24344a', borderRadius: 9, color: '#eaf3fc', fontSize: 12 },
  labelStyle: { color: '#c9d9e9' },
  labelFormatter: (day: number) => `Mission day ${day}`,
};
const axis = { stroke: '#6f849d', fontSize: 10, tickLine: false, axisLine: false, tickMargin: 9 };

function Benchmark({ day }: { day: MissionDay }) {
  return <Panel title="Alert benchmark" subtitle="60-day synthetic replay">
    <div className="benchmark-kpis">
      <div><strong className="mono">−{benchmark.reduction.toFixed(1)}%</strong><span>False alerts · Days 1–14</span><small>{benchmark.fixedFalse} fixed vs {benchmark.adaptiveFalse} adaptive</small></div>
      <div><strong className="mono">+{benchmark.leadHours ?? '—'}h</strong><span>SPE early-warning lead</span><small>Adaptive alert before the fixed vital-sign gate</small></div>
    </div>
    <div className="chart-caption"><span className="legend-dot amber" /> Fixed thresholds <span className="legend-dot cyan" /> A.S.T.R.A.-Bio N-of-1</div>
    <div className="chart-frame benchmark-plot" role="img" aria-label="Synthetic daily alert counts for the fixed-threshold and adaptive monitors">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={mission} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1b2940" strokeDasharray="3 5" vertical={false} />
          <XAxis type="number" dataKey="day" domain={[1, 60]} ticks={ticks} {...axis} />
          <YAxis allowDecimals={false} width={32} domain={[0, 3]} {...axis} />
          <Tooltip {...tooltip} cursor={{ fill: 'rgba(96,145,183,.11)' }} />
          <ReferenceLine x={day} stroke="#7890a8" strokeDasharray="3 4" />
          <Bar dataKey="fixedAlerts" name="Fixed alerts" fill="#c8a580" barSize={6} isAnimationActive={false} />
          <Bar dataKey="adaptiveAlerts" name="Adaptive alerts" fill="#9cb5d6" barSize={6} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <p className="chart-note">Adaptation counts per-signal fixed alerts (HRV &lt;45 ms, resting HR &gt;72 bpm, or temperature ≥38 °C) and daily adaptive alerts (MSCI ≥35). The hourly SPE timing comparison uses resting HR ≥100 bpm or temperature ≥38 °C as the fixed vital-sign gate.</p>
  </Panel>;
}

function TelemetryCharts({ day }: { day: MissionDay }) {
  const [cursor, setCursor] = useState<number>(day);
  const reading = mission[cursor - 1];
  const earlyDay = benchmark.earlyDay;
  return <Panel title="Mission telemetry" subtitle="Synchronized across all 60 mission days" className="telemetry-panel">
    <div className="chart-scrubber">
      <label htmlFor="mission-replay-day">Inspect mission day <output htmlFor="mission-replay-day">{cursor} / 60</output></label>
      <input id="mission-replay-day" type="range" min="1" max="60" step="1" value={cursor} onChange={event => setCursor(Number(event.target.value))} />
      <div className="chart-readings"><span>{reading.hrv_rmssd} ms HRV</span><span>{reading.radiation_dose} mSv/day</span><span>{reading.cabin_co2} mmHg ppCO₂</span><span>{reading.sleep_efficiency}% sleep efficiency</span></div>
    </div>
    <div className="chart-caption"><span className="legend-dot amber" /> Adaptive SPE warning (T − {benchmark.leadHours}h) <span className="legend-dot dim" /> Inspection day</div>
    {(['hrv', 'environment', 'sleep'] as const).map(metric => <div className="chart-section" key={metric}>
      <div className="chart-title">
        {metric === 'hrv' && <><strong>HRV RMSSD <small>ms</small></strong><span><i className="legend-dot cyan" /> N-of-1 reference band</span></>}
        {metric === 'environment' && <><strong>Cabin environment</strong><span><i className="legend-dot amber" /> Radiation, mSv/day <i className="legend-dot green" /> ppCO₂, mmHg</span></>}
        {metric === 'sleep' && <strong>Sleep efficiency <small>%</small></strong>}
      </div>
      <div className="chart-frame telemetry-plot">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mission} syncId="telemetry" syncMethod="value" margin={{ top: 12, right: metric === 'environment' ? 16 : 45, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1b2940" strokeDasharray="3 5" vertical={false} />
            <XAxis type="number" dataKey="day" domain={[1, 60]} ticks={ticks} {...axis} />
            <YAxis width={37} domain={metric === 'hrv' ? [15, 75] : metric === 'sleep' ? [50, 95] : [0, 4]} {...axis} />
            {metric === 'environment' && <YAxis yAxisId="co2" width={29} orientation="right" domain={[0, 5]} {...axis} />}
            <Tooltip {...tooltip} formatter={(value: number | [number, number]) =>
              Array.isArray(value) ? value.map(v => v.toFixed(1)).join('–') : Number(value.toFixed(2))} />
            <ReferenceLine x={cursor} stroke="#c0c8d2" />
            <ReferenceLine x={earlyDay} stroke="#fbb05a" strokeDasharray="4 4" />
            {metric === 'hrv' && <>
              <Area dataKey="hrvBand" name="N-of-1 band" fill="#9cb5d6" stroke="none" fillOpacity={.14} isAnimationActive={false} />
              <Line dataKey="hrv_rmssd" name="HRV RMSSD (ms)" stroke="#9cb5d6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </>}
            {metric === 'environment' && <>
              <ReferenceLine yAxisId="co2" y={nasaCabinCO2Limit} stroke="#c3cbd5" strokeDasharray="2 4" strokeOpacity={.65} />
              <Line dataKey="radiation_dose" name="Radiation (mSv/day)" stroke="#c8a580" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="co2" dataKey="cabin_co2" name="ppCO₂ (mmHg)" stroke="#9cb5d6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </>}
            {metric === 'sleep' && <Line dataKey="sleep_efficiency" name="Sleep efficiency (%)" stroke="#9cb5d6" strokeWidth={2} dot={false} isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>)}
    <p className="chart-note">The dashed horizontal line is the NASA 3.0 mmHg one-hour habitat reference. The early-warning marker comes from the hourly replay. The plotted measurements are synthetic daily samples.</p>
  </Panel>;
}

function Downlink({ day, comms, sample, checked }: { day: MissionDay; comms: CommsMode; sample: MissionSample; checked: ProtocolId[] }) {
  const [notice, setNotice] = useState('');
  const [delivered, setDelivered] = useState(false);
  const status = statusFor(sample.msci);
  const delay = comms === 'blackout' ? null : comms === 'mars' ? marsDelayMinutes : 0;
  const state = comms === 'blackout' ? 'held' : comms === 'leo' ? 'immediate' : delivered ? 'delivered' : 'queued';
  const linkStatus = {
    held: ['Held onboard', 'Restore the Earth link to send the packet.'],
    immediate: ['Available to Earth', 'ETA T+0 s'],
    delivered: ['Simulated receipt confirmed', `Received at T+${marsDelayMinutes} min`],
    queued: ['Queued for Earth', `ETA T+${marsDelayMinutes} min`],
  }[state];
  const packet = {
    schema: 'astra-bio.fhir-lite-demo.v1',
    simulated: true, day, scenario: scenarios[day].short,
    edge: { evaluated_at: 'T+0s', msci: sample.msci, status: status.label },
    downlink: { state, owlt_minutes: delay },
    telemetry: {
      hrv_rmssd: sample.hrv_rmssd, resting_hr: sample.resting_hr, sleep_efficiency: sample.sleep_efficiency,
      radiation_dose: sample.radiation_dose, cabin_co2: sample.cabin_co2, ared_compliance: sample.ared_compliance,
      delta_bmd: sample.delta_bmd, core_temp: sample.core_temp,
    },
    attribution_pct: Object.fromEntries(sample.attribution.map(driver => [driver.id, driver.percent])),
    confirmed_actions: checked,
  };
  const compact = JSON.stringify(packet);
  const json = JSON.stringify(packet, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setNotice('Packet copied');
    } catch {
      setNotice('Copy unavailable. Use Export JSON.');
    }
  };
  return <Panel title="Store-and-forward downlink" subtitle="Simulated communications and local decision log">
    <div className="downlink-grid">
      <section className="downlink-onboard">
        <h3>Onboard decisions <span className="mono">T+0s</span></h3>
        <ul><li>Evaluated risk locally · {sample.msci}% MSCI</li>
          {protocolsFor(day).map(protocol => <li key={protocol.id}>{checked.includes(protocol.id) ? 'Confirmed' : 'Proposed'} · {protocol.title}</li>)}
        </ul>
        <div className="downlink-eta" aria-live="polite"><div><strong>{linkStatus[0]}</strong><small className="mono">{linkStatus[1]}</small></div></div>
        {comms === 'mars' && <button className="secondary-button downlink-replay" onClick={() => {
          setDelivered(!delivered);
          setNotice('');
        }}>{delivered ? 'Replay downlink' : 'Advance mission clock by 22 min'}</button>}
      </section>
      <section className="downlink-packet">
        <h3>FHIR-inspired JSON <span className="mono">{new TextEncoder().encode(compact).byteLength} B compact</span></h3>
        <pre tabIndex={0} aria-label="Clinical packet JSON"><code>{json}</code></pre>
        <div className="packet-actions">
          <button className="secondary-button" onClick={copy}>Copy packet</button>
          <button className="secondary-button" onClick={() => { downloadFile(compact, `astra-bio-day-${day}.json`, 'application/json'); setNotice('JSON exported'); }}>Export JSON</button>
          <span aria-live="polite">{notice}</span>
        </div>
      </section>
    </div>
  </Panel>;
}

function exportTelemetry() {
  const metrics = ['day', 'hrv_rmssd', 'resting_hr', 'sleep_efficiency', 'radiation_dose', 'cabin_co2', 'ared_compliance', 'delta_bmd', 'core_temp', 'msci', 'fixedAlerts', 'adaptiveAlerts'] as const;
  const csv = [metrics.join(','), ...mission.map(row => metrics.map(key => row[key]).join(','))].join('\r\n');
  downloadFile(csv, 'astra-bio-synthetic-mission-telemetry.csv', 'text/csv;charset=utf-8');
}

export function FlightSurgeonConsole({ day, sample, comms, checked }: { day: MissionDay; sample: MissionSample; comms: CommsMode; checked: ProtocolId[] }) {
  return <>
    <MissionHero sample={sample} day={day} comms={comms} ground />
    <div className="section-heading ground-heading"><h2>Mission analysis</h2><button className="text-button" onClick={exportTelemetry}>Export simulated telemetry</button></div>
    <div className="ground-grid">
      <Benchmark day={day} />
      <RiskAttribution sample={sample} day={day} />
    </div>
    <Downlink key={`${day}-${comms}`} day={day} comms={comms} sample={sample} checked={checked} />
    <TelemetryCharts key={day} day={day} />
  </>;
}
