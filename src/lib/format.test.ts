import { describe, it, expect } from 'vitest';
import { fmtMeasure } from './format';

describe('fmtMeasure', () => {
  it('天数直接给', () => {
    expect(fmtMeasure(14, 'days', 'zh')).toBe('14 天');
    expect(fmtMeasure(14, 'days', 'en')).toBe('14 days');
  });

  it('中文金额：一万以上压成「万」', () => {
    expect(fmtMeasure(38000, 'money', 'zh')).toBe('3.8 万');
    expect(fmtMeasure(41000, 'money', 'zh')).toBe('4.1 万');
    expect(fmtMeasure(120000, 'money', 'zh')).toBe('12 万');
  });

  it('中文金额：一万以下带千分位', () => {
    expect(fmtMeasure(3800, 'money', 'zh')).toBe('3,800 元');
    expect(fmtMeasure(999, 'money', 'zh')).toBe('999 元');
  });

  it('整万不显示小数点', () => {
    expect(fmtMeasure(10000, 'money', 'zh')).toBe('1 万');
    expect(fmtMeasure(20000, 'money', 'zh')).toBe('2 万');
  });

  it('英文金额一律带符号和千分位', () => {
    expect(fmtMeasure(38000, 'money', 'en')).toBe('¥38,000');
    expect(fmtMeasure(1500, 'money', 'en')).toBe('¥1,500');
  });
});
