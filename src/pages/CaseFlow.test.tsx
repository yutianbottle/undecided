import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DecisionCase } from '../state/types';
import CaseFlow from './CaseFlow';
import Reopen from './Reopen';

const view = vi.hoisted(() => ({ lang: 'zh' as 'zh' | 'en', c: null as DecisionCase | null }));
vi.mock('../i18n', async (importOriginal) => ({
  ...await importOriginal<typeof import('../i18n')>(),
  useLang: () => ({ lang: view.lang }),
}));
vi.mock('../components/Shell', () => ({ Shell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('../state/store', () => ({ useStore: () => ({
  get: () => view.c, cases: view.c ? [view.c] : [],
  patch: vi.fn(), abandon: vi.fn(), seal: vi.fn(), reopen: vi.fn(), saveReview: vi.fn(),
}) }));

function decision(): DecisionCase {
  return {
    id: 'other-case', gate: 'other', question: 'Should I do it?', deadlineKind: 'none', deadlineAt: null,
    options: ['Do it', 'Do nothing'], nonActionOption: 'Do nothing', facts: ['I have 14 days'],
    distance: 'Try a small step', aiPick: -1, aiGap: '', falsifySignal: '', chosen: 'Do it',
    prediction: 'Finish in 14 days', predictedP: 70, expectedNum: 14,
    sealedAt: null, sealHash: null, openAt: null, result: '', verdict: '', wrongJudgment: '', nextChange: '',
    abandReason: '', status: 'draft', step: 5, furthestStep: 5, skippedWait: false,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

afterEach(() => { view.c = null; });

describe.each(['zh', 'en'] as const)('Other flow (%s)', (lang) => {
  it('renders lighting cards and the call form after the lighting step', () => {
    view.lang = lang;
    view.c = decision();
    const light = renderToStaticMarkup(<CaseFlow id={view.c.id} />);
    expect(light).toContain(lang === 'zh' ? '通用提醒与动作' : 'general caution');
    expect(light).toContain(lang === 'zh' ? '怎么做' : 'How');
    expect(light).toContain(lang === 'zh' ? '暂无基准' : 'No base rate');
    view.c = { ...view.c, step: 6, furthestStep: 6 };
    const call = renderToStaticMarkup(<CaseFlow id={view.c.id} />);
    expect(call).toContain(lang === 'zh' ? '你预计多少天完成' : 'How many days to complete it?');
    expect(call).toContain('id="expected-num"');
    expect(call).toContain('id="review-date"');
    expect(call).toContain(lang === 'zh' ? '落槌' : 'Make the call');
  });

  it('renders all withdrawal reasons in the selected language', () => {
    view.lang = lang;
    const reasons = lang === 'zh'
      ? ['不重要', '情况变了', '别人替我定了', '写下来发现不用选']
      : ['It is no longer important', 'The situation changed', 'Someone else decided it', 'Writing it down showed there was no choice to make'];
    const source = ['不重要', '情况变了', '别人替我定了', '写下来发现不用选'] as const;
    for (const [i, reason] of source.entries()) {
      view.c = { ...decision(), status: 'abandoned', abandReason: reason };
      expect(renderToStaticMarkup(<CaseFlow id={view.c.id} />)).toContain(reasons[i]);
    }
  });

  it('renders actual days on review and keeps both values visible after archiving', () => {
    view.lang = lang;
    view.c = { ...decision(), status: 'sealed', step: 7, openAt: '2026-01-02T00:00:00.000Z',
      sealedAt: '2026-01-01T00:00:00.000Z', sealHash: 'ABCDEF12' };
    const review = renderToStaticMarkup(<Reopen id={view.c.id} />);
    expect(review).toContain('id="actual-num"');
    expect(review).toContain(lang === 'zh' ? '实际完成用了多少天' : 'How many days did it actually take to complete?');
    view.c = { ...view.c, status: 'archived', actualNum: 21, result: 'Finished' };
    const archived = renderToStaticMarkup(<Reopen id={view.c.id} />);
    expect(archived).toContain(lang === 'zh' ? '14 天' : '14 days');
    expect(archived).toContain(lang === 'zh' ? '21 天' : '21 days');
  });
});
