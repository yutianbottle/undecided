import { useState } from 'react';
import { Shell } from '../components/Shell';
import { useLang } from '../i18n';
import { Field } from '../components/ui';
import { DecisionRecord } from '../components/DecisionRecord';
import { EarlyOpen } from '../components/EarlyOpen';
import { useStore } from '../state/store';
import { getGate } from '../knowledge/gates';
import { fmtMeasure } from '../lib/format';
import { fmtDate, fmtDateTime, reviewAvailable } from '../lib/date';
import { LIMITS } from '../lib/validate';
import type { Verdict } from '../state/types';

const VERDICTS: { key: Verdict; zh: string; en: string }[] = [
  { key: 'same', zh: '基本一样', en: 'Roughly yes' }, { key: 'partial', zh: '有点不一样', en: 'Partly' }, { key: 'different', zh: '完全不是', en: 'Not at all' },
];
export default function Reopen({ id }: { id: string }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { get, reopen, saveReview } = useStore();
  const c = get(id);
  if (!c) return <Shell><div className="wrap"><p>{L('找不到这件案卷。', 'Case not found.')}</p><a href="#/">{L('回台面', 'Back to desk')}</a></div></Shell>;
  if (c.status !== 'sealed' && c.status !== 'archived') return <Shell><div className="wrap"><p>{L('这件案卷还未封存。', 'This case is not sealed yet.')}</p><a className="btn" href={`#/case/${id}`}>{L('返回案卷', 'Back to case')}</a></div></Shell>;
  const archived = c.status === 'archived';
  const ready = archived || reviewAvailable(c);
  const draft = c.reviewDraft ?? { result: '', verdict: '' as const, wrong: '', next: '' };
  const [actualNum, setActualNum] = useState('');
  const update = (p: Partial<typeof draft>) => saveReview(id, { ...draft, ...p });
  return <Shell>
    <main className="wrap">
      <a className="btn btn--text back-link" href="#/">{L('← 台面', '← Desk')}</a>
      <p className="eyebrow">{L('第 7 步 / 共 7 步', 'Step 7 of 7')} · {archived ? L('已归档', 'Archived') : L('到期回看', 'Due for review')}</p>
      <h1 className="h2">{c.question}</h1>
      <p className="hint">{L('封存于 ', 'Sealed ')}{fmtDate(c.sealedAt)}{L(' · 原计划回看 ', ' · scheduled ')}{fmtDate(c.openAt)}</p>
      {c.openedEarlyAt && <p className="hint">{L('提前开封于 ', 'Opened early ')}{fmtDateTime(c.openedEarlyAt)}</p>}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-kicker">{L('当时的选择与预测 · 只读', 'The choice and prediction · read-only')}</div>
        <p className="card-d">{L('选了「', 'Chose "')}{c.chosen}{L('」', '"')}</p>
        <p className="card-d">{c.prediction}{L(`（${c.predictedP}%）`, ` (${c.predictedP}%)`)}</p>
        <DecisionRecord c={c} />
      </div>
      {!ready ? <>
        <p className="hint" style={{ marginTop: 24 }}>{L('还没到原计划回看日期。若结果已经出现，可以确认提前开封。', 'Not due yet. If the outcome is already clear, you can open it early.')}</p>
        <EarlyOpen c={c} />
      </> : archived ? <section className="content-section">
        <h2 className="h2">{L('实际结果', 'The result')}</h2>
        <dl className="record-grid">
          <dt>{L('结果', 'Result')}</dt><dd>{c.result}</dd>
          {typeof c.expectedNum === 'number' && <>
            <dt>{L('当时预估', 'Expected')}</dt><dd>{fmtMeasure(c.expectedNum, getGate(c.gate).measure.unit, lang)}</dd>
            <dt>{L('实际数值', 'Actual')}</dt><dd>{typeof c.actualNum === 'number' ? fmtMeasure(c.actualNum, getGate(c.gate).measure.unit, lang) : L('未填写', 'not filled')}</dd>
          </>}
          <dt>{L('与预测相比', 'Versus prediction')}</dt><dd>{(() => { const v = VERDICTS.find(x => x.key === c.verdict); return v ? (lang === 'zh' ? v.zh : v.en) : L('未自标', 'not marked'); })()}</dd>
          <dt>{L('成立与需修正的判断', 'What held, what needs fixing')}</dt><dd>{c.wrongJudgment || L('未填写', 'not filled')}</dd>
          <dt>{L('下次调整', 'Next adjustment')}</dt><dd>{c.nextChange || L('未填写', 'not filled')}</dd>
        </dl>
        <p className="hint">{L('归档于 ', 'Archived ')}{fmtDateTime(c.archivedAt ?? c.updatedAt)}{L(' · 记录只读', ' · read-only')}</p>
      </section> : <section className="content-section">
        <h2 className="h2">{L('现在结果如何？', 'How did it turn out?')}</h2>
        <p className="hint">{L('回访草稿自动保存在本机。只需填写结果，其余可选。', 'The draft saves on this device. Only the result is required.')}</p>
        <Field label={L('结果（必填）', 'Result (required)')} value={draft.result} onChange={result => update({ result })} max={LIMITS.result} rows={2} placeholder={L('例：客户接受了，但砍到 2.9 万', 'e.g. Accepted, negotiated to 29k')} />

        {typeof c.expectedNum === 'number' && (() => {
          const m = getGate(c.gate).measure;
          return (
            <div style={{ marginTop: 12 }}>
              <label className="hint" htmlFor="actual-num">
                {L(
                  `${m.actual}？（当时你估的是 ${fmtMeasure(c.expectedNum, m.unit, 'zh')}）`,
                  `${m.actualEn} (you expected ${fmtMeasure(c.expectedNum, m.unit, 'en')})`,
                )}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input
                  id="actual-num"
                  className="field"
                  inputMode="numeric"
                  style={{ width: 110 }}
                  value={actualNum}
                  onChange={(e) => setActualNum(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={L(m.unit === 'money' ? '例：32000' : '例：21', m.unit === 'money' ? 'e.g. 32000' : 'e.g. 21')}
                />
                <span className="hint">{L(m.unit === 'money' ? '元' : '天', m.unit === 'money' ? 'CNY' : 'days')}</span>
              </div>
              <p className="hint" style={{ marginTop: 6 }}>
                {L('可选。填了才能累出「你自己的偏差」。', 'Optional. Only filled ones count towards your own bias.')}
              </p>
            </div>
          );
        })()}
        <fieldset className="form-group"><legend className="hint">{L('和你当时想的一样吗（可选）', 'Is it what you expected (optional)')}</legend>
          <div className="seg">{VERDICTS.map(v => <button key={v.key} className={draft.verdict === v.key ? 'on' : ''}
            aria-pressed={draft.verdict === v.key} onClick={() => update({ verdict: draft.verdict === v.key ? '' : v.key })}>{(lang === 'zh' ? v.zh : v.en)}</button>)}</div>
        </fieldset>
        <Field label={L('哪些判断成立，哪些需要修正（可选）', 'What held, what needs fixing (optional)')} value={draft.wrong} onChange={wrong => update({ wrong })} max={LIMITS.wrong} rows={2} placeholder={L('可以写判断成立，也可以写需要修正的地方', 'What held, or what you would correct')} />
        <Field label={L('下次改哪一条（可选）', 'What to change next time (optional)')} value={draft.next} onChange={next => update({ next })} max={LIMITS.next} rows={2} placeholder={L('例：报三档，把让步空间预先放进去', 'e.g. Quote three tiers with room built in')} />
        {!draft.result.trim() && <p className="hint">{L('填写实际结果后即可归档。', 'Fill in the result to archive.')}</p>}
        <div className="row-actions"><button className="btn btn--rule" disabled={!draft.result.trim()} onClick={() => {
          reopen(id, draft.result.trim(), draft.verdict, draft.wrong.trim(), draft.next.trim(), actualNum === '' ? null : Number(actualNum));
        }}>{L('归档', 'Archive')}</button></div>
        <p className="hint" style={{ marginTop: 16 }}>{L('归档后进入预测记录，内容只读。系统不会打分或排名。', 'Archived records join your prediction log and become read-only. No scores, no rankings.')}</p>
      </section>}
    </main>
  </Shell>;
}
