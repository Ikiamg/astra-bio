import { useEffect, useState } from 'react';
import { AstronautCockpit } from './components/AstronautCockpit';
import { FlightSurgeonConsole } from './components/FlightSurgeonConsole';
import { MissionTopBar, ScenarioRail, type CommsMode, type Role } from './components/MissionTopBar';
import { EvidenceDialog, NasaValidityFooter } from './components/NasaValidityFooter';
import { protocolIds, scenarioDays, type MissionDay, type ProtocolId } from './data/nasaMissionData';
import { mission } from './engine/astraBioEngine';

type ProtocolLog = Partial<Record<MissionDay, ProtocolId[]>>;
const logKey = 'astra-bio.protocol-log.v1';

function loadProtocolLog(): ProtocolLog {
  try {
    const saved = JSON.parse(localStorage.getItem(logKey) ?? '{}');
    return Object.fromEntries(scenarioDays.map(day => [
      day, protocolIds.filter(id => Array.isArray(saved?.[day]) && saved[day].includes(id)),
    ]));
  } catch {
    return {};
  }
}

export default function App() {
  const [role, setRole] = useState<Role>('crew');
  const [day, setDay] = useState<MissionDay>(25);
  const [comms, setComms] = useState<CommsMode>('leo');
  const [checked, setChecked] = useState<ProtocolLog>(loadProtocolLog);
  const [advanced, setAdvanced] = useState(false);
  const [sources, setSources] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [jumpToAssessments, setJumpToAssessments] = useState(false);
  const sample = mission[day - 1];

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let active = true;
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      if (active) setOfflineReady(true);
    }).catch(() => { /* The simulation still runs in the current tab. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(logKey, JSON.stringify(checked)); } catch { /* Retain the current session log. */ }
  }, [checked]);

  useEffect(() => {
    if (!jumpToAssessments || role !== 'crew') return;
    const section = document.getElementById('assessments');
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start' });
    setJumpToAssessments(false);
  }, [jumpToAssessments, role]);

  const changeRole = (next: Role) => {
    setRole(next);
    window.scrollTo({ top: 0 });
  };
  const openAssessments = () => {
    setRole('crew');
    setJumpToAssessments(true);
  };
  const toggle = (id: ProtocolId) => setChecked(current => {
    const active = current[day] ?? [];
    return { ...current, [day]: active.includes(id) ? active.filter(item => item !== id) : [...active, id] };
  });

  return <>
    <a href="#main" className="sr-only focus:not-sr-only skip-link">Skip to mission dashboard</a>
    <div className="app-shell">
      <MissionTopBar role={role} setRole={changeRole} openSources={() => setSources(true)} openAssessments={openAssessments} offlineReady={offlineReady} />
      <div className="sticky-scenarios"><ScenarioRail day={day} setDay={setDay} comms={comms} setComms={setComms} /></div>
      <main id="main" className="content">
        <h1 className="sr-only">{role === 'crew' ? 'Crew Health Dashboard' : 'Flight Surgeon Console'}</h1>
        {role === 'crew'
          ? <AstronautCockpit day={day} sample={sample} comms={comms} checked={checked[day] ?? []} toggle={toggle} advanced={advanced} toggleAdvanced={() => setAdvanced(!advanced)} openGround={() => changeRole('ground')} />
          : <FlightSurgeonConsole day={day} sample={sample} comms={comms} checked={checked[day] ?? []} />}
        <NasaValidityFooter openSources={() => setSources(true)} />
      </main>
    </div>
    <EvidenceDialog open={sources} close={() => setSources(false)} />
  </>;
}
