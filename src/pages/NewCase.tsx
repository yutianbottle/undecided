import { useEffect, useState } from 'react';
import { Shell, Foot } from '../components/Shell';
import { localizeError, useLang } from '../i18n';
import { Field } from '../components/ui';
import { GATES, gateName } from '../knowledge/gates';
import { useStore } from '../state/store';
import { LIMITS } from '../lib/validate';
import type { GateId, DecisionCase } from '../state/types';
import { monthEndISO, futureInput, dateInputISO, todayInput, fmtDate } from '../lib/date';

function readPrefill(): { gate: GateId | null; question: string } {
  try {
    const p = JSON.parse(sessionStorage.getItem('weijue.prefill') ?? '{}') as { gate?: GateId; question?: string };
    return {
      gate: p.gate && [...GATES.map(g => g.id), 'other'].includes(p.gate) ? p.gate : null,
      question: typeof p.question === 'string' ? p.question.slice(0, LIMITS.question) : '',
    };
  } catch { return { gate: null, question: '' }; }
}

export default function NewCase() {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { create, readIssue } = useStore();
  const [error, setError] = useState('');
  const [prefill] = useState(readPrefill);
  const [gate, setGate] = useState<GateId | null>(prefill.gate);
  const [question, setQuestion] = useState(prefill.question);
  const [kind, setKind] = useState<DecisionCase['deadlineKind']>('date');
  const [date, setDate] = useState(futureInput(7));

  // 要求先完成状态确认，直接访问新建页时返回确认页。
  useEffect(() => {
    let ok = true;
    try {
      // 仅接受最近 10 秒内的确认，限制确认状态的有效期。
      const at = Number(sessionStorage.getItem('weijue.statechecked') || 0);
      ok = Date.now() - at < 10_000;
    } catch { ok = true; }
    if (!ok) { window.location.hash = '#/check'; return; }
    try { sessionStorage.removeItem('weijue.prefill'); } catch { /* 清理预填充失败不影响建案卷。 */ }
  }, []);

  const validDate = kind !== 'date' || (!!dateInputISO(date) && date >= todayInput());
  const can = gate !== null && question.trim().length > 0 && validDate && !readIssue;

  function start() {
    if (!gate || !can) return;
    const deadlineAt =
      kind === 'none' ? null
      : kind === 'month' ? monthEndISO()
      : dateInputISO(date);
    try {
      const id = create(gate, question.trim(), kind, deadlineAt);
      window.location.hash = `#/case/${id}`;
    } catch (e) { setError(e instanceof Error ? localizeError(e.message, lang) : L('暂时无法创建案卷', 'Could not create the case')); }
  }

  return (
    <Shell glow={0.14}>
      <div className="wrap">
        <a className="btn btn--text" href="#/" style={{ paddingLeft: 0 }}>{L('← 台面', '← Desk')}</a>

        <p className="eyebrow">{L('建案卷 · 进入七步之前', 'New case · before the seven steps')}</p>
        <h1 className="h1" style={{ marginTop: 'var(--sp3)' }}>{L('现在，有什么是你还没定的？', 'What have you not decided yet?')}</h1>

        <div style={{ marginTop: 'var(--sp4)' }}>
          <Field label={L('你还没定的事（必填）', 'The decision (required)')} value={question} onChange={setQuestion} max={LIMITS.question}
            placeholder={L('一句话，40 字以内', 'One sentence, under 40 characters')} autoFocus />
        </div>

        <div style={{ marginTop: 'var(--sp3)' }}>
          <div className="hint">{L('它属于哪一类', 'Which kind is it')}</div>
          <div className="gates">
            {GATES.map((g) => (
              <button key={g.id} className={`gatebtn${gate === g.id ? ' on' : ''}`}
                aria-pressed={gate === g.id} onClick={() => setGate(g.id)}>{gateName(g.id, lang)}</button>
            ))}
            <button className={`gatebtn${gate === 'other' ? ' on' : ''}`}
              aria-pressed={gate === 'other'} onClick={() => setGate('other')}>{L('其他', 'Other')}</button>
          </div>
        </div>

        <div style={{ marginTop: 'var(--sp4)' }}>
          <div className="hint">{L('决定期限 · 什么时候之前必须选', 'Deadline · by when you must choose')}</div>
          <div className="seg" style={{ marginTop: 10 }}>
            <button className={kind === 'date' ? 'on' : ''} aria-pressed={kind === 'date'} onClick={() => setKind('date')}>{L('具体日期', 'A date')}</button>
            <button className={kind === 'month' ? 'on' : ''} aria-pressed={kind === 'month'} onClick={() => setKind('month')}>{L('这个月内', 'This month')}</button>
            <button className={kind === 'none' ? 'on' : ''} aria-pressed={kind === 'none'} onClick={() => setKind('none')}>{L('没有期限', 'No deadline')}</button>
          </div>
          {kind === 'date' && (
            <input className="field field--sm" type="date" aria-label={L('决定期限', 'Deadline')} min={todayInput()} value={date}
              style={{ marginTop: 14, maxWidth: 220 }}
              onChange={(e) => setDate(e.target.value)} />
          )}
          {kind === 'month' && <p className="hint" style={{ marginTop: 12 }}>{L('决定期限：', 'Deadline: ')}{fmtDate(monthEndISO())}{L('。回看日期会在落槌前另行确认。', '. The review date is set before the call.')}</p>}
          {!validDate && <p className="warn">{L('请选择今天或之后的有效日期。', 'Pick a valid date today or later.')}</p>}
          {kind === 'none' && (
            <p className="hint" style={{ marginTop: 12 }}>
              {L('可以不设。它会被单独放在「没给自己设期限的」那一组里。', 'You can skip it. It will sit alone in the no-deadline group.')}
            </p>
          )}
        </div>

        {error && <p className="warn" role="alert">{error}</p>}
        {readIssue && <a className="warn" href="#/me/data">{L('先到数据管理恢复记录 →', 'Recover from Data first →')}</a>}
        {(!gate || !question.trim()) && <p className="hint" style={{ marginTop: 24 }}>{L('写下问题并选择关口后，即可开始。', 'Write the question and pick a gate to begin.')}</p>}
        <div className="row-actions">
          <button className="btn" disabled={!can} onClick={start}>{L('开始 →', 'Start →')}</button>
        </div>

        <Foot />
      </div>
    </Shell>
  );
}
