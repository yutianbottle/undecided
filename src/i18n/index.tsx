import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { zh, type Dict } from './zh';
import { en } from './en';

export type Lang = 'zh' | 'en';

const DICTS: Record<Lang, Dict> = { zh, en };
const KEY = 'weijue.lang';

interface LangCtx {
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LangCtx>({ lang: 'zh', t: zh, setLang: () => {} });

function initial(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'zh' || v === 'en') return v;
  } catch { /* 忽略隐私模式 */ }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh'
      ? '未决 · 一个人做公司的决策台'
      : 'Undecided · a decision desk for one';
    try { localStorage.setItem(KEY, lang); } catch { /* 忽略 */ }
  }, [lang]);

  return <Ctx.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx { return useContext(Ctx); }
export function useT(): Dict { return useContext(Ctx).t; }

/** 中英切换：两个字符，不占地方 */
export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label={t.nav.lang}>
      <button type="button" className={lang === 'zh' ? 'on' : ''} onClick={() => setLang('zh')} aria-pressed={lang === 'zh'}>中</button>
      <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
    </div>
  );
}
