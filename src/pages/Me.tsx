import { Shell, Foot } from '../components/Shell';
import { abandonReasonLabel, useLang } from '../i18n';
import { Section } from '../components/ui';
import { CaseHistory, archivedTime, caseLink } from '../components/CaseHistory';
import { DataPanel } from '../components/DataPanel';
import { useStore } from '../state/store';
import { fmtDate, reviewAvailable } from '../lib/date';
import { GATES, gateName } from '../knowledge/gates';
import { calibrationFilled } from '../knowledge/engine';
import { CalibrationBlock } from '../components/CalibrationBlock';

const TABS = {
  predictions: { zh: '预测记录', en: 'Predictions' },
  results: { zh: '回看结果', en: 'Results' },
  history: { zh: '全部案卷', en: 'All cases' },
  data: { zh: '数据管理', en: 'Data' },
} as const;
export default function Me({ initialTab }: { initialTab?: keyof typeof TABS }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { cases, readIssue } = useStore();
  const tab = readIssue ? 'data' : initialTab ?? 'predictions';
  const setTab = (next: keyof typeof TABS) => { window.location.hash = `#/me/${next}`; };
  const archived = cases.filter(c => c.status === 'archived').sort((a, b) => Date.parse(archivedTime(b)) - Date.parse(archivedTime(a)));
  const abandoned = cases.filter(c => c.status === 'abandoned');
  const marked = archived.filter(c => c.verdict);
  const ps = archived.slice(0, 24);
  const groups = [...new Set(ps.map(c => c.predictedP))].sort((a, b) => a - b).map(p => ({ p, cases: ps.filter(c => c.predictedP === p) }));
  const high = marked.filter(c => c.predictedP >= 70);
  const low = marked.filter(c => c.predictedP <= 50);
  /** 只列出真的填过数的关口，避免八条空行 */
  const measured = GATES.map(g => ({ g, filled: calibrationFilled(cases, g.id) })).filter(x => x.filled > 0);
  return <Shell><main className="wrap">
    <h1 className="h1">{L('我', 'Me')}</h1><p className="hint">{L('留下记录，回看自己的处境与判断。', 'Keep a record. Look back at your situation and your calls.')}</p>

    {measured.length > 0 && (
      <Section title={L('你的基准线', 'Your baseline')}>
        <p className="hint" style={{ marginBottom: 'var(--sp3)' }}>
          {L('落槌时你估的数，和回看时实际的数，逐次对上。凑满三次才会给结论。',
             'What you expected at the call against what actually happened, gate by gate. Three pairs before it says anything.')}
        </p>
        {measured.map(({ g, filled }) => (
          <div key={g.id} style={{ padding: '12px 14px', marginBottom: 10, border: '1px solid var(--line-2)', borderRadius: 'var(--radius)' }}>
            <div className="card-kicker" style={{ marginBottom: 6 }}>
              {gateName(g.id, lang)} · <a href={`#/ledger/${g.id}`} style={{ color: 'var(--fog)' }}>{filled} {L('次', 'calls')}</a>
            </div>
            <CalibrationBlock cases={cases} gate={g.id} />
          </div>
        ))}
      </Section>
    )}
    <nav className="page-tabs" aria-label={L('个人记录分类', 'Record sections')}>{Object.entries(TABS).map(([id, label]) => <button key={id}
      aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id as keyof typeof TABS)}>{lang === 'zh' ? label.zh : label.en}</button>)}</nav>
    {tab === 'predictions' && <section>
      <h2 className="h2">{L('你写下过的预测', 'Your predictions')}</h2>
      {!ps.length ? <p className="empty-note">{L('还没有归档的预测。到期回看并归档后，记录会出现在这里。', 'No archived predictions yet. Review one when due and it will appear here.')}</p> : <>
        <p className="hint">{L(`最近 ${ps.length} 条归档记录。横轴是落槌时给出的概率，相同概率上下堆叠。`, `The last ${ps.length} archived records. The axis is the probability you gave at the call; equal probabilities stack.`)}</p>
        <div className="prediction-chart" aria-hidden="true" style={{ height: Math.max(90, ...groups.map(g => g.cases.length * 8 + 44)) }}>
          {groups.map(g => <div key={g.p} className="prediction-stack" style={{ left: `${g.p}%` }}>
            {g.cases.map(c => <i key={c.id} />)}{g.cases.length > 1 && <span>{g.cases.length}</span>}
          </div>)}
        </div><div className="chart-axis"><span>0%<small>{L('几乎不会', 'almost never')}</small></span><span>50%<small>{L('一半一半', 'even odds')}</small></span><span>100%<small>{L('几乎一定', 'almost certain')}</small></span></div>
        <p className="hint" style={{ marginTop: 20 }}>{L(`其中 ${ps.filter(c => c.predictedP >= 40 && c.predictedP <= 60).length} 条在 40%–60% 之间。概率集中或分散本身没有好坏，50% 也可以是合理判断。`, `${ps.filter(c => c.predictedP >= 40 && c.predictedP <= 60).length} of them sit between 40% and 60%. Concentration is not good or bad by itself — 50% can be the honest answer.`)}</p>
        <details className="record-details"><summary>{L('逐条查看概率与案卷', 'See each probability and case')}</summary><ul>{ps.map(c => <li key={c.id}><a className="record-link" href={caseLink(c)}>{c.predictedP}% · {c.question}</a></li>)}</ul></details>
      </>}
      <Section title={L('最近归档的', 'Recently archived')}>{archived.length ? archived.slice(0, 6).map(c => <a key={c.id} className="caserow" href={caseLink(c)}>
        <div className="case-main"><h3 className="caselow-q">{c.question}</h3><p className="hint">{gateName(c.gate, lang)} · {c.prediction}（{c.predictedP}%）</p><p className="card-d">{L('结果：', 'Result: ')}{c.result}</p><p className="hint">{L('归档于 ', 'Archived ')}{fmtDate(archivedTime(c))}</p></div>
      </a>) : <p className="hint">{L('还没有归档记录。', 'Nothing archived yet.')}</p>}
      <button className="btn btn--text" onClick={() => setTab('history')}>{L('打开全部案卷 →', 'Open all cases →')}</button></Section>
    </section>}
    {tab === 'results' && <section>
      <h2 className="h2">{L('结果与当时的预测', 'Results against predictions')}</h2><p className="hint">{L('这里统计你回访时的自标，描述结果与预测的相似程度。', 'Counts of your own marks on review: how close the result was to the prediction.')}</p>
      <div className="stats">{[['same', L('基本一样', 'Roughly yes')], ['partial', L('有点不一样', 'Partly')], ['different', L('完全不是', 'Not at all')]].map(([id, label]) => <div className="stat" key={id}><b>{marked.filter(c => c.verdict === id).length}</b><span>{label}</span></div>)}</div>
      <p className="hint" style={{ marginTop: 16 }}>{L(`共 ${archived.length} 件已回看，${marked.length} 件已自标。自标不是对决定好坏的评分。`, `${archived.length} reviewed, ${marked.length} marked. A mark is not a grade of the decision.`)}</p>
      <Section title={L('按当时的确信度对照', 'By the confidence you had')}><p className="card-d">{L(`70% 及以上的 ${high.length} 件中，${high.filter(c => c.verdict === 'same').length} 件被你标为“基本一样”；50% 及以下的 ${low.length} 件中，${low.filter(c => c.verdict === 'same').length} 件被标为“基本一样”。`, `Of the ${high.length} marked 70%+, ${high.filter(c => c.verdict === 'same').length} came out roughly yes. Of the ${low.length} marked 50% or below, ${low.filter(c => c.verdict === 'same').length} did.`)}</p><p className="hint" style={{ marginTop: 12 }}>{L('这是现有记录的描述。样本数量、事件难度和自标标准都会影响结果，不能据此判断概率是否校准。', 'A description of what you have recorded. Sample size, difficulty and your own marking standard all affect it — it cannot prove your probabilities are calibrated.')}</p></Section>
      <Section title={L('过程记录', 'Process record')}><div className="stats"><div className="stat"><b>{abandoned.length}</b><span>{L('撤回', 'withdrawn')}</span></div><div className="stat"><b>{cases.filter(c => c.skippedWait).length}</b><span>{L('跳过静止', 'waits skipped')}</span></div><div className="stat"><b>{cases.filter(c => c.status === 'sealed' && reviewAvailable(c)).length}</b><span>{L('可回看未归档', 'due, unarchived')}</span></div></div>
        {abandoned.length > 0 && <p className="hint" style={{ marginTop: 16 }}>{[...new Set(abandoned.map(c => c.abandReason))].map(r => lang === 'zh'
          ? `${abandonReasonLabel(r, lang)} ${abandoned.filter(c => c.abandReason === r).length} 件`
          : `${abandonReasonLabel(r, lang)} × ${abandoned.filter(c => c.abandReason === r).length}`).join(' · ')}</p>}
      </Section>
    </section>}
    {tab === 'history' && <CaseHistory cases={cases} />}
    {tab === 'data' && <DataPanel />}
    <Foot />
  </main></Shell>;
}
