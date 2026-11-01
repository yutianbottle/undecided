import type { Edge } from '../state/types';

/** 关口 --易犯--> 偏差 --可解--> 方法；方法 --适用--> 关口 */
export const EDGES: Edge[] = [
  /* 报价 */
  { from: 'quoting', to: 'anchoring', relation: '易犯', weight: 0.92 },
  { from: 'quoting', to: 'single-option', relation: '易犯', weight: 0.74 },
  { from: 'quoting', to: 'planning-fallacy', relation: '易犯', weight: 0.58 },
  { from: 'anchoring', to: 'three-tier-quote', relation: '可解', weight: 0.86 },
  { from: 'anchoring', to: 'reference-class', relation: '可解', weight: 0.62 },
  { from: 'single-option', to: 'three-tier-quote', relation: '可解', weight: 0.70 },
  { from: 'planning-fallacy', to: 'range-not-point', relation: '可解', weight: 0.66 },
  { from: 'three-tier-quote', to: 'quoting', relation: '适用', weight: 0.9 },
  { from: 'reference-class', to: 'quoting', relation: '适用', weight: 0.6 },

  /* 接单 */
  { from: 'accept', to: 'availability', relation: '易犯', weight: 0.68 },
  { from: 'accept', to: 'loss-aversion', relation: '易犯', weight: 0.62 },
  { from: 'accept', to: 'intention-gap', relation: '易犯', weight: 0.48 },
  { from: 'availability', to: 'reference-class', relation: '可解', weight: 0.74 },
  { from: 'loss-aversion', to: 'client-quadrant', relation: '可解', weight: 0.60 },
  { from: 'intention-gap', to: 'ninety-day', relation: '可解', weight: 0.55 },
  { from: 'client-quadrant', to: 'accept', relation: '适用', weight: 0.9 },

  /* 定价 */
  { from: 'pricing', to: 'anchoring', relation: '易犯', weight: 0.80 },
  { from: 'pricing', to: 'loss-aversion', relation: '易犯', weight: 0.56 },
  { from: 'pricing', to: 'sunk-cost', relation: '易犯', weight: 0.44 },
  { from: 'anchoring', to: 'range-not-point', relation: '可解', weight: 0.50 },
  { from: 'loss-aversion', to: 'staged-price-increase', relation: '可解', weight: 0.58 },
  { from: 'staged-price-increase', to: 'pricing', relation: '适用', weight: 0.8 },
  { from: 'staged-price-increase', to: 'priceup', relation: '适用', weight: 0.9 },

  /* 取舍 */
  { from: 'product', to: 'sunk-cost', relation: '易犯', weight: 0.95 },
  { from: 'product', to: 'confirmation', relation: '易犯', weight: 0.80 },
  { from: 'product', to: 'planning-fallacy', relation: '易犯', weight: 0.70 },
  { from: 'sunk-cost', to: 'reversibility', relation: '可解', weight: 0.82 },
  { from: 'sunk-cost', to: 'kill-criteria', relation: '可解', weight: 0.74 },
  { from: 'confirmation', to: 'premortem', relation: '可解', weight: 0.88 },
  { from: 'confirmation', to: 'reference-class', relation: '可解', weight: 0.52 },
  { from: 'planning-fallacy', to: 'ninety-day', relation: '可解', weight: 0.64 },
  { from: 'premortem', to: 'product', relation: '适用', weight: 0.9 },
  { from: 'kill-criteria', to: 'product', relation: '适用', weight: 0.85 },
  { from: 'self-distancing', to: 'product', relation: '适用', weight: 0.7 },
  { from: 'ev-cbinsights', to: 'product', relation: '佐证', weight: 0.9 },

  /* 招人 */
  { from: 'hiring', to: 'planning-fallacy', relation: '易犯', weight: 0.62 },
  { from: 'hiring', to: 'confirmation', relation: '易犯', weight: 0.58 },
  { from: 'hiring', to: 'single-option', relation: '易犯', weight: 0.50 },
  { from: 'planning-fallacy', to: 'range-not-point', relation: '可解', weight: 0.5 },
  { from: 'single-option', to: 'premortem', relation: '可解', weight: 0.55 },
  { from: 'ninety-day', to: 'hiring', relation: '适用', weight: 0.85 },
  { from: 'self-distancing', to: 'hiring', relation: '适用', weight: 0.55 },

  /* 合伙 */
  { from: 'partner', to: 'single-option', relation: '易犯', weight: 0.72 },
  { from: 'partner', to: 'confirmation', relation: '易犯', weight: 0.64 },
  { from: 'partner', to: 'loss-aversion', relation: '易犯', weight: 0.52 },
  { from: 'single-option', to: 'reversibility', relation: '可解', weight: 0.72 },
  { from: 'confirmation', to: 'premortem', relation: '可解', weight: 0.78 },
  { from: 'reversibility', to: 'partner', relation: '适用', weight: 0.9 },
  { from: 'self-distancing', to: 'partner', relation: '适用', weight: 0.6 },

  /* 渠道 */
  { from: 'channel', to: 'availability', relation: '易犯', weight: 0.66 },
  { from: 'channel', to: 'planning-fallacy', relation: '易犯', weight: 0.70 },
  { from: 'channel', to: 'sunk-cost', relation: '易犯', weight: 0.46 },
  { from: 'availability', to: 'single-channel', relation: '可解', weight: 0.70 },
  { from: 'planning-fallacy', to: 'kill-criteria', relation: '可解', weight: 0.66 },
  { from: 'single-channel', to: 'channel', relation: '适用', weight: 0.9 },

  /* 涨价 */
  { from: 'priceup', to: 'loss-aversion', relation: '易犯', weight: 0.84 },
  { from: 'priceup', to: 'anchoring', relation: '易犯', weight: 0.68 },
  { from: 'priceup', to: 'availability', relation: '易犯', weight: 0.38 },
  { from: 'anchoring', to: 'three-tier-quote', relation: '可解', weight: 0.58 },
  { from: 'loss-aversion', to: 'reference-class', relation: '可解', weight: 0.60 },
  { from: 'three-tier-quote', to: 'priceup', relation: '适用', weight: 0.55 },

  /* 第二批：把每个关口的偏差池补到 6 个 */
  { from: 'quoting', to: 'overconfidence', relation: '易犯', weight: 0.70 },
  { from: 'quoting', to: 'framing', relation: '易犯', weight: 0.50 },
  { from: 'quoting', to: 'hyperbolic', relation: '易犯', weight: 0.45 },
  { from: 'accept', to: 'status-quo', relation: '易犯', weight: 0.50 },
  { from: 'accept', to: 'escalation', relation: '易犯', weight: 0.44 },
  { from: 'pricing', to: 'endowment', relation: '易犯', weight: 0.75 },
  { from: 'pricing', to: 'framing', relation: '易犯', weight: 0.55 },
  { from: 'pricing', to: 'overconfidence', relation: '易犯', weight: 0.50 },
  { from: 'product', to: 'escalation', relation: '易犯', weight: 0.85 },
  { from: 'product', to: 'status-quo', relation: '易犯', weight: 0.60 },
  { from: 'product', to: 'hindsight', relation: '易犯', weight: 0.40 },
  { from: 'hiring', to: 'overconfidence', relation: '易犯', weight: 0.60 },
  { from: 'hiring', to: 'status-quo', relation: '易犯', weight: 0.50 },
  { from: 'hiring', to: 'hindsight', relation: '易犯', weight: 0.45 },
  { from: 'partner', to: 'overconfidence', relation: '易犯', weight: 0.65 },
  { from: 'partner', to: 'escalation', relation: '易犯', weight: 0.60 },
  { from: 'partner', to: 'hyperbolic', relation: '易犯', weight: 0.40 },
  { from: 'channel', to: 'overconfidence', relation: '易犯', weight: 0.60 },
  { from: 'channel', to: 'mental-accounting', relation: '易犯', weight: 0.55 },
  { from: 'channel', to: 'framing', relation: '易犯', weight: 0.40 },
  { from: 'priceup', to: 'status-quo', relation: '易犯', weight: 0.70 },
  { from: 'priceup', to: 'endowment', relation: '易犯', weight: 0.50 },
  { from: 'priceup', to: 'framing', relation: '易犯', weight: 0.45 },

  /* 新偏差的解法 */
  { from: 'overconfidence', to: 'base-rate-check', relation: '可解', weight: 0.75 },
  { from: 'overconfidence', to: 'decision-matrix', relation: '可解', weight: 0.50 },
  { from: 'status-quo', to: 'ten-ten-ten', relation: '可解', weight: 0.60 },
  { from: 'status-quo', to: 'reversibility', relation: '可解', weight: 0.55 },
  { from: 'endowment', to: 'cost-floor', relation: '可解', weight: 0.60 },
  { from: 'framing', to: 'decision-matrix', relation: '可解', weight: 0.55 },
  { from: 'framing', to: 'reverse-assumption', relation: '可解', weight: 0.50 },
  { from: 'escalation', to: 'kill-criteria', relation: '可解', weight: 0.80 },
  { from: 'escalation', to: 'precommitment', relation: '可解', weight: 0.60 },
  { from: 'hindsight', to: 'prediction-log', relation: '可解', weight: 0.85 },
  { from: 'mental-accounting', to: 'cost-floor', relation: '可解', weight: 0.70 },
  { from: 'hyperbolic', to: 'ten-ten-ten', relation: '可解', weight: 0.62 },

  /* 新方法挂到关口 */
  { from: 'decision-matrix', to: 'product', relation: '适用', weight: 0.7 },
  { from: 'decision-matrix', to: 'hiring', relation: '适用', weight: 0.65 },
  { from: 'decision-matrix', to: 'partner', relation: '适用', weight: 0.6 },
  { from: 'ten-ten-ten', to: 'accept', relation: '适用', weight: 0.6 },
  { from: 'ten-ten-ten', to: 'partner', relation: '适用', weight: 0.55 },
  { from: 'prediction-log', to: 'product', relation: '适用', weight: 0.6 },
  { from: 'prediction-log', to: 'channel', relation: '适用', weight: 0.55 },
  { from: 'reverse-assumption', to: 'product', relation: '适用', weight: 0.55 },
  { from: 'cost-floor', to: 'quoting', relation: '适用', weight: 0.75 },
  { from: 'cost-floor', to: 'pricing', relation: '适用', weight: 0.7 },
  { from: 'five-questions', to: 'accept', relation: '适用', weight: 0.6 },
  { from: 'five-questions', to: 'channel', relation: '适用', weight: 0.55 },
  { from: 'precommitment', to: 'accept', relation: '适用', weight: 0.55 },
  { from: 'precommitment', to: 'quoting', relation: '适用', weight: 0.5 },
  { from: 'base-rate-check', to: 'product', relation: '适用', weight: 0.65 },
  { from: 'base-rate-check', to: 'channel', relation: '适用', weight: 0.6 },
  { from: 'denominator-first', to: 'product', relation: '适用', weight: 0.45 },
  { from: 'single-point-curse', to: 'quoting', relation: '适用', weight: 0.5 },
  { from: 'single-point-curse', to: 'product', relation: '适用', weight: 0.55 },

  /* 本土情境：接单与合伙是"人情"最集中的两个关口 */
  { from: 'accept', to: 'guanxi-loss', relation: '易犯', weight: 0.66 },
  { from: 'accept', to: 'reciprocity', relation: '易犯', weight: 0.58 },
  { from: 'quoting', to: 'unsettled-debt', relation: '易犯', weight: 0.52 },
  { from: 'partner', to: 'guanxi-loss', relation: '易犯', weight: 0.80 },
  { from: 'guanxi-loss', to: 'relation-cap', relation: '可解', weight: 0.62 },
  { from: 'reciprocity', to: 'relation-cap', relation: '可解', weight: 0.70 },
  { from: 'unsettled-debt', to: 'relation-cap', relation: '可解', weight: 0.55 },
  { from: 'relation-cap', to: 'accept', relation: '适用', weight: 0.7 },

  /* 通用原则挂载 */
  { from: 'marginal-only', to: 'product', relation: '适用', weight: 0.6 },
  { from: 'record-over-memory', to: 'product', relation: '适用', weight: 0.4 },
  { from: 'ev-optimism-bias', to: 'channel', relation: '佐证', weight: 0.3 },
  { from: 'record-over-memory', to: 'quoting', relation: '适用', weight: 0.3 },
];

/**
 * 首推：这个关口最该用的那一个方法。
 * 不靠 bias → method 推导——同一个偏差在不同关口需要的解法不同，
 * 通用解法排在前面会在"招人"给出"用区间不用点"这种错药。
 */
export const PRIMARY: { from: string; to: string; relation: '首推'; weight: number }[] = [
  { from: 'quoting', to: 'three-tier-quote', relation: '首推', weight: 1 },
  { from: 'accept', to: 'client-quadrant', relation: '首推', weight: 1 },
  { from: 'pricing', to: 'staged-price-increase', relation: '首推', weight: 1 },
  { from: 'product', to: 'kill-criteria', relation: '首推', weight: 1 },
  { from: 'hiring', to: 'ninety-day', relation: '首推', weight: 1 },
  { from: 'partner', to: 'reversibility', relation: '首推', weight: 1 },
  { from: 'channel', to: 'single-channel', relation: '首推', weight: 1 },
  { from: 'priceup', to: 'staged-price-increase', relation: '首推', weight: 1 },
];

export function edgesFrom(id: string, relation?: Edge['relation']): Edge[] {
  return EDGES
    .filter((e) => e.from === id && (!relation || e.relation === relation))
    .sort((a, b) => b.weight - a.weight);
}

export function primaryMethod(gate: string): string | null {
  return PRIMARY.find((e) => e.from === gate)?.to ?? null;
}

export function edgesTo(id: string, relation?: Edge['relation']): Edge[] {
  return EDGES
    .filter((e) => e.to === id && (!relation || e.relation === relation))
    .sort((a, b) => b.weight - a.weight);
}
