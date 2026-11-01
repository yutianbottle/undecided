/**
 * 决策照明卡引用的公开文献。
 * 这里只做**转述与引用**，不含任何原文摘录；版权归原作者与出版方所有。
 * 卷期页码以出版物信息为准，若本列表有出入，以原书/原文为准。
 */

export type RefKind = 'paper' | 'book' | 'report' | 'practice';

export interface Reference {
  id: string;
  kind: RefKind;
  cite: string;
  usedFor: string[];
  /** 英文界面的 usedFor；缺省时回落到中文 */
  usedForEn?: string[];
  /** 英文界面的 cite；缺省时回落到 cite（含中译的书目） */
  citeEn?: string;
  note?: string;
  noteEn?: string;
}

export const REFERENCES: Reference[] = [
  {
    id: 'kt1974', kind: 'paper',
    cite: 'Tversky, A., & Kahneman, D. (1974). Judgment under uncertainty: Heuristics and biases. Science, 185(4157), 1124–1131.',
    usedFor: ['锚定'],
    usedForEn: ['Anchoring'],
  },
  {
    id: 'kahneman2011', kind: 'book',
    cite: 'Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux. 中译：《思考，快与慢》，中信出版社，2012。',
    citeEn: "Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux. [Chinese ed.: 《思考，快与慢》, CITIC Press, 2012]",
    usedFor: ['锚定', '损失厌恶', '规划谬误'],
    usedForEn: ['Anchoring', 'Loss aversion', 'Planning fallacy'],
  },
  {
    id: 'kt1979', kind: 'paper',
    cite: 'Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. Econometrica, 47(2), 263–291.',
    usedFor: ['损失厌恶'],
    usedForEn: ['Loss aversion'],
  },
  {
    id: 'arkes1985', kind: 'paper',
    cite: 'Arkes, H. R., & Blumer, C. (1985). The psychology of sunk cost. Organizational Behavior and Human Decision Processes, 35(1), 124–140.',
    usedFor: ['沉没成本'],
    usedForEn: ['Sunk cost'],
  },
  {
    id: 'tk1973', kind: 'paper',
    cite: 'Tversky, A., & Kahneman, D. (1973). Availability: A heuristic for judging frequency and probability. Cognitive Psychology, 5(2), 207–232.',
    usedFor: ['可得性'],
    usedForEn: ['Availability'],
  },
  {
    id: 'wason1960', kind: 'paper',
    cite: 'Wason, P. C. (1960). On the failure to eliminate hypotheses in a conceptual task. Quarterly Journal of Experimental Psychology, 12(3), 129–140.',
    usedFor: ['确认偏误'],
    usedForEn: ['Confirmation bias'],
  },
  {
    id: 'buehler1994', kind: 'paper',
    cite: 'Buehler, R., Griffin, D., & Ross, M. (1994). Exploring the planning fallacy. Journal of Personality and Social Psychology, 67(3), 366–381.',
    usedFor: ['规划谬误'],
    usedForEn: ['Planning fallacy'],
  },
  {
    id: 'sheeran2002', kind: 'paper',
    cite: 'Sheeran, P. (2002). Intention–behavior relations: A conceptual and empirical review. European Review of Social Psychology, 12(1), 1–36.',
    usedFor: ['意图-行为差距'],
    usedForEn: ['Intention–behaviour gap'],
  },
  {
    id: 'heath2013', kind: 'book',
    cite: 'Heath, C., & Heath, D. (2013). Decisive: How to Make Better Choices in Life and Work. Crown Business. 中译：《决断力》，中信出版社。',
    citeEn: "Heath, C., & Heath, D. (2013). Decisive: How to Make Better Choices in Life and Work. Crown Business. [Chinese ed.: 《决断力》, CITIC Press]",
    usedFor: ['单一提案'],
    usedForEn: ['Single option'],
  },
  {
    id: 'klein2007', kind: 'paper',
    cite: 'Klein, G. (2007). Performing a project premortem. Harvard Business Review, 85(9), 18–19.',
    usedFor: ['事前验尸'],
    usedForEn: ['Premortem'],
  },
  {
    id: 'kross2014', kind: 'paper',
    cite: 'Kross, E., Bruehlman-Senecal, E., Park, J., et al. (2014). Self-talk as a regulatory mechanism: How you do it matters. Journal of Personality and Social Psychology, 106(2), 304–324.',
    usedFor: ['自我距离'],
    usedForEn: ['Self-distancing'],
  },
  {
    id: 'flyvbjerg2006', kind: 'paper',
    cite: 'Flyvbjerg, B. (2006). From Nobel Prize to project management: Getting risks right. Project Management Journal, 37(3), 5–15.',
    usedFor: ['参考类别预测'],
    usedForEn: ['Reference class'],
  },
  {
    id: 'ukdft', kind: 'report',
    cite: 'UK Department for Transport (2013). Supplementary Green Book Guidance: Optimism Bias.',
    usedFor: ['参考类别预测', '乐观偏差的校正'],
    usedForEn: ['Reference class', 'Correcting optimism bias'],
  },
  {
    id: 'cbinsights2026', kind: 'report',
    cite: 'CB Insights (2026). Why Startups Fail: 431 post-2023 shutdowns.',
    usedFor: ['431 家关停公司的归因'],
    usedForEn: ['Attributed causes of 431 shutdowns'],
  },
  {
    id: 'bezos2015', kind: 'report',
    cite: 'Bezos, J. (2015). 2015 Letter to Shareholders. Amazon. （one-way / two-way doors 框架）',
    citeEn: "Bezos, J. (2015). 2015 Letter to Shareholders. Amazon. (one-way / two-way doors framework)",
    usedFor: ['可逆性判断'],
    usedForEn: ['Reversibility check'],
  },
  {
    id: 'cialdini2006', kind: 'book',
    cite: 'Cialdini, R. B. (2006). Influence: The Psychology of Persuasion. HarperBusiness. 中译：《影响力》，北京联合出版公司。',
    citeEn: "Cialdini, R. B. (2006). Influence: The Psychology of Persuasion. HarperBusiness. [Chinese ed.: 《影响力》, Beijing United Publishing]",
    usedFor: ['互惠偏差'],
    usedForEn: ['Reciprocity'],
  },
  {
    id: 'loftus2005', kind: 'paper',
    cite: 'Loftus, E. F. (2005). Planting misinformation in the human mind. Learning & Memory, 12(4), 361–366.',
    usedFor: ['记录比记忆可靠', '后见之明偏差'],
    usedForEn: ['Records beat memory', 'Hindsight bias'],
  },
  {
    id: 'ce2025', kind: 'report',
    cite: '《中国企业家》(2025). 一人公司（OPC）生存状况问卷，148 份样本。',
    citeEn: "China Entrepreneur (2025). One-Person Company (OPC) survival survey, 148 respondents. [in Chinese]",
    usedFor: ['关系损失（背景数据：65% 订单靠熟人转介绍）'],
    usedForEn: ['Relationship loss (background: 65% of orders come from referrals)'],
    note: '二手统计，样本自选择，仅作背景，不用于任何基准率。',
    noteEn: 'Secondary statistics, self-selected sample, background only — not used as a base rate.',
  },
];

/** 没有公开文献支撑、纯属实践观察的条目，单独列出，不与文献混排 */
export const PRACTICE_ONLY: { name: string; nameEn: string; why: string; whyEn: string }[] = [
  { name: '三档报价', nameEn: 'Three-tier quote', why: '谈判实践中的通用做法，没有对照研究', whyEn: 'A common negotiating practice; no controlled study' },
  { name: '客户四象限', nameEn: 'Client quadrant', why: '服务业实践工具，无研究支持', whyEn: 'A service-industry practice tool; no research support' },
  { name: '90 天验收', nameEn: '90-day review', why: '管理实践，无对照研究', whyEn: 'Management practice; no controlled study' },
  { name: '分批涨价', nameEn: 'Staged price increase', why: '定价实践，无对照研究', whyEn: 'Pricing practice; no controlled study' },
  { name: '单渠道跑通', nameEn: 'One channel at a time', why: '增长实践，无对照研究', whyEn: 'Growth practice; no controlled study' },
  { name: '关系折价上限', nameEn: 'Relationship discount cap', why: '把"人情"变成可计算的一种尝试，不是标准答案', whyEn: 'An attempt to make “face” calculable — not a standard answer' },
  { name: '关系损失', nameEn: 'Relationship loss', why: '实践观察。唯一可引的量化背景是 65% 订单靠熟人转介绍', whyEn: 'Practice observation. The only quantitative background is 65% of orders coming from referrals' },
  { name: '人情账不可结算', nameEn: 'Unsettled favour', why: '实践观察，无研究支持', whyEn: 'Practice observation; no research support' },
];
