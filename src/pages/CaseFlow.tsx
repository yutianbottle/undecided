import { useCallback, useEffect, useRef, useState } from 'react';
import { Shell } from '../components/Shell';
import { Field, StepBar, Miss, Evidence } from '../components/ui';
import { useStore } from '../state/store';
import { lightUp } from '../knowledge/engine';
import { useLang } from '../i18n';
import { getGate, gateName } from '../knowledge/gates';
import { LIMITS, canRule, needsFalsify, claimsSpecial, vagueHits, ABAND_REASONS, stepIssues, completeIssues } from '../lib/validate';
import { daysSince, fmtDate, futureInput, dateInputISO, todayInput } from '../lib/date';
import { DecisionRecord } from '../components/DecisionRecord';
import type { DecisionCase, LightCard, AbandReason } from '../state/types';

/** 这几类决定里，"人情"往往是真变量，值得给一句提示 */
const RELATIONAL_GATES: string[] = ['accept', 'quoting', 'partner'];

export default function CaseFlow({ id }: { id: string }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { get, patch, abandon, seal, cases } = useStore();
  const c = get(id);

  useEffect(() => {
    if (!c) return;
    if (c.status === 'sealed') window.location.hash = `#/case/${id}/sealed`;
    if (c.status === 'archived') window.location.hash = `#/case/${id}/reopen`;

  }, [c, id]);

  if (!c) {
    return (
      <Shell>
        <div className="wrap">
          <p className="hint">{L('找不到这件案卷。', 'Case not found.')}</p>
          <a className="btn" href="#/" style={{ marginTop: 24, display: 'inline-block' }}>{L('回台面', 'Back to desk')}</a>
        </div>
      </Shell>
    );
  }

  if (c.status === 'abandoned') return <Shell><main className="wrap">
    <a className="btn btn--text back-link" href="#/me/history">{L('← 全部案卷', '← All cases')}</a>
    <h1 className="h2">{c.question}</h1><p className="hint">{L('已撤回', 'Withdrawn')} · {c.abandReason}</p>
    <DecisionRecord c={c} />
  </main></Shell>;

  // 同一个关口的上一份案卷：优先已归档（有结果），其次已封存
  const past = cases
    .filter((x) => x.id !== c.id && x.gate === c.gate && (x.status === 'archived' || x.status === 'sealed'))
    .sort((a, b) => {
      const rank = (x: DecisionCase) => (x.status === 'archived' ? 1 : 0);
      const d = rank(b) - rank(a);
      return d !== 0 ? d : new Date(b.sealedAt ?? 0).getTime() - new Date(a.sealedAt ?? 0).getTime();
    });

  return (
    <Body
      key={c.id}
      c={c}
      patch={patch}
      abandon={abandon}
      seal={seal}
      echo={past[0]}
      round={cases.filter((x) => x.gate === c.gate && (x.status === 'sealed' || x.status === 'archived')).length}
    />
  );
}

function Body({
  c, patch, abandon, seal, echo, round,
}: {
  c: DecisionCase;
  patch: (id: string, p: Partial<DecisionCase>) => void;
  abandon: (id: string, r: AbandReason) => void;
  seal: (id: string, choice: string, prediction: string, p: number, openAt: string, skipped: boolean) => void;
  echo?: DecisionCase;
  round: number;
}) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const step = Math.max(2, Math.min(6, c.step));
  const [locked, setLocked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const names = L('摆选项,写事实,换位自问,看照明,落槌', 'Options,Facts,Friend,Light,Call').split(',');
  const set = useCallback((p: Partial<DecisionCase>) => patch(c.id, p), [c.id, patch]);
  const next = () => set({ step: Math.min(6, step + 1) });
  const back = () => set({ step: Math.max(2, step - 1) });

  const glow = [0, 0, 0.20, 0.28, 0.22, 0.40, 0.06][step] ?? 0.14;

  return (
    <Shell glow={glow}>
      <div className="wrap">
        <a className="btn btn--text" href="#/" style={{ paddingLeft: 0 }}>{L('← 台面', '← Desk')}</a>

        {!locked && <div className="step-header">
          <p className="eyebrow">{L(`第 ${step - 1} 步 / 共 7 步 · ${names[step - 2]}`, `Step ${step - 1} of 7 · ${names[step - 2]}`)}</p>
          <StepBar step={step - 1} total={7} />
          <nav className="step-nav" aria-label={L('案卷步骤', 'Case steps')}>
            {names.map((name, i) => <button key={name} aria-label={L(`第 ${i + 1} 步：${name}`, `Step ${i + 1}: ${name}`)} aria-current={step === i + 2 ? 'step' : undefined}
              disabled={i + 2 > (c.furthestStep ?? c.step) || !!stepIssues(c, i + 2, lang).length}
              onClick={() => set({ step: i + 2 })}>{name}</button>)}
            <span>{L('封存', 'Seal')}</span><span>{L('回看', 'Review')}</span>
          </nav>
        </div>}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginTop: 'var(--sp3)' }}>
          <h1 className="h2" tabIndex={-1} ref={heading}>{c.question || L('（还没写）', '(untitled)')}</h1>
          <div className="days">{daysSince(c.createdAt) === 0 ? L('今天开的', 'opened today') : L(`已 ${daysSince(c.createdAt)} 天`, `${daysSince(c.createdAt)}d open`)}</div>
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          {gateName(c.gate, lang)}
          {c.deadlineAt ? L(` · 必须在 ${fmtDate(c.deadlineAt)} 前定`, ` · due ${fmtDate(c.deadlineAt)}`) : L(' · 没有设期限', ' · no deadline')}
        </div>

        <div style={{ marginTop: 'var(--sp4)' }}>
          {step === 2 && <StepOptions c={c} set={set} next={next} />}
          {step === 3 && <StepFacts c={c} set={set} next={next} back={back} />}
          {step === 4 && <StepDistance c={c} set={set} next={next} back={back} />}
          {step === 5 && (
            <StepLight
              c={c}
              next={next}
              back={back}
              round={round}
            />
          )}
          {step === 6 && <StepRule c={c} set={set} seal={seal} back={back} onAbandon={abandon} echo={echo} onPhaseChange={setLocked} />}
        </div>

        {step !== 6 && (
          <div style={{ marginTop: 'var(--sp4)' }}>
            <Abandon id={c.id} onAbandon={abandon} />
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ───────── 第 2 步：摆牌 ───────── */
function StepOptions({ c, set, next }: { c: DecisionCase; set: (p: Partial<DecisionCase>) => void; next: () => void }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [draft, setDraft] = useState('');
  const [lengthErr, setLengthErr] = useState('');
  const gateDef = getGate(c.gate);
  const hintPool = lang === 'zh' ? gateDef.optionHints : (gateDef.optionHintsEn ?? gateDef.optionHints);
  const hints = hintPool.filter((h) => !c.options.includes(h));
  const issues = stepIssues(c, 3, lang);
  const valid = issues.length === 0;

  function add(text: string) {
    const t = text.trim();
    if (!t || c.options.length >= 4 || c.options.includes(t)) return;
    // 存储层硬校验 20 字符；超长会被静默丢弃，所以这里先拦住并说明
    if (t.length > LIMITS.option) {
      setLengthErr(L(`选项最多 ${LIMITS.option} 个字（这句 ${t.length} 个）。`, `Options are limited to ${LIMITS.option} characters (this one is ${t.length}).`));
      return;
    }
    setLengthErr('');
    set({ options: [...c.options, t] });
    setDraft('');
  }

  return (
    <div>
      <p className="hint" style={{ marginBottom: 6 }}>{L(
            '摆上你的选项。其中一项必须是「不做」——不接这单、不上这个产品、维持现状。由你自己标出来：因为「不做」常常写得很像「做」（比如“先观望”），系统不去猜。',
            'Lay out your options. One of them must be the do-nothing option — decline the job, do not ship it, keep things as they are. You mark it yourself, because "do nothing" often reads like "do something" (e.g. "wait and see"). The system will not guess.',
          )}</p>

      <div className="opts">
        {c.options.map((o, i) => (
          <div className="opt" key={i}>
            <span className="opt-idx">{String.fromCharCode(65 + i)}</span>
            <span className="opt-txt">{o}</span>
            <button className="opt-mark" aria-pressed={c.nonActionOption === o}
              aria-label={L(`将「${o}」标记为非行动选项`, `Mark "${o}" as the do-nothing option`)} onClick={() => set({ nonActionOption: o })}>
              {c.nonActionOption === o ? L('已标记：不做', 'Marked: do nothing') : L('标为「不做」', 'Mark as do nothing')}</button>
            <button className="opt-lock" aria-label={L(`移除「${o}」`, `Remove "${o}"`)} onClick={() => set({ options: c.options.filter((_, j) => j !== i) })}>{L('移除', 'Remove')}</button>
          </div>
        ))}
        {c.options.length < 4 && (
          <div>
            <Field label={L('添加选项', 'Add an option')} value={draft} onChange={setDraft} max={LIMITS.option} placeholder={L('加一个选项，20 字以内', 'Add an option, under 20 characters')} />
            <button className="opt-add" onClick={() => add(draft)} disabled={!draft.trim()}>{L('＋ 放上去', '+ Put it down')}</button>
          </div>
        )}
      </div>

      {hints.length > 0 && c.options.length < 4 && (
        <div style={{ marginTop: 'var(--sp2)' }}>
          <span className="hint">{L('参考：', 'Suggestions: ')}</span>
          {lengthErr && <p className="warn" style={{ marginTop: 8 }}>{lengthErr}</p>}
          {hints.map((h) => (
            <button key={h} className="btn" style={{ fontSize: 12, padding: '7px 12px', marginRight: 8, marginTop: 8 }} onClick={() => add(h)}>{h}</button>
          ))}
        </div>
      )}

      
      <Miss items={issues} />

      <div className="row-actions">
        <button className="btn" disabled={!valid} onClick={next}>{L('下一步 →', 'Next →')}</button>
      </div>
    </div>
  );
}

/* ───────── 第 3 步：照面 ───────── */
function StepFacts({ c, set, next, back }: { c: DecisionCase; set: (p: Partial<DecisionCase>) => void; next: () => void; back: () => void }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const gateDef = getGate(c.gate);
  const aiTakes = lang === 'zh' ? gateDef.aiTakes : (gateDef.aiTakesEn ?? gateDef.aiTakes);
  const picked = c.aiPick;
  const rejected = picked >= 0 && picked < aiTakes.length;
  const allApply = picked === 99;

  const facts = [0, 1, 2].map((i) => c.facts[i] ?? '');
  const [showCounter, setShowCounter] = useState(!!c.falsifySignal);
  const special = claimsSpecial(c.facts);
  const check = canRule({ ...c, step: 3 }, lang);
  const onlyFacts = check.miss.filter((m) =>
    /事实|证伪|处境/.test(m) || /fact|prove|does not know/i.test(m));
  const ok = facts.some((f) => f.trim())
    && (!rejected || c.aiGap.trim().length > 0)
    && (!special || c.falsifySignal.trim().length > 0)
    && !needsFalsify(c);

  function setFact(i: number, v: string) {
    const nf = [...facts];
    nf[i] = v;
    set({ facts: nf });
  }

  return (
    <div>
      {aiTakes.length > 0 && (
        <>
          <div className="card">
            <div className="card-kicker">{L('如果你现在去问 AI，大概会得到这三句', 'If you asked an AI right now, you would probably get these three')}</div>
            <ol style={{ marginTop: 10 }}>
              {aiTakes.map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--paper-42)', paddingTop: 4 }}>{i + 1}</span>
                  <span className="card-d">{t}</span>
                </li>
              ))}
            </ol>
            <p className="hint" style={{ marginTop: 12 }}>
              {L('这些话都对。问题是：它不知道你的事。', 'All true. The problem: it does not know your situation.')}
            </p>
          </div>

          <div style={{ marginTop: 'var(--sp4)' }}>
            <p className="hint" style={{ marginBottom: 10 }}>{L('哪一条对你不适用？', 'Which one does not apply to you?')}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {aiTakes.map((_, i) => (
                <button key={i} className={`btn${picked === i ? ' btn--rule' : ''}`}
                  style={{ fontSize: 13 }} aria-pressed={picked === i} onClick={() => set({ aiPick: i })}>
                  {L(`第 ${i + 1} 条`, `#${i + 1}`)}
                </button>
              ))}
              <button className={`btn${allApply ? ' btn--rule' : ''}`}
                style={{ fontSize: 13 }} aria-pressed={allApply} onClick={() => set({ aiPick: 99 })}>
                {L('都适用', 'All apply')}
              </button>
            </div>
          </div>

          {picked === -1 && (
            <p className="hint" style={{ marginTop: 'var(--sp2)' }}>
              {L('选一条。选不出来的话，往下写事实也行。', 'Pick one. If none fits, just write the facts below.')}
            </p>
          )}

          {rejected && (
            <div style={{ marginTop: 'var(--sp3)' }}>
              <div className="hint" style={{ marginBottom: 6 }}>{L('它不知道的是——', 'What it does not know —')}</div>
              <Field label={L('它不知道的具体处境（必填）', 'What it does not know (required)')} value={c.aiGap} onChange={(v) => set({ aiGap: v })} max={60} rows={2}
                placeholder={L('例：预算我早就知道，问题是我自己不敢报高价', 'e.g. I know the budget. I am afraid to quote high.')} />
            </div>
          )}

          {allApply && (
            <p className="hint" style={{ marginTop: 'var(--sp3)' }}>
              {L('可以把它们作为参考，再检查是否遗漏了你自己的约束。下面写这次的具体情况。', 'Use them as a checklist, then look for the constraint only you know. Write the specifics below.')}
            </p>
          )}
        </>
      )}

      <div style={{ marginTop: 'var(--sp4)' }}>
        <p className="hint" style={{ marginBottom: 6 }}>
          {aiTakes.length > 0 ? L('你观察到的事实，最多三条', 'What you observed — three at most') : L('写你观察到的事实，不写感觉。最多三条。', 'Write what you observed, not what you feel. Three at most.')}
        </p>
        {RELATIONAL_GATES.includes(c.gate) && (
          <p className="hint" style={{ marginBottom: 10, color: 'var(--paper-56)' }}>
            {L('也包括人情上的：谁介绍的、欠过谁、会不会传出去。', 'Include the human side: who introduced them, who you owe, whether word will spread.')}
          </p>
        )}

        <div className="facts">
          {facts.map((f, i) => (
            <div className="fact" key={i}>
              <span className="fact-n">{['①', '②', '③'][i]}</span>
              <div style={{ flex: 1 }}>
                <Field label={L(`事实 ${i + 1}${i === 0 ? '（至少填写一条）' : '（可选）'}`, `Fact ${i + 1}${i === 0 ? ' (at least one)' : ' (optional)'}`)} value={f} onChange={(v) => setFact(i, v)} max={LIMITS.fact}
                  placeholder={i === 0 ? L('例：客户是二次合作，上次拖了 45 天付款', 'e.g. Second project with this client; last invoice was 45 days late') : L('一条你观察到的事实', 'Something you observed')} />
                {vagueHits(f).length > 0 && (
                  <p className="hint" style={{ marginTop: 4 }}>
                    {L(`「${vagueHits(f).join('、')}」是判断，不是事实。能不能换成一个数字或一次发生过的具体事？`, `"${vagueHits(f).join(', ')}" is a judgement, not a fact. Can you replace it with a number, or something that actually happened?`)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 'var(--sp3)' }}>{L('第三条之后，通常是在找理由。', 'After the third fact, you are usually building a case.')}</p>
      </div>

      {!special && !showCounter && <button className="btn btn--text" style={{ marginTop: 20 }} onClick={() => setShowCounter(true)}>{L('＋ 写一个反证条件（可选）', '+ Add a signal that would prove you wrong (optional)')}</button>}
      {(special || showCounter) && (
        <div className="card" style={{ marginTop: 'var(--sp3)', borderColor: 'var(--lamp-25)' }}>
          <div className="card-kicker">{L('你说这次不一样', 'You said this time is different')}</div>
          <div className="card-d" style={{ marginBottom: 10 }}>
              {L('出现什么事实，你会承认“这次并没有不同”，需要重新考虑？', 'What would you have to see to admit this time is not different after all?')}
          </div>
          <Field label={special ? L('反证条件（必填）', 'Signal that would prove you wrong (required)') : L('反证条件（可选）', 'Signal that would prove you wrong (optional)')} value={c.falsifySignal} onChange={(v) => set({ falsifySignal: v })} max={80}
            placeholder={L('例：3 天内仍不能确认预算和决策人，就重新考虑', 'e.g. If budget and decision maker are still unclear in 3 days, reconsider')} />
        </div>
      )}

      <Miss items={onlyFacts} />

      <div className="row-actions row-actions--between">
        <button className="btn btn--text" onClick={back}>{L('← 上一步', '← Back')}</button>
        <button className="btn" disabled={!ok} onClick={next}>{L('下一步 →', 'Next →')}</button>
      </div>
    </div>
  );
}

/* ───────── 第 4 步：设距 ───────── */
function StepDistance({ c, set, next, back }: { c: DecisionCase; set: (p: Partial<DecisionCase>) => void; next: () => void; back: () => void }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const ok = c.distance.trim().length > 0;
  return (
    <div>
      <p className="h2" style={{ fontSize: 20, color: 'var(--paper-78)', marginBottom: 10 }}>
        {L('如果你的朋友坐在这里，把这个情况告诉你，你会跟他说什么？', 'If a friend sat here and told you this, what would you say to them?')}
      </p>
      <p className="hint" style={{ marginBottom: 'var(--sp3)' }}>
        {L('这一步的内容只给你自己看，不进任何统计。', 'Only you see this. It is not counted anywhere.')}
      </p>
      <Field label={L('如果是朋友问我（必填）', 'If a friend asked me (required)')} value={c.distance} onChange={(v) => set({ distance: v })} max={LIMITS.distance} rows={2}
        placeholder={L('我会说……', 'I would say…')} autoFocus />
      <div className="row-actions row-actions--between">
        <button className="btn btn--text" onClick={back}>{L('← 上一步', '← Back')}</button>
        <button className="btn" disabled={!ok} onClick={next}>{L('下一步 →', 'Next →')}</button>
      </div>
    </div>
  );
}

/* ───────── 第 5 步：照明 ───────── */
function StepLight({ c, next, back, round }: { c: DecisionCase; next: () => void; back: () => void; round: number }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const cards = lightUp(c.gate, lang, round);
  return (
    <div>
      <p className="hint" style={{ marginBottom: 6 }}>{L('一条提醒，一个动作，以及可用的依据。按需展开，再回到你的决定。', 'One caution, one move, and whatever evidence exists. Open what you need, then return to the decision.')}</p>
      <div className="cards">
        {cards.map((card, i) => <LightCardView key={i} card={card} />)}
      </div>
      <div className="row-actions row-actions--between">
        <button className="btn btn--text" onClick={back}>{L('← 上一步', '← Back')}</button>
        <button className="btn" onClick={next}>{L('下一步 →', 'Next →')}</button>
      </div>
    </div>
  );
}

function LightCardView({ card }: { card: LightCard }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [open, setOpen] = useState(false);
  if (card.kind === 'rate') {
    return (
      <div className="card">
        <div className="card-kicker">{L('有没有数', 'Any numbers')}</div>
        <div className="card-d">{card.baseRate}</div>
        <div className="card-more" style={{ whiteSpace: 'pre-line' }}>{card.note}</div>
      </div>
    );
  }
  if (card.kind === 'none') {
    return (
      <div className="card card-dim">
        <div className="card-kicker">{L('有没有数', 'Any numbers')}</div>
        <div className="card-t">{L('暂无基准', 'No base rate')}</div>
        <div className="card-d" style={{ whiteSpace: 'pre-line' }}>{card.note}</div>
      </div>
    );
  }
  const { concept } = card;
  const isBias = card.kind === 'bias';
  return (
    <div className="card">
      <div className="card-kicker">{isBias ? L('这类决定最容易错在哪', 'Where this kind usually goes wrong') : L('现在能做的一个动作', 'One thing you can do now')}</div>
      <div className="card-t">
        {concept.name}
        {concept.minutes ? L(` · ${concept.minutes} 分钟`, ` · ${concept.minutes} min`) : ''}
      </div>
      <div className="card-d">{concept.oneLine}</div>
      <div className="card-more">
        <button aria-expanded={open} onClick={() => setOpen(!open)}>{open ? L('收起', 'Close') : isBias ? L('为什么', 'Why') : L('怎么做', 'How')}</button>
        <Evidence grade={concept.evidence} />
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          {isBias ? (
            <>
              <p className="card-d" style={{ fontSize: 12 }}>{L('什么时候成立：', 'Holds when: ')}{concept.whenToUse}</p>
              <p className="card-d" style={{ fontSize: 12, marginTop: 8 }}>{L('什么时候不成立：', 'Does not hold when: ')}{concept.whenNot}</p>
            </>
          ) : (
            <ol className="card-d" style={{ fontSize: 12, paddingLeft: 0 }}>
              {(concept.howTo ?? []).map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ color: 'var(--paper-56)', fontSize: 11 }}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="hint" style={{ marginTop: 10 }}>{L('来源：', 'Source: ')}{concept.source}</p>
        </div>
      )}
    </div>
  );
}

/* ───────── 第 6 步：落槌 ───────── */
function StepRule({
  c, set, seal, back, onAbandon, echo, onPhaseChange,
}: {
  c: DecisionCase;
  set: (p: Partial<DecisionCase>) => void;
  seal: (id: string, choice: string, prediction: string, p: number, openAt: string, skipped: boolean) => void;
  back: () => void;
  onAbandon: (id: string, r: AbandReason) => void;
  echo?: DecisionCase;
  onPhaseChange: (locked: boolean) => void;
}) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [phase, setPhase] = useState<'form' | 'wait' | 'ready'>('form');
  const [skipped, setSkipped] = useState(false);
  const holdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const gate = getGate(c.gate);
  const [reviewDate, setReviewDate] = useState(() => c.openAt ? fmtDate(c.openAt) : futureInput(gate.feedbackDays));
  const openAt = dateInputISO(reviewDate);
  const issues = completeIssues({ ...c, openAt }, lang);
  const check = { ok: issues.length === 0, miss: issues };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (holdRef.current) window.clearTimeout(holdRef.current);
    };
  }, []);

  function begin() {
    if (!check.ok) return;
    setPhase('wait');
    onPhaseChange(true);
    set({ openAt });
    timerRef.current = window.setTimeout(() => setPhase('ready'), 8000);
  }

  function skipByHold() {
    if (holdRef.current) return;
    holdRef.current = window.setTimeout(() => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setSkipped(true);
      setPhase('ready');
    }, 1500);
  }

  function endHold() {
    if (holdRef.current) { window.clearTimeout(holdRef.current); holdRef.current = null; }
  }

  function doSeal() {
    if (!check.ok || !openAt) return;
    seal(c.id, c.chosen, c.prediction.trim(), c.predictedP, openAt, skipped);
    window.location.hash = `#/case/${c.id}/sealed`;
  }

  if (phase !== 'form') {
    return (
      <div className="rulestage">
        <div className="h2" role="status" style={{ color: 'var(--paper-56)', letterSpacing: '.08em', fontSize: 26 }}>
          {phase === 'ready' ? L('现在落槌', 'Make the call') : L('你确定了吗', 'Are you sure')}
        </div>
        <div className={`ruleline${phase === 'wait' ? ' run' : ' done'}`}><i /></div>
        {phase === 'ready' ? (
          <button className="btn btn--rule" onClick={doSeal}>{L('落　槌', 'Seal it')}</button>
        ) : (
          <>
            <button className="btn btn--text" onPointerDown={skipByHold} onPointerUp={endHold} onPointerLeave={endHold} onPointerCancel={endHold} onBlur={endHold}
              onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); skipByHold(); } }}
              onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endHold(); } }}>
              {L('长按 1.5 秒跳过', 'Hold 1.5s to skip')}
            </button>
            <p className="rulehint">{L('八秒。不改任何东西，只是停一下。', 'Eight seconds. Nothing changes. Just a pause.')}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {echo ? (
        <div className="card" style={{ marginBottom: 'var(--sp4)', borderColor: 'var(--lamp-25)' }}>
          <div className="card-kicker">{L('上一次同类决定', 'Last decision of this kind')} · {fmtDate(echo.sealedAt)}</div>
          <div className="card-d">
            {L(`你选了「${echo.chosen}」，当时写下：`, `You chose "${echo.chosen}" and wrote: `)}{echo.prediction}
          </div>
          <div className="card-more">{L('你给这件事的概率：', 'Probability you gave it: ')}{echo.predictedP}%</div>
          {echo.result ? (
            <>
              <div className="card-d" style={{ marginTop: 8 }}>{L('结果：', 'Result: ')}{echo.result}</div>
              {echo.wrongJudgment && (
                <div className="card-more">{L('你当时写的：', 'What you wrote: ')}{echo.wrongJudgment}</div>
              )}
            </>
          ) : (
            <div className="card-more">{L('还没到期回看。这次先按你自己的判断来。', 'Not due yet. Go with your own judgement this time.')}</div>
          )}
        </div>
      ) : (
        <p className="hint" style={{ marginBottom: 'var(--sp3)' }}>
          {L(`这是你第一次在「${gateName(c.gate, lang)}」上做决定。没有上一次可以对照。`, `This is your first decision in "${gateName(c.gate, lang)}". No previous one to compare.`)}
        </p>
      )}

      <p className="hint" style={{ marginBottom: 6 }}>{L('选一个，写下你的预测。到期后再次打开网站，就能回看。', 'Pick one and write your prediction. When it is due, reopen the site and compare.')}</p>

      <div className="opts" style={{ marginTop: 'var(--sp3)' }}>
        {c.options.map((o, i) => (
          <button key={i} className={`opt${c.chosen === o ? ' on' : ''}`} onClick={() => set({ chosen: o })} aria-pressed={c.chosen === o}>
            <span className="opt-idx">{String.fromCharCode(65 + i)}</span>
            <span className="opt-txt">{o}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'var(--sp4)' }}>
        <Field label={L('一句话预测（必填，要有数字或时间）', 'One-line prediction (required, needs a number or date)')} value={c.prediction} onChange={(v) => set({ prediction: v })} max={LIMITS.prediction}
          placeholder={L('例：客户会在 3 天内接受，价格 3.2 万', 'e.g. Client accepts at 32k within 3 days')} />
      </div>

      <div style={{ marginTop: 'var(--sp3)' }}>
        <div className="hint" style={{ marginBottom: 8 }}>{L('你认为这会发生吗', 'Do you think this will happen?')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input type="range" aria-label={L('预测发生的概率', 'Probability')} min={1} max={99} value={c.predictedP}
            onChange={(e) => set({ predictedP: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--lamp)' }} />
          <span className="mono" style={{ fontSize: 20, color: 'var(--lamp)', minWidth: 52, textAlign: 'right' }}>
            {c.predictedP}%
          </span>
        </div>
      </div>

      <div className="form-group">
        <label className="hint" htmlFor="review-date">{L('回看日期 · 什么时候检验这条预测', 'Review date · when you check this prediction')}</label>
        <input id="review-date" className="field" type="date" min={todayInput()} value={reviewDate}
          onChange={e => { setReviewDate(e.target.value); set({ openAt: dateInputISO(e.target.value) }); }} />
        <p className="hint">{L(`按这类决定预填约 ${gate.feedbackDays} 天后。请结合预测的时间窗口确认。`, `Prefilled at about ${gate.feedbackDays} days for this kind of decision. Adjust to your prediction's time window.`)}</p>
      </div>
      <Miss items={check.miss} />

      <div className="row-actions row-actions--between">
        <button className="btn btn--text" onClick={back}>{L('← 上一步', '← Back')}</button>
        <button className="btn btn--rule" disabled={!check.ok} onClick={begin}>{L('落槌', 'Make the call')}</button>
      </div>

      <p className="hint" style={{ marginTop: 'var(--sp3)' }}>
        {L('封存后不可修改。开封日会是 ', 'No edits after sealing. It opens on ')}{fmtDate(openAt)}{L('。', '.')}
      </p>

      <div style={{ marginTop: 'var(--sp4)' }}>
        <Abandon id={c.id} onAbandon={onAbandon} />
      </div>
    </div>
  );
}

/* ───────── 撤回 ───────── */
function Abandon({ id, onAbandon }: { id: string; onAbandon: (id: string, r: AbandReason) => void }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button className="btn btn--text" onClick={() => setOpen(true)}>{L('撤回这个决定', 'Withdraw this decision')}</button>;
  }
  return (
    <div className="card">
      <div className="card-kicker">{L('撤回要写一句为什么', 'Withdrawing needs a reason')}</div>
      <div className="opts" style={{ marginTop: 10 }}>
        {ABAND_REASONS.map((r) => (
          <button key={r} className="opt" onClick={() => {
            onAbandon(id, r);
            window.location.hash = '#/';
          }}>
            <span className="opt-txt" style={{ fontSize: 14 }}>{r}</span>
          </button>
        ))}
      </div>
      <button className="btn btn--text" style={{ marginTop: 10 }} onClick={() => setOpen(false)}>{L('算了，继续', 'Never mind')}</button>
    </div>
  );
}
