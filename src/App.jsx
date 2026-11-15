import { useEffect, useMemo, useState } from 'react';
import AstronautCockpit from './components/AstronautCockpit.jsx';
import FlightSurgeonConsole from './components/FlightSurgeonConsole.jsx';
import { MissionTopBar, ScenarioRail } from './components/MissionTopBar';
import { ScientificFooter, ScientificTraceabilityModal } from './components/ScientificTraceabilityModal.jsx';
import { generateMissionDataset, generateSpeLeadTimeSeries, getDayClinicalIntelligence } from './engine/astraBioEngine.js';

const logKey = 'astra-bio.protocol-log.v2';
const exampleChecklist = Object.fromEntries([
  'spe-1', 'spe-2', 'spe-4', 'spe-7', 'sans-1', 'sans-4', 'sans-6', 'nom-1', 'nom-2', 'nom-3', 'nom-4', 'nom-5',
].map(key => [key, true]));
const seedAssessments = {
  25: { coherence: 92, history: [228, 239, 231, 240, 232] },
  42: { coherence: 76, history: [304, 318, 368, 315, 315] },
  55: { coherence: 81, history: [276, 294, 285, 298, 287] },
};

function getExampleStats(day) {
  const example = seedAssessments[day];
  const history = example?.history ?? [];
  return {
    breathing: { sessionsCompleted: example ? 1 : 0, coherenceScore: example?.coherence ?? 68, hrvBoostMs: 0 },
    pvt: {
      meanRtMs: history.length ? Math.round(history.reduce((sum, value) => sum + value, 0) / history.length) : null,
      lapses: history.filter(value => value > 355).length, trialsCount: history.length,
      grade: history.length ? 'SIMULATED BASELINE' : 'TEST NOT STARTED', history, simulated: true,
    },
  };
}

function loadChecklist() {
  try {
    const result = JSON.parse(localStorage.getItem(logKey) ?? 'null');
    if (result && typeof result === 'object' && !Array.isArray(result)) return result;
  } catch { /* Use the demo example when browser storage is unavailable. */ }
  return exampleChecklist;
}

export default function App() {
  const missionDays = useMemo(generateMissionDataset, []);
  const speLeadSeries = useMemo(generateSpeLeadTimeSeries, []);
  const [role, setRole] = useState('crew');
  const [day, setDay] = useState(42);
  const [comms, setComms] = useState('MARS_DELAY');
  const [checkedItems, setCheckedItems] = useState(loadChecklist);
  const [assessments, setAssessments] = useState({});
  const [sources, setSources] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [jumpToAssessments, setJumpToAssessments] = useState(false);
  const sample = missionDays[day - 1];
  const clinicalIntel = useMemo(() => getDayClinicalIntelligence(sample, comms), [sample, comms]);
  const stats = assessments[day] ?? getExampleStats(day);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let active = true;
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      if (active) setOfflineReady(true);
    }).catch(() => { /* The simulation still runs in the current tab. */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(logKey, JSON.stringify(checkedItems)); } catch { /* Retain this session's log. */ }
  }, [checkedItems]);

  useEffect(() => {
    if (!jumpToAssessments || role !== 'crew') return;
    const section = document.getElementById('assessments');
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start' });
    setJumpToAssessments(false);
  }, [jumpToAssessments, role]);

  function openRole(next) {
    setRole(next);
    window.scrollTo({ top: 0 });
  }

  function saveStat(key, value) {
    setAssessments(previous => ({
      ...previous,
      [day]: { ...(previous[day] ?? getExampleStats(day)), [key]: value },
    }));
  }

  return <>
    <a href="#main" className="sr-only focus:not-sr-only skip-link">Skip to mission dashboard</a>
    <div className="app-shell">
      <MissionTopBar role={role} setRole={openRole} openSources={() => setSources(true)} openAssessments={() => {
        setRole('crew');
        setJumpToAssessments(true);
      }} offlineReady={offlineReady} />
      <div className="sticky-scenarios"><ScenarioRail day={day} setDay={setDay} comms={comms} setComms={setComms} msci={sample.msci} /></div>
      <main id="main" className="content">
        <div key={role} className="view-enter">
          {role === 'crew'
            ? <AstronautCockpit dayData={sample} clinicalIntel={clinicalIntel} commsMode={comms} checkedItems={checkedItems}
                onToggleChecklistItem={id => setCheckedItems(current => ({ ...current, [id]: !current[id] }))}
                breathingStats={stats.breathing} onUpdateBreathingStats={value => saveStat('breathing', value)}
                pvtStats={stats.pvt} onUpdatePvtStats={value => saveStat('pvt', value)} onSwitchToSurgeonView={() => openRole('ground')} />
            : <FlightSurgeonConsole missionDays={missionDays} speLeadSeries={speLeadSeries} selectedDay={day} onSelectDay={setDay}
                dayData={sample} clinicalIntel={clinicalIntel} commsMode={comms} checkedItems={checkedItems}
                pvtStats={stats.pvt} breathingStats={stats.breathing} />}
        </div>
        <ScientificFooter onOpenModal={() => setSources(true)} />
      </main>
    </div>
    <ScientificTraceabilityModal isOpen={sources} onClose={() => setSources(false)} />
  </>;
}
