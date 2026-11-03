export type GateId =
  | 'quoting' | 'accept' | 'pricing' | 'product'
  | 'hiring' | 'partner' | 'channel' | 'priceup' | 'other';

export type CaseStatus = 'draft' | 'framed' | 'sealed' | 'archived' | 'abandoned';

export type AbandReason = '不重要' | '情况变了' | '别人替我定了' | '写下来发现不用选';

/** 结果和你当时的预测比，像不像。由用户自己标，系统不判。 */
export type Verdict = 'same' | 'partial' | 'different';

export interface DecisionCase {
  id: string;
  gate: GateId;
  question: string;
  deadlineKind: 'date' | 'month' | 'none';
  deadlineAt: string | null;
  options: string[];
  facts: string[];
  /** 用户明确标记的非行动选项；旧备份迁移时补齐。 */
  nonActionOption?: string;
  furthestStep?: number;
  /** 从 aiTakes 里挑出的"对我不适用"那条：-1 未选，0..n 索引，99 = 都适用 */
  aiPick: number;
  /** 它不知道的是……（≤60 字） */
  aiGap: string;
  falsifySignal: string;
  distance: string;
  chosen: string;
  prediction: string;
  predictedP: number;
  /** 落槌时可选填：这件决定你估计要多少天完成 */
  expectedNum?: number | null;
  /** 回看时可选填：实际用了多少天 */
  actualNum?: number | null;
  sealedAt: string | null;
  sealHash: string | null;
  openAt: string | null;
  openedEarlyAt?: string | null;
  archivedAt?: string | null;
  reviewDraft?: { result: string; verdict: Verdict | ''; wrong: string; next: string };
  result: string;
  /** 用户自标：结果和预测像不像。空 = 没标（不强制） */
  verdict: Verdict | '';
  wrongJudgment: string;
  nextChange: string;
  abandReason: AbandReason | '';
  status: CaseStatus;
  step: number;
  skippedWait: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GateLayer = '人' | '钱' | '货' | '市' | '己';

/** 一个关口的可比数：单位 + 两次提问的措辞 */
export interface MeasureSpec {
  unit: 'money' | 'days';
  /** 落槌时的问法 */
  expected: string;
  /** 回看时的问法 */
  actual: string;
  expectedEn: string;
  actualEn: string;
}

export interface Gate {
  id: GateId;
  name: string;
  layer: GateLayer;
  reversibility: 1 | 2 | 3 | 4 | 5;
  feedbackDays: number;
  outcomeVars: string[];
  entryQuestions: string[];
  baseRate: string | null;
  baseRateNote: string;
  /** 预置的「如果去问 AI，大概会得到这三句」——静态文案，不接模型 */
  aiTakes: string[];
  aiTakesEn?: string[];
  /**
   * 这个关口的"可比数"：落槌时估一个、回看时填实际。
   * 钱类关口收金额，人/货类收天数——单位跟关口走，不能跨关口混算。
   */
  measure: MeasureSpec;
  /** 该关口最常用的三个选项骨架，含"不做" */
  optionHints: string[];
  optionHintsEn?: string[];
}

export type ConceptKind = 'bias' | 'method' | 'principle' | 'evidence';

export interface Concept {
  id: string;
  kind: ConceptKind;
  name: string;
  oneLine: string;
  whenToUse: string;
  whenNot: string;
  minutes?: number;
  evidence: 'A' | 'B' | 'C' | 'D';
  source: string;
  /** 展开"怎么做"时的 3–5 步 */
  howTo?: string[];
  /** 指向 src/knowledge/calc.ts 里的一个可算项；只有账本页会渲染算格 */
  calcId?: 'cost-floor';
}

export interface Edge {
  from: string;
  to: string;
  relation: '易犯' | '可解' | '适用' | '佐证' | '反例' | '首推';
  weight: number;
}

/** 照明卡：规则引擎的输出，固定三张（第三张可能缺席） */
export type LightCard =
  | { kind: 'bias'; concept: Concept }
  | { kind: 'method'; concept: Concept }
  | { kind: 'rate'; baseRate: string; note: string }
  | { kind: 'none'; note: string };

export interface LibCase {
  id: string;
  gate: GateId;
  situation: string;
  chose: string;
  result: string;
  review: string;
}

export interface AppState {
  cases: DecisionCase[];
  version: number;
}
