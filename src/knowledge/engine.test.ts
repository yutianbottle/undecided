import { describe, it, expect } from 'vitest';
import { lightUp, gateLedger, terrainPoint, calibration } from './engine';
import { getGate, gateBaseRate } from './gates';
import { CONCEPTS } from './concepts';
import { EDGES } from './edges';
import type { GateId, LightCard } from '../state/types';

const GATE_IDS: GateId[] = [
  'quoting',
  'accept',
  'pricing',
  'product',
  'hiring',
  'partner',
  'channel',
  'priceup',
];

const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));

/** 取出卡里引用的概念 id（rate / none 卡没有概念） */
function conceptIdOf(card: LightCard): string | null {
  return card.kind === 'bias' || card.kind === 'method' ? card.concept.id : null;
}


/** 从三张卡里取偏差卡的 id；取不到返回 undefined */
function biasId(cards: ReturnType<typeof lightUp>): string | undefined {
  const b = cards.find((c) => c.kind === 'bias');
  return b && b.kind === 'bias' ? b.concept.id : undefined;
}

describe('lightUp', () => {
  it.each(GATE_IDS)('%s 关口：返回 2–3 张卡，首张偏差、次张方法', (gate) => {
    const cards = lightUp(gate);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(cards[0].kind).toBe('bias');
    expect(cards[1].kind).toBe('method');
  });

  it.each(GATE_IDS)('%s 关口：每张卡引用的概念都在 CONCEPTS 里', (gate) => {
    for (const card of lightUp(gate)) {
      const id = conceptIdOf(card);
      if (id === null) continue;
      const concept = CONCEPT_BY_ID.get(id);
      expect(concept, `概念 ${id} 不在 CONCEPTS 中`).toBeDefined();
      expect(concept?.name).toBe(card.kind === 'bias' || card.kind === 'method' ? card.concept.name : '');
    }
  });

  it.each(GATE_IDS)('%s 关口：偏差卡引用的概念 kind 必须是 bias', (gate) => {
    const first = lightUp(gate)[0];
    if (first.kind !== 'bias') throw new Error(`首张卡不是 bias，实际是 ${first.kind}`);
    expect(first.concept.kind).toBe('bias');
  });

  it.each(GATE_IDS)('%s 关口：第三张一定存在且为 rate 或 none', (gate) => {
    const cards = lightUp(gate);
    expect(cards).toHaveLength(3);
    expect(['rate', 'none']).toContain(cards[2].kind);
  });

  it('product 关口：第三张是 rate 且带基准数字', () => {
    const cards = lightUp('product');
    const third = cards[2];
    if (third.kind !== 'rate') throw new Error(`product 第三张应为 rate，实际是 ${third.kind}`);
    expect(third.baseRate.length).toBeGreaterThan(0);
    expect(third.note.length).toBeGreaterThan(0);
  });

  it('quoting 关口：没有基准，第三张是 none', () => {
    const cards = lightUp('quoting');
    const third = cards[2];
    if (third.kind !== 'none') throw new Error(`quoting 第三张应为 none，实际是 ${third.kind}`);
    expect(typeof third.note).toBe('string');
    expect(third.note.length).toBeGreaterThan(0);
  });

  it('八个关口里只有 product 有 rate 卡', () => {
    const rateGates = GATE_IDS.filter((g) => lightUp(g)[2].kind === 'rate');
    expect(rateGates).toEqual(['product']);
  });

  it('偏差卡与它给出的方法卡不是同一个概念', () => {
    for (const gate of GATE_IDS) {
      const cards = lightUp(gate);
      if (cards[0].kind !== 'bias' || cards[1].kind !== 'method') continue;
      expect(cards[1].concept.id).not.toBe(cards[0].concept.id);
    }
  })
  it('随机：不同案卷抽到的偏差不只一种', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const id = biasId(lightUp('quoting', 'zh', `case-${i}`));
      if (id) seen.add(id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('随机带种子：同一件案卷反复打开给同一张', () => {
    for (const id of ['a1', 'b2', 'c3', '案例-7']) {
      expect(biasId(lightUp('quoting', 'zh', id))).toBe(biasId(lightUp('quoting', 'zh', id)));
    }
  });

  it('抽到哪张，方法就跟到哪张，不会缺', () => {
    for (let i = 0; i < 30; i++) {
      const cards = lightUp('quoting', 'zh', `s-${i}`);
      const bias = cards.find((c) => c.kind === 'bias');
      const method = cards.find((c) => c.kind === 'method');
      expect(bias).toBeTruthy();
      expect(method).toBeTruthy();
    }
  });

  it('数字种子与字符串种子都接受，负数不会崩', () => {
    expect(lightUp('quoting', 'zh', -5).length).toBeGreaterThan(0);
    expect(lightUp('quoting', 'zh', 0).length).toBeGreaterThan(0);
  });
;
});

describe('gateLedger', () => {
  it('product 关口：偏差 ≥2、方法 ≥2，且概念都合法', () => {
    const ledger = gateLedger('product');
    expect(ledger.gate.id).toBe('product');
    expect(ledger.biases.length).toBeGreaterThanOrEqual(2);
    expect(ledger.methods.length).toBeGreaterThanOrEqual(2);

    for (const b of ledger.biases) {
      expect(CONCEPT_BY_ID.get(b.concept.id)).toBeDefined();
      expect(b.weight).toBeGreaterThan(0);
      expect(b.weight).toBeLessThanOrEqual(1);
    }
    for (const m of ledger.methods) {
      expect(CONCEPT_BY_ID.get(m.id)).toBeDefined();
    }
  });

  it('product 关口：佐证边能取到（方向是 概念 → 关口）', () => {
    // 「佐证」「适用」边在 EDGES 里存成 概念 → 关口，所以 engine 必须用 edgesTo 回溯。
    // 早先误用 edgesFrom 时这里恒为空，而界面上看不出来——这条断言就是为了盯住它。
    const ledger = gateLedger('product');
    expect(ledger.evidences.length).toBeGreaterThan(0);
    expect(ledger.evidences.map((c) => c.id)).toContain('ev-cbinsights');
  });

  it('每条「适用 / 佐证」边都是 概念 → 关口 的方向', () => {
    for (const e of EDGES.filter((x) => x.relation === '适用' || x.relation === '佐证')) {
      expect(CONCEPT_BY_ID.get(e.from), `${e.from} 应该是概念`).toBeDefined();
      expect(GATE_IDS).toContain(e.to);
    }
  });

  it('偏差按权重从高到低排列', () => {
    const weights = gateLedger('product').biases.map((b) => b.weight);
    expect([...weights].sort((a, b) => b - a)).toEqual(weights);
  });

  it('other 关口不抛异常，返回空账本', () => {
    expect(() => gateLedger('other')).not.toThrow();
    const ledger = gateLedger('other');
    expect(ledger.gate.id).toBe('other');
    expect(ledger.biases).toEqual([]);
    expect(ledger.methods).toEqual([]);
  });

  it('英文账本中的卡片字段不回落为中文', () => {
    const cjk = /[\u3400-\u9fff]/;
    for (const gate of GATE_IDS) {
      const ledger = gateLedger(gate, 'en');
      for (const card of [...ledger.biases.map((x) => x.concept), ...ledger.methods, ...ledger.evidences]) {
        expect(card.name, `${gate}/${card.id} name`).not.toMatch(cjk);
        expect(card.oneLine, `${gate}/${card.id} oneLine`).not.toMatch(cjk);
        expect(card.whenToUse, `${gate}/${card.id} whenToUse`).not.toMatch(cjk);
        expect(card.whenNot, `${gate}/${card.id} whenNot`).not.toMatch(cjk);
        for (const step of card.howTo ?? []) expect(step, `${gate}/${card.id} howTo`).not.toMatch(cjk);
      }
    }
  });

  it('英文产品基准率使用英文文案', () => {
    const rate = gateBaseRate('product', 'en');
    expect(rate.baseRate).toContain('market need');
    expect(rate.note).toContain('failure causes');
    expect(rate.baseRate).not.toMatch(/[\u3400-\u9fff]/);
    expect(rate.note).not.toMatch(/[\u3400-\u9fff]/);
  });
});

describe('terrainPoint', () => {
  it('可逆性 1 → x=0，可逆性 5 → x=1', () => {
    expect(terrainPoint(1, 30).x).toBe(0);
    expect(terrainPoint(5, 30).x).toBe(1);
  });

  it('可逆性居中时 x 线性分布', () => {
    expect(terrainPoint(3, 30).x).toBeCloseTo(0.5, 10);
    expect(terrainPoint(4, 30).x).toBeCloseTo(0.75, 10);
  });

  it('反馈 365 天 → y≈1', () => {
    expect(terrainPoint(3, 365).y).toBeCloseTo(1, 5);
  });

  it('反馈周期越长 y 越大（对数压缩）', () => {
    const ys = [7, 30, 90, 180, 365].map((d) => terrainPoint(3, d).y);
    for (let i = 1; i < ys.length; i += 1) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]);
    }
  });

  it('反馈周期低于 7 天按 7 天封底', () => {
    expect(terrainPoint(3, 1).y).toBe(terrainPoint(3, 7).y);
    expect(terrainPoint(3, 0).y).toBe(terrainPoint(3, 7).y);
  });

  it('超出 365 天后 y 被截到 1', () => {
    expect(terrainPoint(3, 3650).y).toBe(1);
  });

  it('合法输入下 x、y 都落在 0..1', () => {
    for (let r = 1; r <= 5; r += 1) {
      for (const days of [1, 7, 30, 45, 90, 180, 365, 1200]) {
        const p = terrainPoint(r, days);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('calibration：你自己的预估偏差', () => {
  function c(i: number, expected: number | null, actual: number | null, gate = 'quoting'): any {
    return {
      id: `c${i}`, gate, question: 'q', deadlineKind: 'date', deadlineAt: '2026-11-01T00:00:00.000Z',
      options: ['a', 'b', 'c'], facts: [], aiPick: -1, aiGap: '', falsifySignal: '', distance: '',
      chosen: 'a', prediction: 'p', predictedP: 50, expectedNum: expected, actualNum: actual,
      sealedAt: '2026-10-01T00:00:00.000Z', sealHash: 'ABCD1234', openAt: '2026-11-01T00:00:00.000Z',
      result: 'r', verdict: 'same', wrongJudgment: '', nextChange: '', abandReason: '',
      status: 'archived', step: 7, skippedWait: false,
      createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
      nonActionOption: 'c', furthestStep: 6, openedEarlyAt: null, archivedAt: '2026-11-01T00:00:00.000Z',
    };
  }

  it('不足 3 对不给结论', () => {
    expect(calibration([c(1, 10, 15), c(2, 12, 18)], 'quoting')).toBeNull();
  });

  it('3 对就算', () => {
    const r = calibration([c(1, 10, 15), c(2, 8, 12), c(3, 12, 18)], 'quoting')!;
    expect(r.n).toBe(3);
    expect(r.avgExpected).toBe(10);
    expect(r.avgActual).toBe(15);
    expect(r.ratio).toBe(1.5);
    expect(r.unit).toBe('money');
  });

  it('没有天数的案卷不计入', () => {
    const r = calibration([c(1, 10, 15), c(2, 8, 12), c(3, 12, 18), c(4, null, null), c(5, 10, null)], 'quoting')!;
    expect(r.n).toBe(3);
  });

  it('按关口过滤：别的关口的案卷不算进来', () => {
    const cases = [c(1, 10, 15), c(2, 8, 12), c(3, 12, 18, 'pricing')];
    // quoting 只有 2 对，给不出结论
    expect(calibration(cases, 'quoting')).toBeNull();
    // pricing 那一条自己也不足 3 对
    expect(calibration(cases, 'pricing')).toBeNull();
  });

  it('用总和比，不让一单的极端值主导', () => {
    // 估 1 天用 10 天 + 估 100 天用 100 天 → 总和比 1.09，逐单比的均值会是 5.5
    const r = calibration([c(1, 1, 10), c(2, 100, 100), c(3, 100, 100)], 'quoting')!;
    expect(r.ratio).toBeCloseTo(210 / 201, 2);
  });

  it('实际比预估快时 ratio 小于 1', () => {
    const r = calibration([c(1, 20, 10), c(2, 20, 10), c(3, 20, 10)], 'quoting')!;
    expect(r.ratio).toBe(0.5);
  });
});

describe('关口的可比数：钱类收金额，人货类收天数', () => {
  const EXPECTED: Record<string, 'money' | 'days'> = {
    quoting: 'money', pricing: 'money', priceup: 'money', channel: 'money',
    accept: 'days', product: 'days', hiring: 'days', partner: 'days',
  };

  it('八个关口的单位都对', () => {
    for (const [id, unit] of Object.entries(EXPECTED)) {
      expect(getGate(id as any).measure.unit).toBe(unit);
    }
  });

  it('每个关口都有自己的落槌问法和回看问法，不共用一句', () => {
    const seen = new Set<string>();
    for (const id of Object.keys(EXPECTED)) {
      const m = getGate(id as any).measure;
      expect(m.expected.length).toBeGreaterThan(4);
      expect(m.actual.length).toBeGreaterThan(4);
      seen.add(m.expected);
    }
    expect(seen.size).toBe(8);
  });

  it('报价收金额，招人收天数', () => {
    expect(getGate('quoting').measure.unit).toBe('money');
    expect(getGate('quoting').measure.expected).toContain('报');
    expect(getGate('hiring').measure.unit).toBe('days');
    expect(getGate('hiring').measure.expected).toContain('招');
    // 金额类与天数类的问法在语义上不能互换
    expect(getGate('quoting').measure.expected).not.toBe(getGate('hiring').measure.expected);
  });
});
