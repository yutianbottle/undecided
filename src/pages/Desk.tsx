import { Shell, Foot } from '../components/Shell';
import { useStore } from '../state/store';
import { daysSince, fmtDate, reviewAvailable, daysUntil } from '../lib/date';
import { gateName } from '../knowledge/gates';
import { useT, useLang } from '../i18n';
import type { DecisionCase, GateId } from '../state/types';

function start(gate: GateId, question: string) {
  try { sessionStorage.setItem('weijue.prefill', JSON.stringify({ gate, question })); } catch { /* 仍可手动新建 */ }
  window.location.hash = '#/new';
}

export default function Desk() {
  const { cases } = useStore();
  const t = useT();
  const { lang } = useLang();

  const live = cases.filter((c) => c.status === 'draft' || c.status === 'framed');
  const sealed = cases.filter((c) => c.status === 'sealed');
  const dueBack = sealed.filter((c) => reviewAvailable(c));
  const waiting = sealed.filter((c) => !reviewAvailable(c));

  const dated = live
    .filter((c) => c.deadlineAt)
    .sort((a, b) => new Date(a.deadlineAt!).getTime() - new Date(b.deadlineAt!).getTime());
  const undated = live
    .filter((c) => !c.deadlineAt)
    .sort((a, b) => daysSince(b.createdAt) - daysSince(a.createdAt));

  const empty = live.length === 0 && sealed.length === 0;

  function right(c: DecisionCase): string {
    const d = daysUntil(c.deadlineAt);
    if (d !== null && d <= 7) return d < 0 ? t.desk.overdue(-d) : d === 0 ? t.desk.dueToday : t.desk.dueIn(d);
    return t.desk.dayN(daysSince(c.createdAt));
  }

  function Row({ c, rightText, url }: { c: DecisionCase; rightText: string; url: string }) {
    return (
      <a className="caserow" href={url}>
        <div style={{ minWidth: 0 }}>
          <div className="caselow-q">{c.question || t.desk.untitled}</div>
          <div className="caselow-meta">
            <span className="gate-tag">{gateName(c.gate, lang)}</span>
            {c.status === 'draft' && c.step < 7 && (
              <span className="gate-tag" style={{ color: 'var(--fog)' }}>{t.desk.stepN(c.step - 1)}</span>
            )}
          </div>
        </div>
        <div className="days">{rightText}</div>
      </a>
    );
  }

  return (
    <Shell glow={0.14}>
      <div className="wrap">
        <div className="page-heading">
          <div>
            <h1 className="h1">{t.nav.brand}</h1>
            <div className="hint" style={{ marginTop: 6 }}>{t.desk.tagline}</div>
          </div>
          <a className="btn" href="#/new">{t.desk.newCase}</a>
        </div>

        {!empty && <p className="hint desk-count">{t.desk.count(live.length, sealed.length)}</p>}
        {empty ? (
          <div style={{ paddingTop: 'var(--sp5)' }}>
            <p className="hint" style={{ marginBottom: 18 }}>{t.desk.startersIntro}</p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {t.desk.starters.map((x) => (
                <button key={x.label} className="starter"
                  onClick={() => start((['quoting', 'product', 'hiring', 'priceup', 'accept'] as GateId[])[t.desk.starters.indexOf(x)], x.q)}>
                  <span>{x.q}</span>
                  <span className="starter-gate">{x.label}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 26 }}>
              <p className="hint">{t.desk.startHint}</p>
              <p className="hint" style={{ marginTop: 6 }}>{t.desk.startHint2}</p>
            </div>

            <div style={{ marginTop: 'var(--sp4)' }}>
              <a className="btn" href="#/new">{t.desk.writeOwn}</a>
            </div>
          </div>
        ) : (
          <>
            {dueBack.length > 0 && (
              <>
                <div className="group-title">{t.desk.groupDue}</div>
                <div className="caselist" style={{ marginTop: 0 }}>
                  {dueBack.map((c) => (
                    <Row key={c.id} c={c} rightText={t.desk.canReview} url={`#/case/${c.id}/reopen`} />
                  ))}
                </div>
              </>
            )}

            {dated.length > 0 && (
              <section><h2 className="group-title">{t.desk.groupDated}</h2>
                <div className="caselist" style={{ marginTop: 0 }}>
                  {dated.map((c) => <Row key={c.id} c={c} rightText={right(c)} url={`#/case/${c.id}`} />)}
                </div></section>
            )}

            {undated.length > 0 && (
              <>
                <div className="group-title">{t.desk.groupUndated}</div>
                <div className="caselist" style={{ marginTop: 0 }}>
                  {undated.map((c) => <Row key={c.id} c={c} rightText={t.desk.dayN(daysSince(c.createdAt))} url={`#/case/${c.id}`} />)}
                </div>
              </>
            )}

            {waiting.length > 0 && (
              <>
                <div className="group-title">{t.desk.groupWaiting}</div>
                <div className="caselist" style={{ marginTop: 0 }}>
                  {waiting.map((c) => <Row key={c.id} c={c} rightText={fmtDate(c.openAt)} url={`#/case/${c.id}/sealed`} />)}
                </div>
              </>
            )}

            <a className="newrow" href="#/new">{t.desk.newRow}</a>
          </>
        )}

        <Foot />
      </div>
    </Shell>
  );
}
