import type { AppState, DecisionCase } from './types';
import { hasNonAction } from '../lib/validate';
import { fmtDate } from '../lib/date';

export const STORAGE_KEY = 'weijue.v1';
export const STATE_VERSION = 2;
const EXPORT_KEY = 'weijue.last-export';
const EMPTY: AppState = { cases: [], version: STATE_VERSION };
let readIssue = '';
const gates = ['quoting', 'accept', 'pricing', 'product', 'hiring', 'partner', 'channel', 'priceup', 'other'];
const statuses = ['draft', 'framed', 'sealed', 'archived', 'abandoned'];
const verdicts = ['', 'same', 'partial', 'different'];
const reasons = ['', '不重要', '情况变了', '别人替我定了', '写下来发现不用选'];
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const date = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const maybeDate = (v: unknown) => v === null || date(v);

/** 严格检查导入内容，再补齐旧版新增字段；不截断、不默默丢弃案卷。 */
export function parseState(value: unknown): AppState {
  if (!record(value) || ![1, STATE_VERSION].includes(value.version as number) || !Array.isArray(value.cases)) {
    throw new Error('备份版本不支持，或缺少案卷数组。');
  }
  const ids = new Set<string>();
  const cases = value.cases.map((raw: unknown, index: number): DecisionCase => {
    const fail = () => { throw new Error(`第 ${index + 1} 个案卷的数据不完整或格式不正确。`); };
    if (!record(raw)) return fail();
    if (!text(raw.id, 200) || !raw.id || ids.has(raw.id)) return fail();
    ids.add(raw.id);
    for (const [key, max] of Object.entries({ question: 40, aiGap: 60, falsifySignal: 80, distance: 80,
      chosen: 20, prediction: 60, result: 40, wrongJudgment: 40, nextChange: 40 })) {
      if (!text(raw[key], max)) return fail();
    }
    if (!gates.includes(raw.gate as string) || !statuses.includes(raw.status as string)
      || !['date', 'month', 'none'].includes(raw.deadlineKind as string)
      || !verdicts.includes(raw.verdict as string) || !reasons.includes(raw.abandReason as string)
      || !Number.isInteger(raw.step) || (raw.step as number) < 1 || (raw.step as number) > 7
      || !Number.isInteger(raw.predictedP) || (raw.predictedP as number) < 1 || (raw.predictedP as number) > 99
      || ![-1, 0, 1, 2, 99].includes(raw.aiPick as number)
      || typeof raw.skippedWait !== 'boolean') return fail();
    if (!Array.isArray(raw.options) || raw.options.length > 4 || !raw.options.every(o => text(o, 20))
      || !Array.isArray(raw.facts) || raw.facts.length > 3 || !raw.facts.every(f => text(f, 60))) return fail();
    if (!date(raw.createdAt) || !date(raw.updatedAt) || !maybeDate(raw.deadlineAt)
      || !maybeDate(raw.sealedAt) || !maybeDate(raw.openAt)
      || (raw.sealHash !== null && (typeof raw.sealHash !== 'string' || !/^[A-F0-9]{8}$/.test(raw.sealHash)))) return fail();
    if (raw.deadlineKind !== 'none' && !date(raw.deadlineAt)) return fail();
    if ((raw.status === 'sealed' || raw.status === 'archived')
      && (!date(raw.sealedAt) || !date(raw.openAt) || !raw.sealHash || !raw.chosen || !raw.prediction)) return fail();
    if (raw.status === 'archived' && !(raw.result as string).trim()) return fail();
    if (raw.status === 'abandoned' && !raw.abandReason) return fail();
    for (const key of ['openedEarlyAt', 'archivedAt']) {
      if (raw[key] !== undefined && !maybeDate(raw[key])) return fail();
    }
    for (const key of ['expectedDays', 'actualDays']) {
      const v = raw[key];
      if (v !== undefined && v !== null
        && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100000)) return fail();
    }
    if (raw.furthestStep !== undefined && (!Number.isInteger(raw.furthestStep)
      || (raw.furthestStep as number) < 2 || (raw.furthestStep as number) > 6)) return fail();
    if (raw.nonActionOption !== undefined && (!text(raw.nonActionOption, 20)
      || (raw.nonActionOption !== '' && !raw.options.includes(raw.nonActionOption)))) return fail();
    if (raw.reviewDraft !== undefined) {
      const draft = raw.reviewDraft;
      if (!record(draft) || !text(draft.result, 40) || !text(draft.wrong, 40)
        || !text(draft.next, 40) || !verdicts.includes(draft.verdict as string)) return fail();
    }
    const c = raw as unknown as DecisionCase;
    return {
      ...c,
      nonActionOption: c.nonActionOption ?? c.options.find(o => hasNonAction([o])) ?? '',
      furthestStep: c.furthestStep ?? Math.max(2, Math.min(6, c.step)),
      openedEarlyAt: c.openedEarlyAt ?? null,
      archivedAt: c.archivedAt ?? (c.status === 'archived' ? c.updatedAt : null),
    };
  });
  return { version: STATE_VERSION, cases };
}

export function loadState(): AppState {
  readIssue = '';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseState(JSON.parse(raw)) : { ...EMPTY };
  } catch {
    readIssue = '本机记录暂时无法读取。原始数据已保留，自动保存已暂停；请先导出原始数据，再导入有效备份恢复。';
    return { ...EMPTY };
  }
}

export const getReadIssue = () => readIssue;

export function saveState(s: AppState): { ok: boolean; message: string } {
  if (readIssue) return { ok: false, message: readIssue };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return { ok: true, message: '已保存到本机' };
  } catch {
    return { ok: false, message: '保存失败，当前内容仍在页面中。请立即导出备份，再重试保存。' };
  }
}

/** 只有用户明确导入或清空时，才解除损坏数据的写入保护。 */
export function allowRecoveryWrite(): void { readIssue = ''; }

export function downloadFile(contents: string, filename: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportRaw(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) throw new Error('浏览器中没有可导出的原始记录。');
  downloadFile(raw, `weijue-original-${fmtDate(new Date().toISOString())}.json`);
}

export function exportJSON(s: AppState): void {
  downloadFile(JSON.stringify(s, null, 2), `weijue-${fmtDate(new Date().toISOString())}.json`);
  try { localStorage.setItem(EXPORT_KEY, new Date().toISOString()); } catch { /* 导出文件不依赖元数据写入 */ }
}

export function lastExportAt(): string | null {
  try { return localStorage.getItem(EXPORT_KEY); } catch { return null; }
}

/** 合并时保留本机相同 ID 的案卷，尤其不覆盖已封存记录。 */
export function mergeStates(current: AppState, incoming: AppState): AppState {
  const ids = new Set(current.cases.map(c => c.id));
  return { version: STATE_VERSION, cases: [...current.cases, ...incoming.cases.filter(c => !ids.has(c.id))] };
}


/**
 * 向浏览器申请「持久存储」。
 * 默认情况下，浏览器在磁盘紧张时可能清掉不常用站点的 localStorage；
 * 申请成功后这个 origin 会被标记为 persistent，不会被自动清理。
 * Chrome / Edge 支持，Safari 部分支持，失败时静默返回 false，不影响使用。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage || typeof navigator.storage.persist !== 'function') return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** 当前用量（字节），用于判断离上限还有多远 */
export async function storageUsage(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (!navigator.storage || typeof navigator.storage.estimate !== 'function') return null;
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  } catch {
    return null;
  }
}
