import { useEffect, useRef } from 'react';
import { evidence } from '../data/evidence';

export function EvidenceDialog({ open, close }: { open: boolean; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return <dialog ref={dialog} className="evidence-dialog" aria-labelledby="evidence-title" onClose={close} onClick={event => {
    if (event.target === event.currentTarget) close();
  }}>
    <div className="evidence-content">
      <div className="evidence-header">
        <h2 id="evidence-title">Science &amp; Data</h2>
        <button className="secondary-button" onClick={close} aria-label="Close Science & Data" autoFocus>Close</button>
      </div>
      <p className="evidence-intro">The 60-day telemetry, scenario values, risk model, and benchmark are synthetic and tuned for this demonstration. Use them to explore the workflow. NASA sources provide the published limits, measurements, and research context shown below.</p>
      <a className="secondary-button evidence-download" href="/nasa-data-sources.md" download>Download complete source register</a>
      <div className="evidence-list">
        {evidence.map(item => <article key={item.title}>
          <div className="eyebrow">{item.tag}</div>
          <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
          <p>{item.detail}</p>
        </article>)}
      </div>
      <p className="evidence-intro">The MSCI uses directional z-scores against an adaptive N-of-1 baseline. The attribution describes contributions in the model. The simulation and assessments have no clinical validation.</p>
    </div>
  </dialog>;
}

export function NasaValidityFooter({ openSources }: { openSources: () => void }) {
  return <footer className="footer">
    <div><strong>A.S.T.R.A.-Bio</strong><span>Research demo · Synthetic telemetry · For demonstration only</span></div>
    <button className="text-button" onClick={openSources}>Science &amp; Data</button>
  </footer>;
}
