import type { Gate, GateId } from '../state/types';

export const GATES: Gate[] = [
  {
    id: 'quoting', name: '报价', layer: '钱', reversibility: 2, feedbackDays: 30,
    outcomeVars: ['是否成交', '成交价', '实际毛利'],
    entryQuestions: [
      '这单你必须什么时候回价',
      '你心里的三个价位分别是什么',
      '这个客户之前合作过吗，付款快不快',
      '这次的范围比上次多了什么',
      '你预计他接受的概率是多少',
    ],
    aiTakesEn: ['Assess the client’s budget range before setting your quote', 'Benchmark against market rates for similar work to stay competitive', 'Leave some negotiating room in the quote'],
    baseRate: null,
    baseRateNote: '这一行本该放「同类项目通常报多少」。目前没有可靠的公开数据。但你自己有：翻一遍过去 12 个月的报价和成交记录，中位数就是你的基准。',
    optionHints: ['按我算的价报', '降一档报', '不接'],
    optionHintsEn: ['Quote what you calculated', 'Quote one tier lower', 'Decline'],
    aiTakes: [
      '建议先评估客户的预算范围，再确定报价区间',
      '建议参考同行业的市场价格，保持竞争力',
      '建议在报价中预留一定的议价空间',
    ],
  },
  {
    id: 'accept', name: '接单', layer: '钱', reversibility: 3, feedbackDays: 30,
    outcomeVars: ['是否接', '实际投入时间', '回款周期'],
    entryQuestions: [
      '金额和账期分别是什么',
      '这个客户过去有没有拖过款、加过需求',
      '它会占掉你未来几周的多少时间',
      '拒绝它的代价是什么',
      '你预计这单能赚多少',
    ],
    aiTakesEn: ['Assess the return on this project', 'Check the client’s payment ability and credit history', 'Spell out delivery standards and payment milestones in the contract'],
    baseRate: null,
    baseRateNote: '本该放「这类客户的平均回款周期和返工率」。公开数据没有。你自己的历史最实：过去 10 单里，有几单拖过款、拖了多久。',
    optionHints: ['接', '不接', '接但要预付款'],
    optionHintsEn: ['Take it', 'Decline', 'Take it with prepayment'],
    aiTakes: [
      '建议评估这个项目的投入产出比',
      '建议了解客户的付款能力和信用记录',
      '建议在合同中明确交付标准和付款节点',
    ],
  },
  {
    id: 'pricing', name: '定价', layer: '钱', reversibility: 3, feedbackDays: 60,
    outcomeVars: ['付费转化率', '客单价', '退款率'],
    entryQuestions: [
      '现在的价格是多少',
      '同类产品卖多少',
      '你的成本结构是什么',
      '目标客户为此付过多少钱',
      '你预计提价后的转化率变化',
    ],
    aiTakesEn: ['Price on cost-plus to protect a reasonable margin', 'Research competitors’ pricing', 'Run a price sensitivity test'],
    baseRate: null,
    baseRateNote: '本该放「同类产品的价位分布」。这个能查到：竞品的公开定价页、应用商店的订阅档位、你所在行业的报价单。找到就把来源一起记下来。',
    optionHints: ['维持现价', '提一档', '降一档'],
    optionHintsEn: ['Keep the price', 'Raise one tier', 'Lower one tier'],
    aiTakes: [
      '建议基于成本加成定价，保证合理利润率',
      '建议调研竞品的定价策略',
      '建议做一次价格敏感度测试',
    ],
  },
  {
    id: 'product', name: '取舍', layer: '货', reversibility: 4, feedbackDays: 90,
    outcomeVars: ['付费用户数', '投入工时', '机会成本'],
    entryQuestions: [
      '已经投入了多少时间和钱',
      '什么信号出现你会停',
      '同类产品现在活得怎么样',
      '如果不做这件事，你会做什么',
      '你预计 3 个月后的数字是多少',
    ],
    aiTakesEn: ['Validate market demand with an MVP first', 'Set a clear stop-loss line', 'Watch retention and repeat purchase data closely'],
    baseRate: '在 431 家已关停的公司里，43% 的首要失败原因是「没有市场需求」（CB Insights 2026 复盘）',
    baseRateNote: '这是失败归因的分布，不是成功率。不能直接用来预测你这一个产品，但它说明：先看需求，再看执行。',
    optionHints: ['继续做', '停掉', '换个方向做'],
    optionHintsEn: ['Keep building', 'Stop', 'Pivot'],
    aiTakes: [
      '建议先用 MVP 验证市场需求',
      '建议设定明确的止损线',
      '建议重点关注用户留存和复购数据',
    ],
  },
  {
    id: 'hiring', name: '招人', layer: '人', reversibility: 4, feedbackDays: 90,
    outcomeVars: ['人效', '90 天留存', '现金消耗'],
    entryQuestions: [
      '你现在真正缺的是什么能力',
      '这件事能不能先外包验证 3 个月',
      '90 天后你怎么判断招对了',
      '多一个人的现金压力是多少',
      '不招的后果是什么',
    ],
    aiTakesEn: ['Define the role and requirements clearly first', 'Weigh hiring cost against expected output', 'Set probation review criteria'],
    baseRate: null,
    baseRateNote: '本该放「这类岗位的 90 天留存率」。招聘平台的公开数据多为平台口径，未必可信。你自己的情况更实：上一个外包或兼职，干了多久。',
    optionHints: ['招', '不招', '先外包 3 个月'],
    optionHintsEn: ['Hire', 'Do not hire', 'Outsource for three months'],
    aiTakes: [
      '建议先明确岗位职责和任职要求',
      '建议评估招聘成本和预期产出',
      '建议设置试用期考核标准',
    ],
  },
  {
    id: 'partner', name: '合伙', layer: '人', reversibility: 5, feedbackDays: 180,
    outcomeVars: ['股权结构', '决策效率', '退出成本'],
    entryQuestions: [
      '对方投入的是钱、时间，还是资源',
      '如果半年后他不干了，怎么退出',
      '谁做最终决定',
      '你们先试过一起做一个小项目吗',
      '最坏的情况你能接受吗',
    ],
    aiTakesEn: ['Sign a written partnership agreement with clear rights and duties', 'Set up equity vesting', 'Work together for a while before formalising'],
    baseRate: null,
    baseRateNote: '本该放「合伙散伙的比例」。没有可靠统计——工商登记只看得到注销，看不到原因。所以这个关口最依赖你自己的判断，别轻信任何「成功率」说法。',
    optionHints: ['给股份合伙', '不合伙', '先按项目合作'],
    optionHintsEn: ['Partner with equity', 'No partnership', 'Project-based only'],
    aiTakes: [
      '建议签订书面合伙协议，明确各方权责',
      '建议设置股权成熟机制（vesting）',
      '建议先磨合一段时间再确定合作关系',
    ],
  },
  {
    id: 'channel', name: '渠道', layer: '市', reversibility: 3, feedbackDays: 50,
    outcomeVars: ['单个获客成本', '询盘数', '成交转化'],
    entryQuestions: [
      '你的客户平时在哪出现',
      '这次准备投多少预算和时间',
      '单个获客成本超过多少你就停',
      '跑多久算失败',
      '你预计能带来多少询盘',
    ],
    aiTakesEn: ['Test small first and check conversion', 'Work out customer acquisition cost (CAC)', 'Focus on one channel and go deep rather than spreading out'],
    baseRate: null,
    baseRateNote: '本该放「这个渠道的单个获客成本」。平台自己公布的数据一般偏乐观。可查：同行的公开复盘、你自己的历史投放记录。',
    optionHints: ['做这个渠道', '不做', '先小规模试'],
    optionHintsEn: ['Do this channel', 'Skip it', 'Small test first'],
    aiTakes: [
      '建议先小规模测试，验证转化率',
      '建议计算单个获客成本（CAC）',
      '建议聚焦一个渠道做深，不要铺开',
    ],
  },
  {
    id: 'priceup', name: '涨价', layer: '钱', reversibility: 3, feedbackDays: 38,
    outcomeVars: ['续约率', '客单价', '流失客户数'],
    entryQuestions: [
      '准备涨多少',
      '怎么通知，提前多久',
      '流失多少你能接受',
      '是一次性涨还是分批',
      '你预计续约率会掉到多少',
    ],
    aiTakesEn: ['Notify clients in advance and allow a buffer period', 'Explain the reason and emphasise added value', 'Adjust in stages to reduce churn'],
    baseRate: null,
    baseRateNote: '本该放「涨价的客户流失率」。几乎没有公开数据。可参照：你自己的续约记录，以及这次涨幅是否超过成本涨幅。',
    optionHints: ['涨', '不涨', '新单新价'],
    optionHintsEn: ['Raise', 'Do not raise', 'New clients only'],
    aiTakes: [
      '建议提前通知客户，给出缓冲期',
      '建议说明涨价原因，强调价值提升',
      '建议分批次调整，降低流失风险',
    ],
  },
];

export const GATE_MAP: Record<string, Gate> = Object.fromEntries(GATES.map((g) => [g.id, g]));

export function getGate(id: GateId): Gate {
  return GATE_MAP[id] ?? {
    id: 'other', name: '其他', layer: '己', reversibility: 3, feedbackDays: 45,
    outcomeVars: [], entryQuestions: [], baseRate: null,
    baseRateNote: '这个关口还没有整理基准数据。', optionHints: [], aiTakes: [],
    optionHintsEn: [],
  };
}

export function gateName(id: GateId, lang: 'zh' | 'en' = 'zh'): string {
  return gateLabel(id, lang);
}


/** 英文侧重名。baseRateNote 也要译——它常常是整段最有信息量的话。 */
export const GATE_EN: Record<string, { name: string; baseRateNote: string; baseRate?: string }> = {
  quoting: {
    name: 'Quoting',
    baseRateNote: 'This line should hold "what similar work usually costs". No reliable public data exists. But you have your own: go through the last 12 months of quotes and wins — the median is your base rate.',
  },
  accept: {
    name: 'Taking a client',
    baseRateNote: 'Should hold "how long this kind of client takes to pay, and how often they change scope". No public data. Your own history is better: of the last 10 jobs, how many ran late, and by how much.',
  },
  pricing: {
    name: 'Pricing',
    baseRateNote: 'Should hold "where similar products sit". This one is findable: competitor pricing pages, app store tiers, rate cards in your industry. Record the source when you find it.',
  },
  product: {
    name: 'Keep or kill',
    baseRate: 'Of 431 companies that shut down, 43% named "no market need" as the primary cause (CB Insights 2026).',
    baseRateNote: 'This is a distribution of failure causes, not a success rate. It cannot predict your one product — but it says: check demand before you check execution.',
  },
  hiring: {
    name: 'Hiring',
    baseRateNote: 'Should hold "90-day retention for this kind of role". Platform data is usually self-serving. Your own case is more real: how long did your last contractor or part-timer stay.',
  },
  partner: {
    name: 'Partnership',
    baseRateNote: 'Should hold "how often partnerships break". No reliable statistic — registries show dissolutions, not reasons. This gate depends most on your own judgement; distrust any "success rate" you are quoted.',
  },
  channel: {
    name: 'Channel',
    baseRateNote: 'Should hold "cost per acquisition on this channel". Platform numbers are optimistic. Look at public post-mortems and your own past spend instead.',
  },
  priceup: {
    name: 'Raising prices',
    baseRateNote: 'Should hold "churn after a price rise". Almost no public data. Reference your own renewal history, and whether the rise exceeds your cost increase.',
  },
};

export function gateLabel(id: string, lang: 'zh' | 'en'): string {
  if (lang === 'en') return GATE_EN[id]?.name ?? (id === 'other' ? 'Other' : id);
  return id === 'other' ? '其他' : (GATE_MAP[id]?.name ?? '其他');
}

export function gateBaseRate(id: string, lang: 'zh' | 'en'): { baseRate: string | null; note: string } {
  const zh = GATE_MAP[id];
  if (lang === 'en') {
    const e = GATE_EN[id];
    return { baseRate: e?.baseRate ?? null, note: e?.baseRateNote ?? '' };
  }
  return { baseRate: zh?.baseRate ?? null, note: zh?.baseRateNote ?? '' };
}


/** 层名（钱/人/货/市）双语 */
const LAYER_EN: Record<string, string> = { 钱: 'Money', 人: 'People', 货: 'Product', 市: 'Market' };
export function layerName(layer: string, lang: 'zh' | 'en' = 'zh'): string {
  return lang === 'zh' ? layer : (LAYER_EN[layer] ?? layer);
}
