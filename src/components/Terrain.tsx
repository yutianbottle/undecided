import { useState } from 'react';
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
const PAPER_25 = '#8B8781';   /* 坐标轴文字 */
const LAMP = '#D9AE63';
const CONTOUR = 'rgba(237,235,230,.09)';
const AXIS = 'rgba(237,235,230,.12)';
const CONTOUR2 = 'rgba(237,235,230,.42)';
const FONT = 'var(--sans)';

/** 三条手绘等高线：不规则、不闭合，避免同心椭圆的机械感 */
const CONTOURS = [
  'M -30 258 C 34 240 74 264 132 254 C 192 243 216 210 280 218 C 344 226 370 254 430 244 C 490 234 534 210 630 222',
  'M -30 190 C 40 174 86 194 146 180 C 206 166 236 134 302 144 C 368 154 398 182 458 170 C 514 159 562 138 630 148',
  'M -30 116 C 36 102 90 116 152 102 C 212 88 252 62 320 72 C 388 82 416 108 476 98 C 532 89 578 70 630 78',
];

/**
 * 取舍与招人的可逆性、反馈周期完全一致（4, 90），坐标必然落在同一点；
 * 各错开 6–9 像素，保证两个点都点得到。偏移小于一个字符高度，不改变读图结论。
 * 其余关口一律按 terrainPoint 的真实坐标落点，不做任何挪动。
 */
const NUDGE: Partial<Record<GateId, { dx: number; dy: number }>> = {
  product: { dx: -9, dy: -6 },
  hiring: { dx: 9, dy: 6 },
};

/**
 * 标签位置手调（相对圆点，像素）。
 * 可逆性 3 的四个关口（接单/定价/渠道/涨价）落在 x≈300 的一条竖线上，间距只有 7–11px：
 * 定价朝上、渠道朝左、涨价朝右、接单朝下，四个方向各占一边，标签不互相压住。
 */
const LABELS: Partial<Record<GateId, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }>> = {
  quoting: { dx: -12, dy: 4, anchor: 'end' },
  accept: { dx: 0, dy: 16, anchor: 'middle' },
  pricing: { dx: 0, dy: -10, anchor: 'middle' },
  channel: { dx: -12, dy: 4, anchor: 'end' },
  priceup: { dx: 12, dy: 4, anchor: 'start' },
  product: { dx: -12, dy: -2, anchor: 'end' },
  hiring: { dx: 12, dy: 12, anchor: 'start' },
  partner: { dx: -4, dy: -14, anchor: 'end' },
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function toXY(x: number, y: number) {
  return {
    x: PAD + clamp01(x) * (W - 2 * PAD),
    y: H - PAD - clamp01(y) * (H - 2 * PAD),
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
  const [hover, setHover] = useState<GateId | null>(null);
  const hg = hover ? GATES.find((g) => g.id === hover) : undefined;

  // 悬停的关口最后画，金点才不会被相邻的灰点压住
  const ordered = hover ? [...GATES.filter((g) => g.id !== hover), ...GATES.filter((g) => g.id === hover)] : GATES;

  return (
    <div>
    <div className="terrain-scroll" role="region" aria-label="关口地形图，可横向滚动" tabIndex={0}><svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="terrain-map"
      role="group"
      aria-label={L('关口地形图：横轴可逆性 1 到 5，纵轴反馈周期从短到长', 'Gate map: reversibility across, feedback time up')}
      style={{ display: 'block', width: '100%', height: 'auto', maxHeight: height }}
    >
      {/* 等高线 */}
      {CONTOURS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={CONTOUR} strokeWidth={1} strokeLinecap="round" />
      ))}

      {/* 两条极淡的轴 */}
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={AXIS} strokeWidth={1} />
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={AXIS} strokeWidth={1} />

      {/* 轴上只放最短的词，完整解释在图下面 */}
      <g fontFamily={FONT} fontSize={13} fill={PAPER_25}>
        <text x={PAD - 8} y={PAD + 4} textAnchor="end">{L('久', 'slow')}</text>
        <text x={PAD - 8} y={H - PAD} textAnchor="end">{L('快', 'fast')}</text>
        <text x={PAD} y={H - PAD + 17} textAnchor="start">{L('能改', 'reversible')}</text>
        <text x={W - PAD} y={H - PAD + 17} textAnchor="end">{L('改不了', 'permanent')}</text>
      </g>
      {/* 方向提示 */}
      <g fontFamily={FONT} fontSize={13} fill={CONTOUR2}>
        <text x={PAD + 6} y={PAD - 6} textAnchor="start">{L('↑ 越往上，结果来得越慢', '↑ up: slower to know')}</text>
        <text x={W - PAD} y={PAD - 6} textAnchor="end">{L('越往右，越改不回来 →', 'right: harder to undo →')}</text>
      </g>

      {/* 八个关口 */}
      {ordered.map((g) => {
        const base = terrainPoint(g.reversibility, g.feedbackDays);
        const p = toXY(base.x, base.y);
        const n = NUDGE[g.id];
        const x = p.x + (n?.dx ?? 0);
        const y = p.y + (n?.dy ?? 0);
        const lab = LABELS[g.id] ?? { dx: 12, dy: 4, anchor: 'start' as const };
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
            {/* 图上的密集点仅作辅助入口，完整触控入口在下方关口列表。 */}
            <circle cx={x} cy={y} r={8} fill="transparent" />
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
              fontSize={13}
              fill={on ? LAMP : PAPER_45}
              style={{ transition: 'fill 160ms', userSelect: 'none' }}
            >
              {gateName(g.id, lang)}
            </text>
          </g>
        );
      })}

      {/* 用户自己的案卷：按传入的归一化坐标落点，画在关口点之上才看得见；不加任何连线 */}
      <g pointerEvents="none">
        {userPoints.map((p, i) => {
          const c = toXY(p.x, p.y);
          const n = p.gate ? NUDGE[p.gate] : undefined;
          // 空心金环：落在关口点外围，表示"这个关口你碰过"
          return (
            <circle key={i} cx={c.x + (n?.dx ?? 0)} cy={c.y + (n?.dy ?? 0)} r={7.5} fill="none"
              stroke="rgba(198,161,91,.5)" strokeWidth={1} />
          );
        })}
      </g>
    </svg></div>
    <div style={{ minHeight: 22, textAlign: 'center' }}>
      {hg && (
        <p className="hint" style={{ marginTop: 4 }}>
          {L(`${hg.name}：${revText(hg.reversibility, lang)}，约 ${hg.feedbackDays} 天知道结果`, `${gateName(hg.id, lang)}: ${revText(hg.reversibility, lang)}, ~${hg.feedbackDays} days to know`)}
        </p>
      )}
    </div>
    </div>
  );
}
