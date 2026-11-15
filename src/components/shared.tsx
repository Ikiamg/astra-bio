import type { PropsWithChildren } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

export function Panel({ title, subtitle, children, className = '' }: PropsWithChildren<{
  title: string; subtitle?: string; className?: string;
}>) {
  return <section className={`panel ${className}`}>
    <div className="panel-heading"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    {children}
  </section>;
}

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  return <div className="sparkline" aria-hidden>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={values.map(value => ({ value }))} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.4} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}

export function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
