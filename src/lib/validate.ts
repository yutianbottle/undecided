import type { DecisionCase, AbandReason } from '../state/types';

export const LIMITS = {
  question: 40,
  option: 20,
  fact: 60,
  facts: 3,
  distance: 80,
  prediction: 60,
  result: 40,
  wrong: 40,
  next: 40,
  abandReason: 20,
} as const;

/** 允许的"不行动"措辞。命中任一即视为已提供非行动选项。 */
const NON_ACTION = ['不做', '不接', '不招', '不涨', '不投', '不上', '不合伙', '不签', '不继续',
  '维持现状', '维持', '放弃', '暂不', '先不', '搁置', '放弃这个', '不扩张'];

export function hasNonAction(options: string[]): boolean {
  return options.some((o) => {
    const s = o.trim();
    if (!s) return false;
    // 不把所有以“不”开头的行动都当成维持现状。
    return NON_ACTION.some((k) => s.includes(k));
  });
}

/** "这次不一样"类自证句式 */
const SPECIAL = ['这次不一样', '这次不同', '情况特殊', '跟上次不一样', '和他们不一样', '和别的不一样'];

export function claimsSpecial(facts: string[]): boolean {
  return facts.some((f) => SPECIAL.some((k) => f.includes(k)));
}

export function needsFalsify(c: DecisionCase): boolean {
  return claimsSpecial(c.facts) && c.falsifySignal.trim().length === 0;
}

export type VLang = 'zh' | 'en';
const L = (lang: VLang, zh: string, en: string) => (lang === 'zh' ? zh : en);

export interface GateCheck { ok: boolean; miss: string[] }

/** 能否进入落槌（第 6 步） */
export function canRule(c: DecisionCase, lang: VLang = 'zh'): GateCheck {
  const miss: string[] = [];
  if (!c.question.trim()) miss.push(L(lang, '一句话问题', 'one-line question'));
  if (c.deadlineKind !== 'none' && (!c.deadlineAt || !Number.isFinite(Date.parse(c.deadlineAt)))) miss.push(L(lang, '期限', 'deadline'));
  const opts = c.options.map((o) => o.trim()).filter(Boolean);
  if (opts.length < 2) miss.push(L(lang, '至少两个选项', 'at least two options'));
  if (opts.length > 4) miss.push(L(lang, '选项不超过四个', 'no more than four options'));
  if (!hasMarkedNonAction(c)) miss.push(L(lang, '一个"不做/不接/维持现状"的选项', 'one do-nothing / decline option'));
  const facts = c.facts.map((f) => f.trim()).filter(Boolean);
  if (facts.length < 1) miss.push(L(lang, '至少一条可观察的事实', 'at least one observable fact'));
  if (!c.distance.trim()) miss.push(L(lang, '如果是朋友问我', 'what you would tell a friend'));
  if (c.aiPick >= 0 && c.aiPick < 3 && !c.aiGap.trim()) miss.push(L(lang, '它不知道的具体处境', 'what the AI does not know'));
  if (c.question.length > LIMITS.question || opts.some(o => o.length > LIMITS.option)
    || c.facts.length > LIMITS.facts || c.facts.some(f => f.length > LIMITS.fact)
    || c.distance.length > LIMITS.distance || c.falsifySignal.length > 80 || c.aiGap.length > 60) miss.push(L(lang, '内容字数上限', 'text over the limit'));
  if (needsFalsify(c)) miss.push(L(lang, '「这次不一样」的证伪信号', 'a signal that would prove you wrong'));
  return { ok: miss.length === 0, miss };
}

export interface RuleCheck { ok: boolean; miss: string[] }

/** 能否落槌（第 6 步提交） */
export function canSeal(c: DecisionCase, lang: VLang = 'zh'): RuleCheck {
  const miss: string[] = [];
  if (!c.chosen.trim()) miss.push(L(lang, '选哪一个', 'which option you chose'));
  if (!c.prediction.trim()) miss.push(L(lang, '一句话预测', 'a one-line prediction'));
  if (!Number.isInteger(c.predictedP) || c.predictedP < 1 || c.predictedP > 99) miss.push(L(lang, '预测概率（1–99）', 'a probability (1–99)'));
  if (c.prediction.length > LIMITS.prediction) miss.push(L(lang, '预测不超过 60 字', 'prediction under 60 characters'));
  if (c.prediction.trim() && !/[\d一二三四五六七八九十百千万年月日天周季]/.test(c.prediction)) miss.push(L(lang, '预测里要有可验证的数字或时间', 'prediction needs a checkable number or date'));
  return { ok: miss.length === 0, miss };
}

/** 检测形容词式表述，返回给用户的改写提示（不拦截） */
const VAGUE = ['很难', '很大', '很多', '很少', '不错', '不好', '感觉', '应该', '大概', '可能吧', '挺好的'];

export function vagueHits(text: string): string[] {
  return VAGUE.filter((w) => text.includes(w));
}

export const ABAND_REASONS: AbandReason[] = ['不重要', '情况变了', '别人替我定了', '写下来发现不用选'];

export function clampText(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max);
}

export function hasMarkedNonAction(c: DecisionCase): boolean {
  return c.nonActionOption === undefined ? hasNonAction(c.options)
    : !!c.nonActionOption.trim() && c.options.includes(c.nonActionOption);
}

/** 页面和数据层共用，检查目标步骤之前的所有约束。内部 2–6 对应七步中的 1–5。 */
export function stepIssues(c: DecisionCase, target: number, lang: VLang = 'zh'): string[] {
  const miss: string[] = [];
  if (target >= 3) {
    if (c.options.filter(o => o.trim()).length < 2) miss.push(L(lang, '至少两个选项', 'at least two options'));
    if (!hasMarkedNonAction(c)) miss.push(L(lang, '标记一个非行动选项', 'mark a do-nothing option'));
  }
  if (target >= 4) {
    if (!c.facts.some(f => f.trim())) miss.push(L(lang, '至少一条可观察的事实', 'at least one observable fact'));
    if (needsFalsify(c)) miss.push(L(lang, '「这次不一样」的证伪信号', 'a signal that would prove you wrong'));
    if (c.aiPick >= 0 && c.aiPick < 3 && !c.aiGap.trim()) miss.push(L(lang, '它不知道的具体处境', 'what the AI does not know'));
  }
  if (target >= 5 && !c.distance.trim()) miss.push(L(lang, '如果是朋友问我', 'what you would tell a friend'));
  if (target >= 6) return [...new Set([...miss, ...canRule(c, lang).miss])];
  return miss;
}

export function completeIssues(c: DecisionCase, lang: VLang = 'zh'): string[] {
  const miss = [...canRule(c, lang).miss, ...canSeal(c, lang).miss];
  if (c.chosen && !c.options.includes(c.chosen)) miss.push(L(lang, '从当前选项中选择', 'choose from your current options'));
  if (!c.openAt || !Number.isFinite(Date.parse(c.openAt)) || Date.parse(c.openAt) <= Date.now()) miss.push(L(lang, '未来的回看日期', 'a future review date'));
  return [...new Set(miss)];
}
