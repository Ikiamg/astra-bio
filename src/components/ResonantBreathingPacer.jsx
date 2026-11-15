import React, { useState, useEffect } from 'react';

export default function ResonantBreathingPacer({
  baseHrvRmssd,
  breathingStats,
  onUpdateBreathingStats,
}) {
  const [isActive, setIsActive] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isActive) return undefined;
    const interval = setInterval(() => {
      setElapsedMs((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  // 10,000 ms (10s) full cycle = 0.1 Hz (6 cycles/min): 0..5000ms Inhale, 5000..10000ms Exhale
  const cyclePosMs = elapsedMs % 10000;
  const isInhaling = cyclePosMs < 5000;
  const phaseProgress = isInhaling ? cyclePosMs / 5000 : (cyclePosMs - 5000) / 5000;
  const phaseRemainingSec = (5.0 - phaseProgress * 5.0).toFixed(1);

  // Smooth sinusoidal scale between 0.58 and 1.00
  const ringScale = isActive
    ? isInhaling
      ? 0.58 + 0.42 * Math.sin((phaseProgress * Math.PI) / 2)
      : 1.0 - 0.42 * Math.sin((phaseProgress * Math.PI) / 2)
    : 0.72;

  // Live vagal coherence and HRV boost rise with elapsed breathing time
  const activeSeconds = isActive ? elapsedMs / 1000 : 0;
  const liveHrvBoost = Number(
    Math.min(14.5, breathingStats.hrvBoostMs + activeSeconds * 0.42).toFixed(1)
  );
  const liveCoherence = Math.min(
    98,
    Math.round(breathingStats.coherenceScore + activeSeconds * 1.15)
  );
  const effectiveHrv = Number((baseHrvRmssd + liveHrvBoost).toFixed(1));

  const handleToggle = () => {
    if (isActive) {
      // Persist accumulated boost when stopping
      onUpdateBreathingStats({
        sessionsCompleted: breathingStats.sessionsCompleted + 1,
        coherenceScore: liveCoherence,
        hrvBoostMs: liveHrvBoost,
      });
      setIsActive(false);
    } else {
      setElapsedMs(0);
      setIsActive(true);
    }
  };

  const handleInstantDemoBoost = () => {
    const boostedCoherence = 95;
    const boostedHrvDelta = 11.4;
    onUpdateBreathingStats({
      sessionsCompleted: breathingStats.sessionsCompleted + 1,
      coherenceScore: boostedCoherence,
      hrvBoostMs: boostedHrvDelta,
    });
  };

  const handleReset = () => {
    setIsActive(false);
    setElapsedMs(0);
    onUpdateBreathingStats({
      sessionsCompleted: 0,
      coherenceScore: 68,
      hrvBoostMs: 0,
    });
  };

  return (
    <div className="assessment-card">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              0.1 Hz Resonant Breathing Biofeedback Pacer
            </h3>
            <p className="font-mono text-[11px] text-slate-400">
              6.0 Cycles/Min (5s Inhale • 5s Exhale) • Simulated HRV and coherence
            </p>
          </div>
        </div>
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
            isActive
              ? 'border-slate-400/60 bg-slate-500/20 text-slate-300'
              : 'border-slate-700 bg-slate-900 text-slate-400'
          }`}
        >
          {isActive ? 'PACER ACTIVE • 0.1 Hz' : 'STANDBY'}
        </span>
      </div>

      {/* Main Interactive Biofeedback Ring & Real-Time Vagal Telemetry */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Animated Breathing Circle */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center py-2">
          <div className="relative flex h-36 w-36 items-center justify-center">
            {/* Outer reference guide ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-500/35" />
            {/* Animated expanding/contracting pulmonary sphere */}
            <div
              style={{
                transform: `scale(${ringScale.toFixed(3)})`,
                transition: 'transform 100ms linear',
              }}
              className={`flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 text-center shadow-glow-cyan ${
                isActive
                  ? isInhaling
                    ? 'border-slate-300 bg-slate-500/25 text-slate-100'
                    : 'border-slate-300 bg-slate-500/25 text-slate-100'
                  : 'border-slate-600 bg-slate-900/90 text-slate-300'
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                {isActive ? (isInhaling ? 'INHALE SLOWLY' : 'EXHALE VAGAL') : '0.1 Hz PACER'}
              </span>
              <span className="mt-0.5 font-mono text-2xl font-extrabold text-white">
                {isActive ? `${phaseRemainingSec}s` : '5.0s'}
              </span>
              <span className="mt-0.5 font-mono text-[10px] text-slate-300">
                {isActive ? `Cycle #${Math.floor(elapsedMs / 10000) + 1}` : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Biofeedback Metrics & Controls */}
        <div className="sm:col-span-7 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Live Vagal HRV (RMSSD)
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-slate-300">
                  {effectiveHrv} ms
                </span>
                {liveHrvBoost > 0 && (
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    (+{liveHrvBoost} ms)
                  </span>
                )}
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Base: {baseHrvRmssd} ms → Target &gt;38 ms
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Cardio-Vagal Coherence
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-slate-300">
                  {liveCoherence}%
                </span>
                <span className="font-mono text-[10px] text-slate-400">RSA Locked</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all duration-200"
                  style={{ width: `${liveCoherence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Phase Bar */}
          <div className="rounded-lg border border-slate-800/90 bg-slate-900/60 px-3 py-2">
            <div className="flex justify-between font-mono text-[10px] text-slate-400 mb-1">
              <span className={isActive && isInhaling ? 'text-slate-300 font-bold' : ''}>
                ▲ INHALE (0.0s – 5.0s)
              </span>
              <span className={isActive && !isInhaling ? 'text-slate-300 font-bold' : ''}>
                ▼ EXHALE (5.0s – 10.0s)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full transition-all duration-100 ${
                  isInhaling ? 'bg-slate-400' : 'bg-slate-400'
                }`}
                style={{ width: `${isActive ? (cyclePosMs / 10000) * 100 : 50}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggle}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'border border-rose-400/60 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-slate-500 text-slate-950 hover:bg-slate-400 shadow-glow-cyan'
              }`}
            >

              <span>{isActive ? 'Stop & Log Biofeedback' : 'Start 0.1 Hz Pacer Live'}</span>
            </button>

            <button
              type="button"
              onClick={handleInstantDemoBoost}
              className="flex items-center gap-1 rounded-lg border border-slate-500/40 bg-slate-950/50 px-2.5 py-2 font-mono text-[11px] font-semibold text-slate-300 hover:border-slate-400 hover:bg-slate-900/50 transition-all cursor-pointer"
              title="Simulate completed 6-cycle resonant vagal session for quick demo"
            >

              <span>Simulate +11.4 ms HRV</span>
            </button>

            {(breathingStats.hrvBoostMs > 0 || isActive) && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white cursor-pointer"
                title="Reset biofeedback session"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
