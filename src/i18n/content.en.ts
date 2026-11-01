import type { Concept } from '../state/types';

/** 卡片英文字段。只翻面向用户的叙述；source 保留原文，文献本来就是英文。 */
type CEN = Pick<Concept, 'name' | 'oneLine' | 'whenToUse' | 'whenNot'> & { howTo?: string[] };

export const CONCEPT_EN: Record<string, CEN> = {
  /* ── 偏差 ── */
  'anchoring': {
    name: 'Anchoring',
    oneLine: 'You take the first number you see as the baseline, then adjust too little.',
    whenToUse: 'First quote to a client; the other side named a number first; estimating work you have never done.',
    whenNot: 'You already have a hard cost floor that is high enough; talking to a repeat client, where the anchor is on your side.',
  },
  'sunk-cost': {
    name: 'Sunk cost',
    oneLine: 'Time and money already spent become the reason to keep spending.',
    whenToUse: 'Deciding whether to stop something old; renewing a tool you do not use; keeping a relationship that produces nothing.',
    whenNot: 'The past spend bought something irreplaceable (client relationships, a patent). Then it is not just a cost.',
  },
  'availability': {
    name: 'Availability',
    oneLine: 'What comes to mind easily feels more common than it is.',
    whenToUse: 'Judging a trend from one competitor; judging a market from your last three clients.',
    whenNot: 'You have a complete sample of your own — twenty quotes, ten jobs, real records.',
  },
  'confirmation': {
    name: 'Confirmation bias',
    oneLine: 'You look for information that supports your read, and remember it better.',
    whenToUse: 'You already lean one way and are now collecting "evidence".',
    whenNot: 'You have no leaning yet — still in the gathering stage.',
  },
  'single-option': {
    name: 'Single option',
    oneLine: 'When you can only think of one plan, you are deciding "whether", not "which".',
    whenToUse: 'Your list is just do / don\'t; only one plan is circling in your head.',
    whenNot: 'A hard deadline with minutes left — inventing a third option then does harm.',
  },
  'intention-gap': {
    name: 'Intention–behaviour gap',
    oneLine: 'Saying they like it and paying for it are different events.',
    whenToUse: 'Using interviews, likes or verbal yes to judge demand; using "they said they would buy" to set a price.',
    whenNot: 'There is real payment history, even from five people.',
  },
  'planning-fallacy': {
    name: 'Planning fallacy',
    oneLine: 'Your estimates of time, cost and revenue all run optimistic, and you cannot feel it.',
    whenToUse: 'Any "about three months"; any "we should sell X this month".',
    whenNot: 'You have done this exact work five times and kept records.',
  },
  'loss-aversion': {
    name: 'Loss aversion',
    oneLine: 'Losing hurts more than winning pleases — so you avoid small losses and keep bigger risks.',
    whenToUse: 'Afraid to raise prices and lose a client; afraid to fire someone; afraid to stop a project and admit it.',
    whenNot: 'The other side genuinely has alternatives and switching is cheap. Then the fear is correct.',
  },
  'overconfidence': {
    name: 'Overconfidence',
    oneLine: 'You rate your own accuracy higher than it is.',
    whenToUse: 'Every "I think" and "I estimate" — especially in fields you know well.',
    whenNot: 'You have been wrong three times in this kind of thing and wrote it down.',
  },
  'status-quo': {
    name: 'Status quo bias',
    oneLine: 'Doing nothing gets treated as the safe option.',
    whenToUse: 'When one of your options is "keep things as they are" or "wait and see".',
    whenNot: 'The status quo is already deteriorating (clients leaving, costs rising). Then "no change" is not caution, it is surrender.',
  },
  'endowment': {
    name: 'Endowment effect',
    oneLine: 'You overvalue what you already own.',
    whenToUse: 'Pricing your own product; deciding whether to kill a feature you built.',
    whenNot: 'You never invested in it — inherited work, someone else\'s product.',
  },
  'framing': {
    name: 'Framing',
    oneLine: 'Same fact, different wording, different choice.',
    whenToUse: 'When you write an option as "70% success" versus "30% failure".',
    whenNot: 'Both options are described in the same frame, so comparability is intact.',
  },
  'escalation': {
    name: 'Escalation of commitment',
    oneLine: 'Once you have said publicly that you will make it work, stopping gets harder.',
    whenToUse: 'You have announced it — to clients, on social, to investors.',
    whenNot: 'You never announced anything; it is still private.',
  },
  'hindsight': {
    name: 'Hindsight bias',
    oneLine: 'After the result, it feels like you always knew.',
    whenToUse: 'During review — especially when you think "I saw that coming".',
    whenNot: 'You actually wrote it down at the time. Then it is not hindsight.',
  },
  'mental-accounting': {
    name: 'Mental accounting',
    oneLine: 'Money that arrived easily gets spent easily.',
    whenToUse: 'Deciding with windfall money — a subsidy, refund or bonus.',
    whenNot: 'All cash sits in one pool with a written allocation rule.',
  },
  'hyperbolic': {
    name: 'Hyperbolic discounting',
    oneLine: 'Small immediate gains beat larger later ones, and the closer the gain, the stronger the pull.',
    whenToUse: 'Take a job that pays now, or build the thing that pays in six months.',
    whenNot: 'Both payoffs land at roughly the same time.',
  },
  'reciprocity': {
    name: 'Reciprocity',
    oneLine: 'Someone who did you a favour gets repaid more than it was worth — and sooner than you expect.',
    whenToUse: 'The client came through a friend; they helped you once; you owe something.',
    whenNot: 'A pure price comparison with no history between you.',
  },
  'guanxi-loss': {
    name: 'Relationship loss',
    oneLine: 'In a referral network, saying no costs more than the deal — it costs future introductions.',
    whenToUse: 'Your work comes from referrals; this client sits in the same circle as you.',
    whenNot: 'A one-off transaction, platform traffic, no shared network. Note: this card is also a convenient excuse for avoiding an awkward conversation.',
  },
  'unsettled-debt': {
    name: 'Unsettled favour',
    oneLine: 'Favours have no ledger, so you pay an unclear debt with "giving a little on this one".',
    whenToUse: 'They helped you and you never repaid it; or you helped them and feel owed.',
    whenNot: 'The account was settled, or you never exchanged anything.',
  },

  /* ── 方法 ── */
  'three-tier-quote': {
    name: 'Three-tier quote',
    oneLine: 'Offer low, mid and high at once, so they choose a tier instead of choosing whether to buy.',
    whenToUse: 'They want one number and you have no pricing power yet.',
    whenNot: 'They explicitly want a single total (tenders, platform comparison) — three tiers reads as unprofessional.',
    howTo: [
      'Write what each tier includes (scope, timeline, deliverables)',
      'Put the tier you actually want to win in the middle',
      'The top tier must be justified, not just marked up',
      'Lead with the middle one; let them choose between tiers',
    ],
  },
  'reference-class': {
    name: 'Reference class',
    oneLine: 'Do not ask "how will this go" — ask "how do things like this usually go".',
    whenToUse: 'Anything you are doing for the first time that has plenty of precedents.',
    whenNot: 'There genuinely is no comparable class (very early new category) — forcing a reference misleads.',
    howTo: [
      'Name the class this belongs to, as narrowly as you can',
      'Find the distribution: median, failure rate, denominator',
      'Compare your estimate against it',
      'If you are far off, explain why you are different before trusting yourself',
    ],
  },
  'premortem': {
    name: 'Premortem',
    oneLine: 'Assume it failed a year from now. Write the three most likely reasons.',
    whenToUse: 'Irreversible decision, fifteen minutes available, everyone already agrees.',
    whenNot: 'You are alone and already stuck — then you need a deadline, not more failure scenarios.',
    howTo: [
      'Write: "A year from now this failed completely"',
      'Silently write three reasons (three if alone)',
      'Pick the most likely one',
      'Give it an early signal you could actually observe',
    ],
  },
  'self-distancing': {
    name: 'Self-distancing',
    oneLine: 'Asking in the third person cools the emotion and brings you closer to the advice you would give a friend.',
    whenToUse: 'When emotion is high: angry at a client, rattled by a competitor, anxious at 1am.',
    whenNot: 'When you need to act fast — this step slows you down on purpose.',
    howTo: [
      'Change "what should I do" to "what should he do"',
      'Use your name, or "this person"',
      'Write the first sentence you would say to them',
    ],
  },
  'reversibility': {
    name: 'Reversibility check',
    oneLine: 'First ask whether it can be undone. Reversible: do it now. Irreversible: slow down.',
    whenToUse: 'The first cut on any decision — especially when you feel rushed.',
    whenNot: 'You already know it is irreversible and the deadline is here. Then sorting is just delay.',
    howTo: [
      'Ask: if wrong, how long to undo, and at what cost',
      'Reversible and cheap → do it now, no meeting',
      'Irreversible or expensive → run the full pass',
    ],
  },
  'kill-criteria': {
    name: 'Kill criteria',
    oneLine: 'Write "what signal makes me stop" before you start, not when you are attached.',
    whenToUse: 'Anything requiring continued investment: product, channel, hire, partnership.',
    whenNot: 'One-off decisions that end immediately — no stake to protect.',
    howTo: [
      'Write one number and one date (e.g. 20 paying users in 3 months)',
      'Write that you will reopen the case unconditionally on that date',
      'Put it inside the sealed record',
    ],
  },
  'client-quadrant': {
    name: 'Client quadrant',
    oneLine: 'Sort by "pays well" and "costs you trouble" — see which box they are in first.',
    whenToUse: 'Deciding whether to take a client, or keep an old one.',
    whenNot: 'You have one or two clients and no choice.',
    howTo: [
      'Horizontal: money. Vertical: communication and rework cost',
      'Place the candidate in a box',
      'Low money, high trouble → raise the price or decline',
    ],
  },
  'ninety-day': {
    name: '90-day review',
    oneLine: 'Any "let me try a bit longer" gets a 90-day limit and three verifiable lines.',
    whenToUse: 'When you are saying "give me another three months".',
    whenNot: 'Feedback arrives in days, not months (quoting, taking a client) — 90 days is too long.',
    howTo: [
      'Three verifiable lines (number + date)',
      'Write that you reopen on the date regardless of how you feel',
      'Set the open date 90 days out',
    ],
  },
  'staged-price-increase': {
    name: 'Staged price increase',
    oneLine: 'Do not raise everyone at once. New clients first; existing ones next round.',
    whenToUse: 'Costs rose, or the price has not moved in three years.',
    whenNot: 'One client is 60% of revenue — talk before you raise.',
    howTo: [
      'New clients get the new price immediately',
      'Existing clients get 30 days written notice',
      'Give a deadline, never a permanent discount',
    ],
  },
  'single-channel': {
    name: 'One channel at a time',
    oneLine: 'Run a single channel until you have one repeatable acquisition move, then add a second.',
    whenToUse: 'When you are about to spread across several platforms.',
    whenNot: 'You already have stable cash flow; a portfolio of channels is reasonable.',
    howTo: [
      'Pick one channel, fix a budget and a time window',
      'Define "working" in numbers (e.g. 20 enquiries in 30 days)',
      'If it misses, switch — do not double the spend',
    ],
  },
  'decision-matrix': {
    name: 'Weighted decision matrix',
    oneLine: 'Options against criteria, weights before scores — so one factor cannot quietly take over.',
    whenToUse: 'Three or more options, several criteria, and you keep going in circles.',
    whenNot: 'Two options and one criterion (price). The table only adds noise.',
    howTo: [
      'Write 3–5 criteria, no more',
      'Assign weights that total 100',
      'Score each option 1–5',
      'Compute totals, then check whether one weight swallowed the rest',
    ],
  },
  'ten-ten-ten': {
    name: '10-10-10',
    oneLine: 'How will this look in ten minutes, ten months, ten years?',
    whenToUse: 'When short-term feeling is driving: fear of losing the deal, of offending, of missing out.',
    whenNot: 'When a reply is needed in the next minute.',
    howTo: ['In ten minutes I will think…', 'In ten months, will it still matter?', 'In ten years, will I remember it?'],
  },
  'prediction-log': {
    name: 'Prediction log',
    oneLine: 'Write the prediction as a checkable sentence with a probability, and look on the date.',
    whenToUse: 'Any time you say "I think it will…".',
    whenNot: 'The prediction cannot be checked ("this industry will get harder").',
    howTo: ['Event, time window, number', 'A probability', 'On the date: record facts only, no verdict'],
  },
  'reverse-assumption': {
    name: 'Reverse the assumption',
    oneLine: 'Assume you already picked the other one. Write how you would defend it.',
    whenToUse: 'When you are clearly leaning one way.',
    whenNot: 'Before you have a leaning — still gathering.',
    howTo: ['Pick the option you least want', 'Write three reasons for it', 'Notice if any of them moves you'],
  },
  'cost-floor': {
    name: 'Cost floor',
    oneLine: 'Work out the price below which you are working for free, before anything else.',
    whenToUse: 'Before any quote, client decision or price change.',
    whenNot: 'You already have a stable cost model and margin line.',
    howTo: [
      'Direct cost: hours × your day rate',
      'Add hidden costs: communication, rework, payment terms',
      'That is the floor. Below it, decline',
    ],
  },
  'five-questions': {
    name: 'Five client questions',
    oneLine: 'Do not ask "would you buy" — ask what they spent last time.',
    whenToUse: 'Testing demand; judging whether a client is worth pursuing.',
    whenNot: 'There is already real payment history.',
    howTo: [
      'When did you last hit this problem',
      'How did you solve it, and what did it cost',
      'Who decided',
      'What happens if it stays unsolved',
      'Are you already paying for something here',
    ],
  },
  'precommitment': {
    name: 'Precommitment',
    oneLine: 'Fix the rule before you are tempted.',
    whenToUse: 'You know you will soften — discount, waive the fee, take one more job you do not want.',
    whenNot: 'Rigid rules would damage a real relationship.',
    howTo: [
      'Write "below X I decline"',
      'Write "this kind of client always pays 30% up front"',
      'Put it into the sealed record and check against it on the date',
    ],
  },
  'base-rate-check': {
    name: 'Base-rate check',
    oneLine: 'Ask how things like this usually go, then ask why this time is different.',
    whenToUse: 'First time doing this kind of thing; your estimate is far from the market.',
    whenNot: 'No comparable cases exist at all (very early new category).',
    howTo: [
      'Name the class',
      'Find the distribution: denominator, median, failure rate',
      'Explain why you are not in it',
    ],
  },
  'relation-cap': {
    name: 'Relationship discount cap',
    oneLine: 'Discounting for a relationship is fine — write the cap first, past which the relationship costs you money.',
    whenToUse: 'A friend referred them; you want to lower the price, waive it, or throw in extra.',
    whenNot: 'They are not someone you know, or you are already losing money.',
    howTo: [
      'Work out the normal price without the relationship',
      'Write how much you are willing to give for the relationship (amount or %)',
      'Write the cap: past it, decline or say it out loud',
      'Put those four lines into "facts" — they are observable',
    ],
  },

  /* ── 原则 ── */
  'denominator-first': {
    name: 'Denominator first',
    oneLine: 'A percentage without a denominator says nothing.',
    whenToUse: 'Any "80% success rate", "most people do…".',
    whenNot: 'The other side gave you the sample and the sampling method.',
  },
  'single-point-curse': {
    name: 'No single-point predictions',
    oneLine: '"Three months" is not a prediction, it is a wish.',
    whenToUse: 'All estimates of time, cost and revenue.',
    whenNot: 'When you must commit to one delivery date externally (keep the range internally).',
  },
  'marginal-only': {
    name: 'Marginal only',
    oneLine: 'Look at what one more unit costs and earns — not at what you already spent.',
    whenToUse: 'Any decision involving "we have already invested a lot".',
    whenNot: 'Exit costs are real (penalties, trust). Then they are part of the marginal cost.',
  },
  'range-not-point': {
    name: 'Ranges, not points',
    oneLine: '"About three months" is worse than "two at the fastest, five at the slowest".',
    whenToUse: 'Every estimate of time, cost, revenue.',
    whenNot: 'When you must publish a single date (keep the range for yourself).',
  },
  'record-over-memory': {
    name: 'Records beat memory',
    oneLine: 'Your memory of what you judged three months ago gets rewritten by the result.',
    whenToUse: 'Every "I knew it all along".',
    whenNot: '—',
  },

  /* ── 证据 ── */
  'ev-cbinsights': {
    name: '431 shutdowns, attributed',
    oneLine: 'Running out of cash is the final cause, not the root cause — "no market need" ranks first.',
    whenToUse: 'Judging whether a product should continue, or start.',
    whenNot: 'This is a distribution of failure causes, not a success rate. It cannot compute your odds.',
  },
  'ev-optimism-bias': {
    name: 'Optimism bias, corrected at policy level',
    oneLine: 'The UK Department for Transport requires large projects to add a fixed uplift based on historical overrun — reference-class forecasting in practice.',
    whenToUse: 'Estimating a large project you have never done.',
    whenNot: 'Small, repetitive work where the historical spread is narrow.',
  },
};
