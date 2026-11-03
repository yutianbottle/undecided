import { describe, it, expect } from 'vitest';
import { floorPrice, floorResult, parseAmount } from './calc';

describe('floorPrice：保本价 = 直接成本 ÷ (1 − 目标毛利率)', () => {
  it('调研里的四个例子', () => {
    expect(floorPrice(8000, 40)).toBe(13333);
    expect(floorPrice(8000, 30)).toBe(11429);
    expect(floorPrice(8000, 50)).toBe(16000);
    expect(floorPrice(15000, 35)).toBe(23077);
  });

  it('毛利为 0 时保本价等于成本', () => {
    expect(floorPrice(8000, 0)).toBe(8000);
  });

  it('非法输入返回 null，不猜', () => {
    expect(floorPrice(NaN, 40)).toBeNull();
    expect(floorPrice(0, 40)).toBeNull();
    expect(floorPrice(-100, 40)).toBeNull();
    expect(floorPrice(8000, NaN)).toBeNull();
    expect(floorPrice(8000, -5)).toBeNull();
    expect(floorPrice(8000, 100)).toBeNull();
    expect(floorPrice(8000, 120)).toBeNull();
  });
});

describe('floorResult：必须带一个边界值', () => {
  it('毛利降 10 个点后的结果', () => {
    const r = floorResult(8000, 40);
    expect(r).not.toBeNull();
    expect(r!.floor).toBe(13333);
    expect(r!.lowerMargin).toBe(30);
    expect(r!.lower).toBe(11429);
  });

  it('毛利不足 10 点时降到 0，不出现负数毛利', () => {
    const r = floorResult(8000, 6);
    expect(r!.lowerMargin).toBe(0);
    expect(r!.lower).toBe(8000);
  });

  it('非法输入整组返回 null', () => {
    expect(floorResult(0, 40)).toBeNull();
    expect(floorResult(8000, 100)).toBeNull();
  });
});

describe('parseAmount：容错用户输入', () => {
  it('接受千分位与空格', () => {
    expect(parseAmount('8,000')).toBe(8000);
    expect(parseAmount('8，000')).toBe(8000);
    expect(parseAmount('8 000')).toBe(8000);
  });

  it('空串与文字返回 NaN', () => {
    expect(Number.isNaN(parseAmount(''))).toBe(true);
    expect(Number.isNaN(parseAmount('八千'))).toBe(true);
  });
});
