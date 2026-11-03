import { useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { Shell, Foot } from '../components/Shell';
import { useLang } from '../i18n';
import { gateLedger, calibration } from '../knowledge/engine';
import { gateName, gateBaseRate, layerName } from '../knowledge/gates';
import { floorResult, parseAmount } from '../knowledge/calc';
import { href } from '../router';
import { useStore } from '../state/store';
import { Evidence } from '../components/ui';
import { archivedTime } from '../components/CaseHistory';
import { fmtDate } from '../lib/date';
import type { GateId } from '../state/types';

const SECTION_TITLE = {
  margin: 0,
  fontSize: 12,
  letterSpacing: '.08em',
  color: 'var(--paper-56)',
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 'var(--sp5)' }}>
      <h2 className="group-title" style={SECTION_TITLE}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 折叠的步骤：自己画 +/−，避免依赖全局 CSS 改 summary 的默认三角 */
/** 成本底价算格：默认收起；只给数，不给建议；始终并列一个边界值。 */
function CostFloorCalc() {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [open, setOpen] = useState(false);
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState('40');

  const r = floorResult(parseAmount(cost), Number(margin));
  const fmt = (n: number) => n.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US');

  return (
    <details style={{ marginTop: 6 }} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary
        style={{
          cursor: 'pointer',
          fontSize: 12,
          letterSpacing: '.04em',
          color: open ? 'var(--paper-78)' : 'var(--paper-56)',
          listStyle: 'none',
        }}
      >
        <span style={{ display: 'inline-block', width: 14, color: 'var(--fog)' }}>{open ? '−' : '+'}</span>
        {L('算一下（2 个输入）', 'Work it out (2 inputs)')}
      </summary>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--paper-66)' }}>
          {L('这单的直接成本', 'Direct cost of this job')}
          <input
            className="field"
            inputMode="numeric"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder={L('例：8000', 'e.g. 8000')}
            style={{ width: 140, fontSize: 13 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--paper-66)' }}>
          {L('想赚多少毛利', 'Margin you want')}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              className="field"
              inputMode="numeric"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              style={{ width: 72, fontSize: 13 }}
            />
            <span style={{ fontSize: 13 }}>%</span>
          </span>
        </label>
      </div>

      {r ? (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--line-2)', paddingTop: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--paper-78)' }}>
            {L('保本价', 'Floor price')}
            <b style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 400, color: 'var(--lamp)', marginLeft: 10 }}>
              {fmt(r.floor)}
            </b>
          </p>
          <p style={{ marginTop: 6, fontSize: 12, color: 'var(--paper-56)' }}>
            {L(
              `毛利若降到 ${r.lowerMargin}% → ${fmt(r.lower)}（差 ${fmt(r.floor - r.lower)}）`,
              `If margin drops to ${r.lowerMargin}% → ${fmt(r.lower)} (${fmt(r.floor - r.lower)} lower)`,
            )}
          </p>
          <p style={{ marginTop: 8, fontSize: 12, lineHeight: 1.8, color: 'var(--paper-56)' }}>
            {L(
              '这单低于这个价，达不到你要的毛利。报多少由你定。',
              'Below this the job does not reach the margin you set. What to quote is yours to decide.',
            )}
          </p>
        </div>
      ) : (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--paper-56)' }}>
          {L('填两个数，这里出保本价。', 'Fill in both numbers and the floor price appears here.')}
        </p>
      )}
    </details>
  );
}

function HowTo({ steps }: { steps: string[] }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [open, setOpen] = useState(false);
  return (
    <details style={{ marginTop: 10 }} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary
        style={{
          cursor: 'pointer',
          fontSize: 12,
          letterSpacing: '.04em',
          color: open ? 'var(--paper-78)' : 'var(--paper-56)',
          listStyle: 'none',
        }}
      >
        <span style={{ display: 'inline-block', width: 14, color: 'var(--fog)' }}>{open ? '−' : '+'}</span>
        {L(`怎么做（${steps.length} 步）`, `How (${steps.length} steps)`)}
      </summary>
      <ol style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, fontSize: 12, lineHeight: 1.8, color: 'var(--paper-78)' }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--paper-56)', paddingTop: 3 }}>
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export default function GateLedger({ gate }: { gate: GateId }): JSX.Element {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { gate: g, biases, methods, evidences } = gateLedger(gate, lang);
  const { cases } = useStore();
  const cal = calibration(cases, gate);

  const mine = cases.filter((c) => c.gate === gate && c.status !== 'abandoned');
  const archived = mine
    .filter((c) => c.status === 'archived')
    .sort((a, b) => Date.parse(archivedTime(b)) - Date.parse(archivedTime(a)));
  const last = archived[0];
  const completed = mine.filter(c => c.status === 'sealed' || c.status === 'archived');
  const unlocked = completed.length > 0;
  const begin = () => {
    try { sessionStorage.setItem('weijue.prefill', JSON.stringify({ gate })); } catch { /* 手动选择仍可继续 */ }
    window.location.hash = '#/check';
  };

  // 按你在这个场景做过几次，逐步展开。不是加密，是"没做过看了也记不住"
  const n = completed.length;
  const capB = n >= 5 ? 99 : n >= 3 ? 6 : 3;
  const capM = n >= 5 ? 99 : n >= 3 ? 5 : 2;
  const shownB = biases.slice(0, capB);
  const shownM = methods.slice(0, capM);
  const hiddenB = Math.max(0, biases.length - shownB.length);
  const hiddenM = Math.max(0, methods.length - shownM.length);
  const hidden = hiddenB + hiddenM;
  const nextAt = n >= 5 ? null : n >= 3 ? 5 : 3;

  // 没碰过这个关口：只给一句话 + 一条最关键的失效，其余留白
  if (!unlocked) {
    const top = biases[0];
    return (
      <Shell>
        <div className="wrap">
          <a className="btn btn--text" href={href({ name: 'ledger' })} style={{ marginBottom: 'var(--sp3)', paddingLeft: 0 }}>
            {L('← 账本', '← Ledger')}
          </a>
          <h1 className="h1">{gateName(g.id, lang)}</h1>
          <p className="hint" style={{ marginTop: 'var(--sp1)' }}>
            {L(g.reversibility <= 2 ? '做错了能改回来' : g.reversibility === 3 ? '改起来有代价' : '基本改不回来', g.reversibility <= 2 ? 'reversible' : g.reversibility === 3 ? 'costly to undo' : 'hard to undo')}
            <span style={{ color: 'var(--line)' }}> ｜ </span>
            {L(`约 ${g.feedbackDays} 天知道结果`, `~${g.feedbackDays} days to know`)}
            <span style={{ color: 'var(--line)' }}> ｜ </span>
            {layerName(g.layer, lang)}
          </p>

          <p className="h2" style={{ marginTop: 'var(--sp5)', fontSize: 20, color: 'var(--paper-78)' }}>
            {L('你还没在这个关口完成过落槌。', 'You have not sealed a decision in this gate yet.')}
          </p>
          <p className="hint" style={{ marginTop: 'var(--sp2)' }}>
            {L('先给你一条提醒。完成第一份封存记录后，这里会展开更多内容；草稿不计入次数。', 'One line for now. After your first sealed record this page unfolds; drafts do not count.')}
          </p>

          {top && (
            <div className="card" style={{ marginTop: 'var(--sp5)' }}>
              <div className="card-kicker">{L('先给你一条', 'One thing for now')}</div>
              <div className="card-t">{top.concept.name}</div>
              <div className="card-d">{top.concept.oneLine}</div>
            </div>
          )}

          <p className="hint" style={{ marginTop: 'var(--sp4)' }}>
            {L('完成一次落槌后，这一页会有：这类决定最常见的三个错、能用的动作、有没有数，以及你上一次的结果。', 'After one sealed decision this page will hold: the three most common errors, the moves that work, whether there is data, and how your last one turned out.')}
          </p>

          <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn--rule" onClick={begin}>{L(`在「${gateName(g.id, lang)}」做一个决定`, `Make a decision in ${gateName(g.id, lang)}`)}</button>
          </div>

          <Foot />
        </div>
      </Shell>
    );
  }
  // 有些 note 本身以「暂无基准。」开头，上面已经写了结论，这里去掉重复的那半句
  const noBaseNote = gateBaseRate(gate, lang).note.replace(/^暂无基准。\s*|^No base rate\.\s*/, '');

  return (
    <Shell>
      <div className="wrap">
        <a
          className="btn btn--text"
          href={href({ name: 'ledger' })}
          style={{ marginBottom: 'var(--sp3)', paddingLeft: 0 }}
        >
          {L('← 账本', '← Ledger')}
        </a>

        <h1 className="h1">{gateName(g.id, lang)}</h1>
        <p className="hint" style={{ marginTop: 'var(--sp1)' }}>
          {L(g.reversibility <= 2 ? '做错了能改回来' : g.reversibility === 3 ? '改起来有代价' : '基本改不回来', g.reversibility <= 2 ? 'reversible' : g.reversibility === 3 ? 'costly to undo' : 'hard to undo')}
          <span style={{ color: 'var(--line)' }}> ｜ </span>
          {L(`约 ${g.feedbackDays} 天知道结果`, `~${g.feedbackDays} days to know`)}
          <span style={{ color: 'var(--line)' }}> ｜ </span>
          {layerName(g.layer, lang)}
        </p>

        <Section title={L('你自己的记录', 'Your record')}>
          <div className="stats" style={{ marginTop: 'var(--sp2)' }}>
            <div className="stat"><b>{completed.length}</b><span>{L('已落槌', 'sealed')}</span></div>
            <div className="stat"><b>{mine.length - completed.length}</b><span>{L('草稿', 'drafts')}</span></div>
            <div className="stat"><b>{archived.length}</b><span>{L('已回看', 'reviewed')}</span></div>
          </div>
          {cal && (
            <div
              style={{
                marginTop: 'var(--sp3)',
                padding: '12px 14px',
                border: '1px solid var(--line-2)',
                borderRadius: 'var(--radius)',
              }}
            >
              <div className="card-kicker" style={{ marginBottom: 6 }}>
                {L('你自己的预估偏差', 'Your own estimate bias')}
              </div>
              <p className="card-d" style={{ margin: 0 }}>
                {L(
                  `${cal.n} 次有记录的判断：你估平均 ${cal.avgExpected} 天，实际平均 ${cal.avgActual} 天。`,
                  `${cal.n} logged calls: you expected ${cal.avgExpected} days on average, it took ${cal.avgActual}.`,
                )}
              </p>
              <p className="card-more" style={{ marginTop: 6 }}>
                {cal.ratio >= 0.9 && cal.ratio <= 1.1
                  ? L('你的预估和实际基本吻合。', 'Your estimates land close to reality.')
                  : cal.ratio > 1.1
                    ? L(
                        `你的预估一贯偏快——实际比你估的多 ${Math.round((cal.ratio - 1) * 100)}%。下次给天数，乘 ${cal.ratio}。`,
                        `Your estimates run fast — things take ${Math.round((cal.ratio - 1) * 100)}% longer than you say. Next time, multiply by ${cal.ratio}.`,
                      )
                    : L(
                        `你的预估偏慢——实际比你估的少 ${Math.round((1 - cal.ratio) * 100)}%。`,
                        `Your estimates run slow — things take ${Math.round((1 - cal.ratio) * 100)}% less than you say.`,
                      )}
              </p>
            </div>
          )}
          {last ? (
            <div className="card" style={{ marginTop: 'var(--sp3)' }}>
              <div className="card-kicker">{L('最近回看', 'Last reviewed')} · {fmtDate(archivedTime(last))}</div>
              <div className="card-d">
                {L('你选了「', 'You chose "')}{last.chosen}{L('」，预测 ', '", predicted ')}{last.prediction}（{last.predictedP}%）。
              </div>
              {last.result && (
                <div className="card-d" style={{ marginTop: 8 }}>{L('结果：', 'Result: ')}{last.result}</div>
              )}
              {last.wrongJudgment && (
                <div className="card-more">{L('你回看时写的判断：', 'What you wrote on review: ')}{last.wrongJudgment}</div>
              )}
              <a className="record-link" href={`#/case/${last.id}/reopen`}>{L('查看完整案卷 →', 'Open the full case →')}</a>
              {last.nextChange && (
                <div className="card-more">{L('下次要改：', 'Next time: ')}{last.nextChange}</div>
              )}
            </div>
          ) : (
            <p className="hint" style={{ marginTop: 'var(--sp3)' }}>
              {L(`还有 ${completed.length - archived.length} 件已封存、尚未归档。到期回看后，结果会补到这里。`, `${completed.length - archived.length} sealed but not yet reviewed. Results will be added here when due.`)}
            </p>
          )}
        </Section>

        <Section title={L('这类决定最容易错在', 'Where this kind usually goes wrong')}>
          {biases.length === 0 ? (
            <p className="hint" style={{ marginTop: 'var(--sp2)' }}>
              {L('这个关口还没有整理出常见错误。', 'No common errors written for this gate yet.')}
            </p>
          ) : (
            <div className="cards">
              {shownB.map(({ concept }) => (
                <article key={concept.id} className="card">
                  <div className="card-kicker">{L('偏差', 'Bias')}</div>
                  <h3 className="card-t">{concept.name}</h3>
                  <p className="card-d">{concept.oneLine}</p>
                  <div className="card-more">{L('不适用：', 'Does not apply: ')}{concept.whenNot}</div><Evidence grade={concept.evidence} />
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title={L('现在能用的动作', 'Moves you can use now')}>
          {methods.length === 0 ? (
            <p className="hint" style={{ marginTop: 'var(--sp2)' }}>
              {L('这个关口还没有整理出可执行的动作。', 'No concrete moves written for this gate yet.')}
            </p>
          ) : (
            <ul style={{ marginTop: 'var(--sp2)', borderTop: '1px solid var(--line)' }}>
              {shownM.map((c) => (
                <li key={c.id} style={{ padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 15, color: 'var(--paper)' }}>{c.name}</span>
                    {typeof c.minutes === 'number' && <span className="days">{L(`约 ${c.minutes} 分钟`, `~${c.minutes} min`)}</span>}
                  </div>
                  <p className="card-d" style={{ marginTop: 4 }}>{c.oneLine}</p><Evidence grade={c.evidence} />
                  {c.howTo && c.howTo.length > 0 && <HowTo steps={c.howTo} />}
                  {c.calcId === 'cost-floor' && <CostFloorCalc />}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {hidden > 0 && (
          <p className="hint" style={{ marginTop: 'var(--sp3)' }}>
            {L('还有 ', '')}<b style={{ fontWeight: 400, color: 'var(--paper-78)' }}>{hidden}</b> {L(' 张卡没展开。在这个关口再完成 ', ' more cards are folded. Seal ')}{nextAt! - n}{L(' 次落槌，便会展开。先结合当前记录使用已经展示的方法。', ' more decisions here and they unfold. Work with what is shown for now.')}
          </p>
        )}

        <Section title={L('有没有数', 'Any numbers')}>
          {g.baseRate ? (
            <>
              <p className="card-d" style={{ marginTop: 'var(--sp2)' }}>
                {g.baseRate}
              </p>
              <p className="warn" style={{ marginTop: 'var(--sp1)' }}>
                {g.baseRateNote}
              </p>
            </>
          ) : (
            <>
              <p className="card-d" style={{ marginTop: 'var(--sp2)' }}>
                {L('暂无基准', 'No base rate')}
              </p>
              <p className="hint" style={{ marginTop: 'var(--sp1)' }}>
                {noBaseNote}
              </p>
            </>
          )}
        </Section>

        {evidences.length > 0 && (
          <Section title={L('依据', 'Evidence')}>
            <div style={{ marginTop: 'var(--sp2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {evidences.map((c) => (
                <article key={c.id} className="card">
                  <div className="card-kicker">{L('证据', 'Evidence')} · {c.evidence}</div>
                  <h3 className="card-t">{c.name}</h3>
                  <p className="card-d">{c.oneLine}</p>
                  <div className="card-more">{L('来源：', 'Source: ')}{c.source}</div>
                </article>
              ))}
            </div>
          </Section>
        )}

        <div className="inline-actions"><button className="btn" onClick={begin}>{L(`在「${gateName(g.id, lang)}」做一个决定`, `Make a decision in ${gateName(g.id, lang)}`)}</button></div>
        <Foot />
      </div>
    </Shell>
  );
}
