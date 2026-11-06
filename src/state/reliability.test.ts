import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reducer } from './reducer';
import { completeIssues, hasMarkedNonAction } from '../lib/validate';
import { dateInputISO, daysUntil, isDue, reviewAvailable } from '../lib/date';
import { loadState, saveState, parseState, mergeStates, getReadIssue, STORAGE_KEY } from './storage';
import { toMarkdown } from '../lib/export';
import type { AppState, DecisionCase } from './types';

const instant = new Date(2026, 10, 2, 12);
const iso = (day: number) => new Date(2026, 10, day, 23, 59, 59, 999).toISOString();
function decision(p: Partial<DecisionCase> = {}): DecisionCase {
  return { id: 'one', gate: 'quoting', question: '这单报多少', deadlineKind: 'none', deadlineAt: null,
    options: ['报 3 万', '不接'], nonActionOption: '不接', facts: ['客户预算 3 万'], aiPick: -1, aiGap: '',
    falsifySignal: '', distance: '先确认交付范围', chosen: '报 3 万', prediction: '3 天内接受', predictedP: 60,
    sealedAt: null, sealHash: null, openAt: iso(6), openedEarlyAt: null, archivedAt: null,
    result: '', verdict: '', wrongJudgment: '', nextChange: '', abandReason: '', status: 'draft', step: 6,
    furthestStep: 6, skippedWait: false, createdAt: instant.toISOString(), updatedAt: instant.toISOString(), ...p };
}
const state = (c = decision()): AppState => ({ version: 2, cases: [c] });
const seal = (s: AppState) => reducer(s, { type: 'case/seal', id: 'one', choice: s.cases[0].chosen,
  prediction: '3 天内接受', p: 60, openAt: iso(6), skipped: false });
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(instant); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('完整决策与状态约束', () => {
  it('其他可从摆选项走完照明、落槌、提前回看和归档，并保留预估与实际天数', () => {
    let s = state(decision({ gate: 'other', step: 2, furthestStep: 2,
      options: [], nonActionOption: '', facts: [], distance: '', chosen: '', prediction: '' }));
    const patch = (p: Partial<DecisionCase>) => { s = reducer(s, { type: 'case/patch', id: 'one', patch: p }); };
    patch({ options: ['完成这件事', '不做'], nonActionOption: '不做', step: 3 });
    expect(s.cases[0].step).toBe(3);
    patch({ facts: ['我有 14 天空闲'], step: 4 });
    expect(s.cases[0].step).toBe(4);
    patch({ distance: '先试一个小步骤', step: 5 });
    expect(s.cases[0].step).toBe(5);
    patch({ step: 6 });
    expect(s.cases[0].step).toBe(6);
    s = reducer(s, { type: 'case/seal', id: 'one', choice: '完成这件事', prediction: '14 天内完成',
      p: 70, openAt: iso(6), skipped: false, expectedNum: 14 });
    expect(s.cases[0].status).toBe('sealed');
    s = parseState(JSON.parse(JSON.stringify(s)));
    s = reducer(s, { type: 'case/open-early', id: 'one' });
    s = reducer(s, { type: 'case/reopen', id: 'one', result: '21 天完成', verdict: 'partial',
      wrong: '', next: '', actualNum: 21 });
    expect(parseState(JSON.parse(JSON.stringify(s))).cases[0]).toMatchObject({
      gate: 'other', status: 'archived', expectedNum: 14, actualNum: 21, openAt: iso(6),
    });
  });
  it('两个行动选项或未明确标记时不能推进，也不能直接落槌', () => {
    const s = state(decision({ step: 2, furthestStep: 2, nonActionOption: '' }));
    expect(reducer(s, { type: 'case/patch', id: 'one', patch: { step: 3 } }).cases[0].step).toBe(2);
    expect(seal(s)).toBe(s);
    expect(seal(state(decision({ nonActionOption: '' }))).cases[0].status).toBe('draft');
  });
  it('不把“不降价，继续原价”自动视为用户的非行动标记', () => {
    expect(hasMarkedNonAction(decision({ options: ['不降价，继续原价', '涨价'], nonActionOption: '' }))).toBe(false);
  });
  it('不能跳过未完成的事实和换位自问，已完成步骤可以返回', () => {
    const s = state(decision({ step: 3, furthestStep: 3, facts: [], distance: '' }));
    expect(reducer(s, { type: 'case/patch', id: 'one', patch: { step: 6 } }).cases[0].step).toBe(3);
    expect(reducer(state(), { type: 'case/patch', id: 'one', patch: { step: 2 } }).cases[0].step).toBe(2);
  });
  it('删除选项时同步清除其选择与非行动标记', () => {
    const s = state(decision({ chosen: '不接' }));
    const next = reducer(s, { type: 'case/patch', id: 'one', patch: { options: ['报 3 万'] } }).cases[0];
    expect(next.nonActionOption).toBe(''); expect(next.chosen).toBe('');
  });
  it('不完整处境、无反证条件、失效选项或过去日期不能封存', () => {
    for (const patch of [{ aiPick: 0 }, { facts: ['这次不一样'] }, { chosen: '不存在' }, { openAt: iso(1) }]) {
      expect(completeIssues(decision(patch)).length).toBeGreaterThan(0);
    }
  });
  it('合法落槌后，不能 patch、撤回、再次落槌或变更原始记录', () => {
    const sealed = seal(state());
    expect(sealed.cases[0].status).toBe('sealed');
    expect(reducer(sealed, { type: 'case/patch', id: 'one', patch: { prediction: '改写' } })).toBe(sealed);
    expect(reducer(sealed, { type: 'case/abandon', id: 'one', reason: '情况变了' })).toBe(sealed);
    expect(seal(sealed)).toBe(sealed);
  });
  it('通用 patch 不接受身份、状态字段及超长输入', () => {
    const s = state();
    const next = reducer(s, { type: 'case/patch', id: 'one', patch: { status: 'archived', id: 'other' } });
    expect(next.cases[0].status).toBe('draft'); expect(next.cases[0].id).toBe('one');
    expect(reducer(s, { type: 'case/patch', id: 'one', patch: { facts: ['x'.repeat(61)] } })).toBe(s);
  });
  it('未到期直接回访不能写入；提前确认后草稿保留，原计划日期不变', () => {
    const s = seal(state());
    const draft = { result: '客户接受', verdict: 'same' as const, wrong: '', next: '' };
    expect(reducer(s, { type: 'case/review-draft', id: 'one', draft })).toBe(s);
    expect(reducer(s, { type: 'case/reopen', id: 'one', result: '客户接受', verdict: 'same', wrong: '', next: '' })).toBe(s);
    const early = reducer(s, { type: 'case/open-early', id: 'one' });
    expect(early.cases[0].openAt).toBe(iso(6));
    expect(early.cases[0].openedEarlyAt).toBe(instant.toISOString());
    const saved = reducer(early, { type: 'case/review-draft', id: 'one', draft });
    expect(parseState(JSON.parse(JSON.stringify(saved))).cases[0].reviewDraft).toEqual(draft);
    const archived = reducer(saved, { type: 'case/reopen', id: 'one', result: '客户接受', verdict: 'same', wrong: '', next: '' });
    expect(archived.cases[0].archivedAt).toBe(instant.toISOString());
    expect(archived.cases[0].reviewDraft).toBeUndefined();
    expect(reducer(archived, { type: 'case/review-draft', id: 'one', draft })).toBe(archived);
  });
});

describe('备份迁移、导入和异常保护', () => {
  let memory: Map<string, string>;
  beforeEach(() => {
    memory = new Map();
    vi.stubGlobal('localStorage', { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => memory.set(k, v) });
    loadState();
  });
  it('旧版备份补齐字段，不丢案卷', () => {
    const old = decision(); delete old.nonActionOption; delete old.furthestStep;
    const s = parseState({ version: 1, cases: [old] });
    expect(s.version).toBe(2); expect(s.cases[0].nonActionOption).toBe('不接'); expect(s.cases).toHaveLength(1);
  });
  it.each([
    { version: 99, cases: [] }, { version: 2, cases: [{}] }, state(decision({ gate: 'wrong' as never })),
    state(decision({ predictedP: NaN })), state(decision({ deadlineAt: 'invalid' })),
    state(decision({ sealHash: 12345678 as never })), { version: 2, cases: [decision(), decision()] },
  ])('拒绝不支持版本或不完整字段 %#', value => expect(() => parseState(value)).toThrow());
  it('合并保留相同 ID 的本机封存记录，仅新增其他记录', () => {
    const current = seal(state());
    const incoming = { version: 2, cases: [decision({ question: '试图覆盖' }), decision({ id: 'two' })] };
    const merged = mergeStates(current, incoming);
    expect(merged.cases).toHaveLength(2); expect(merged.cases[0]).toBe(current.cases[0]);
  });
  it('损坏原始数据不会被空记录自动覆盖', () => {
    memory.set(STORAGE_KEY, '{bad json');
    const loaded = loadState();
    expect(getReadIssue()).toBeTruthy(); expect(saveState(loaded).ok).toBe(false);
    expect(memory.get(STORAGE_KEY)).toBe('{bad json');
  });
  it('存储空间不足时向页面返回保存失败', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('quota'); } });
    expect(saveState(state())).toMatchObject({ ok: false });
  });
});

describe('期限和回看日期', () => {
  it('按本地日历天区分今天与已过期限，按精确时间决定开封', () => {
    expect(daysUntil(iso(2))).toBe(0); expect(daysUntil(iso(1))).toBe(-1);
    expect(isDue(iso(2))).toBe(false); expect(isDue(iso(1))).toBe(true);
    expect(reviewAvailable({ openAt: iso(6), openedEarlyAt: instant.toISOString() })).toBe(true);
  });
  it('拒绝空日期、溢出的日历日期', () => {
    expect(dateInputISO('')).toBeNull(); expect(dateInputISO('2026-02-30')).toBeNull();
    expect(dateInputISO('2026-11-02')).toBe(iso(2));
  });
});


describe('阅读版导出', () => {
  it('英文导出翻译旧记录中的四种撤回原因', () => {
    const reasons = ['不重要', '情况变了', '别人替我定了', '写下来发现不用选'] as const;
    const md = toMarkdown(reasons.map((reason, i) => decision({ id: `withdrawn-${i}`,
      question: 'Should I do it?', options: [], facts: [], distance: '', chosen: '', prediction: '',
      status: 'abandoned', abandReason: reason,
    })), instant, 'en');
    expect(md).toContain('The situation changed');
    expect(md).toContain('Someone else decided it');
    expect(md).not.toMatch(/[\u3400-\u9fff]/);
  });
  it('保留原计划时间、提前回看时间、反证条件与未归档的回访草稿', () => {
    const md = toMarkdown([decision({ openedEarlyAt: instant.toISOString(), falsifySignal: '3 天不回复就重新考虑',
      reviewDraft: { result: '接受报价', verdict: 'same', wrong: '范围判断成立', next: '确认账期' } })]);
    expect(md).toContain('原计划回看日'); expect(md).toContain('提前开封');
    expect(md).toContain('3 天不回复就重新考虑'); expect(md).toContain('回访草稿（未归档）');
    expect(md).toContain('确认账期');
  });

  it('英文导出使用英文标题和状态文案', () => {
    const md = toMarkdown([decision({
      question: 'What should I quote?', options: ['Quote 30k', 'Decline'], nonActionOption: 'Decline',
      facts: ['Repeat client'], distance: 'Ask for the scope first', chosen: 'Quote 30k',
      prediction: 'They accept in 3 days', result: 'Accepted', verdict: 'same', status: 'archived',
    })], instant, 'en');
    expect(md).toContain('# My decision log');
    expect(md).toContain('Reviewed');
    expect(md).toContain('Did it match what you expected');
    expect(md).not.toMatch(/[\u3400-\u9fff]/);
  });
});
