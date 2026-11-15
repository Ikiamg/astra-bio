import { useEffect, useRef, useState } from 'react';

function BreathingPacer() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(0);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const update = () => {
      setElapsed(performance.now() - start.current);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const toggle = () => {
    if (!running) {
      start.current = performance.now();
      setElapsed(0);
    }
    setRunning(!running);
  };
  const seconds = Math.floor(elapsed / 1000);
  const inhale = elapsed % 10000 < 5000;
  const phaseRemaining = 5 - seconds % 5;
  return <div className="assessment-card">
    <div className="assessment-name"><h3>Resonant breathing</h3><span className="mono">0.1 Hz</span></div>
    <p>Follow a five-second inhale and a five-second exhale.</p>
    <div className="breathing-display">
      <div className={`breathing-orbit ${running ? 'breathing' : ''}`}><div /></div>
      <div><strong>{running ? `${inhale ? 'Inhale' : 'Exhale'} · ${phaseRemaining}s` : seconds ? 'Session stopped' : 'Ready to begin'}</strong>
        <span className="mono">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} elapsed · +{Math.min(8, Math.floor(seconds / 10) * .8).toFixed(1)} ms simulated ΔRMSSD</span></div>
    </div>
    <button className="secondary-button" onClick={toggle}>{running ? 'Stop breathing pacer' : 'Start breathing pacer'}</button>
  </div>;
}

type TrialState = 'idle' | 'wait' | 'signal' | 'done';
const testLength = 15000;
const lapseThreshold = 500;

function VigilanceTest() {
  const [state, setState] = useState<TrialState>('idle');
  const [remaining, setRemaining] = useState(testLength);
  const [results, setResults] = useState<number[]>([]);
  const [missed, setMissed] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [interrupted, setInterrupted] = useState(false);
  const trial = useRef({ state: 'idle' as TrialState, deadline: 0, cue: 0, timer: 0, clock: 0, frame: 0 });

  function change(next: TrialState) {
    trial.current.state = next;
    setState(next);
  }

  function clearTimers() {
    const current = trial.current;
    window.clearTimeout(current.timer);
    window.clearInterval(current.clock);
    cancelAnimationFrame(current.frame);
  }

  function finish(cancelled = false) {
    if (trial.current.state === 'signal' && trial.current.cue && !cancelled) setMissed(count => count + 1);
    clearTimers();
    setInterrupted(cancelled);
    setRemaining(cancelled ? Math.max(0, trial.current.deadline - performance.now()) : 0);
    change('done');
  }

  function scheduleCue() {
    const current = trial.current;
    current.cue = 0;
    change('wait');
    const wait = 1500 + Math.random() * 2000;
    if (performance.now() + wait + lapseThreshold >= current.deadline) return;
    current.timer = window.setTimeout(() => {
      change('signal');
      current.frame = requestAnimationFrame(() => {
        current.cue = performance.now();
        current.timer = window.setTimeout(() => {
          setMissed(count => count + 1);
          scheduleCue();
        }, 1400);
      });
    }, wait);
  }

  function start() {
    clearTimers();
    setResults([]);
    setMissed(0);
    setFalseStarts(0);
    setInterrupted(false);
    setRemaining(testLength);
    trial.current.deadline = performance.now() + testLength;
    trial.current.clock = window.setInterval(() => {
      const left = trial.current.deadline - performance.now();
      if (left <= 0) finish();
      else setRemaining(left);
    }, 50);
    scheduleCue();
  }

  function reactToStimulus() {
    const current = trial.current;
    const now = performance.now();
    if (now >= current.deadline) {
      finish();
      return;
    }
    if (current.state === 'signal' && current.cue) {
      setResults(previous => [...previous, Math.round(now - current.cue)]);
    } else if (current.state === 'wait') {
      setFalseStarts(count => count + 1);
    } else {
      return;
    }
    window.clearTimeout(current.timer);
    scheduleCue();
  }

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && ['wait', 'signal'].includes(trial.current.state)) finish(true);
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      clearTimers();
    };
  }, []);

  const active = state === 'wait' || state === 'signal';
  const average = results.length ? Math.round(results.reduce((sum, result) => sum + result, 0) / results.length) : null;
  const lapses = results.filter(result => result > lapseThreshold).length + missed;
  const summary = interrupted ? 'Test interrupted' : lapses ? 'Vigilance lapses observed' : !results.length ? 'Insufficient responses' : 'No lapses observed';
  return <div className="assessment-card">
    <div className="assessment-name"><h3>Vigilance micro-test</h3><span className="mono">15 seconds</span></div>
    <p>Press the target as soon as it lights up.</p>
    {active ? <>
      <button className={`reaction-target ${state === 'signal' ? 'signal' : ''}`} onClick={reactToStimulus}>
        {state === 'signal' ? 'Respond now' : 'Wait for the signal'}
      </button>
      <div className="trial-info mono"><span>{(remaining / 1000).toFixed(1)}s remaining</span><button className="text-button" onClick={() => finish(true)}>End test</button></div>
    </> : <>
      <div className="pvt-results" aria-live="polite">
        <strong>{state === 'done' ? summary : 'Psychomotor vigilance (PVT)'}</strong>
        <span className="mono">{state === 'done' ? `${average === null ? '—' : average + ' ms mean'} · ${lapses} lapses · ${falseStarts} early taps` : 'Reaction time · Lapse threshold >500 ms'}</span>
      </div>
      <button className="secondary-button" onClick={start}>{state === 'done' ? 'Restart vigilance test' : 'Start vigilance test'}</button>
    </>}
  </div>;
}

export function MicroAssessments() {
  return <section className="assessments" id="assessments" tabIndex={-1} aria-labelledby="assessments-title">
    <div className="section-heading"><h2 id="assessments-title">Active micro-assessments</h2></div>
    <div className="dashboard-grid"><BreathingPacer /><VigilanceTest /></div>
  </section>;
}
