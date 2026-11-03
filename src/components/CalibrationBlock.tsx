import { useLang } from '../i18n';
import { CALIBRATION_MIN, calibration, calibrationFilled } from '../knowledge/engine';
import { getGate } from '../knowledge/gates';
import { fmtMeasure } from '../lib/format';
import type { DecisionCase, GateId } from '../state/types';

/**
 * 校准数据：比较某个关口在落槌时的预估值与回看时的实际值。
 * 样本少于三次时仅显示进度，不输出倾向结论。
 */
export function CalibrationBlock({ cases, gate }: { cases: DecisionCase[]; gate: GateId }) {
  const { lang } = useLang();
  const L = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const cal = calibration(cases, gate);
  const m = getGate(gate).measure;

  if (!cal) {
    const filled = calibrationFilled(cases, gate);
    return (
      <div className="hint" style={{ lineHeight: 1.9 }}>
        {L(
          `${m.unit === 'money' ? '报价' : '天数'}记了 ${filled} / ${CALIBRATION_MIN} 次。凑满 ${CALIBRATION_MIN} 次，这里会写出你自己的规律。`,
          `${filled} of ${CALIBRATION_MIN} logged. At ${CALIBRATION_MIN} this states the pattern in your own numbers.`,
        )}
      </div>
    );
  }

  const pct = Math.round(Math.abs(cal.ratio - 1) * 100);
  const close = cal.ratio >= 0.9 && cal.ratio <= 1.1;

  return (
    <div>
      <p className="card-d" style={{ margin: 0 }}>
        {L(
          `${cal.n} 次有记录的判断：你估平均 ${fmtMeasure(cal.avgExpected, cal.unit, 'zh')}，实际 ${fmtMeasure(cal.avgActual, cal.unit, 'zh')}。`,
          `${cal.n} logged calls: you expected ${fmtMeasure(cal.avgExpected, cal.unit, 'en')} on average, it was ${fmtMeasure(cal.avgActual, cal.unit, 'en')}.`,
        )}
      </p>
      <p className="card-more" style={{ marginTop: 6 }}>
        {close
          ? L('你的估计和实际基本吻合。', 'Your estimates land close to reality.')
          : cal.unit === 'money'
            ? cal.ratio < 1
              ? L(`你一贯报高——实际比你估的低 ${pct}%。下次给价，先把估的数乘 ${cal.ratio}。`,
                  `You tend to price high — it lands ${pct}% below what you said. Next time, multiply by ${cal.ratio}.`)
              : L(`你一贯报低——实际比你估的高 ${pct}%。下次给价，先把估的数乘 ${cal.ratio}。`,
                  `You tend to price low — it lands ${pct}% above what you said. Next time, multiply by ${cal.ratio}.`)
            : cal.ratio > 1
              ? L(`你的预估一贯偏快——实际比你估的多 ${pct}%。下次给天数，乘 ${cal.ratio}。`,
                  `Your estimates run fast — things take ${pct}% longer. Next time, multiply by ${cal.ratio}.`)
              : L(`你的预估偏慢——实际比你估的少 ${pct}%。`,
                  `Your estimates run slow — things take ${pct}% less than you said.`)}
      </p>
    </div>
  );
}
