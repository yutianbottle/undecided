import { describe, it, expect } from 'vitest';
import {
  LIMITS,
  hasNonAction,
  claimsSpecial,
  needsFalsify,
  canRule,
  canSeal,
  vagueHits,
  ABAND_REASONS,
  clampText,
} from './validate';
import type { DecisionCase } from '../state/types';

/** 字段齐全的最小案卷，按需覆盖 */
function makeCase(over: Partial<DecisionCase> = {}): DecisionCase {
  return {
    id: 'case-1',
    gate: 'quoting',
    question: '',
    deadlineKind: 'none',
    deadlineAt: null,
    options: [],
    facts: [],
    aiPick: -1,
    aiGap: '',
    falsifySignal: '',
    distance: '',
    verdict: '',
    chosen: '',
    prediction: '',
    predictedP: 50,
    sealedAt: null,
    sealHash: null,
    openAt: null,
    result: '',
    wrongJudgment: '',
    nextChange: '',
    abandReason: '',
    status: 'draft',
    step: 1,
    skippedWait: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

/** 刚好能过 canRule 的案卷 */
function ruledCase(over: Partial<DecisionCase> = {}): DecisionCase {
  return makeCase({
    question: '要不要接这个客户的单',
    deadlineKind: 'none',
    deadlineAt: null,
    options: ['接这个单', '不接'],
    facts: ['客户过去 3 次都拖款 30 天'],
    falsifySignal: '',
    distance: '如果是朋友问我，我会说先看现金流',
    ...over,
  });
}

describe('hasNonAction', () => {
  const cases: Array<[string, string[], boolean]> = [
    ['只有「不做」', ['不做'], true],
    ['只有「不接」', ['不接'], true],
    ['只有「维持现状」', ['维持现状'], true],
    ['两个报价选项，没有非行动项', ['报 3.2 万', '报 2.6 万'], false],
    ['空数组', [], false],
    ['只有「不涨」', ['不涨'], true],
    ['只含空字符串', [''], false],
    ['只有空白字符串', ['', '   '], false],
  ];

  it.each(cases)('%s → %s', (_name, options, expected) => {
    expect(hasNonAction(options)).toBe(expected);
  });

  it('选项里任意一条是非行动项即算命中', () => {
    expect(hasNonAction(['按我算的价报', '降一档报', '不做'])).toBe(true);
  });
});

describe('claimsSpecial', () => {
  it('含「这次不一样」为真', () => {
    expect(claimsSpecial(['这次不一样，客户是大公司'])).toBe(true);
  });

  it('含其他自证句式也为真', () => {
    expect(claimsSpecial(['情况特殊，这个行业周期长'])).toBe(true);
  });

  it('普通事实为假', () => {
    expect(claimsSpecial(['客户过去 3 次都拖款 30 天', '这单占用 6 周'])).toBe(false);
  });

  it('空事实列表为假', () => {
    expect(claimsSpecial([])).toBe(false);
  });
});

describe('needsFalsify', () => {
  it('说了「这次不一样」但没填证伪信号 → 需要补', () => {
    const c = makeCase({ facts: ['这次不一样，对方说会长期合作'], falsifySignal: '' });
    expect(needsFalsify(c)).toBe(true);
  });

  it('填了 falsifySignal → 不再需要补', () => {
    const c = makeCase({
      facts: ['这次不一样，对方说会长期合作'],
      falsifySignal: '3 个月内复购低于 2 单',
    });
    expect(needsFalsify(c)).toBe(false);
  });

  it('没出现自证句式时，即使证伪信号为空也返回假', () => {
    const c = makeCase({ facts: ['客户已经付了定金'], falsifySignal: '' });
    expect(needsFalsify(c)).toBe(false);
  });
});

describe('canRule', () => {
  it('全空案卷不通过，且提示缺一句话问题', () => {
    const r = canRule(makeCase());
    expect(r.ok).toBe(false);
    expect(r.miss).toContain('一句话问题');
    expect(r.miss.length).toBeGreaterThan(1);
  });

  it('补齐最小合格案卷后通过', () => {
    const r = canRule(ruledCase());
    expect(r.miss).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('两个选项但没有非行动选项 → 不通过', () => {
    const r = canRule(ruledCase({ options: ['报 3.2 万', '报 2.6 万'] }));
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('不做'))).toBe(true);
  });

  it('只有一条事实时通过；事实为空则不通过', () => {
    expect(canRule(ruledCase()).ok).toBe(true);
    const r = canRule(ruledCase({ facts: ['', '  '] }));
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('事实'))).toBe(true);
  });

  it('缺少「如果是朋友问我」的距离描述 → 不通过', () => {
    const r = canRule(ruledCase({ distance: '   ' }));
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('朋友'))).toBe(true);
  });

  it('说了「这次不一样」却没填证伪信号 → 被拦截', () => {
    const r = canRule(
      ruledCase({ facts: ['这次不一样，客户承诺会长期合作'], falsifySignal: '' }),
    );
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('证伪信号'))).toBe(true);
  });

  it('补上证伪信号后放行', () => {
    const r = canRule(
      ruledCase({
        facts: ['这次不一样，客户承诺会长期合作'],
        falsifySignal: '90 天内没有第二单',
      }),
    );
    expect(r.miss).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('选了有 deadlineKind 却没填日期 → 缺期限', () => {
    const r = canRule(ruledCase({ deadlineKind: 'date', deadlineAt: null }));
    expect(r.ok).toBe(false);
    expect(r.miss).toContain('期限');
  });
});

describe('canSeal', () => {
  it('预测概率为 0 → 不通过', () => {
    const r = canSeal(
      makeCase({ chosen: '接', prediction: '3 个月内回款 4.2 万', predictedP: 0 }),
    );
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('预测概率'))).toBe(true);
  });

  it('预测概率为 100 → 不通过', () => {
    const r = canSeal(
      makeCase({ chosen: '接', prediction: '3 个月内回款 4.2 万', predictedP: 100 }),
    );
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('预测概率'))).toBe(true);
  });

  it('边界值 1 与 99 可以通过', () => {
    expect(
      canSeal(makeCase({ chosen: '接', prediction: '30 天回款 2 万', predictedP: 1 })).ok,
    ).toBe(true);
    expect(
      canSeal(makeCase({ chosen: '接', prediction: '30 天回款 2 万', predictedP: 99 })).ok,
    ).toBe(true);
  });

  it('预测里没有数字或时间 → 提示补数字或时间', () => {
    const r = canSeal(makeCase({ chosen: '接', prediction: '客户会很满意', predictedP: 70 }));
    expect(r.ok).toBe(false);
    expect(r.miss.some((m) => m.includes('数字或时间'))).toBe(true);
  });

  it('没写选哪个 → 不通过', () => {
    const r = canSeal(makeCase({ chosen: ' ', prediction: '30 天回款 2 万', predictedP: 70 }));
    expect(r.ok).toBe(false);
    expect(r.miss).toContain('选哪一个');
  });

  it('合格输入 → 通过且 miss 为空', () => {
    const r = canSeal(
      makeCase({ chosen: '接这个单', prediction: '3 个月内回款 4.2 万', predictedP: 70 }),
    );
    expect(r.miss).toEqual([]);
    expect(r.ok).toBe(true);
  });
});

describe('clampText', () => {
  it('未超长时原样返回', () => {
    expect(clampText('三档报价', LIMITS.question)).toBe('三档报价');
  });

  it('超长时截断到上限', () => {
    expect(clampText('abcdef', 3)).toBe('abc');
    expect(clampText('x'.repeat(LIMITS.question + 10), LIMITS.question)).toHaveLength(
      LIMITS.question,
    );
  });

  it('空串与 0 上限不出错', () => {
    expect(clampText('', 10)).toBe('');
    expect(clampText('abc', 0)).toBe('');
  });

  it('恰好等于上限时不截断', () => {
    expect(clampText('abcd', 4)).toBe('abcd');
  });
});

describe('vagueHits 与 ABAND_REASONS', () => {
  it('命中多个形容词式表述', () => {
    const hits = vagueHits('这个客户很难搞，感觉不好');
    expect(hits).toContain('很难');
    expect(hits).toContain('感觉');
    expect(hits).toContain('不好');
  });

  it('具体表述不命中', () => {
    expect(vagueHits('客户过去 3 次都拖款 30 天')).toEqual([]);
  });

  it('放弃原因固定四个且含「情况变了」', () => {
    expect(ABAND_REASONS).toHaveLength(4);
    expect(ABAND_REASONS).toContain('情况变了');
  });
});
