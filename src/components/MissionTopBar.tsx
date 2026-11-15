import { marsDelayMinutes, scenarioDays, scenarios, type MissionDay } from '../data/nasaMissionData';

export type Role = 'crew' | 'ground';
export type CommsMode = 'leo' | 'mars' | 'blackout';

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

export function ScenarioRail({ day, setDay, comms, setComms }: {
  day: MissionDay; setDay: (day: MissionDay) => void; comms: CommsMode; setComms: (mode: CommsMode) => void;
}) {
  return <div className="mission-controls">
    <div className="scenario-rail" role="group" aria-label="Mission scenario">
      <span className="scenario-label">Mission scenario</span>
      {scenarioDays.map(missionDay => <button className={day === missionDay ? 'selected' : ''} key={missionDay} aria-pressed={day === missionDay} onClick={() => setDay(missionDay)}>
        <span className="scenario-day">D{missionDay}</span><span>{scenarios[missionDay].short}</span>
      </button>)}
    </div>
    <label className="link-control">
      <span>Earth link</span>
      <select aria-label="Communications mode" value={comms} onChange={event => setComms(event.target.value as CommsMode)}>
        <option value="leo">ISS / Real time</option>
        <option value="mars">Mars / {marsDelayMinutes} min delay</option>
        <option value="blackout">Mars / Blackout</option>
      </select>
    </label>
  </div>;
}
