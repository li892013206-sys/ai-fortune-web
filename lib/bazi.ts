import { Solar, Lunar, BaZi } from 'lunar-javascript';

/**
 * 五行属性映射
 */
const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

/**
 * 十神关系映射 (以日干为主)
 */
const SHISHEN_MAP: Record<string, Record<string, string>> = {
  '甲': { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' },
  '乙': { '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印' },
  '丙': { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' },
  '丁': { '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀' },
  '戊': { '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
  '己': { '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财' },
  '庚': { '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官' },
  '辛': { '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神' },
  '壬': { '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财' },
  '癸': { '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩' },
};

/**
 * 地支藏干映射（含余气、中气、本气权重）
 */
const DIZHI_CANGGAN: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

/**
 * 地支藏干权重（本气权重最高）
 */
const CANGGAN_WEIGHT: Record<string, number[]> = {
  '子': [1.0],
  '丑': [0.6, 0.3, 0.1],
  '寅': [0.6, 0.3, 0.1],
  '卯': [1.0],
  '辰': [0.6, 0.3, 0.1],
  '巳': [0.6, 0.3, 0.1],
  '午': [0.7, 0.3],
  '未': [0.6, 0.3, 0.1],
  '申': [0.6, 0.3, 0.1],
  '酉': [1.0],
  '戌': [0.6, 0.3, 0.1],
  '亥': [0.7, 0.3],
};

/**
 * 月令司令表（十二月建对应的五行旺相）
 */
const MONTH_SEASON: Record<string, { wuxing: string; strength: number }> = {
  '寅': { wuxing: '木', strength: 3.0 }, // 正月，木旺
  '卯': { wuxing: '木', strength: 3.0 }, // 二月，木旺
  '辰': { wuxing: '土', strength: 2.5 }, // 三月，土旺（木余气）
  '巳': { wuxing: '火', strength: 3.0 }, // 四月，火旺
  '午': { wuxing: '火', strength: 3.0 }, // 五月，火旺
  '未': { wuxing: '土', strength: 2.5 }, // 六月，土旺（火余气）
  '申': { wuxing: '金', strength: 3.0 }, // 七月，金旺
  '酉': { wuxing: '金', strength: 3.0 }, // 八月，金旺
  '戌': { wuxing: '土', strength: 2.5 }, // 九月，土旺（金余气）
  '亥': { wuxing: '水', strength: 3.0 }, // 十月，水旺
  '子': { wuxing: '水', strength: 3.0 }, // 十一月，水旺
  '丑': { wuxing: '土', strength: 2.5 }, // 十二月，土旺（水余气）
};

/**
 * 五行生克关系
 */
const WUXING_RELATION = {
  生: {
    '木': '火',
    '火': '土',
    '土': '金',
    '金': '水',
    '水': '木',
  },
  克: {
    '木': '土',
    '火': '金',
    '土': '水',
    '金': '木',
    '水': '火',
  },
};

export interface BaZiPillar {
  gan: string;
  zhi: string;
  ganWuxing: string;
  zhiWuxing: string;
  nayin: string;
  cangGan: string[];
  shiShen?: string;
}

export interface RiZhuStrengthAnalysis {
  deLing: boolean; // 得令（月令是否生扶日主）
  deLingScore: number; // 得令分数
  deDi: boolean; // 得地（地支是否有根）
  deDiScore: number; // 得地分数
  deSheng: boolean; // 得生（是否有印星生扶）
  deShengScore: number; // 得生分数
  deZhu: boolean; // 得助（是否有比劫帮扶）
  deZhuScore: number; // 得助分数
  totalScore: number; // 总分
  strength: '身强' | '身弱' | '中和'; // 强弱判定
  xiYongShen: string[]; // 喜用神（五行）
  jiShen: string[]; // 忌神（五行）
  analysis: string; // 详细分析文本
}

export interface BaZiResult {
  fourPillars: {
    year: BaZiPillar;
    month: BaZiPillar;
    day: BaZiPillar;
    hour: BaZiPillar;
  };
  wuxingScore: {
    金: number;
    木: number;
    水: number;
    火: number;
    土: number;
  };
  dayGan: string;
  dayGanWuxing: string;
  shiShenAnalysis: Record<string, number>;
  strengthAnalysis: RiZhuStrengthAnalysis; // 新增：日主强弱分析
  lunar: {
    year: number;
    month: number;
    day: number;
    yearInChinese: string;
    monthInChinese: string;
    dayInChinese: string;
  };
  solar: {
    year: number;
    month: number;
    day: number;
    hour: number;
  };
}

/**
 * 获取地支对应的五行
 */
function getZhiWuxing(zhi: string): string {
  const zhiWuxingMap: Record<string, string> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水',
  };
  return zhiWuxingMap[zhi] || '未知';
}

/**
 * 计算五行得分（考虑月令权重）
 */
function calculateWuxingScore(pillars: BaZiPillar[], monthZhi: string): { 金: number; 木: number; 水: number; 火: number; 土: number } {
  const score: { 金: number; 木: number; 水: number; 火: number; 土: number } = {
    '金': 0,
    '木': 0,
    '水': 0,
    '火': 0,
    '土': 0,
  };

  // 获取月令旺相信息
  const monthSeason = MONTH_SEASON[monthZhi];

  pillars.forEach((pillar, index) => {
    // 天干得分 (基础权重 3)
    let ganWeight = 3;
    // 月干权重加倍
    if (index === 1) ganWeight = 4;
    score[pillar.ganWuxing as keyof typeof score] += ganWeight;

    // 地支得分 (基础权重 2)
    let zhiWeight = 2;
    // 月令权重最高
    if (index === 1 && monthSeason) {
      zhiWeight = monthSeason.strength;
    }
    score[pillar.zhiWuxing as keyof typeof score] += zhiWeight;

    // 藏干得分（根据权重表）
    const weights = CANGGAN_WEIGHT[pillar.zhi] || [1.0];
    pillar.cangGan.forEach((gan, cangIndex) => {
      const wuxing = WUXING_MAP[gan];
      if (wuxing) {
        const weight = weights[cangIndex] || 0.1;
        // 月令藏干权重加倍
        const finalWeight = index === 1 ? weight * 1.5 : weight;
        score[wuxing as keyof typeof score] += finalWeight;
      }
    });
  });

  return score;
}

/**
 * 判断日主是否得令（月令生扶）
 */
function checkDeLing(dayGanWuxing: string, monthZhi: string): { deLing: boolean; score: number; reason: string } {
  const monthSeason = MONTH_SEASON[monthZhi];
  if (!monthSeason) {
    return { deLing: false, score: 0, reason: '月令信息缺失' };
  }

  const monthWuxing = monthSeason.wuxing;

  // 月令与日主同五行（最强）
  if (monthWuxing === dayGanWuxing) {
    return { deLing: true, score: 3.0, reason: `月令${monthZhi}为${monthWuxing}，与日主同气，得令最旺` };
  }

  // 月令生日主（次强）
  if (WUXING_RELATION.生[monthWuxing as keyof typeof WUXING_RELATION.生] === dayGanWuxing) {
    return { deLing: true, score: 2.5, reason: `月令${monthZhi}为${monthWuxing}，生扶日主${dayGanWuxing}，得令` };
  }

  // 月令克日主（失令）
  if (WUXING_RELATION.克[monthWuxing as keyof typeof WUXING_RELATION.克] === dayGanWuxing) {
    return { deLing: false, score: -2.0, reason: `月令${monthZhi}为${monthWuxing}，克制日主${dayGanWuxing}，失令` };
  }

  // 日主克月令（耗泄）
  if (WUXING_RELATION.克[dayGanWuxing as keyof typeof WUXING_RELATION.克] === monthWuxing) {
    return { deLing: false, score: -1.0, reason: `日主${dayGanWuxing}克月令${monthWuxing}，耗泄，不得令` };
  }

  // 日主生月令（泄气）
  if (WUXING_RELATION.生[dayGanWuxing as keyof typeof WUXING_RELATION.生] === monthWuxing) {
    return { deLing: false, score: -1.5, reason: `日主${dayGanWuxing}生月令${monthWuxing}，泄气，不得令` };
  }

  return { deLing: false, score: 0, reason: '月令与日主关系平和' };
}

/**
 * 判断日主是否得地（地支有根）
 */
function checkDeDi(dayGan: string, dayGanWuxing: string, pillars: BaZiPillar[]): { deDi: boolean; score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  pillars.forEach((pillar, index) => {
    const pillarName = ['年', '月', '日', '时'][index];

    // 检查地支藏干是否有日主通根
    pillar.cangGan.forEach((gan, cangIndex) => {
      if (gan === dayGan) {
        const weight = CANGGAN_WEIGHT[pillar.zhi]?.[cangIndex] || 0.1;
        const rootScore = weight * 2.0; // 通根得分
        score += rootScore;
        reasons.push(`${pillarName}支${pillar.zhi}藏${gan}，日主通根（+${rootScore.toFixed(1)}）`);
      } else if (WUXING_MAP[gan] === dayGanWuxing) {
        // 同五行也算有根，但分数较低
        const weight = CANGGAN_WEIGHT[pillar.zhi]?.[cangIndex] || 0.1;
        const rootScore = weight * 1.0;
        score += rootScore;
        reasons.push(`${pillarName}支${pillar.zhi}藏${gan}（${dayGanWuxing}），有气（+${rootScore.toFixed(1)}）`);
      }
    });

    // 检查地支本气是否与日主同五行
    if (pillar.zhiWuxing === dayGanWuxing) {
      score += 1.0;
      reasons.push(`${pillarName}支${pillar.zhi}为${dayGanWuxing}，有根（+1.0）`);
    }
  });

  const deDi = score >= 2.0;
  const reason = reasons.length > 0 ? reasons.join('；') : '地支无根';

  return { deDi, score, reason };
}

/**
 * 判断日主是否得生（印星生扶）
 */
function checkDeSheng(dayGanWuxing: string, pillars: BaZiPillar[], shiShenAnalysis: Record<string, number>): { deSheng: boolean; score: number; reason: string } {
  const yinxingCount = (shiShenAnalysis['正印'] || 0) + (shiShenAnalysis['偏印'] || 0);

  if (yinxingCount === 0) {
    return { deSheng: false, score: 0, reason: '八字无印星' };
  }

  // 计算印星的实际生扶力量
  let score = 0;
  const reasons: string[] = [];

  pillars.forEach((pillar, index) => {
    const pillarName = ['年', '月', '日', '时'][index];

    // 检查天干印星
    if (WUXING_RELATION.生[pillar.ganWuxing as keyof typeof WUXING_RELATION.生] === dayGanWuxing) {
      const ganScore = index === 1 ? 2.0 : 1.5; // 月干印星力量最大
      score += ganScore;
      reasons.push(`${pillarName}干${pillar.gan}（${pillar.ganWuxing}）生日主（+${ganScore}）`);
    }

    // 检查地支藏干印星
    pillar.cangGan.forEach((gan, cangIndex) => {
      const ganWuxing = WUXING_MAP[gan];
      if (ganWuxing && WUXING_RELATION.生[ganWuxing as keyof typeof WUXING_RELATION.生] === dayGanWuxing) {
        const weight = CANGGAN_WEIGHT[pillar.zhi]?.[cangIndex] || 0.1;
        const cangScore = weight * 1.0;
        score += cangScore;
        reasons.push(`${pillarName}支${pillar.zhi}藏${gan}（${ganWuxing}）生日主（+${cangScore.toFixed(1)}）`);
      }
    });
  });

  const deSheng = score >= 2.0;
  const reason = reasons.length > 0 ? reasons.join('；') : '印星力量不足';

  return { deSheng, score, reason };
}

/**
 * 判断日主是否得助（比劫帮扶）
 */
function checkDeZhu(dayGan: string, dayGanWuxing: string, pillars: BaZiPillar[], shiShenAnalysis: Record<string, number>): { deZhu: boolean; score: number; reason: string } {
  const bijieCount = (shiShenAnalysis['比肩'] || 0) + (shiShenAnalysis['劫财'] || 0);

  if (bijieCount <= 1) { // 日主自己算1个比肩
    return { deZhu: false, score: 0, reason: '八字无比劫帮扶' };
  }

  let score = 0;
  const reasons: string[] = [];

  pillars.forEach((pillar, index) => {
    if (index === 2) return; // 跳过日柱（日主自己）

    const pillarName = ['年', '月', '日', '时'][index];

    // 检查天干比劫
    if (WUXING_MAP[pillar.gan] === dayGanWuxing) {
      const ganScore = index === 1 ? 2.0 : 1.5; // 月干比劫力量最大
      score += ganScore;
      reasons.push(`${pillarName}干${pillar.gan}（${dayGanWuxing}）帮身（+${ganScore}）`);
    }

    // 检查地支藏干比劫
    pillar.cangGan.forEach((gan, cangIndex) => {
      const ganWuxing = WUXING_MAP[gan];
      if (ganWuxing === dayGanWuxing) {
        const weight = CANGGAN_WEIGHT[pillar.zhi]?.[cangIndex] || 0.1;
        const cangScore = weight * 1.0;
        score += cangScore;
        reasons.push(`${pillarName}支${pillar.zhi}藏${gan}（${dayGanWuxing}）帮身（+${cangScore.toFixed(1)}）`);
      }
    });
  });

  const deZhu = score >= 2.0;
  const reason = reasons.length > 0 ? reasons.join('；') : '比劫力量不足';

  return { deZhu, score, reason };
}

/**
 * 综合判断日主强弱并推算喜用神
 */
function analyzeRiZhuStrength(
  dayGan: string,
  dayGanWuxing: string,
  pillars: BaZiPillar[],
  shiShenAnalysis: Record<string, number>
): RiZhuStrengthAnalysis {
  const monthZhi = pillars[1].zhi;

  // 四大判断
  const deLingResult = checkDeLing(dayGanWuxing, monthZhi);
  const deDiResult = checkDeDi(dayGan, dayGanWuxing, pillars);
  const deShengResult = checkDeSheng(dayGanWuxing, pillars, shiShenAnalysis);
  const deZhuResult = checkDeZhu(dayGan, dayGanWuxing, pillars, shiShenAnalysis);

  // 计算总分
  const totalScore =
    deLingResult.score +
    deDiResult.score +
    deShengResult.score +
    deZhuResult.score;

  // 判断强弱
  let strength: '身强' | '身弱' | '中和';
  if (totalScore >= 5.0) {
    strength = '身强';
  } else if (totalScore <= -2.0) {
    strength = '身弱';
  } else {
    strength = '中和';
  }

  // 推算喜用神
  const xiYongShen: string[] = [];
  const jiShen: string[] = [];

  if (strength === '身强') {
    // 身强：喜克泄耗，忌生扶
    // 喜：官杀（克）、食伤（泄）、财星（耗）
    const keWuxing = Object.entries(WUXING_RELATION.克).find(([_, v]) => v === dayGanWuxing)?.[0];
    const xieWuxing = WUXING_RELATION.生[dayGanWuxing as keyof typeof WUXING_RELATION.生];
    const haoWuxing = Object.entries(WUXING_RELATION.克).find(([k, _]) => k === dayGanWuxing)?.[1];

    if (keWuxing) xiYongShen.push(keWuxing); // 官杀
    if (xieWuxing) xiYongShen.push(xieWuxing); // 食伤
    if (haoWuxing) xiYongShen.push(haoWuxing); // 财星

    // 忌：印星（生）、比劫（助）
    const shengWuxing = Object.entries(WUXING_RELATION.生).find(([_, v]) => v === dayGanWuxing)?.[0];
    if (shengWuxing) jiShen.push(shengWuxing); // 印星
    jiShen.push(dayGanWuxing); // 比劫

  } else if (strength === '身弱') {
    // 身弱：喜生扶，忌克泄耗
    // 喜：印星（生）、比劫（助）
    const shengWuxing = Object.entries(WUXING_RELATION.生).find(([_, v]) => v === dayGanWuxing)?.[0];
    if (shengWuxing) xiYongShen.push(shengWuxing); // 印星
    xiYongShen.push(dayGanWuxing); // 比劫

    // 忌：官杀（克）、食伤（泄）、财星（耗）
    const keWuxing = Object.entries(WUXING_RELATION.克).find(([_, v]) => v === dayGanWuxing)?.[0];
    const xieWuxing = WUXING_RELATION.生[dayGanWuxing as keyof typeof WUXING_RELATION.生];
    const haoWuxing = Object.entries(WUXING_RELATION.克).find(([k, _]) => k === dayGanWuxing)?.[1];

    if (keWuxing) jiShen.push(keWuxing); // 官杀
    if (xieWuxing) jiShen.push(xieWuxing); // 食伤
    if (haoWuxing) jiShen.push(haoWuxing); // 财星

  } else {
    // 中和：根据具体情况微调
    xiYongShen.push('根据大运流年灵活调整');
  }

  // 生成详细分析文本
  const analysis = `
【日主强弱分析】

一、得令情况（${deLingResult.score >= 0 ? '+' : ''}${deLingResult.score.toFixed(1)}分）
${deLingResult.reason}

二、得地情况（+${deDiResult.score.toFixed(1)}分）
${deDiResult.reason}

三、得生情况（+${deShengResult.score.toFixed(1)}分）
${deShengResult.reason}

四、得助情况（+${deZhuResult.score.toFixed(1)}分）
${deZhuResult.reason}

【综合判定】
总分：${totalScore >= 0 ? '+' : ''}${totalScore.toFixed(1)}分
结论：日主${strength}

【喜用神推算】
喜用神：${xiYongShen.join('、')}
忌神：${jiShen.join('、')}

调运建议：
${strength === '身强'
  ? '日主偏旺，宜用克泄耗之五行平衡命局。可多接触喜用神对应的颜色、方位、行业。'
  : strength === '身弱'
  ? '日主偏弱，宜用生扶之五行增强命局。可多接触喜用神对应的颜色、方位、行业。'
  : '日主中和，命局平衡较好，顺应自然即可。'}
  `.trim();

  return {
    deLing: deLingResult.deLing,
    deLingScore: deLingResult.score,
    deDi: deDiResult.deDi,
    deDiScore: deDiResult.score,
    deSheng: deShengResult.deSheng,
    deShengScore: deShengResult.score,
    deZhu: deZhuResult.deZhu,
    deZhuScore: deZhuResult.score,
    totalScore,
    strength,
    xiYongShen,
    jiShen,
    analysis,
  };
}

/**
 * 计算十神分布
 */
function calculateShiShenDistribution(dayGan: string, pillars: BaZiPillar[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  pillars.forEach((pillar) => {
    const shiShen = SHISHEN_MAP[dayGan]?.[pillar.gan];
    if (shiShen) {
      distribution[shiShen] = (distribution[shiShen] || 0) + 1;
    }

    // 计算藏干的十神
    pillar.cangGan.forEach((gan) => {
      const cangGanShiShen = SHISHEN_MAP[dayGan]?.[gan];
      if (cangGanShiShen) {
        distribution[cangGanShiShen] = (distribution[cangGanShiShen] || 0) + 0.5;
      }
    });
  });

  return distribution;
}

/**
 * 根据经度计算真太阳时偏移（分钟）
 * @param longitude 经度（东经为正，西经为负）
 * @returns 时间偏移（分钟）
 */
function calculateSolarTimeOffset(longitude: number): number {
  // 东经120度为标准时区基准（北京时间）
  // 每15度经度差 = 1小时时差
  // 每1度经度差 = 4分钟时差
  const standardLongitude = 120;
  const offsetMinutes = (longitude - standardLongitude) * 4;
  return Math.round(offsetMinutes);
}

/**
 * 排八字
 * @param year 公历年
 * @param month 公历月 (1-12)
 * @param day 公历日
 * @param hour 公历时 (0-23)
 * @param minute 公历分 (0-59)
 * @param longitude 经度（可选，用于真太阳时校对）
 * @returns 八字排盘结果
 */
export function calculateBaZi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
  longitude?: number
): BaZiResult {
  // 如果提供了经度，进行真太阳时校对
  let adjustedHour = hour;
  let adjustedMinute = minute;

  if (longitude !== undefined) {
    const offsetMinutes = calculateSolarTimeOffset(longitude);
    const totalMinutes = hour * 60 + minute + offsetMinutes;

    // 处理跨日情况
    if (totalMinutes < 0) {
      // 前一天
      const solar = Solar.fromYmdHms(year, month, day, 0, 0, 0);
      const prevSolar = solar.next(-1);
      year = prevSolar.getYear();
      month = prevSolar.getMonth();
      day = prevSolar.getDay();
      adjustedHour = Math.floor((1440 + totalMinutes) / 60);
      adjustedMinute = (1440 + totalMinutes) % 60;
    } else if (totalMinutes >= 1440) {
      // 后一天
      const solar = Solar.fromYmdHms(year, month, day, 0, 0, 0);
      const nextSolar = solar.next(1);
      year = nextSolar.getYear();
      month = nextSolar.getMonth();
      day = nextSolar.getDay();
      adjustedHour = Math.floor((totalMinutes - 1440) / 60);
      adjustedMinute = (totalMinutes - 1440) % 60;
    } else {
      adjustedHour = Math.floor(totalMinutes / 60);
      adjustedMinute = totalMinutes % 60;
    }
  }

  // 创建公历日期（使用校对后的时间）
  const solar = Solar.fromYmdHms(year, month, day, adjustedHour, adjustedMinute, 0);
  const lunar = solar.getLunar();
  const baZi = lunar.getEightChar();

  // 获取四柱（使用正确的方法）
  const yearGanZhi = baZi.getYearGan() + baZi.getYearZhi();
  const monthGanZhi = baZi.getMonthGan() + baZi.getMonthZhi();
  const dayGanZhi = baZi.getDayGan() + baZi.getDayZhi();
  const hourGanZhi = baZi.getTimeGan() + baZi.getTimeZhi();

  const dayGan = baZi.getDayGan();

  // 构建四柱对象
  const createPillar = (ganZhi: string, nayin: string): BaZiPillar => {
    const gan = ganZhi.charAt(0);
    const zhi = ganZhi.charAt(1);
    return {
      gan,
      zhi,
      ganWuxing: WUXING_MAP[gan] || '未知',
      zhiWuxing: getZhiWuxing(zhi),
      nayin,
      cangGan: DIZHI_CANGGAN[zhi] || [],
      shiShen: SHISHEN_MAP[dayGan]?.[gan],
    };
  };

  const yearPillar = createPillar(yearGanZhi, baZi.getYearNaYin());
  const monthPillar = createPillar(monthGanZhi, baZi.getMonthNaYin());
  const dayPillar = createPillar(dayGanZhi, baZi.getDayNaYin());
  const hourPillar = createPillar(hourGanZhi, baZi.getTimeNaYin());

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];

  // 计算五行得分（传入月支用于月令权重计算）
  const wuxingScore = calculateWuxingScore(pillars, monthPillar.zhi);

  // 计算十神分布
  const shiShenAnalysis = calculateShiShenDistribution(dayGan, pillars);

  // 计算日主强弱和喜用神
  const strengthAnalysis = analyzeRiZhuStrength(dayGan, WUXING_MAP[dayGan], pillars, shiShenAnalysis);

  return {
    fourPillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    wuxingScore,
    dayGan,
    dayGanWuxing: WUXING_MAP[dayGan] || '未知',
    shiShenAnalysis,
    strengthAnalysis, // 新增
    lunar: {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      yearInChinese: lunar.getYearInChinese(),
      monthInChinese: lunar.getMonthInChinese(),
      dayInChinese: lunar.getDayInChinese(),
    },
    solar: {
      year,
      month,
      day,
      hour,
    },
  };
}

/**
 * 将八字结果格式化为适合 AI Prompt 的文本
 */
export function formatBaZiForPrompt(baziResult: BaZiResult): string {
  const { fourPillars, wuxingScore, dayGan, dayGanWuxing, shiShenAnalysis, strengthAnalysis, lunar, solar } = baziResult;

  return `
八字排盘信息：

公历生日：${solar.year}年${solar.month}月${solar.day}日 ${solar.hour}时
农历生日：${lunar.yearInChinese}年${lunar.monthInChinese}月${lunar.dayInChinese}

四柱干支：
- 年柱：${fourPillars.year.gan}${fourPillars.year.zhi} (${fourPillars.year.nayin})
- 月柱：${fourPillars.month.gan}${fourPillars.month.zhi} (${fourPillars.month.nayin})
- 日柱：${fourPillars.day.gan}${fourPillars.day.zhi} (${fourPillars.day.nayin})
- 时柱：${fourPillars.hour.gan}${fourPillars.hour.zhi} (${fourPillars.hour.nayin})

日主：${dayGan} (${dayGanWuxing})

五行得分：
- 金：${wuxingScore.金.toFixed(1)}
- 木：${wuxingScore.木.toFixed(1)}
- 水：${wuxingScore.水.toFixed(1)}
- 火：${wuxingScore.火.toFixed(1)}
- 土：${wuxingScore.土.toFixed(1)}

十神分布：
${Object.entries(shiShenAnalysis)
  .map(([shishen, count]) => `- ${shishen}：${count}`)
  .join('\n')}

藏干信息：
- 年支 ${fourPillars.year.zhi} 藏：${fourPillars.year.cangGan.join('、')}
- 月支 ${fourPillars.month.zhi} 藏：${fourPillars.month.cangGan.join('、')}
- 日支 ${fourPillars.day.zhi} 藏：${fourPillars.day.cangGan.join('、')}
- 时支 ${fourPillars.hour.zhi} 藏：${fourPillars.hour.cangGan.join('、')}

${strengthAnalysis.analysis}
`.trim();
}
