import { useState } from 'react';
import { GATES, gateName } from '../knowledge/gates';
import { useLang } from '../i18n';
import { fmtDate } from '../lib/date';
import type { DecisionCase } from '../state/types';

export const statusLabel = { draft: '正在梳理', framed: '准备落槌', sealed: '封存等待', archived: '已回看', abandoned: '已撤回' };
const statusLabelEn: Record<keyof typeof statusLabel, string> = {
  draft: 'Drafting', framed: 'Ready to seal', sealed: 'Sealed', archived: 'Reviewed', abandoned: 'Withdrawn',
};
export function caseLink(c: DecisionCase): string {
  return c.status === 'archived' ? `#/case/${c.id}/reopen`
    : c.status === 'sealed' ? `#/case/${c.id}/sealed` : `#/case/${c.id}`;
}
export function archivedTime(c: DecisionCase): string { return c.archivedAt ?? c.updatedAt; }
export function CaseHistory({ cases }: { cases: DecisionCase[] }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const SL: Record<string, string> = lang === 'zh' ? statusLabel : statusLabelEn;
  const [query, setQuery] = useState('');
  const [gate, setGate] = useState('all');
  const [status, setStatus] = useState('all');
  const [limit, setLimit] = useState(20);
  const filtered = cases.filter(c => (gate === 'all' || c.gate === gate) && (status === 'all' || c.status === status)
    && [c.question, c.prediction, c.result, c.aiGap, c.distance, c.wrongJudgment, c.nextChange, ...c.facts, ...c.options]
      .join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => Date.parse(b.status === 'archived' ? archivedTime(b) : b.updatedAt)
      - Date.parse(a.status === 'archived' ? archivedTime(a) : a.updatedAt));
  return <section>
    <h2 className="h2">{L('全部案卷', 'All cases')}</h2>
    <p className="hint">{L('包括草稿、封存、回看和撤回记录。按最近记录时间排列。', 'Drafts, sealed, reviewed and withdrawn. Sorted by latest activity.')}</p>
    <div className="history-filters">
      <label className="hint">{L('搜索', 'Search')}<input className="field" type="search" value={query} placeholder={L('问题、事实、预测或结果', 'Question, fact, prediction or result')}
        onChange={e => { setQuery(e.target.value); setLimit(20); }} /></label>
      <label className="hint">{L('关口', 'Gate')}<select className="field" value={gate} onChange={e => { setGate(e.target.value); setLimit(20); }}>
        <option value="all">{L('全部关口', 'All gates')}</option>{GATES.map(g => <option key={g.id} value={g.id}>{gateName(g.id, lang)}</option>)}<option value="other">{L('其他', 'Other')}</option>
      </select></label>
      <label className="hint">{L('状态', 'Status')}<select className="field" value={status} onChange={e => { setStatus(e.target.value); setLimit(20); }}>
        <option value="all">{L('全部状态', 'All statuses')}</option>{Object.entries(SL).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
    </div>
    <p className="hint" role="status">{L(`共 ${filtered.length} 件`, `${filtered.length} total`)}</p>
    {filtered.length ? <div className="caselist" style={{ marginTop: 12 }}>{filtered.slice(0, limit).map(c => <a className="caserow" key={c.id} href={caseLink(c)}>
      <div className="case-main"><h3 className="caselow-q">{c.question}</h3><p className="hint">{gateName(c.gate)} · {statusLabel[c.status]}</p>
        {c.result && <p className="card-d">{L('结果：', 'Result: ')}{c.result}</p>}
        {!c.result && c.prediction && <p className="card-d">{L('预测：', 'Predicted: ')}{c.prediction}</p>}
      </div>
      <span className="due">{fmtDate(c.status === 'archived' ? archivedTime(c) : c.updatedAt)}</span>
    </a>)}</div> : <p className="empty-note">{cases.length ? L('没有符合条件的案卷。可以换个关键词或筛选条件。', 'No cases match. Try another keyword or filter.') : L('还没有案卷。先把一个未决的事摆上台面。', 'No cases yet. Put one undecided thing on the desk.')}</p>}
    {filtered.length > limit && <button className="btn" onClick={() => setLimit(limit + 20)}>{L('再看 20 件', 'Show 20 more')}</button>}
  </section>;
}
