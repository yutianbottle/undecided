import type { DecisionCase } from '../state/types';
import { useLang } from '../i18n';

export function DecisionRecord({ c }: { c: DecisionCase }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  return <details className="record-details">
    <summary>{L('查看当时完整记录', 'See the full record')}</summary>
    <dl className="record-grid">
      <dt>{L('选项', 'Options')}</dt><dd>{c.options.map((o, i) => <p key={i}>{String.fromCharCode(65 + i)} · {o}{o === c.nonActionOption ? L('（非行动选项）', ' (do-nothing option)') : ''}</p>)}</dd>
      <dt>{L('事实', 'Facts')}</dt><dd>{c.facts.filter(Boolean).map((f, i) => <p key={i}>{i + 1} · {f}</p>)}</dd>
      {c.aiGap && <><dt>{L('具体处境', 'Situation')}</dt><dd>{c.aiGap}</dd></>}
      {c.falsifySignal && <><dt>{L('反证条件', 'Falsifier')}</dt><dd>{c.falsifySignal}</dd></>}
      <dt>{L('如果朋友问我', 'If a friend asked me')}</dt><dd>{c.distance || L('未填写', 'not filled')}</dd>
    </dl>
  </details>;
}
