import { useState } from 'react';
import { useStore } from '../state/store';
import { useLang } from '../i18n';
import type { DecisionCase } from '../state/types';
import { fmtDate } from '../lib/date';

export function EarlyOpen({ c }: { c: DecisionCase }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [ask, setAsk] = useState(false);
  const { openEarly } = useStore();
  return <div className="early-open">
    {ask ? <>
      <p className="hint">{L(`原计划在 ${fmtDate(c.openAt)} 回看。已有结果时可以提前回看，原计划日期与本次提前开封时间都会保留。`, `Scheduled for ${fmtDate(c.openAt)}. If the outcome is already clear you can look early; both dates are kept.`)}</p>
      <div className="inline-actions">
        <button className="btn" onClick={() => { openEarly(c.id); window.location.hash = `#/case/${c.id}/reopen`; }}>{L('确认提前开封', 'Open it early')}</button>
        <button className="btn btn--text" onClick={() => setAsk(false)}>等到期再看</button>
      </div>
    </> : <button className="btn btn--text" onClick={() => setAsk(true)}>{L('已经有结果了，提前开封', 'Already have a result — open it early')}</button>}
  </div>;
}
