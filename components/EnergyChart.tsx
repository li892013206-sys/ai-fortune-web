'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { BaZiResult } from '@/lib/bazi';

interface EnergyChartProps {
  baziResult: BaZiResult;
  chartType?: 'radar' | 'bar';
}

// 五行颜色映射
const WUXING_COLORS: Record<string, string> = {
  '金': '#D4AF37',
  '木': '#22C55E',
  '水': '#3B82F6',
  '火': '#EF4444',
  '土': '#A16207',
};

// 五行生克关系
const WUXING_SHENGKE = {
  '金': { sheng: '水', ke: '木' },
  '木': { sheng: '火', ke: '土' },
  '水': { sheng: '木', ke: '火' },
  '火': { sheng: '土', ke: '金' },
  '土': { sheng: '金', ke: '水' },
};

/**
 * 分析五行喜忌
 */
function analyzeWuxingPreference(wuxingScore: Record<string, number>, dayGanWuxing: string) {
  const entries = Object.entries(wuxingScore);
  const total = entries.reduce((sum, [_, score]) => sum + score, 0);
  const average = total / 5;

  // 找出最强和最弱的五行
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0][0];
  const weakest = sorted[sorted.length - 1][0];

  // 判断日主强弱
  const dayGanScore = wuxingScore[dayGanWuxing];
  const isDayGanStrong = dayGanScore > average * 1.2;

  // 生成喜忌分析
  let analysis = '';
  let xiShen = ''; // 喜神
  let jiShen = ''; // 忌神

  if (isDayGanStrong) {
    // 日主偏强，需要泄耗
    const keWuxing = WUXING_SHENGKE[dayGanWuxing as keyof typeof WUXING_SHENGKE]?.ke; // 日主克的五行
    const shengWuxing = Object.entries(WUXING_SHENGKE).find(([_, v]) => v.sheng === dayGanWuxing)?.[0]; // 生日主的五行

    xiShen = keWuxing || '';
    jiShen = shengWuxing || strongest;

    analysis = `命局五行${dayGanWuxing}偏旺，日主身强。宜泄耗，喜${keWuxing}来消耗能量。忌${jiShen}再生扶，以免过旺失衡。`;
  } else {
    // 日主偏弱，需要生扶
    const shengWuxing = Object.entries(WUXING_SHENGKE).find(([_, v]) => v.sheng === dayGanWuxing)?.[0]; // 生日主的五行
    const keWuxing = WUXING_SHENGKE[dayGanWuxing as keyof typeof WUXING_SHENGKE]?.ke; // 日主克的五行

    xiShen = shengWuxing || dayGanWuxing;
    jiShen = Object.entries(WUXING_SHENGKE).find(([_, v]) => v.ke === dayGanWuxing)?.[0] || strongest;

    analysis = `命局五行${dayGanWuxing}偏弱，日主身弱。宜生扶，喜${xiShen}来增强力量。忌${jiShen}克泄，以免更加虚弱。`;
  }

  // 检查五行是否严重失衡
  if (sorted[0][1] > average * 2) {
    analysis += `\n\n五行${strongest}过旺（${sorted[0][1]}分），容易导致性格偏激或健康问题，需要特别注意平衡调节。`;
  }

  if (sorted[sorted.length - 1][1] < average * 0.3) {
    analysis += `\n\n五行${weakest}严重不足（${sorted[sorted.length - 1][1]}分），建议通过颜色、方位、职业等方式补足。`;
  }

  return {
    analysis,
    xiShen,
    jiShen,
    strongest,
    weakest,
    isDayGanStrong,
  };
}

export default function EnergyChart({ baziResult, chartType = 'radar' }: EnergyChartProps) {
  const { wuxingScore, dayGanWuxing } = baziResult;

  // 转换数据格式
  const chartData = Object.entries(wuxingScore).map(([name, value]) => ({
    name,
    value,
    fullMark: Math.max(...Object.values(wuxingScore)) * 1.2,
  }));

  // 分析五行喜忌
  const preference = analyzeWuxingPreference(wuxingScore, dayGanWuxing);

  return (
    <div className="w-full space-y-6">
      {/* 图表区域 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-amber-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
          <h3 className="text-xl font-bold text-amber-400">五行能量分布</h3>
        </div>

        {chartType === 'radar' ? (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="#475569" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#fbbf24', fontSize: 14, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} stroke="#64748b" />
              <Radar
                name="五行得分"
                dataKey="value"
                stroke="#fbbf24"
                fill="#fbbf24"
                fillOpacity={0.4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fontSize: 14, fontWeight: 600, fill: '#fbbf24' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="value" name="五行得分" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={WUXING_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 五行分析说明 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl p-6 border border-amber-500/20">
        <h4 className="text-lg font-semibold mb-3 text-amber-400 flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          五行喜忌分析
        </h4>

        <div className="space-y-4">
          {/* 喜忌总结 */}
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-700/50 rounded-lg p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-400 mb-1">喜神（宜补）</div>
              <div className="text-2xl font-bold" style={{ color: WUXING_COLORS[preference.xiShen] }}>
                {preference.xiShen}
              </div>
            </div>
            <div className="flex-1 bg-slate-700/50 rounded-lg p-4 border-l-4 border-red-500">
              <div className="text-sm text-gray-400 mb-1">忌神（宜避）</div>
              <div className="text-2xl font-bold" style={{ color: WUXING_COLORS[preference.jiShen] }}>
                {preference.jiShen}
              </div>
            </div>
          </div>

          {/* 详细分析 */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {preference.analysis}
            </p>
          </div>

          {/* 调运建议 */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h5 className="font-semibold text-amber-400 mb-2">💡 调运建议</h5>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>多使用<strong style={{ color: WUXING_COLORS[preference.xiShen] }}>{preference.xiShen}</strong>属性的颜色、方位、数字</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>选择与<strong style={{ color: WUXING_COLORS[preference.xiShen] }}>{preference.xiShen}</strong>相关的职业或行业</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>避免过多接触<strong style={{ color: WUXING_COLORS[preference.jiShen] }}>{preference.jiShen}</strong>属性的事物</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
