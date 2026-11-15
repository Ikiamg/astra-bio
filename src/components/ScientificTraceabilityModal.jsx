import React, { useEffect, useRef } from 'react';
import { evidence } from '../data/evidence';
import {
  CLINICAL_PARAMETERS_TABLE,
  runMonteCarloBenchmark,
} from '../engine/astraBioEngine.js';

export const AI_TRANSPARENCY_DISCLOSURE =
  'The concept, scientific approach and design decisions are ours. AI tools (Google Antigravity) assisted with code generation, including the interface and simulation code, and with text drafting.';

export function ScientificFooter({ onOpenModal }) {
  return (
    <footer className="mt-10 border-matte-t bg-matte-main text-slate-300">
      <div className="mx-auto max-w-[1600px] px-4 py-6 space-y-5">
        {/* Science & Data Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-matte-b pb-3">
          <div className="flex items-center gap-2">

            <h2 className="text-sm font-semibold text-white">
              Science &amp; Data — Technical Traceability Register (NASA · ESA · CSA · JAXA)
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenModal}
            className="rounded-lg px-3 py-1.5 text-xs font-medium matte-btn cursor-pointer"
          >
            Open thresholds and equations
          </button>
        </div>


        {/* Mandatory AI / Super Intelligence (SI) Transparency Disclosure Banner */}
        <div className="matte-card px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">

            <p className="text-xs text-muted-gray leading-relaxed">
              <strong className="text-white mr-1.5">
                AI / SI Transparency Disclosure:
              </strong>
              <em>&ldquo;{AI_TRANSPARENCY_DISCLOSURE}&rdquo;</em>
            </p>
          </div>
          <span className="shrink-0 matte-pill px-2.5 py-1 font-mono text-[10px]">
            Client-side simulation
          </span>
        </div>
      </div>
    </footer>
  );
}

export function ScientificTraceabilityModal({ isOpen, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (isOpen && !dialog.current.open) dialog.current.showModal();
    if (!isOpen && dialog.current.open) dialog.current.close();
  }, [isOpen]);
  const benchmark = runMonteCarloBenchmark();

  return (
    <dialog ref={dialog} className="science-dialog" aria-label="Science & Data Traceability Register" onClose={onClose}>
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto matte-card p-6 space-y-5">
        <div className="flex items-center justify-between border-matte-b pb-3">
          <div className="flex items-center gap-2.5">

            <div>
              <h2 className="text-base font-bold text-white">
                Science &amp; Data — A.S.T.R.A.-Bio Technical Traceability &amp; Reference Register
              </h2>
              <p className="font-mono text-xs text-muted-gray mt-0.5">
                NASA-STD-3001 Vol. 1 &amp; 2 · NASA PDS RAD (MSL-M-RAD-3-RDR-V1.0) · NASA OSDR (OSD-946, OSD-570) · ESA · CSA · JAXA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 matte-btn cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Mathematical Formulation & 30-Seed Summary Box */}
        <div className="matte-card-sub p-4 space-y-2.5">
          <div className="text-xs font-semibold text-white">
            30-Seed Monte Carlo Reproducibility &amp; Core Mathematical Formulation
          </div>
          <p className="text-xs text-muted-gray leading-relaxed">
            Across our {benchmark.numSeeds}-seed deterministic Mulberry32 simulation, fixed terrestrial cutoffs trigger a mean of <strong className="text-white">{benchmark.staticFalseAlarms.mean}</strong> false alarms (range {benchmark.staticFalseAlarms.min}–{benchmark.staticFalseAlarms.max}) during Days 1–14 microgravity fluid shift, whereas A.S.T.R.A.-Bio triggers a mean of <strong className="text-white">{benchmark.astraFalseAlarms.mean}</strong> (range {benchmark.astraFalseAlarms.min}–{benchmark.astraFalseAlarms.max}), a <strong className="text-white">{benchmark.falseAlarmReductionPct}%</strong> reduction. During the Day-42 SPE storm, A.S.T.R.A.-Bio provides a mean of <strong className="text-white">+{benchmark.speLeadTimeHours.mean}h</strong> early detection lead time (range {benchmark.speLeadTimeHours.min}–{benchmark.speLeadTimeHours.max}h). <em>Results come from a 30-seed synthetic simulation under our stated assumptions.</em>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-xs">
            <div className="rounded-lg border-matte bg-matte-main p-3 text-slate-200">
              <div className="text-[10px] uppercase text-muted-gray mb-1">
                1. Adaptive N-of-1 EWMA State &amp; Variance
              </div>
              <div>μ(i,t) = λ·x(i,t) + (1 − λ)·μ(i,t−1)</div>
              <div>σ²(i,t) = λ·(x(i,t) − μ(i,t−1))² + (1 − λ)·σ²(i,t−1)</div>
              <div className="mt-1 text-[10px] text-muted-gray">
                Tolerance Band: μ(i,t) ± 2·σ(i,t)
              </div>
            </div>
            <div className="rounded-lg border-matte bg-matte-main p-3 text-slate-200">
              <div className="text-[10px] uppercase text-muted-gray mb-1">
                2. Non-Linear Multi-System Coupling Index (MSCI)
              </div>
              <div>Z(i,t) = max(0, s_i·(x(i,t) − μ(i,t−1)) / σ(i,t−1))</div>
              <div>MSCI(t) = clip[ Σ w_i·Z(i,t) + γ·(Z_env × Z_autonomic × Z_context)^0.68 ]</div>
              <div className="mt-1 text-[10px] text-muted-gray">
                Mean +{benchmark.speLeadTimeHours.mean}h Early Detection Lead Time (Range {benchmark.speLeadTimeHours.min}–{benchmark.speLeadTimeHours.max}h)
              </div>
            </div>
          </div>
        </div>

        {/* Thresholds & Parameters Table with Source Column */}
        <div className="matte-card-sub p-4 overflow-x-auto">
          <div className="text-xs font-semibold text-white mb-2.5">
            Simulation thresholds and adaptive model parameters
          </div>
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead>
              <tr className="border-matte-b text-white">
                <th className="py-2 pr-3">Parameter</th>
                <th className="py-2 pr-3">Fixed comparator</th>
                <th className="py-2 pr-3">Adaptive N-of-1 Rule</th>
                <th className="py-2">Reference context</th>
              </tr>
            </thead>
            <tbody>
              {CLINICAL_PARAMETERS_TABLE.map((row, i) => (
                <tr key={i} className="border-matte-b text-muted-gray">
                  <td className="py-2 pr-3 font-semibold text-white">{row.parameter}</td>
                  <td className="py-2 pr-3 text-slate-200">{row.terrestrialFixedLimit}</td>
                  <td className="py-2 pr-3 text-slate-200">{row.adaptiveNof1Rule}</td>
                  <td className="py-2 text-muted-gray">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Clean 2-Column Grid of Citation Cards */}
        <div>
          <div className="text-xs font-semibold text-white mb-2.5">
            Technical references
          </div>
          <a className="text-button" href="/nasa-data-sources.md" download>Download the source register</a>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
            {evidence.map(ref => (
              <div key={ref.url} className="matte-card-sub p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    {ref.tag}
                  </span>
                  <span className="matte-pill px-2 py-0.5 font-mono text-[10px]">
                    Source
                  </span>
                </div>
                <h3 className="mt-1.5 text-xs font-medium text-slate-200">
                  <a className="text-button" href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a>
                </h3>
                <p className="mt-1 text-xs text-muted-gray leading-relaxed">
                  {ref.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-matte-t pt-3">
          <p className="text-xs text-muted-gray italic">
            {AI_TRANSPARENCY_DISCLOSURE}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-xs matte-btn-active cursor-pointer shrink-0 ml-3"
          >
            Close Science &amp; Data
          </button>
        </div>
      </div>
    </dialog>
  );
}
