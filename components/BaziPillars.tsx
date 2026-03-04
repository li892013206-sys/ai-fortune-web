'use client';

import { BaZiResult } from '@/lib/bazi';
import { motion } from 'framer-motion';

interface BaziPillarsProps {
  baziResult: BaZiResult;
}

// 纳音五行颜色映射
const NAYIN_COLORS: Record<string, string> = {
  '海中金': 'from-yellow-400 to-amber-500',
  '炉中火': 'from-red-500 to-orange-600',
  '大林木': 'from-green-500 to-emerald-600',
  '路旁土': 'from-yellow-600 to-amber-700',
  '剑锋金': 'from-slate-300 to-slate-500',
  '山头火': 'from-red-400 to-rose-500',
  '涧下水': 'from-blue-400 to-cyan-500',
  '城头土': 'from-amber-600 to-yellow-700',
  '白蜡金': 'from-yellow-200 to-amber-300',
  '杨柳木': 'from-green-400 to-lime-500',
  '泉中水': 'from-blue-300 to-sky-400',
  '屋上土': 'from-yellow-700 to-amber-800',
  '霹雳火': 'from-purple-500 to-pink-600',
  '松柏木': 'from-green-600 to-emerald-700',
  '长流水': 'from-blue-500 to-indigo-500',
  '沙中金': 'from-yellow-300 to-amber-400',
  '山下火': 'from-orange-500 to-red-500',
  '平地木': 'from-lime-500 to-green-500',
  '壁上土': 'from-stone-600 to-amber-700',
  '金箔金': 'from-yellow-100 to-amber-200',
  '覆灯火': 'from-red-300 to-orange-400',
  '天河水': 'from-cyan-400 to-blue-500',
  '大驿土': 'from-amber-700 to-yellow-800',
  '钗钏金': 'from-yellow-200 to-amber-400',
  '桑柘木': 'from-green-500 to-lime-600',
  '大溪水': 'from-blue-400 to-cyan-600',
  '沙中土': 'from-yellow-500 to-amber-600',
  '天上火': 'from-orange-400 to-red-600',
  '石榴木': 'from-red-600 to-green-700',
  '大海水': 'from-blue-600 to-indigo-700',
};

// 五行颜色
const WUXING_COLORS: Record<string, string> = {
  '金': 'text-yellow-400',
  '木': 'text-green-400',
  '水': 'text-blue-400',
  '火': 'text-red-400',
  '土': 'text-amber-400',
};

export default function BaziPillars({ baziResult }: BaziPillarsProps) {
  const { fourPillars, dayGan, dayGanWuxing, lunar, solar } = baziResult;

  const pillars = [
    { name: '年柱', pillar: fourPillars.year, desc: '祖辈·根基' },
    { name: '月柱', pillar: fourPillars.month, desc: '父母·事业' },
    { name: '日柱', pillar: fourPillars.day, desc: '自身·婚姻', isDay: true },
    { name: '时柱', pillar: fourPillars.hour, desc: '子女·晚年' },
  ];

  return (
    <div className="space-y-6">
      {/* 基本信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-amber-500/20 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
          <h3 className="text-xl font-bold text-amber-400">命盘信息</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">公历：</span>
            <span className="text-white ml-2">
              {solar.year}年{solar.month}月{solar.day}日 {solar.hour}时
            </span>
          </div>
          <div>
            <span className="text-gray-400">农历：</span>
            <span className="text-white ml-2">
              {lunar.yearInChinese}年{lunar.monthInChinese}{lunar.dayInChinese}
            </span>
          </div>
          <div>
            <span className="text-gray-400">日主：</span>
            <span className={`ml-2 font-bold text-lg ${WUXING_COLORS[dayGanWuxing]}`}>
              {dayGan} ({dayGanWuxing})
            </span>
          </div>
          <div>
            <span className="text-gray-400">命格：</span>
            <span className="text-amber-300 ml-2 font-medium">
              {fourPillars.day.nayin}命
            </span>
          </div>
        </div>
      </motion.div>

      {/* 四柱展示 */}
      <div className="grid grid-cols-4 gap-4">
        {pillars.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-gradient-to-br ${
              item.isDay
                ? 'from-amber-900/40 to-amber-800/40 border-amber-500/50'
                : 'from-slate-800/80 to-slate-900/80 border-slate-700/50'
            } rounded-xl p-4 border backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300`}
          >
            {/* 日柱特殊标记 */}
            {item.isDay && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                日主
              </div>
            )}

            {/* 柱名 */}
            <div className="text-center mb-3">
              <div className={`text-sm font-semibold ${item.isDay ? 'text-amber-400' : 'text-gray-400'}`}>
                {item.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </div>

            {/* 天干地支 */}
            <div className="flex flex-col items-center gap-2 mb-3">
              <div className="relative">
                <div className="text-3xl font-bold text-white bg-gradient-to-br from-slate-700 to-slate-800 w-14 h-14 rounded-lg flex items-center justify-center border border-slate-600 shadow-inner">
                  {item.pillar.gan}
                </div>
                <div className="absolute -bottom-1 -right-1 text-xs bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {item.pillar.ganWuxing}
                </div>
              </div>

              <div className="relative">
                <div className="text-3xl font-bold text-white bg-gradient-to-br from-slate-700 to-slate-800 w-14 h-14 rounded-lg flex items-center justify-center border border-slate-600 shadow-inner">
                  {item.pillar.zhi}
                </div>
                <div className="absolute -bottom-1 -right-1 text-xs bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {item.pillar.zhiWuxing}
                </div>
              </div>
            </div>

            {/* 纳音 */}
            <div className="text-center">
              <div
                className={`inline-block bg-gradient-to-r ${
                  NAYIN_COLORS[item.pillar.nayin] || 'from-gray-400 to-gray-600'
                } text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md`}
              >
                {item.pillar.nayin}
              </div>
            </div>

            {/* 藏干 */}
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-gray-400 text-center mb-1">藏干</div>
              <div className="flex justify-center gap-1">
                {item.pillar.cangGan.map((gan, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-700/50 text-amber-300 text-xs px-2 py-0.5 rounded border border-slate-600"
                  >
                    {gan}
                  </span>
                ))}
              </div>
            </div>

            {/* 十神 */}
            {item.pillar.shiShen && (
              <div className="mt-2 text-center">
                <span className="inline-block bg-purple-900/50 text-purple-300 text-xs font-medium px-2 py-1 rounded border border-purple-700/50">
                  {item.pillar.shiShen}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* 十神统计 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-5 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
          <h4 className="text-base font-semibold text-purple-400">十神分布</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(baziResult.shiShenAnalysis).map(([shishen, count]) => (
            <div
              key={shishen}
              className="bg-slate-700/50 text-white text-sm px-3 py-1.5 rounded-lg border border-slate-600 flex items-center gap-2"
            >
              <span className="font-medium">{shishen}</span>
              <span className="text-amber-400 font-bold">{count}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
