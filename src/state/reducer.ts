import type { AppState, DecisionCase, AbandReason } from './types';
import { completeIssues, stepIssues, ABAND_REASONS, LIMITS } from '../lib/validate';
import { nowISO, reviewAvailable } from '../lib/date';
import { sealHash } from '../lib/seal';
import { mergeStates, parseState } from './storage';

export type Action =
  | { type: 'case/create'; c: DecisionCase }
  | { type: 'case/patch'; id: string; patch: Partial<DecisionCase> }
  | { type: 'case/abandon'; id: string; reason: AbandReason }
  | { type: 'case/seal'; id: string; choice: string; prediction: string; p: number; openAt: string; skipped: boolean; expectedNum?: number | null }
  | { type: 'case/review-draft'; id: string; draft: NonNullable<DecisionCase['reviewDraft']> }
  | { type: 'case/reopen'; id: string; result: string; verdict: string; wrong: string; next: string; actualNum?: number | null }
  | { type: 'case/open-early'; id: string }
  | { type: 'all/clear' }
  | { type: 'all/import'; s: AppState; mode: 'merge' | 'replace' };

const editable = (c: DecisionCase) => c.status === 'draft' || c.status === 'framed';
const reviewValid = (d: NonNullable<DecisionCase['reviewDraft']>) =>
  d.result.length <= LIMITS.result && d.wrong.length <= LIMITS.wrong && d.next.length <= LIMITS.next
    && ['', 'same', 'partial', 'different'].includes(d.verdict);

export function reducer(state: AppState, a: Action): AppState {
  const touch = (id: string, fn: (c: DecisionCase) => DecisionCase): AppState => {
    let changed = false;
    const cases = state.cases.map(c => {
      if (c.id !== id) return c;
      const next = fn(c);
      if (next === c) return c;
      changed = true;
      return { ...next, updatedAt: nowISO() };
    });
    return changed ? { ...state, cases } : state;
  };
  switch (a.type) {
    case 'case/create':
      return editable(a.c) && !state.cases.some(c => c.id === a.c.id) ? { ...state, cases: [a.c, ...state.cases] } : state;
    case 'case/patch':
      return touch(a.id, c => {
        if (!editable(c)) return c;
        // 只接受草稿字段，封存记录和身份字段不能通过通用 patch 修改。
        const keys = ['options', 'facts', 'nonActionOption', 'aiPick', 'aiGap', 'falsifySignal', 'distance',
          'chosen', 'prediction', 'predictedP', 'openAt', 'expectedNum'] as const;
        const p = Object.fromEntries(keys.filter(k => k in a.patch).map(k => [k, a.patch[k]]));
        let next = { ...c, ...p } as DecisionCase;
        if (next.nonActionOption && !next.options.includes(next.nonActionOption)) next.nonActionOption = '';
        if (next.chosen && !next.options.includes(next.chosen)) next.chosen = '';
        const target = a.patch.step;
        if (target !== undefined) {
          const furthest = c.furthestStep ?? c.step;
          if (Number.isInteger(target) && target >= 2 && target <= 6
            && target <= Math.max(c.step + 1, furthest) && !stepIssues(next, target).length) {
            next = { ...next, step: target, furthestStep: Math.max(furthest, target) };
          }
        }
        try { return parseState({ version: state.version, cases: [next] }).cases[0]; } catch { return c; }
      });
    case 'case/abandon':
      return touch(a.id, c => editable(c) && ABAND_REASONS.includes(a.reason)
        ? { ...c, status: 'abandoned', abandReason: a.reason, step: 7 } : c);
    case 'case/seal':
      return touch(a.id, c => {
        const next = { ...c, chosen: a.choice, prediction: a.prediction, predictedP: a.p, openAt: a.openAt,
          expectedNum: a.expectedNum ?? null };
        if (!editable(c) || c.step !== 6 || completeIssues(next).length) return c;
        const t = nowISO();
        return { ...next, sealedAt: t, sealHash: sealHash(JSON.stringify({
          id: c.id, question: c.question, options: c.options, facts: c.facts, distance: c.distance,
          falsifySignal: c.falsifySignal, aiGap: c.aiGap, choice: a.choice,
          prediction: a.prediction, p: a.p, openAt: a.openAt, t, v: 2,
        })), status: 'sealed', step: 7, skippedWait: a.skipped };
      });
    case 'case/review-draft':
      return touch(a.id, c => c.status === 'sealed' && reviewAvailable(c) && reviewValid(a.draft)
        ? { ...c, reviewDraft: a.draft } : c);
    case 'case/reopen':
      return touch(a.id, c => {
        const draft = { result: a.result, verdict: a.verdict as DecisionCase['verdict'], wrong: a.wrong, next: a.next };
        if (c.status !== 'sealed' || !reviewAvailable(c) || !draft.result.trim() || !reviewValid(draft)) return c;
        const { reviewDraft: _draft, ...original } = c;
        return { ...original, result: a.result, verdict: draft.verdict,
          wrongJudgment: a.wrong, nextChange: a.next, actualNum: a.actualNum ?? null,
          status: 'archived', archivedAt: nowISO() };
      });
    case 'case/open-early':
      return touch(a.id, c => c.status === 'sealed' && !reviewAvailable(c) ? { ...c, openedEarlyAt: nowISO() } : c);
    case 'all/clear': return { ...state, cases: [] };
    case 'all/import': return a.mode === 'merge' ? mergeStates(state, a.s) : a.s;
  }
}
