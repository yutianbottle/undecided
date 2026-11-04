import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { zh, type Dict } from './zh';
import { en } from './en';
import type { AbandReason } from '../state/types';

export type Lang = 'zh' | 'en';

const ABANDON_REASON_EN: Record<AbandReason, string> = {
  '不重要': 'It is no longer important',
  '情况变了': 'The situation changed',
  '别人替我定了': 'Someone else decided it',
  '写下来发现不用选': 'Writing it down showed there was no choice to make',
};

export function abandonReasonLabel(reason: AbandReason | '', lang: Lang): string {
  return lang === 'en' && reason ? ABANDON_REASON_EN[reason] : reason;
}

/** 将存储层和创建流程抛出的稳定错误翻译成当前界面语言。 */
export function localizeError(message: string, lang: Lang): string {
  if (lang === 'zh') return message;
  const exact: Record<string, string> = {
    '请先在数据管理中恢复本机记录。': 'Recover your local records in Data first.',
    '请检查问题和决定期限。': 'Check the question and deadline.',
    '备份版本不支持，或缺少案卷数组。': 'This backup version is unsupported or has no case list.',
    '浏览器中没有可导出的原始记录。': 'There is no raw record to export in this browser.',
    '保存失败，当前内容仍在页面中。请立即导出备份，再重试保存。': 'Saving failed. The current content is still on this page. Export a backup now, then try again.',
    '本机记录暂时无法读取。原始数据已保留，自动保存已暂停；请先导出原始数据，再导入有效备份恢复。': 'Local records could not be read. The raw data is still kept and auto-save is paused. Export it first, then restore a valid backup.',
    'useStore 必须在 StoreProvider 内使用': 'useStore must be used inside StoreProvider',
  };
  if (exact[message]) return exact[message];
  const malformed = message.match(/^第 (\d+) 个案卷的数据不完整或格式不正确。$/);
  if (malformed) return `Case ${malformed[1]} is incomplete or has an invalid format.`;
  return message;
}

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
  } catch { /* 隐私模式下无法读取本地语言设置。 */ }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh'
      ? '未决 · 把决定留在自己手里'
      : 'Undecided · the decision stays yours';
    try { localStorage.setItem(KEY, lang); } catch { /* 无法持久化语言设置时继续使用当前语言。 */ }
  }, [lang]);

  return <Ctx.Provider value={{ lang, t: DICTS[lang], setLang }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx { return useContext(Ctx); }
export function useT(): Dict { return useContext(Ctx).t; }

/** 中英文界面切换控件。 */
export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label={t.nav.lang}>
      <button type="button" className={lang === 'zh' ? 'on' : ''} onClick={() => setLang('zh')} aria-pressed={lang === 'zh'}>中</button>
      <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
    </div>
  );
}
