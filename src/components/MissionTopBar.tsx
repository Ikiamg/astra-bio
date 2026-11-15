export type Role = 'crew' | 'ground';
export type CommsMode = 'LEO_REALTIME' | 'MARS_DELAY' | 'BLACKOUT';
const scenarios = [[25, 'Nominal Transit'], [42, 'Solar Particle Event'], [55, 'Bone & SANS Risk']] as const;

interface TopBarProps {
  role: Role;
  setRole: (role: Role) => void;
  openAssessments: () => void;
  openSources: () => void;
  offlineReady: boolean;
}

export function MissionTopBar({ role, setRole, openAssessments, openSources, offlineReady }: TopBarProps) {
  return <header className="topbar">
    <div className="masthead">
      <a className="wordmark" href="#main" onClick={() => setRole('crew')}>A.S.T.R.A.-Bio</a>
      <span className="masthead-label">Independent NASA Space Apps demo</span>
      <span className="masthead-status" role="status">{offlineReady ? 'Offline ready' : 'Onboard processing'}</span>
    </div>
    <nav className="mission-nav" aria-label="Console navigation">
      <button aria-current={role === 'crew' ? 'page' : undefined} onClick={() => setRole('crew')}>Crew Cockpit</button>
      <button aria-current={role === 'ground' ? 'page' : undefined} onClick={() => setRole('ground')}>Flight Surgeon</button>
      <button onClick={openAssessments}>Assessments</button>
      <button onClick={openSources}>Science &amp; Data</button>
    </nav>
  </header>;
}

export function ScenarioRail({ day, setDay, comms, setComms, msci }: {
  day: number; setDay: (day: number) => void; comms: CommsMode; setComms: (mode: CommsMode) => void; msci: number;
}) {
  return <div className="mission-controls">
    <div className="scenario-rail" role="group" aria-label="Mission scenario">
      <span className="scenario-label">Mission scenario</span>
      {scenarios.map(([missionDay, label]) => <button className={day === missionDay ? 'selected' : ''} key={missionDay} aria-pressed={day === missionDay} onClick={() => setDay(missionDay)}>
        <span className="scenario-day">D{missionDay}</span><span>{label}</span>
      </button>)}
    </div>
    <label className="mission-day-control">
      <span>Mission day</span>
      <input aria-label="Mission day" type="range" min="1" max="60" value={day} onChange={event => setDay(Number(event.target.value))} />
      <output>{day}/60</output>
      <span className="mission-score">MSCI {msci}%</span>
    </label>
    <label className="link-control">
      <span>Earth link</span>
      <select aria-label="Communications mode" value={comms} onChange={event => setComms(event.target.value as CommsMode)}>
        <option value="LEO_REALTIME">ISS / Real time</option>
        <option value="MARS_DELAY">Mars / 22 min delay</option>
        <option value="BLACKOUT">Mars / Blackout</option>
      </select>
    </label>
  </div>;
}
