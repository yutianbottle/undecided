import { useLang } from '../i18n';
import { useId, type ReactNode } from 'react';

export function Field({ value, onChange, max, placeholder, rows = 1, autoFocus, label, error }: {
  value: string; onChange: (v: string) => void; max: number; placeholder?: string;
  rows?: number; autoFocus?: boolean; label?: string; error?: string;
}) {
  const id = useId();
  const props = {
    id, className: 'field', value, maxLength: max, placeholder, autoFocus,
    'aria-label': label ?? placeholder ?? '', 'aria-describedby': `${id}-count${error ? ` ${id}-error` : ''}`,
    'aria-invalid': !!error,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return (
    <div className="field-wrap">
      {label && <label className="hint field-label" htmlFor={id}>{label}</label>}
      {rows > 1 ? <textarea {...props} rows={rows} /> : <input {...props} />}
      <span id={`${id}-count`} className={`counter${value.length >= max ? ' counter--over' : ''}`}>{value.length}/{max}</span>
      {error && <p id={`${id}-error`} className="warn">{error}</p>}
    </div>
  );
}
export function StepBar({ step, total }: { step: number; total: number }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return <div className="progress" role="progressbar" aria-label={L('决策进度', 'Decision progress')} aria-valuenow={step} aria-valuemin={0} aria-valuemax={total}>
    <i style={{ width: `${Math.min(100, step / total * 100)}%` }} />
  </div>;
}
export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section className="content-section" id={id}>
    <h2 className="group-title" style={{ marginTop: 0 }}>{title}</h2>
    <div style={{ marginTop: 'var(--sp2)' }}>{children}</div>
  </section>;
}
export function Miss({ items }: { items: string[] }) {
  const { lang } = useLang();
  return items.length ? (
    <p className="warn" style={{ marginTop: 'var(--sp2)' }}>
      {lang === 'zh' ? `还差：${items.join('、')}` : `Still missing: ${items.join(', ')}`}
    </p>
  ) : null;
}
export function Evidence({ grade }: { grade: string }) {
  const { lang } = useLang();
  const notes: Record<string, string> = lang === 'zh'
    ? { A: '多项独立研究或元分析', B: '有研究支持，商业场景外推仍有限', C: '实践观察，无对照研究', D: '尚缺可靠证据' }
    : { A: 'Multiple independent studies or meta-analyses', B: 'Research-backed; extrapolation to business is still limited', C: 'Practice observation, no controlled study', D: 'No reliable evidence yet' };
  return (
    <details className="evidence">
      <summary>{lang === 'zh' ? `证据 ${grade} · 等级说明` : `Evidence ${grade} · what the grade means`}</summary>
      <p className="hint">
        {notes[grade] ?? (lang === 'zh' ? '尚未分级' : 'not graded')}
        {lang === 'zh' ? '。等级说明依据强弱，不代表适合每个具体决定。' : '. Grades describe strength of evidence, not fitness for your decision.'}
      </p>
    </details>
  );
}
