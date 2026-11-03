import type { JSX } from 'react';
import { Shell, Foot } from '../components/Shell';
import { useLang } from '../i18n';
import { Terrain } from '../components/Terrain';
import { GATES, gateName } from '../knowledge/gates';
import { terrainPoint } from '../knowledge/engine';
import { useStore } from '../state/store';
import { href, go } from '../router';
import { fmtDate } from '../lib/date';
import type { DecisionCase, GateId } from '../state/types';

export default function Ledger(): JSX.Element {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { cases } = useStore();

  const live = cases.filter((c) => c.status === 'sealed' || c.status === 'archived');
  const byGate = (id: GateId) => live.filter((c) => c.gate === id);
  const lastOf = (id: GateId): DecisionCase | undefined =>
    byGate(id)
      .filter((c) => c.status === 'archived' || c.status === 'sealed')
      .sort((a, b) => new Date(b.sealedAt ?? 0).getTime() - new Date(a.sealedAt ?? 0).getTime())[0];

  // 每个有历史记录的关口只绘制一个环，避免同一关口重复叠加。
  const userPoints = GATES
    .filter((g) => byGate(g.id).length > 0)
    .map((g) => ({ ...terrainPoint(g.reversibility, g.feedbackDays), gate: g.id }));

  const touched = GATES.filter((g) => byGate(g.id).length > 0).length;

  return (
    <Shell>
      <div className="wrap ledger-wrap">
        <h1 className="h1">{L('账本', 'Ledger')}</h1>
        <p className="hint" style={{ marginTop: 'var(--sp1)' }}>
          {L('这里记着你做过的决定，和尚未落槌的那几类。', 'Every decision you have made, and the kinds you have not touched.')}
        </p>

        <div className="terrain-region">
          <p className="terrain-summary">{L('关口地形图 · 辅助理解决定的可逆性和反馈周期', 'Gate map · reversibility against feedback time')}</p>
          <Terrain userPoints={userPoints} onPick={(g) => go({ name: 'gate', gate: g })} />
          <div style={{ marginTop: 10 }}>
            <p className="hint">
              {L('图上的位置是类别参考，不是对你这一次决定的测量。具体情境可能不同。', 'Positions describe the category, not your specific decision. Context can differ.')}
            </p>
            <p className="hint" style={{ marginTop: 6 }}>
              <b style={{ fontWeight: 400, color: 'var(--paper-78)' }}>{L('横轴', 'Horizontal')}</b>：{L('这件事做错了，还能不能改回来', 'if this goes wrong, can you undo it')}
              <span style={{ color: 'var(--line)' }}> ｜ </span>
              <b style={{ fontWeight: 400, color: 'var(--paper-78)' }}>{L('纵轴', 'Vertical')}</b>：{L('做决定之后，多久能知道结果', 'how long until you know')}
            </p>
            <p className="hint" style={{ marginTop: 6 }}>
              {L('越靠右上（改不回来、结果来得慢），越值得花十分钟走完一遍再拍。', 'Top right (hard to undo, slow feedback) deserves ten minutes.')}<br />
              {L('越靠左下（能改、几天就知道），越该现在就做，别想太久。', 'Bottom left (reversible, days to know) should be done now, not deliberated.')}
            </p>
            <p className="hint" style={{ marginTop: 6, color: 'var(--fog)' }}>
              {L('外面套着金环的，是你已在那个关口完成落槌。', 'A gold ring means you have sealed a decision in that gate.')}
            </p>
          </div>
        </div>

        <div className="group-title ledger-title" style={{ marginTop: 'var(--sp4)' }}>
          {L('八个关口 · 已落槌 ', 'Eight gates · sealed in ')}{touched}{L(' 类', '')}
        </div>

        <div className="caselist gate-list" style={{ marginTop: 'var(--sp1)' }}>
          {GATES.map((g) => {
            const n = byGate(g.id).length;
            const last = lastOf(g.id);
            const empty = n === 0;
            return (
              <a key={g.id} className="caserow" href={href({ name: 'gate', gate: g.id })}
                >
                <div style={{ minWidth: 0 }}>
                  <div className="caselow-q" style={empty ? { color: 'var(--paper-56)' } : undefined}>
                    {gateName(g.id, lang)}
                  </div>
                  <div className="caselow-meta">
                    {empty ? (
                      <span className="gate-tag">{L('尚未落槌', 'not yet')}</span>
                    ) : (
                      <>
                        <span className="gate-tag">{L(`${n} 次`, `${n}×`)}</span>
                        <span className="gate-tag">{last ? L(`最近 ${fmtDate(last.sealedAt)}`, `last ${fmtDate(last.sealedAt)}`) : ''}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="days">{empty ? '—' : `${n}`}</div>
              </a>
            );
          })}
        </div>

        <p className="hint ledger-note" style={{ marginTop: 'var(--sp3)' }}>
          {L('未落槌的关口先给一条提醒。随着完成落槌，逐步展开更多方法；草稿不计入展开次数。', 'Untouched gates show one line. Each sealed decision unfolds more; drafts do not count.')}
        </p>

        <Foot />
      </div>
    </Shell>
  );
}
