import { Shell } from '../components/Shell';
import { useLang } from '../i18n';
import { DecisionRecord } from '../components/DecisionRecord';
import { EarlyOpen } from '../components/EarlyOpen';
import { useStore } from '../state/store';
import { sealDisplay } from '../lib/seal';
import { fmtDate, fmtDateTime, reviewAvailable } from '../lib/date';
import { gateName } from '../knowledge/gates';
import { exportJSON, lastExportAt, STATE_VERSION } from '../state/storage';
import { useState } from 'react';

export default function Sealed({ id }: { id: string }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { get, cases } = useStore();
  const c = get(id);
  const [exported, setExported] = useState(!!lastExportAt());
  if (!c) return <Shell><main className="wrap"><p>{L('找不到这件案卷。', 'Case not found.')}</p><a href="#/">{L('回台面', 'Back to desk')}</a></main></Shell>;
  if (c.status !== 'sealed' && c.status !== 'archived') return <Shell><main className="wrap"><p>{L('这件案卷尚未封存。', 'This case is not sealed yet.')}</p><a className="btn" href={`#/case/${id}`}>{L('返回案卷', 'Back to case')}</a></main></Shell>;
  const due = reviewAvailable(c);
  return <Shell glow={0.05}><main className="wrap sealed-wrap">
    <p className="eyebrow">{L('第 6 步 / 共 7 步 · 封存', 'Step 6 of 7 · Seal')}</p>
    <h1 className="h1">{L('已封存', 'Sealed')}</h1><p className="hint">{L('这张纸现在只读了。', 'This page is read-only now.')}</p>
    <div style={{ marginTop: 32 }}><div className="sealbox">{sealDisplay(c.sealHash)}</div>
      <p className="hint" style={{ marginTop: 16 }}>{L('封存于 ', 'Sealed ')}{fmtDateTime(c.sealedAt)}</p><p className="hint">{L('原计划回看：', 'Scheduled: ')}{fmtDate(c.openAt)}</p>
      {c.openedEarlyAt && <p className="hint">{L('提前开封：', 'Opened early: ')}{fmtDateTime(c.openedEarlyAt)}</p>}
    </div>
    <div className="card" style={{ marginTop: 32 }}><div className="card-kicker">{L('你当时写的', 'What you wrote')} · {gateName(c.gate, lang)}</div>
      <h2 className="card-t">{c.question}</h2><p className="card-d">{L('选了：', 'Chose: ')}{c.chosen}<br />{L('预测：', 'Predicted: ')}{c.prediction}（{c.predictedP}%）</p>
      <DecisionRecord c={c} />
    </div>
    {due || c.status === 'archived' ? <div className="inline-actions"><a className="btn btn--rule" href={`#/case/${id}/reopen`}>{c.status === 'archived' ? L('查看归档结果', 'View archived result') : L('现在就能回看', 'Review it now')}</a></div>
      : <><p className="hint" style={{ marginTop: 24 }}>{L('到期后再次打开网站，台面会显示回看入口。', 'When it is due, reopen the site — the desk will show the review entry.')}</p><EarlyOpen c={c} /></>}
    {!exported && <aside className="backup-note"><p className="hint">{L('第一份封存记录已经留下。建议现在下载一份备份，浏览器清理后无法从服务器找回。', 'Your first sealed record is saved. Download a backup now — if the browser clears it, there is no server to recover from.')}</p><button className="btn" onClick={() => { exportJSON({ cases, version: STATE_VERSION }); setExported(true); }}>{L('下载 JSON 备份', 'Download JSON backup')}</button></aside>}
    <a className="btn btn--text back-link" style={{ marginTop: 32 }} href="#/">{L('← 回台面', '← Desk')}</a>
  </main></Shell>;
}
