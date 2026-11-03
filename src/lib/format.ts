/** 关口可比数的显示：金额用「万」压短，天数直接给 */
export type MeasureUnit = 'money' | 'days';

export function fmtMeasure(v: number, unit: MeasureUnit, lang: 'zh' | 'en'): string {
  if (unit === 'days') {
    return lang === 'zh' ? `${v} 天` : `${v} days`;
  }
  if (lang === 'zh') {
    // 一万以上用「万」，否则带千分位——中文里「4.1 万」比「41,000 元」好读
    if (v >= 10000) {
      const w = v / 10000;
      const s = w >= 100 ? Math.round(w).toString() : w.toFixed(1).replace(/\.0$/, '');
      return `${s} 万`;
    }
    return `${Math.round(v).toLocaleString('zh-CN')} 元`;
  }
  return `¥${Math.round(v).toLocaleString('en-US')}`;
}
