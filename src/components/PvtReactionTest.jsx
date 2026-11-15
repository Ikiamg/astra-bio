import React, { useState, useEffect, useRef } from 'react';
import { createMulberry32, FIXED_TERRESTRIAL_THRESHOLDS } from '../engine/astraBioEngine.js';

export default function PvtReactionTest({ pvtStats, onUpdatePvtStats, cabinCo2 }) {
  // States: 'IDLE' | 'WAITING_STIMULUS' | 'STIMULUS_ACTIVE' | 'FALSE_START' | 'COMPLETED'
  const [phase, setPhase] = useState('IDLE');
  const [remainingSec, setRemainingSec] = useState(15);
  const [trials, setTrials] = useState([]);
  const [lastRt, setLastRt] = useState(null);

  const stimulusStartRef = useRef(0);
  const waitTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const trialsRef = useRef([]);
  const deadlineRef = useRef(0);
  const prngRef = useRef(createMulberry32(2026));

  const lapseCutoff = FIXED_TERRESTRIAL_THRESHOLDS.pvt_lapse_threshold_ms.value;

  const clearTimers = () => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const scheduleNextStimulus = () => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    setPhase('WAITING_STIMULUS');
    // Deterministic seeded 1100ms to 2400ms inter-stimulus interval
    const delayMs = 1100 + Math.floor(prngRef.current() * 1300);
    waitTimeoutRef.current = setTimeout(() => {
      stimulusStartRef.current = performance.now();
      setPhase('STIMULUS_ACTIVE');
    }, delayMs);
  };

  const finalizeTest = (recordedTrials) => {
    clearTimers();
    setPhase('COMPLETED');
    const sum = recordedTrials.reduce((a, b) => a + b, 0);
    const meanRtMs = recordedTrials.length ? Math.round(sum / recordedTrials.length) : null;
    const lapses = recordedTrials.filter((rt) => rt > lapseCutoff).length;
    const grade =
      meanRtMs === null ? 'NO RESPONSES RECORDED' : meanRtMs <= 265 && lapses === 0
        ? 'OPTIMAL VIGILANCE (FAST RESPONSE)'
        : meanRtMs <= lapseCutoff
        ? 'RESPONSE WITHIN DEMO THRESHOLD'
        : `SLOW MEAN RESPONSE (>${lapseCutoff}ms)`;

    onUpdatePvtStats({
      meanRtMs,
      lapses,
      trialsCount: recordedTrials.length,
      grade,
      history: recordedTrials,
      simulated: false,
    });
  };

  const startTest = () => {
    clearTimers();
    trialsRef.current = [];
    setTrials([]);
    setLastRt(null);
    setRemainingSec(15);

    deadlineRef.current = performance.now() + 15000;
    countdownIntervalRef.current = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadlineRef.current - performance.now()) / 1000));
      setRemainingSec(seconds);
      if (seconds === 0) finalizeTest(trialsRef.current);
    }, 100);

    scheduleNextStimulus();
  };

  const handleTargetClick = () => {
    if (phase === 'IDLE' || phase === 'COMPLETED') {
      startTest();
      return;
    }

    if (phase === 'WAITING_STIMULUS') {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      setPhase('FALSE_START');
      waitTimeoutRef.current = setTimeout(() => {
        scheduleNextStimulus();
      }, 650);
      return;
    }

    if (phase === 'STIMULUS_ACTIVE') {
      const rt = Math.round(performance.now() - stimulusStartRef.current);
      const updated = [...trialsRef.current, rt];
      trialsRef.current = updated;
      setTrials(updated);
      setLastRt(rt);

      const meanRtMs = Math.round(updated.reduce((a, b) => a + b, 0) / updated.length);
      const lapses = updated.filter((x) => x > lapseCutoff).length;
      onUpdatePvtStats({
        meanRtMs,
        lapses,
        trialsCount: updated.length,
        grade:
          meanRtMs <= 265 && lapses === 0
            ? 'OPTIMAL VIGILANCE (FAST RESPONSE)'
            : meanRtMs <= lapseCutoff
            ? 'RESPONSE WITHIN DEMO THRESHOLD'
            : `SLOW MEAN RESPONSE (>${lapseCutoff}ms)`,
        history: updated,
        simulated: false,
      });

      scheduleNextStimulus();
    }
  };

  const isRunning =
    phase === 'WAITING_STIMULUS' || phase === 'STIMULUS_ACTIVE' || phase === 'FALSE_START';

  return (
    <div className="assessment-card">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              15-Second Psychomotor Vigilance Micro-Test (PVT)
            </h3>
            <p className="font-mono text-[11px] text-slate-400">
              Measured reaction time · Demo lapse threshold &gt;{lapseCutoff} ms
            </p>
          </div>
        </div>
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
            isRunning
              ? 'border-stone-400/70 bg-stone-500/20 text-stone-200'
              : 'border-slate-700 bg-slate-900 text-slate-400'
          }`}
        >
          {isRunning ? `TIME LEFT: ${remainingSec}s` : 'READY • 15s SPRINT'}
        </span>
      </div>

      {/* Interactive Optical Reaction Pad */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-6">
          <button
            type="button"
            onClick={handleTargetClick}
            className={`w-full h-32 rounded-xl border-2 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer select-none ${
              phase === 'STIMULUS_ACTIVE'
                ? 'border-slate-300 bg-slate-500 text-slate-950 shadow-glow-emerald scale-[1.02]'
                : phase === 'WAITING_STIMULUS'
                ? 'border-stone-500/60 bg-stone-950/40 text-stone-200'
                : phase === 'FALSE_START'
                ? 'border-rose-500 bg-rose-950/60 text-rose-200'
                : 'border-slate-500/50 bg-slate-900/90 text-slate-200 hover:border-slate-400 hover:bg-slate-950/40'
            }`}
          >
            {phase === 'STIMULUS_ACTIVE' && (
              <>

                <span className="mt-1 font-mono text-base font-black uppercase tracking-wider">
                  CLICK NOW! (OPTICAL TARGET)
                </span>
                <span className="font-mono text-[11px] font-semibold opacity-80">
                  Measuring millisecond cortical-motor latency...
                </span>
              </>
            )}

            {phase === 'WAITING_STIMULUS' && (
              <>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-stone-300">
                  WAIT FOR THE TARGET
                </span>
                <span className="mt-1 text-[11px] text-slate-300">
                  Keep finger/cursor poised • Do not click early
                </span>
                {lastRt && (
                  <span className="mt-1.5 rounded bg-slate-950/80 px-2 py-0.5 font-mono text-xs text-slate-300">
                    Last Reaction: {lastRt} ms
                  </span>
                )}
              </>
            )}

            {phase === 'FALSE_START' && (
              <>

                <span className="mt-1 font-mono text-xs font-bold uppercase text-rose-300">
                  FALSE START! WAIT FOR OPTICAL FLASH
                </span>
              </>
            )}

            {(phase === 'IDLE' || phase === 'COMPLETED') && (
              <>

                <span className="mt-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                  {phase === 'COMPLETED'
                    ? 'Re-Run 15s PVT Reaction Test'
                    : 'Click to Start 15s PVT Reaction Test'}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  Click when the target appears ({trials.length} trials logged)
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Live Millisecond Readouts & NASA-STD-3001 Grading */}
        <div className="sm:col-span-6 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Mean Reaction Time
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-xl font-bold ${
                    pvtStats.meanRtMs <= 265
                      ? 'text-slate-300'
                      : pvtStats.meanRtMs <= lapseCutoff
                      ? 'text-stone-300'
                      : 'text-rose-400'
                  }`}
                >
                  {pvtStats.meanRtMs === null ? 'No reading' : `${pvtStats.meanRtMs} ms`}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                {lastRt ? `Latest click: ${lastRt} ms` : `Baseline ref: 238 ms`}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Lapses (&gt;{lapseCutoff} ms)
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`font-mono text-xl font-bold ${
                    pvtStats.lapses === 0 ? 'text-slate-300' : 'text-rose-400'
                  }`}
                >
                  {pvtStats.lapses}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  / {pvtStats.trialsCount} trials
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                ppCO₂ context: {cabinCo2} mmHg
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="flex items-center gap-1.5">

              <span className="font-mono text-[11px] font-semibold text-slate-200">
                {pvtStats.grade}
              </span>
            </div>
            {isRunning && (
              <button
                type="button"
                onClick={() => finalizeTest(trialsRef.current)}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:text-white cursor-pointer"
              >
                Finish Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
