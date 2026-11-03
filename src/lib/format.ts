/** 格式化关口可比数：金额以「万」为单位，天数直接显示。 */
export type MeasureUnit = 'money' | 'days';

export function fmtMeasure(v: number, unit: MeasureUnit, lang: 'zh' | 'en'): string {
  if (unit === 'days') {
    return lang === 'zh' ? `${v} 天` : `${v} days`;
  }
  if (lang === 'zh') {
    // 一万以上使用「万」单位，其余金额保留千分位。
    if (v >= 10000) {
      const w = v / 10000;
      const s = w >= 100 ? Math.round(w).toString() : w.toFixed(1).replace(/\.0$/, '');
      return `${s} 万`;
    }
    return `${Math.round(v).toLocaleString('zh-CN')} 元`;
  }
  return `¥${Math.round(v).toLocaleString('en-US')}`;
}
