import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { AppState, DecisionCase, GateId, AbandReason } from './types';
import { loadState, saveState, getReadIssue, allowRecoveryWrite, parseState, requestPersistentStorage } from './storage';
import { reducer } from './reducer';
import { uid } from '../lib/id';
import { nowISO, dateInputISO, fmtDate } from '../lib/date';

export interface Store {
  cases: DecisionCase[];
  saveMessage: string;
  saveOK: boolean;
  readIssue: string;
  retrySave: () => void;
  get: (id: string) => DecisionCase | undefined;
  create: (gate: GateId, question: string, deadlineKind: DecisionCase['deadlineKind'], deadlineAt: string | null) => string;
  patch: (id: string, patch: Partial<DecisionCase>) => void;
  abandon: (id: string, reason: AbandReason) => void;
  seal: (id: string, choice: string, prediction: string, p: number, openAt: string, skipped: boolean, expectedDays?: number | null) => void;
  saveReview: (id: string, draft: NonNullable<DecisionCase['reviewDraft']>) => void;
  reopen: (id: string, result: string, verdict: string, wrong: string, next: string, actualDays?: number | null) => void;
  openEarly: (id: string) => void;
  clearAll: () => void;
  importState: (s: AppState, mode: 'merge' | 'replace') => void;
}
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [clock, setClock] = useState(0);
  // 申请持久化：让浏览器别在磁盘紧张时把这份账本当成可回收缓存
  useEffect(() => { void requestPersistentStorage(); }, []);

  useEffect(() => {
    const refresh = () => setClock(v => v + 1);
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const [saving, setSaving] = useState({ ok: !getReadIssue(), message: getReadIssue() || '已保存到本机' });
  const persist = useCallback(() => { setSaving(saveState(state)); }, [state]);
  useEffect(persist, [persist]);

  const create = useCallback<Store['create']>((gate, question, deadlineKind, deadlineAt) => {
    if (getReadIssue()) throw new Error('请先在数据管理中恢复本机记录。');
    if (!question.trim() || question.length > 40 || (deadlineKind !== 'none' && (!deadlineAt || !dateInputISO(fmtDate(deadlineAt))))) {
      throw new Error('请检查问题和决定期限。');
    }
    const t = nowISO();
    const c: DecisionCase = {
      id: uid(), gate, question, deadlineKind, deadlineAt,
      options: [], nonActionOption: '', facts: [], aiPick: -1, aiGap: '', falsifySignal: '', distance: '',
      chosen: '', prediction: '', predictedP: 50, sealedAt: null, sealHash: null, openAt: null,
      openedEarlyAt: null, archivedAt: null, result: '', verdict: '', wrongJudgment: '', nextChange: '',
      abandReason: '', status: 'draft', step: 2, furthestStep: 2, skippedWait: false, createdAt: t, updatedAt: t,
    };
    dispatch({ type: 'case/create', c });
    return c.id;
  }, []);

  const api = useMemo<Store>(() => ({
    cases: state.cases, saveOK: saving.ok, saveMessage: saving.message, readIssue: getReadIssue(), retrySave: persist,
    get: id => state.cases.find(c => c.id === id), create,
    patch: (id, patch) => dispatch({ type: 'case/patch', id, patch }),
    abandon: (id, reason) => dispatch({ type: 'case/abandon', id, reason }),
    seal: (id, choice, prediction, p, openAt, skipped, expectedDays) => dispatch({ type: 'case/seal', id, choice, prediction, p, openAt, skipped, expectedDays }),
    saveReview: (id, draft) => dispatch({ type: 'case/review-draft', id, draft }),
    reopen: (id, result, verdict, wrong, next, actualDays) => dispatch({ type: 'case/reopen', id, result, verdict, wrong, next, actualDays }),
    openEarly: id => dispatch({ type: 'case/open-early', id }),
    clearAll: () => { allowRecoveryWrite(); dispatch({ type: 'all/clear' }); },
    importState: (s, mode) => {
      const valid = parseState(s);
      allowRecoveryWrite();
      dispatch({ type: 'all/import', s: valid, mode });
    },
  }), [state.cases, saving, persist, create, clock]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore 必须在 StoreProvider 内使用');
  return s;
}
