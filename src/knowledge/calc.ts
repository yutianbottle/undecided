/**
 * 成本底价：保本价 = 直接成本 ÷ (1 − 目标毛利率)
 *
 * 仅使用用户当场可提供的两个数：直接成本和目标毛利。
 * 不依赖税率、社保或平台佣金等外部参数，适用于离线环境。
 */

export interface FloorResult {
  /** 保本价 */
  floor: number;
  /** 目标毛利降 10 个点后的保本价，用来防点估计 */
  lower: number;
  /** 实际用于算 lower 的毛利率 */
  lowerMargin: number;
}

/** 成本或毛利不合法时返回 null。 */
export function floorPrice(cost: number, marginPct: number): number | null {
  if (!Number.isFinite(cost) || cost <= 0) return null;
  if (!Number.isFinite(marginPct) || marginPct < 0 || marginPct >= 100) return null;
  return Math.round(cost / (1 - marginPct / 100));
}

/** 连同「毛利降 10 个点」的边界值一起返回；任何一个算不出就返回 null */
export function floorResult(cost: number, marginPct: number): FloorResult | null {
  const floor = floorPrice(cost, marginPct);
  const lowerMargin = Math.max(0, marginPct - 10);
  const lower = floorPrice(cost, lowerMargin);
  if (floor === null || lower === null) return null;
  return { floor, lower, lowerMargin };
}

/** 把「8,000」「8 000」这类输入还原成数；空串返回 NaN */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,，\s]/g, '');
  if (!cleaned) return NaN;
  return Number(cleaned);
}
