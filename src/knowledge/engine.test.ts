import { describe, it, expect } from 'vitest';
import { lightUp, gateLedger, terrainPoint } from './engine';
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
  });
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
