import type { DecisionCase } from '../state/types';
import { gateName } from '../knowledge/gates';
import { downloadFile } from '../state/storage';
import { fmtDate, fmtDateTime } from './date';
import { sealDisplay } from './seal';

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

/** 把全部案卷导出成一封可读的 Markdown 信 */
export function toMarkdown(cases: DecisionCase[], exportedAt = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${exportedAt.getFullYear()}-${pad(exportedAt.getMonth() + 1)}-${pad(exportedAt.getDate())} ${pad(exportedAt.getHours())}:${pad(exportedAt.getMinutes())}`;

  const live = cases.filter((c) => c.status === 'draft' || c.status === 'framed');
  const sealed = cases.filter((c) => c.status === 'sealed');
  const archived = cases.filter((c) => c.status === 'archived').sort((a, b) => Date.parse(b.archivedAt ?? b.updatedAt) - Date.parse(a.archivedAt ?? a.updatedAt));
  const abandoned = cases.filter((c) => c.status === 'abandoned');

  const L: string[] = [];
  L.push('# 我的决策账本');
  L.push('');
  L.push(`> 导出于 ${ts} · 由「未决」在本机生成，没有经过任何服务器`);
  L.push('');
  L.push(`共 **${cases.length}** 个决定：草稿 ${live.length} · 已封存 ${sealed.length} · 已归档 ${archived.length} · 撤回 ${abandoned.length}`);
  L.push('');

  if (archived.length > 0) {
    L.push('## 一句话回顾');
    L.push('');
    for (const c of archived.slice(0, 10)) {
      L.push(`- **${c.question}** — 选了「${c.chosen}」，结果：${c.result || '—'}${c.verdict ? `（${VERDICT[c.verdict]}）` : ''}`);
    }
    L.push('');
  }

  const groups: [string, DecisionCase[]][] = [
    ['进行中的决定', live],
    ['已封存，等到期', sealed],
    ['已归档', archived],
    ['已撤回', abandoned],
  ];

  for (const [title, list] of groups) {
    if (list.length === 0) continue;
    L.push(`---`);
    L.push('');
    L.push(`## ${title}`);
    L.push('');

    for (const c of list) {
      L.push(`### ${c.question || '（未命名）'}`);
      L.push('');
      L.push(`\`${gateName(c.gate)}\` · ${STATUS[c.status] ?? c.status} · 开卷 ${fmtDate(c.createdAt)}`);
      if (c.deadlineAt) L.push(`必须定于：${fmtDate(c.deadlineAt)}`);
      if (c.sealHash) L.push(`封条：\`${sealDisplay(c.sealHash)}\``);
      L.push('');

      if (c.options.length) {
        L.push('**当时的选项**');
        L.push('');
        c.options.forEach((o, i) => L.push(`${i + 1}. ${o}${o === c.chosen ? '　← 选了这个' : ''}${o === c.nonActionOption ? '（非行动选项）' : ''}`));
        L.push('');
      }

      const facts = c.facts.map((f) => f.trim()).filter(Boolean);
      if (facts.length) {
        L.push('**我观察到的事实**');
        L.push('');
        facts.forEach((f) => L.push(`- ${f}`));
        L.push('');
      }

      if (c.aiGap) {
        L.push('**AI 不知道的是**');
        L.push('');
        L.push(`> ${c.aiGap}`);
        L.push('');
      }

      if (c.falsifySignal) { L.push('**反证条件**', '', c.falsifySignal, ''); }

      if (c.distance) {
        L.push('**如果是朋友问我**');
        L.push('');
        L.push(`> ${c.distance}`);
        L.push('');
      }

      if (c.chosen) {
        L.push('**落槌**');
        L.push('');
        L.push(`- 选了：${c.chosen}`);
        if (c.prediction) L.push(`- 预测：${c.prediction}`);
        if (c.predictedP) L.push(`- 当时给的概率：${c.predictedP}%`);
        if (c.sealedAt) L.push(`- 封存于：${fmtDate(c.sealedAt)}`);
        if (c.openAt) L.push(`- 原计划回看日：${fmtDate(c.openAt)}`);
        if (c.openedEarlyAt) L.push(`- 提前开封：${fmtDateTime(c.openedEarlyAt)}`);
        if (c.archivedAt) L.push(`- 归档于：${fmtDateTime(c.archivedAt)}`);
        L.push('');
      }

      if (c.reviewDraft) {
        L.push('**回访草稿（未归档）**', '', `- 结果：${c.reviewDraft.result}`,
          `- 自标：${VERDICT[c.reviewDraft.verdict] ?? '未填写'}`, `- 判断：${c.reviewDraft.wrong}`, `- 下次调整：${c.reviewDraft.next}`, '');
      }

      if (c.result || c.wrongJudgment || c.nextChange || c.verdict) {
        L.push('**回看**');
        L.push('');
        if (c.result) L.push(`- 结果：${c.result}`);
        if (c.verdict) L.push(`- 和当时想的一样吗：${VERDICT[c.verdict] ?? c.verdict}`);
        if (c.wrongJudgment) L.push(`- 成立与需修正的判断：${c.wrongJudgment}`);
        if (c.nextChange) L.push(`- 下次改：${c.nextChange}`);
        L.push('');
      }

      if (c.abandReason) {
        L.push(`**撤回原因**：${c.abandReason}`);
        L.push('');
      }

      L.push('---');
      L.push('');
    }
  }

  L.push('## 关于这份文件');
  L.push('');
  L.push('- 它是你自己的记录，不在任何服务器上。删了就是删了，建议定期备份。');
  L.push('- 里面的判断没有对错之分，只有「后来发生了什么」。');
  L.push('- 如果你想把它交给别人看，先想清楚：这里面有你客户的价格和你自己的犹豫。');
  L.push('');
  L.push('*由「未决」生成 · 一个不联网的决策账本*');

  return L.join('\n');
}

export function downloadMarkdown(cases: DecisionCase[]): void {
  const md = toMarkdown(cases);
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  downloadFile(md, `未决-决策账本-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.md`, 'text/markdown;charset=utf-8');
}
