import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { useRoute } from '../router';
import { useStore } from '../state/store';
import { useT, LangSwitch } from '../i18n';

function Navigation() {
  const route = useRoute();
  const t = useT();
  const { saveOK } = useStore();
  const current = route.name === 'gate' ? 'ledger' : route.name === 'about' ? 'me' : route.name;
  return <nav className="site-nav" aria-label={t.nav.main}>
    <a className="brand" href="#/" aria-label={t.nav.home}>{t.nav.brand}</a>
    <div>
      {[['desk', '#/', t.nav.desk], ['ledger', '#/ledger', t.nav.ledger], ['me', '#/me', t.nav.me]].map(([id, url, label]) =>
        <a href={url} key={id} aria-current={current === id ? 'page' : undefined}>{label}</a>)}
    </div>
    <span className="nav-side">
      <span className="save-state" role="status">{saveOK ? t.shell.saved : t.shell.saveErr}</span>
      <LangSwitch />
    </span>
  </nav>;
}

export function Shell({ children, glow = 0.10 }: { children: ReactNode; glow?: number }) {
  const route = useRoute();
  const t = useT();
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
    {!saveOK && <aside className="save-alert" role="alert"><span>{saveMessage}</span><a href="#/me/data">{t.shell.openData}</a>{!readIssue && <button onClick={retrySave}>{t.shell.retry}</button>}</aside>}
    {children}
    {focus && route.name !== 'check' && <span className="proto" role="status">{saveOK ? t.shell.saved : t.shell.saveErr}</span>}
  </div>;
}

export function Foot() {
  const t = useT();
  return <footer className="foot"><span>{t.foot.local}</span><a href="#/about">{t.foot.about}</a></footer>;
}
