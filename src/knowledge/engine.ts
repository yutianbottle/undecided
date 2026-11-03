import type { Concept, DecisionCase, GateId, LightCard } from '../state/types';
import { getGate, gateBaseRate } from './gates';
import { CONCEPT_EN } from '../i18n/content.en';
import { getConcept } from './concepts';
import { edgesFrom, edgesTo, primaryMethod } from './edges';

export type LangCode = 'zh' | 'en';

/** 按语言取卡片文案；缺英文时回落到中文，不显示空白 */
function loc(c: Concept | undefined, lang: LangCode): Concept | undefined {
  if (!c || lang === 'zh') return c;
  const e = CONCEPT_EN[c.id];
  return e ? { ...c, ...e } : c;
}

/**
 * 照明：规则匹配，无 LLM。
 * 三张：本轮该看的偏差 → 它的可做动作 → 有没有数。
 * 拿不到就少给一张，宁可少，不许编。
 *
 * 偏差从该关口的「易犯」边里随机抽，不挑最贴切的——挑最贴的，
 * 第 5 次看到的还是第 1 次那张，卡就退化成背景噪音。
 *
 * 但随机是带种子的（seed 用案卷 id）：同一件案卷反复打开给同一张，
 * 换个案卷换一张。否则页面上一个随机数每次重渲染都跳，像坏了。
 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function lightUp(gate: GateId, lang: LangCode = 'zh', seed: string | number = 0): LightCard[] {
  const cards: LightCard[] = [];
  const n = typeof seed === 'string' ? hashSeed(seed) : Math.abs(Math.trunc(seed));

  const pool = edgesFrom(gate, '易犯');
  const biasEdge = pool.length ? pool[n % pool.length] : undefined;
  const bias: Concept | undefined = loc(biasEdge ? getConcept(biasEdge.to) : undefined, lang);
  if (bias) cards.push({ kind: 'bias', concept: bias });

  let method: Concept | undefined;
  // 先给「这个偏差」的解法，而不是关口通用的那个——药要跟着病走
  if (bias) {
    const mEdge = edgesFrom(bias.id, '可解')[0];
    if (mEdge) method = loc(getConcept(mEdge.to), lang);
  }
  if (!method) {
    const primary = primaryMethod(gate);
    if (primary) method = loc(getConcept(primary), lang);
  }
  if (!method) {
    // 「适用」边存成 概念 → 关口，所以从关口往回找
    const alt = edgesTo(gate, '适用')[0];
    if (alt) method = getConcept(alt.from);
  }
  if (method) cards.push({ kind: 'method', concept: method });

  const { baseRate, note } = gateBaseRate(gate, lang);
  if (baseRate) {
    cards.push({ kind: 'rate', baseRate, note });
  } else {
    /**
     * 报价与定价这两类，账本页有一张能算完的卡（成本底价）。
     * 照明本身仍然只读——这里只提示存在一个可算的数，不把输入框搬进卡片。
     */
    const calculable = gate === 'quoting' || gate === 'pricing';
    const hint = calculable
      ? lang === 'zh'
        ? '\n\n这单有一个能算的数：成本底价。翻到账本的「成本底价」卡，填两个数就有了。'
        : '\n\nThere is one number you can work out here: the floor price. On the ledger page, under the cost-floor card, fill in two values.'
      : '';
    cards.push({ kind: 'none', note: note + hint });
  }
  return cards;
}

/** 关口账本：该类决定的全部知识，按类型分组 */
export function gateLedger(gate: GateId, lang: LangCode = 'zh') {
  const g = getGate(gate);
  const biases = edgesFrom(gate, '易犯')
    .map((e) => ({ concept: loc(getConcept(e.to), lang), weight: e.weight }))
    .filter((x): x is { concept: Concept; weight: number } => Boolean(x.concept));

  const methods = new Map<string, Concept>();
  for (const b of biases) {
    for (const e of edgesFrom(b.concept.id, '可解')) {
      const c = loc(getConcept(e.to), lang);
      if (c) methods.set(c.id, c);
    }
  }
  const pm = primaryMethod(gate);
  const pmConcept = pm ? loc(getConcept(pm), lang) : undefined;
  if (pmConcept) methods.set(pmConcept.id, pmConcept);
  for (const e of edgesTo(gate, '适用')) {
    const c = loc(getConcept(e.from), lang);
    if (c) methods.set(c.id, c);
  }

  // 同样：「佐证」边是 证据 → 关口
  const evidences = edgesTo(gate, '佐证')
    .map((e) => loc(getConcept(e.from), lang))
    .filter((c): c is Concept => Boolean(c));

  return { gate: g, biases, methods: [...methods.values()], evidences };
}

/** 地形图坐标：可逆性 1–5 → x；反馈周期 → y（对数压缩到 0–1） */
export function terrainPoint(reversibility: number, feedbackDays: number) {
  const x = (reversibility - 1) / 4;
  const y = Math.min(1, Math.log10(Math.max(7, feedbackDays)) / Math.log10(365));
  return { x, y };
}

/** 你自己的校准数据：预估天数 vs 实际天数 */
export interface Calibration {
  /** 成对的样本数 */
  n: number;
  avgExpected: number;
  avgActual: number;
  /** 实际 ÷ 预估；1.2 表示实际比你预想的多两成 */
  ratio: number;
  /** 数字的单位，由关口决定 */
  unit: 'money' | 'days';
}

/**
 * 至少 3 对才算——一两单算不出"你这个人偏乐观"，
 * 只会让用户拿一个噪音当结论。
 */
export const CALIBRATION_MIN = 3;

export function calibration(cases: DecisionCase[], gate: GateId): Calibration | null {
  const pairs = cases.filter(
    (c) =>
      c.status === 'archived' &&
      c.gate === gate &&
      typeof c.expectedNum === 'number' &&
      typeof c.actualNum === 'number' &&
      c.expectedNum > 0 &&
      c.actualNum >= 0,
  );
  if (pairs.length < CALIBRATION_MIN) return null;

  let se = 0;
  let sa = 0;
  for (const c of pairs) {
    se += c.expectedNum as number;
    sa += c.actualNum as number;
  }
  // 用总和比，而不是逐单比值的平均：一单估 1 天用了 10 天，不该把结论拉到十倍
  const ratio = se > 0 ? sa / se : 1;
  return {
    n: pairs.length,
    avgExpected: Math.round((se / pairs.length) * 10) / 10,
    avgActual: Math.round((sa / pairs.length) * 10) / 10,
    ratio: Math.round(ratio * 100) / 100,
    unit: getGate(gate).measure.unit,
  };
}

/** 某个关口已经填了几对（落槌估了、回看也填了） */
export function calibrationFilled(cases: DecisionCase[], gate: GateId): number {
  return cases.filter(
    (c) =>
      c.gate === gate &&
      c.status === 'archived' &&
      typeof c.expectedNum === 'number' &&
      typeof c.actualNum === 'number' &&
      c.expectedNum > 0 &&
      c.actualNum >= 0,
  ).length;
}
