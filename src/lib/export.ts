import type { DecisionCase } from '../state/types';
import { gateName } from '../knowledge/gates';
import { downloadFile } from '../state/storage';
import { fmtDate, fmtDateTime } from './date';
import { sealDisplay } from './seal';
import { abandonReasonLabel, type Lang } from '../i18n';

const STATUS: Record<string, string> = {
  draft: '草稿',
  framed: '待落槌',
  sealed: '已封存',
  archived: '已归档',
  abandoned: '已撤回',
};

const VERDICT: Record<string, string> = {
  same: '基本一样',
  partial: '有点不一样',
  different: '完全不是',
};
const VERDICT_EN: Record<string, string> = {
  same: 'Roughly yes',
  partial: 'Partly',
  different: 'Not at all',
};

/** 把全部案卷导出成一封可读的 Markdown 信 */
export function toMarkdown(cases: DecisionCase[], exportedAt = new Date(), lang: Lang = 'zh'): string {
  const en = lang === 'en';
  const text = (zh: string, english: string) => en ? english : zh;
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${exportedAt.getFullYear()}-${pad(exportedAt.getMonth() + 1)}-${pad(exportedAt.getDate())} ${pad(exportedAt.getHours())}:${pad(exportedAt.getMinutes())}`;

  const live = cases.filter((c) => c.status === 'draft' || c.status === 'framed');
  const sealed = cases.filter((c) => c.status === 'sealed');
  const archived = cases.filter((c) => c.status === 'archived').sort((a, b) => Date.parse(b.archivedAt ?? b.updatedAt) - Date.parse(a.archivedAt ?? a.updatedAt));
  const abandoned = cases.filter((c) => c.status === 'abandoned');

  const L: string[] = [];
  L.push(`# ${text('我的决策账本', 'My decision ledger')}`);
  L.push('');
  L.push(`> ${text('导出于', 'Exported')} ${ts} · ${text('由「未决」在本机生成，没有经过任何服务器', 'Generated locally by Undecided; it never passed through a server')}`);
  L.push('');
  L.push(en
    ? `**${cases.length}** decisions: ${live.length} drafts · ${sealed.length} sealed · ${archived.length} reviewed · ${abandoned.length} withdrawn`
    : `共 **${cases.length}** 个决定：草稿 ${live.length} · 已封存 ${sealed.length} · 已归档 ${archived.length} · 撤回 ${abandoned.length}`);
  L.push('');

  if (archived.length > 0) {
    L.push(`## ${text('一句话回顾', 'One-line review')}`);
    L.push('');
    for (const c of archived.slice(0, 10)) {
      L.push(en
        ? `- **${c.question}** — chose "${c.chosen}", result: ${c.result || '—'}${c.verdict ? ` (${VERDICT_EN[c.verdict] ?? c.verdict})` : ''}`
        : `- **${c.question}** — 选了「${c.chosen}」，结果：${c.result || '—'}${c.verdict ? `（${VERDICT[c.verdict]}）` : ''}`);
    }
    L.push('');
  }

  const groups: [string, DecisionCase[]][] = en ? [
    ['In progress', live], ['Sealed, waiting', sealed], ['Reviewed', archived], ['Withdrawn', abandoned],
  ] : [
    ['进行中的决定', live], ['已封存，等到期', sealed], ['已归档', archived], ['已撤回', abandoned],
  ];

  for (const [title, list] of groups) {
    if (list.length === 0) continue;
    L.push(`---`);
    L.push('');
    L.push(`## ${title}`);
    L.push('');

    for (const c of list) {
      L.push(`### ${c.question || text('（未命名）', '(untitled)')}`);
      L.push('');
      L.push(`\`${gateName(c.gate, lang)}\` · ${en ? ({ draft: 'Draft', framed: 'Ready to seal', sealed: 'Sealed', archived: 'Reviewed', abandoned: 'Withdrawn' }[c.status] ?? c.status) : (STATUS[c.status] ?? c.status)} · ${text('开卷', 'Opened')} ${fmtDate(c.createdAt)}`);
      if (c.deadlineAt) L.push(`${text('必须定于', 'Decision due')}: ${fmtDate(c.deadlineAt)}`);
      if (c.sealHash) L.push(`${text('封条', 'Seal')}: \`${sealDisplay(c.sealHash)}\``);
      L.push('');

      if (c.options.length) {
        L.push(`**${text('当时的选项', 'Options at the time')}**`);
        L.push('');
        c.options.forEach((o, i) => L.push(`${i + 1}. ${o}${o === c.chosen ? text('　← 选了这个', ' ← chosen') : ''}${o === c.nonActionOption ? text('（非行动选项）', ' (do-nothing option)') : ''}`));
        L.push('');
      }

      const facts = c.facts.map((f) => f.trim()).filter(Boolean);
      if (facts.length) {
        L.push(`**${text('我观察到的事实', 'Facts I observed')}**`);
        L.push('');
        facts.forEach((f) => L.push(`- ${f}`));
        L.push('');
      }

      if (c.aiGap) {
        L.push(`**${text('AI 不知道的是', 'What the AI did not know')}**`);
        L.push('');
        L.push(`> ${c.aiGap}`);
        L.push('');
      }

      if (c.falsifySignal) { L.push(`**${text('反证条件', 'Falsifier')}**`, '', c.falsifySignal, ''); }

      if (c.distance) {
        L.push(`**${text('如果是朋友问我', 'If a friend had asked me')}**`);
        L.push('');
        L.push(`> ${c.distance}`);
        L.push('');
      }

      if (c.chosen) {
        L.push(`**${text('落槌', 'The call')}**`);
        L.push('');
        L.push(`- ${text('选了', 'Chose')}: ${c.chosen}`);
        if (c.prediction) L.push(`- ${text('预测', 'Prediction')}: ${c.prediction}`);
        if (c.predictedP) L.push(`- ${text('当时给的概率', 'Probability')}: ${c.predictedP}%`);
        if (c.sealedAt) L.push(`- ${text('封存于', 'Sealed')}: ${fmtDate(c.sealedAt)}`);
        if (c.openAt) L.push(`- ${text('原计划回看日', 'Scheduled review')}: ${fmtDate(c.openAt)}`);
        if (c.openedEarlyAt) L.push(`- ${text('提前开封', 'Opened early')}: ${fmtDateTime(c.openedEarlyAt)}`);
        if (c.archivedAt) L.push(`- ${text('归档于', 'Reviewed')}: ${fmtDateTime(c.archivedAt)}`);
        L.push('');
      }

      if (c.reviewDraft) {
        L.push(`**${text('回访草稿（未归档）', 'Review draft (not archived)')}**`, '', `- ${text('结果', 'Result')}: ${c.reviewDraft.result}`,
          `- ${text('自标', 'Your mark')}: ${(en ? VERDICT_EN[c.reviewDraft.verdict] : VERDICT[c.reviewDraft.verdict]) ?? text('未填写', 'not filled')}`, `- ${text('判断', 'Judgement')}: ${c.reviewDraft.wrong}`, `- ${text('下次调整', 'Next change')}: ${c.reviewDraft.next}`, '');
      }

      if (c.result || c.wrongJudgment || c.nextChange || c.verdict) {
        L.push(`**${text('回看', 'Review')}**`);
        L.push('');
        if (c.result) L.push(`- ${text('结果', 'Result')}: ${c.result}`);
        if (c.verdict) L.push(`- ${text('和当时想的一样吗', 'Did it match what you expected')}: ${(en ? VERDICT_EN[c.verdict] : VERDICT[c.verdict]) ?? c.verdict}`);
        if (c.wrongJudgment) L.push(`- ${text('成立与需修正的判断', 'Judgement to keep or correct')}: ${c.wrongJudgment}`);
        if (c.nextChange) L.push(`- ${text('下次改', 'Next change')}: ${c.nextChange}`);
        L.push('');
      }

      if (c.abandReason) {
        L.push(`**${text('撤回原因', 'Withdrawal reason')}**: ${abandonReasonLabel(c.abandReason, lang)}`);
        L.push('');
      }

      L.push('---');
      L.push('');
    }
  }

  L.push(`## ${text('关于这份文件', 'About this file')}`);
  L.push('');
  L.push(text('- 它是你自己的记录，不在任何服务器上。删了就是删了，建议定期备份。', '- These are your records. They never touched a server; if you delete them, they are gone. Back them up regularly.'));
  L.push(text('- 里面的判断没有对错之分，只有「后来发生了什么」。', '- There is no right or wrong judgement here, only what happened afterwards.'));
  L.push(text('- 如果你想把它交给别人看，先想清楚：这里面有你客户的价格和你自己的犹豫。', '- If you share this, remember that it contains client prices and your private hesitation.'));
  L.push('');
  L.push(en ? '*Generated by Undecided · an offline decision ledger*' : '*由「未决」生成 · 一个不联网的决策账本*');

  return L.join('\n');
}

export function downloadMarkdown(cases: DecisionCase[], lang: Lang = 'zh'): void {
  const md = toMarkdown(cases, new Date(), lang);
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const prefix = lang === 'en' ? 'undecided-decision-ledger' : '未决-决策账本';
  downloadFile(md, `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.md`, 'text/markdown;charset=utf-8');
}
