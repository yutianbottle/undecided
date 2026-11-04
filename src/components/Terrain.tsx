import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import type { GateId } from '../state/types';
import { useLang } from '../i18n';
import { gateName } from '../knowledge/gates';
import { GATES } from '../knowledge/gates';
import { terrainPoint } from '../knowledge/engine';

export interface TerrainProps {
  userPoints?: { x: number; y: number; gate?: GateId }[];   // 0..1 归一化，来自用户自己的案卷
  onPick?: (gate: GateId) => void;           // 点击关口点
  height?: number;                            // 默认 300
}

const W = 600;
const H = 320;
const PAD = 44;

const PAPER_45 = '#A8A49E';   /* 关口点与标签 */
const PAPER_25 = '#97938E';   /* 坐标轴文字 */
const LAMP = '#D9AE63';
const CONTOUR = 'rgba(237,235,230,.09)';
const AXIS = 'rgba(237,235,230,.12)';
const FONT = 'var(--sans)';

/** 三条不规则且不闭合的等高线，用于区分不同区域。 */
const CONTOURS = [
  'M -30 258 C 34 240 74 264 132 254 C 192 243 216 210 280 218 C 344 226 370 254 430 244 C 490 234 534 210 630 222',
  'M -30 190 C 40 174 86 194 146 180 C 206 166 236 134 302 144 C 368 154 398 182 458 170 C 514 159 562 138 630 148',
  'M -30 116 C 36 102 90 116 152 102 C 212 88 252 62 320 72 C 388 82 416 108 476 98 C 532 89 578 70 630 78',
];

/** 小幅分开同簇圆点，标签通过引线放在独立位置。 */
const NUDGE: Partial<Record<GateId, { dx: number; dy: number }>> = {
  pricing: { dx: 0, dy: -10 },
  channel: { dx: -10, dy: 0 },
  priceup: { dx: 10, dy: 2 },
  accept: { dx: 0, dy: 10 },
  product: { dx: -9, dy: -6 },
  hiring: { dx: 9, dy: 6 },
};
const LABELS: Record<string, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
  quoting: { dx: -14, dy: 24, anchor: 'end' },
  accept: { dx: 0, dy: 48, anchor: 'middle' },
  pricing: { dx: -20, dy: -30, anchor: 'end' },
  channel: { dx: -38, dy: -4, anchor: 'end' },
  priceup: { dx: 38, dy: 24, anchor: 'start' },
  product: { dx: -14, dy: -22, anchor: 'end' },
  hiring: { dx: 14, dy: 14, anchor: 'start' },
  partner: { dx: -4, dy: -18, anchor: 'end' },
};
// 地图内用短名；完整名称和数值保留在可访问标签、悬停说明与关口列表。
const SHORT_EN: Record<string, string> = {
  quoting: 'Quoting', accept: 'Client', pricing: 'Pricing', channel: 'Channel',
  priceup: 'Raise price', product: 'Product', hiring: 'Hiring', partner: 'Partner',
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function toXY(x: number, y: number, width = W, height = H) {
  return {
    x: PAD + clamp01(x) * (width - 2 * PAD),
    y: height - PAD - clamp01(y) * (height - 2 * PAD),
  };
}

const revText = (n: number, lang: 'zh' | 'en' = 'zh'): string =>
  lang === 'zh'
    ? (n <= 2 ? '做错了能改回来' : n === 3 ? '改起来有代价' : '基本改不回来')
    : (n <= 2 ? 'reversible' : n === 3 ? 'costly to undo' : 'hard to undo');

export function Terrain(props: TerrainProps): JSX.Element {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const { userPoints = [], onPick, height = 300 } = props;
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(W);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, Math.min(W, entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const mapHeight = width < 500 ? 360 : H;
  const [hover, setHover] = useState<GateId | null>(null);
  const hg = hover ? GATES.find((g) => g.id === hover) : undefined;

  // 最后绘制悬停关口，使高亮点位于相邻点之上。
  const ordered = hover ? [...GATES.filter((g) => g.id !== hover), ...GATES.filter((g) => g.id === hover)] : GATES;

  return (
    <div>
    <div className="terrain-scroll" ref={container} role="region" aria-label={L('关口地形图', 'Gate map')}><svg
      viewBox={`0 0 ${width} ${mapHeight}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="terrain-map"
      role="group"
      aria-label={L('关口地形图：横轴可逆性 1 到 5，纵轴反馈周期从短到长', 'Gate map: reversibility across, feedback time up')}
      style={{ display: 'block', width: '100%', height: 'auto', maxHeight: Math.max(height, mapHeight) }}
    >
      {/* 等高线 */}
      {CONTOURS.map((d, i) => (
        <path key={i} d={d} transform={`scale(${width / W} ${mapHeight / H})`} fill="none" stroke={CONTOUR} strokeWidth={1} strokeLinecap="round" />
      ))}

      {/* 两条极淡的轴 */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={mapHeight - PAD} stroke={AXIS} strokeWidth={1} />
      <line x1={PAD} y1={mapHeight - PAD} x2={width - PAD} y2={mapHeight - PAD} stroke={AXIS} strokeWidth={1} />

      {/* 轴上只放最短的词，完整解释在图下面 */}
      <g fontFamily={FONT} fontSize={12} fill={PAPER_25}>
        <text x={PAD - 8} y={PAD + 4} textAnchor="end">{L('久', 'slow')}</text>
        <text x={PAD - 8} y={mapHeight - PAD} textAnchor="end">{L('快', 'fast')}</text>
        <text x={PAD} y={mapHeight - PAD + 24} textAnchor="start">{L('能改', 'reversible')}</text>
        <text x={width - PAD} y={mapHeight - PAD + 24} textAnchor="end">{L('改不了', 'permanent')}</text>
      </g>
      {/* 八个关口 */}
      {ordered.map((g) => {
        const base = terrainPoint(g.reversibility, g.feedbackDays);
        const p = toXY(base.x, base.y, width, mapHeight);
        const n = NUDGE[g.id];
        const x = p.x + (n?.dx ?? 0);
        const y = p.y + (n?.dy ?? 0);
        const lab = width < 320 && g.id === 'product'
          ? { ...LABELS.product, dy: -46 }
          : LABELS[g.id];
        const on = hover === g.id;

        return (
          <g
            key={g.id}
            role="button"
            tabIndex={0}
            aria-label={L(`${g.name}：${revText(g.reversibility, lang)}，约 ${g.feedbackDays} 天知道结果`, `${gateName(g.id, lang)}: ${revText(g.reversibility, lang)}, ~${g.feedbackDays} days to know`)}
            onClick={() => onPick?.(g.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPick?.(g.id);
              }
            }}
            onMouseEnter={() => setHover(g.id)}
            onMouseLeave={() => setHover((h) => (h === g.id ? null : h))}
            onFocus={() => setHover(g.id)}
            onBlur={() => setHover((h) => (h === g.id ? null : h))}
            style={{ cursor: onPick ? 'pointer' : 'default' }}
          >
            <title>{L(`${g.name} · 可逆性 ${g.reversibility}/5 · 反馈约 ${g.feedbackDays} 天`, `${gateName(g.id, lang)} · reversibility ${g.reversibility}/5 · ~${g.feedbackDays} days`)}</title>
            <line x1={x} y1={y} x2={x + lab.dx} y2={y + lab.dy - 5} stroke={on ? LAMP : AXIS} />
            <circle cx={x} cy={y} r={12} fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r={on ? 5.5 : 4}
              fill={on ? LAMP : PAPER_45}
              style={{ transition: 'r 160ms, fill 160ms' }}
            />
            <text
              x={x + lab.dx}
              y={y + lab.dy}
              textAnchor={lab.anchor}
              fontFamily={FONT}
              fontSize={12}
              fill={on ? LAMP : PAPER_45}
              style={{ transition: 'fill 160ms', userSelect: 'none' }}
            >
              {lang === 'zh' ? g.name : SHORT_EN[g.id]}
            </text>
          </g>
        );
      })}

      {/* 用户案卷按归一化坐标绘制为独立标记，不与关口连线。 */}
      <g pointerEvents="none">
        {userPoints.map((p, i) => {
          const c = toXY(p.x, p.y, width, mapHeight);
          const n = p.gate ? NUDGE[p.gate] : undefined;
          // 空心金环表示该关口存在用户案卷。
          return (
            <circle key={i} cx={c.x + (n?.dx ?? 0)} cy={c.y + (n?.dy ?? 0)} r={7.5} fill="none"
              stroke="rgba(198,161,91,.5)" strokeWidth={1} />
          );
        })}
      </g>
    </svg></div>
    <div className="terrain-caption" aria-live="polite">
      {hg ? (
        <p className="hint">
          {L(`${hg.name}：${revText(hg.reversibility, lang)}，约 ${hg.feedbackDays} 天知道结果`, `${gateName(hg.id, lang)}: ${revText(hg.reversibility, lang)}, ~${hg.feedbackDays} days to know`)}
        </p>
      ) : <p className="hint">{L('选择一个关口，看看它的处境。', 'Choose a gate to explore its context.')}</p>}
    </div>
    </div>
  );
}
