import { useState } from 'react';
import { marsDelayMinutes, nasaCabinCO2Limit, protocolsFor, scenarios, type MissionDay, type ProtocolId, type Signal } from '../data/nasaMissionData';
import { mission, statusFor, type MissionSample } from '../engine/astraBioEngine';
import { MicroAssessments } from './MicroAssessments';
import { Panel, Sparkline } from './shared';
import type { CommsMode } from './MissionTopBar';

export function MissionHero({ sample, day, comms, ground = false }: { sample: MissionSample; day: MissionDay; comms: CommsMode; ground?: boolean }) {
  const status = statusFor(sample.msci);
  const link = {
    leo: 'Earth link available in real time',
    mars: `Earth link delayed by ${marsDelayMinutes} minutes`,
    blackout: 'Earth link unavailable. Local monitoring active.',
  }[comms];
  return <section className={`hero tone-${status.tone}`} aria-label="Mission status">
    <div className="hero-copy">
      <div className="hero-meta">{ground ? 'Flight Surgeon Console' : 'Crew Health Dashboard'} <span>Day {day} of 60</span></div>
      <h2>{scenarios[day].name}</h2>
      <p>{scenarios[day].description}</p>
      <div className="hero-risk">
        <div className="gauge" style={{ '--score': `${sample.msci}%` } as React.CSSProperties}>
          <div><strong>{sample.msci}<small>%</small></strong><span>MSCI</span></div>
        </div>
        <div className="risk-summary"><div className="status-tag">{status.label}</div><p className="hero-link">{link}</p></div>
      </div>
    </div>
    <figure className="mission-photo">
      <img src="/viking-mars.webp" alt="The Valles Marineris hemisphere of Mars, imaged by the Viking orbiters" width="880" height="880" />
      <figcaption>Mars from Viking orbiters. NASA/JPL-Caltech</figcaption>
    </figure>
  </section>;
}

const metricKeys = ['hrv_rmssd', 'radiation_dose', 'cabin_co2', 'sleep_efficiency'] as const;
const metrics = [
  { name: 'Heart rate variability (RMSSD)', unit: 'ms', digits: 1 },
  { name: 'Radiation dose rate', unit: 'mSv/day', digits: 2 },
  { name: 'Cabin ppCO₂', unit: 'mmHg', digits: 2 },
  { name: 'Sleep efficiency', unit: '%', digits: 0 },
] as const;

const secondaryMetrics = [
  { key: 'resting_hr', name: 'Resting heart rate', unit: 'bpm', digits: 0 },
  { key: 'ared_compliance', name: 'ARED completion', unit: '%', digits: 0 },
  { key: 'delta_bmd', name: 'Projected ΔBMD', unit: '%', digits: 2 },
  { key: 'core_temp', name: 'Core temperature', unit: '°C', digits: 2 },
] as const;

function TelemetryCards({ day, sample, advanced, toggleAdvanced }: {
  day: MissionDay; sample: MissionSample; advanced: boolean; toggleAdvanced: () => void;
}) {
  const [selected, setSelected] = useState<Signal | null>(null);
  const recent = mission.slice(day - 12, day);
  const notes = [
    day === 42 ? 'Down 27.0 ms from prior day' : 'Autonomic variability',
    day === 42 ? 'Simulated SPE peak' : 'Simulated dose rate',
    sample.cabin_co2 > nasaCabinCO2Limit ? 'Above NASA 1 h reference' : 'Within NASA 1 h reference',
    day === 42 ? 'Sleep disruption' : 'Sleep period score',
  ];
  const cards = [...metrics.map((metric, index) => ({ ...metric, key: metricKeys[index], note: notes[index] })),
    ...(advanced ? secondaryMetrics.map(metric => ({ ...metric, note: '' })) : [])];
  const activeMetric = cards.find(card => card.key === selected);
  return <section className="telemetry" aria-labelledby="telemetry-title">
    <div className="section-heading">
      <h2 id="telemetry-title">Crew telemetry</h2>
      <button className="text-button" aria-expanded={advanced} onClick={toggleAdvanced}>{advanced ? 'Hide extra signals' : 'All signals'}</button>
    </div>
    <div className="metric-grid">
      {cards.map(({ key, name, unit, digits, note }) => <button type="button" className="metric-card" key={key}
        aria-label={`Inspect ${name}`} aria-expanded={selected === key} onClick={() => setSelected(selected === key ? null : key)}>
          <span className="metric-label">{name}</span>
          <div className="metric-value"><strong>{sample[key].toFixed(digits)}</strong><span>{unit}</span></div>
          {note && <span className="metric-note">{note}</span>}
          <Sparkline color="#8099bc" values={recent.map(row => row[key])} />
        </button>)}
    </div>
    {activeMetric && <div className="metric-detail">
      <h3>{activeMetric.name} on day {day}</h3>
      <dl><div><dt>Recorded</dt><dd>{sample[activeMetric.key].toFixed(activeMetric.digits)} {activeMetric.unit}</dd></div>
        <div><dt>Prior N-of-1 baseline</dt><dd>{sample.prior[activeMetric.key].mean.toFixed(activeMetric.digits)} {activeMetric.unit}</dd></div>
        <div><dt>Directional model input</dt><dd>{sample.z[activeMetric.key].toFixed(2)} z-score</dd></div></dl>
    </div>}
  </section>;
}

export function RiskAttribution({ sample, day }: { sample: MissionSample; day: MissionDay }) {
  const visible = sample.attribution.filter(driver => driver.percent > 0);
  return <Panel title="Risk attribution" subtitle="What drives the multisystem coupling index">
    <p className="explanation">{scenarios[day].explanation}</p>
    {visible.length > 0 ? <>
      <div className="risk-bar" aria-hidden>{visible.map(driver => <div key={driver.id} style={{ width: `${driver.percent}%`, backgroundColor: driver.color }} />)}</div>
      <ul className="risk-legend">
        {visible.map(driver => <li key={driver.id}><i style={{ backgroundColor: driver.color }} /><span>{driver.label}</span><strong className="mono">{driver.percent}%</strong></li>)}
      </ul>
    </> : <p className="muted">No positive directional risk contributions.</p>}
    <details className="model-detail">
      <summary>How the index is calculated</summary>
      <p>The model compares measurements with the prior individual baseline, weights directional deviations, then adds paired HRV/radiation and sleep/CO₂ terms. The shares describe contributions to the model. EWMA learning rate is {sample.alpha.toFixed(2)} for this mission day.</p>
    </details>
  </Panel>;
}

function Countermeasures({ day, checked, toggle }: { day: MissionDay; checked: ProtocolId[]; toggle: (id: ProtocolId) => void }) {
  return <Panel title="Onboard response" subtitle="Confirm each simulated countermeasure as it is completed.">
    <div className="protocols">
      {protocolsFor(day).map(protocol =>
        <label className="protocol" key={protocol.id}>
          <span className="protocol-content"><strong>{protocol.title}</strong><span>{protocol.detail}</span></span>
          <input type="checkbox" checked={checked.includes(protocol.id)} onChange={() => toggle(protocol.id)} aria-label={`Confirm ${protocol.title}`} />
        </label>)}
    </div>
    <div className="compliance" aria-live="polite">
      <div><span>Onboard protocol compliance</span><strong className="mono">{checked.length}/3 ({Math.round(checked.length / 3 * 100)}%)</strong></div>
      <progress aria-label="Onboard protocol compliance" value={checked.length} max="3" />
    </div>
  </Panel>;
}

export function AstronautCockpit({ day, sample, comms, checked, toggle, advanced, toggleAdvanced, openGround }: {
  day: MissionDay; sample: MissionSample; comms: CommsMode; checked: ProtocolId[];
  toggle: (id: ProtocolId) => void; advanced: boolean; toggleAdvanced: () => void; openGround: () => void;
}) {
  return <>
    <MissionHero sample={sample} day={day} comms={comms} />
    <TelemetryCards day={day} sample={sample} advanced={advanced} toggleAdvanced={toggleAdvanced} />
    <div className="dashboard-grid">
      <RiskAttribution sample={sample} day={day} />
      <Countermeasures checked={checked} day={day} toggle={toggle} />
    </div>
    <MicroAssessments />
    <button className="ground-shortcut" onClick={openGround}>Open 60-day mission telemetry</button>
  </>;
}
