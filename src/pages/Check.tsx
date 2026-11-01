import { useState } from 'react';
import { Shell, Foot } from '../components/Shell';
import { useLang } from '../i18n';

/** 四类已知的坏时机。不是诊断，只是提醒。 */
const STATES = [
  { id: 'tired', zh: '困', en: 'Tired', zhD: '没睡够，或者已经撑了很久', enD: 'Short on sleep, or running on empty' },
  { id: 'hungry', zh: '饿', en: 'Hungry', zhD: '今天还没好好吃一顿', enD: 'You have not eaten properly today' },
  { id: 'angry', zh: '气', en: 'Angry', zhD: '刚和人起过冲突，还没下来', enD: 'A conflict just happened and has not settled' },
  { id: 'rushed', zh: '急', en: 'Rushed', zhD: '心里很急，想今天就把事定下来', enD: 'You want it settled today, badly' },
];

export default function Check() {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  function proceed() {
    try { sessionStorage.setItem('weijue.statechecked', String(Date.now())); } catch { /* 不可用时 NewCase 会放行 */ }
    window.location.hash = '#/new';
  }

  const blocked = picked.length > 0;
  const first = STATES.find((s) => s.id === picked[0]);

  return (
    <Shell>
      <main className="wrap">
        <a className="btn btn--text back-link" href="#/">← {L('台面', 'Desk')}</a>

        <p className="eyebrow" style={{ marginTop: 24 }}>{L('在开始之前', 'Before you start')}</p>
        <h1 className="h2" style={{ marginTop: 8 }}>
          {L('你现在是什么状态', 'What state are you in right now')}
        </h1>
        <p className="hint" style={{ marginTop: 12, maxWidth: 560 }}>
          {L(
            '这一步不在七步里，在它前面。它不评价你，只是先确认一件事：现在是不是一个能做决定的时候。',
            'This is not one of the seven steps. It comes before them. It is not judging you — it only checks whether now is a time to decide at all.',
          )}
        </p>

        <ul className="check-list">
          {STATES.map((s) => (
            <li key={s.id}>
              <label className="check-row" data-on={picked.includes(s.id) ? '1' : undefined}>
                <input
                  type="checkbox"
                  checked={picked.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span className="check-name">{L(s.zh, s.en)}</span>
                <span className="check-desc">{L(s.zhD, s.enD)}</span>
              </label>
            </li>
          ))}
        </ul>

        {blocked ? (
          <div className="check-block" role="alert">
            <p className="check-block-t">{L('先别做这个决定。', 'Do not make this decision now.')}</p>
            <p className="check-block-d">
              {L(
                `你选了自己在「${first?.zh ?? ''}」里。人在这种状态下，看什么都偏向一边：该谨慎的会冒进，该放手的会硬撑。不是你会做错，是现在看到的东西本身就不准。`,
                `You said you are "${first?.en.toLowerCase() ?? ''}". In that state everything tilts one way: what deserves caution gets rushed, what deserves letting go gets held onto. It is not that you would decide wrong — it is that what you can see right now is off.`,
              )}
            </p>
            <p className="check-block-d">
              {L('这件事明天还在。先去睡一觉，或者吃顿饭，走一圈。', 'It will still be here tomorrow. Sleep, eat something, take a walk.')}
            </p>
            <div className="inline-actions" style={{ marginTop: 20 }}>
              <a className="btn" href="#/">{L('回台面', 'Back to the desk')}</a>
              <button className="btn btn--text" onClick={() => setPicked([])}>
                {L('其实我状态没问题', 'Actually I am fine')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="hint" style={{ marginTop: 8 }}>
              {L('四样都没有，再往下走。', 'None of the four — then go ahead.')}
            </p>
            <div className="inline-actions" style={{ marginTop: 16 }}>
              <button className="btn btn--rule" onClick={proceed}>{L('开始 →', 'Start →')}</button>
            </div>
          </>
        )}

        <Foot />
      </main>
    </Shell>
  );
}
