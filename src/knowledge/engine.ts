import type { GateId, LightCard, Concept } from '../state/types';
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
 * 固定三张：最可能栽的偏差 → 对应的可做动作 → 有没有数。
 * 拿不到就少给一张，宁可少，不许编。
 */
export function lightUp(gate: GateId, lang: LangCode = 'zh'): LightCard[] {
  const cards: LightCard[] = [];

  const biasEdge = edgesFrom(gate, '易犯')[0];
  const bias: Concept | undefined = loc(biasEdge ? getConcept(biasEdge.to) : undefined, lang);
  if (bias) cards.push({ kind: 'bias', concept: bias });

  let method: Concept | undefined;
  // 先看这个关口指定的首选方法，再退回到「偏差 → 解法」
  const primary = primaryMethod(gate);
  if (primary) method = loc(getConcept(primary), lang);
  if (!method && bias) {
    const mEdge = edgesFrom(bias.id, '可解')[0];
    if (mEdge) method = loc(getConcept(mEdge.to), lang);
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
