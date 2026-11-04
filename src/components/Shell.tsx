import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useRoute } from '../router';
import { useStore } from '../state/store';
import { useT, useLang, localizeError, LangSwitch } from '../i18n';

function Navigation() {
  const route = useRoute();
  const t = useT();
  const { lang } = useLang();
  const L = (l: 'zh' | 'en', zh: string, en: string) => (l === 'zh' ? zh : en);
  const { saveOK } = useStore();
  const current = route.name === 'gate' ? 'ledger' : route.name === 'about' ? 'me' : route.name;
  return <nav className="site-nav" aria-label={t.nav.main}>
    <a className="brand" href="#/" aria-label={t.nav.home}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z M15 3v5h4" /></svg>
    </a>
    <div>
      {[['desk', '#/', t.nav.desk], ['ledger', '#/ledger', t.nav.ledger], ['me', '#/me', t.nav.me]].map(([id, url, label]) =>
        <a href={url} key={id} aria-current={current === id ? 'page' : undefined}>{label}</a>)}
    </div>
    <span className="nav-side">
      <span className="save-state" role="status">{saveOK ? t.shell.saved : t.shell.saveErr}</span>
      <LangSwitch />
      <a
        className="nav-gh"
        href="https://github.com/yutianbottle/undecided"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={L(lang, '在 GitHub 上查看源码', 'View source on GitHub')}
        title={L(lang, '在 GitHub 上查看源码', 'View source on GitHub')}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
        </svg>
      </a>
    </span>
  </nav>;
}

export function Shell({ children, glow = 0.10 }: { children: ReactNode; glow?: number }) {
  const route = useRoute();
  const t = useT();
  const { lang } = useLang();
  const { saveMessage, saveOK, readIssue, retrySave } = useStore();
  const focus = ['case', 'new', 'check', 'sealed', 'reopen'].includes(route.name);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => document.documentElement.classList.toggle('keyboard-open', !!viewport && window.innerHeight - viewport.height > 150);
    viewport?.addEventListener('resize', update);
    update();
    return () => { viewport?.removeEventListener('resize', update); document.documentElement.classList.remove('keyboard-open'); };
  }, []);
  return <div className={`stage${focus ? ' stage--focus' : ''}`} style={{ '--glow': glow } as CSSProperties}>
    <div className="glow" aria-hidden="true" />
    {!focus && <Navigation />}
    {!saveOK && <aside className="save-alert" role="alert"><span>{localizeError(saveMessage, lang)}</span><a href="#/me/data">{t.shell.openData}</a>{!readIssue && <button onClick={retrySave}>{t.shell.retry}</button>}</aside>}
    {children}
  </div>;
}

export function Foot() {
  const t = useT();
  const { saveOK } = useStore();
  const { lang } = useLang();
  return <footer className="foot">
    <div className="foot-meta"><span role="status">{saveOK ? t.shell.saved : t.shell.saveErr}</span><a href="#/about">{t.foot.about}</a></div>
    <div className="foot-tools"><LangSwitch /><a href="https://github.com/yutianbottle/undecided" target="_blank" rel="noopener noreferrer" aria-label={lang === 'zh' ? '在 GitHub 上查看源码' : 'View source on GitHub'}>GitHub ↗</a></div>
  </footer>;
}
