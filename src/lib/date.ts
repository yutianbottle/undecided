const DAY = 86400000;

export function nowISO(): string { return new Date().toISOString(); }

export function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export function daysSince(iso: string, from: string = nowISO()): number {
  return Math.max(0, Math.floor((new Date(from).getTime() - new Date(iso).getTime()) / DAY));
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fmtDate(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 距今天还有几天到期（负数=已过期） */
export function daysUntil(iso: string | null): number | null {
  if (!iso || !Number.isFinite(Date.parse(iso))) return null;
  const target = new Date(iso);
  const today = new Date();
  return Math.round((Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
    - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / DAY);
}

export function isDue(iso: string | null): boolean {
  return !!iso && Number.isFinite(Date.parse(iso)) && Date.parse(iso) <= Date.now();
}

/** 当月最后一天的 23:59（"这个月内"用） */
export function monthEndISO(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  last.setHours(23, 59, 0, 0);
  return last.toISOString();
}

/** n 天后的日期，给 date input 用 */
export function futureInput(n: number): string {
  const d = new Date(Date.now() + n * 86400000);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function todayInput(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 日期输入必须是一个真实的本地日历日期。 */
export function dateInputISO(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(value + 'T23:59:59.999');
  return Number.isFinite(d.getTime()) && fmtDate(d.toISOString()) === value ? d.toISOString() : null;
}

export function reviewAvailable(c: { openAt: string | null; openedEarlyAt?: string | null }): boolean {
  return isDue(c.openAt) || !!c.openedEarlyAt;
}
