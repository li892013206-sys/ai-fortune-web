import { Solar, Lunar } from 'lunar-javascript';

/**
 * 八字排盘引擎 - 完整版
 * 对齐 FateMaster 功能
 */

// ==================== 基础数据映射 ====================

/** 天干 */
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 地支 */
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 五行映射 */
const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

/** 地支五行 */
const DIZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

/** 地支藏干（本气、中气、余气） */
const DIZHI_CANGGAN: Record<string, { gan: string; weight: number }[]> = {
  '子': [{ gan: '癸', weight: 1.0 }],
  '丑': [{ gan: '己', weight: 0.6 }, { gan: '癸', weight: 0.3 }, { gan: '辛', weight: 0.1 }],
  '寅': [{ gan: '甲', weight: 0.6 }, { gan: '丙', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '卯': [{ gan: '乙', weight: 1.0 }],
  '辰': [{ gan: '戊', weight: 0.6 }, { gan: '乙', weight: 0.3 }, { gan: '癸', weight: 0.1 }],
  '巳': [{ gan: '丙', weight: 0.6 }, { gan: '庚', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '午': [{ gan: '丁', weight: 0.7 }, { gan: '己', weight: 0.3 }],
  '未': [{ gan: '己', weight: 0.6 }, { gan: '丁', weight: 0.3 }, { gan: '乙', weight: 0.1 }],
  '申': [{ gan: '庚', weight: 0.6 }, { gan: '壬', weight: 0.3 }, { gan: '戊', weight: 0.1 }],
  '酉': [{ gan: '辛', weight: 1.0 }],
  '戌': [{ gan: '戊', weight: 0.6 }, { gan: '辛', weight: 0.3 }, { gan: '丁', weight: 0.1 }],
  '亥': [{ gan: '壬', weight: 0.7 }, { gan: '甲', weight: 0.3 }],
};

/** 十神映射表 */
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

// ==================== 刑冲破害法则 ====================

/** 天干五合 */
const TIANGAN_HE = [
  { gan1: '甲', gan2: '己', result: '土' },
  { gan1: '乙', gan2: '庚', result: '金' },
  { gan1: '丙', gan2: '辛', result: '水' },
  { gan1: '丁', gan2: '壬', result: '木' },
  { gan1: '戊', gan2: '癸', result: '火' },
];

/** 天干相冲 */
const TIANGAN_CHONG = [
  { gan1: '甲', gan2: '庚' },
  { gan1: '乙', gan2: '辛' },
  { gan1: '丙', gan2: '壬' },
  { gan1: '丁', gan2: '癸' },
];

/** 地支六合 */
const DIZHI_LIUHE = [
  { zhi1: '子', zhi2: '丑', result: '土' },
  { zhi1: '寅', zhi2: '亥', result: '木' },
  { zhi1: '卯', zhi2: '戌', result: '火' },
  { zhi1: '辰', zhi2: '酉', result: '金' },
  { zhi1: '巳', zhi2: '申', result: '水' },
  { zhi1: '午', zhi2: '未', result: '土' },
];

/** 地支三合 */
const DIZHI_SANHE = [
  { zhi: ['申', '子', '辰'], result: '水' },
  { zhi: ['亥', '卯', '未'], result: '木' },
  { zhi: ['寅', '午', '戌'], result: '火' },
  { zhi: ['巳', '酉', '丑'], result: '金' },
];

/** 地支六冲 */
const DIZHI_LIUCHONG = [
  { zhi1: '子', zhi2: '午' },
  { zhi1: '丑', zhi2: '未' },
  { zhi1: '寅', zhi2: '申' },
  { zhi1: '卯', zhi2: '酉' },
  { zhi1: '辰', zhi2: '戌' },
  { zhi1: '巳', zhi2: '亥' },
];

/** 地支六害 */
const DIZHI_LIUHAI = [
  { zhi1: '子', zhi2: '未' },
  { zhi1: '丑', zhi2: '午' },
  { zhi1: '寅', zhi2: '巳' },
  { zhi1: '卯', zhi2: '辰' },
  { zhi1: '申', zhi2: '亥' },
  { zhi1: '酉', zhi2: '戌' },
];

/** 地支三刑 */
const DIZHI_SANXING = [
  { type: '无恩之刑', zhi: ['寅', '巳', '申'] },
  { type: '无礼之刑', zhi: ['丑', '未', '戌'] },
  { type: '恃势之刑', zhi: ['子', '卯'] },
  { type: '自刑', zhi: ['辰', '午', '酉', '亥'] },
];

// ==================== 神煞系统 ====================

/** 天乙贵人（按日干查） */
const TIANYI_GUIREN: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '庚': ['丑', '未'], '辛': ['寅', '午'],
  '壬': ['卯', '巳'], '癸': ['巳', '卯'],
};

/** 文昌贵人（按日干或年干查） */
const WENCHANG_GUIREN: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

/** 禄神（按日干查地支） */
const LUSHEN: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

/** 羊刃（按日干查地支） */
const YANGREN: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
  '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
};

/** 空亡（按日柱旬首查）*/
const KONGWANG_TABLE: Record<string, string[]> = {
  // 甲子旬（甲子-癸酉，空戌亥）
  '甲子': ['戌', '亥'], '乙丑': ['戌', '亥'], '丙寅': ['戌', '亥'], '丁卯': ['戌', '亥'],
  '戊辰': ['戌', '亥'], '己巳': ['戌', '亥'], '庚午': ['戌', '亥'], '辛未': ['戌', '亥'],
  '壬申': ['戌', '亥'], '癸酉': ['戌', '亥'],

  // 甲戌旬（甲戌-癸未，空申酉）
  '甲戌': ['申', '酉'], '乙亥': ['申', '酉'], '丙子': ['申', '酉'], '丁丑': ['申', '酉'],
  '戊寅': ['申', '酉'], '己卯': ['申', '酉'], '庚辰': ['申', '酉'], '辛巳': ['申', '酉'],
  '壬午': ['申', '酉'], '癸未': ['申', '酉'],

  // 甲申旬（甲申-癸巳，空午未）
  '甲申': ['午', '未'], '乙酉': ['午', '未'], '丙戌': ['午', '未'], '丁亥': ['午', '未'],
  '戊子': ['午', '未'], '己丑': ['午', '未'], '庚寅': ['午', '未'], '辛卯': ['午', '未'],
  '壬辰': ['午', '未'], '癸巳': ['午', '未'],

  // 甲午旬（甲午-癸卯，空辰巳）
  '甲午': ['辰', '巳'], '乙未': ['辰', '巳'], '丙申': ['辰', '巳'], '丁酉': ['辰', '巳'],
  '戊戌': ['辰', '巳'], '己亥': ['辰', '巳'], '庚子': ['辰', '巳'], '辛丑': ['辰', '巳'],
  '壬寅': ['辰', '巳'], '癸卯': ['辰', '巳'],

  // 甲辰旬（甲辰-癸丑，空寅卯）
  '甲辰': ['寅', '卯'], '乙巳': ['寅', '卯'], '丙午': ['寅', '卯'], '丁未': ['寅', '卯'],
  '戊申': ['寅', '卯'], '己酉': ['寅', '卯'], '庚戌': ['寅', '卯'], '辛亥': ['寅', '卯'],
  '壬子': ['寅', '卯'], '癸丑': ['寅', '卯'],

  // 甲寅旬（甲寅-癸亥，空子丑）
  '甲寅': ['子', '丑'], '乙卯': ['子', '丑'], '丙辰': ['子', '丑'], '丁巳': ['子', '丑'],
  '戊午': ['子', '丑'], '己未': ['子', '丑'], '庚申': ['子', '丑'], '辛酉': ['子', '丑'],
  '壬戌': ['子', '丑'], '癸亥': ['子', '丑'],
};

// ==================== 类型定义 ====================

export interface BaziPillar {
  gan: string;
  zhi: string;
  ganWuxing: string;
  zhiWuxing: string;
  nayin: string;
  ganShishen: string;
  zhiCanggan: { gan: string; shishen: string; weight: number }[];
}

export interface XingChongRelation {
  type: '天干合' | '天干冲' | '地支六合' | '地支三合' | '地支六冲' | '地支六害' | '地支刑';
  positions: string[]; // ['年', '月'] 或 ['年', '月', '日']
  elements: string[]; // 涉及的干支
  result?: string; // 合化结果（如果有）
  description: string;
}

export interface Shensha {
  name: string;
  position: string; // '年支'、'月支'、'日支'、'时支'
  element: string; // 具体地支
  description: string;
}

export interface Dayun {
  startAge: number;
  endAge: number;
  gan: string;
  zhi: string;
  ganShishen: string;
  zhiShishen: string;
  nayin: string;
}

export interface WuxingScore {
  金: number;
  木: number;
  水: number;
  火: number;
  土: number;
}

export interface BaziEngineResult {
  // 基础信息
  solar: { year: number; month: number; day: number; hour: number; minute: number };
  lunar: { year: number; month: number; day: number; yearInChinese: string; monthInChinese: string; dayInChinese: string };

  // 四柱
  fourPillars: {
    year: BaziPillar;
    month: BaziPillar;
    day: BaziPillar;
    hour: BaziPillar;
  };

  // 日主信息
  dayGan: string;
  dayGanWuxing: string;

  // 刑冲破害
  xingchong: XingChongRelation[];

  // 神煞
  shensha: Shensha[];

  // 大运
  dayun: Dayun[];
  qiyunAge: number; // 起运年龄
  shunni: '顺行' | '逆行'; // 顺逆

  // 五行分值（0-100标准化）
  wuxingScore: WuxingScore;
  wuxingPercentage: WuxingScore; // 百分比

  // 十神统计
  shishenStats: Record<string, number>;

  // 日主强弱
  strength: {
    level: '身强' | '身弱' | '中和';
    score: number;
    xiYongShen: string[];
    jiShen: string[];
  };
}

// ==================== 核心算法 ====================

/**
 * 检测天干关系
 */
function detectTianganRelations(pillars: { gan: string }[]): XingChongRelation[] {
  const relations: XingChongRelation[] = [];
  const positions = ['年', '月', '日', '时'];

  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const gan1 = pillars[i].gan;
      const gan2 = pillars[j].gan;

      // 检测天干五合
      const heRelation = TIANGAN_HE.find(
        (h) => (h.gan1 === gan1 && h.gan2 === gan2) || (h.gan1 === gan2 && h.gan2 === gan1)
      );
      if (heRelation) {
        relations.push({
          type: '天干合',
          positions: [positions[i], positions[j]],
          elements: [gan1, gan2],
          result: heRelation.result,
          description: `${positions[i]}干${gan1}与${positions[j]}干${gan2}相合化${heRelation.result}`,
        });
      }

      // 检测天干相冲
      const chongRelation = TIANGAN_CHONG.find(
        (c) => (c.gan1 === gan1 && c.gan2 === gan2) || (c.gan1 === gan2 && c.gan2 === gan1)
      );
      if (chongRelation) {
        relations.push({
          type: '天干冲',
          positions: [positions[i], positions[j]],
          elements: [gan1, gan2],
          description: `${positions[i]}干${gan1}与${positions[j]}干${gan2}相冲`,
        });
      }
    }
  }

  return relations;
}

/**
 * 检测地支关系
 */
function detectDizhiRelations(pillars: { zhi: string }[]): XingChongRelation[] {
  const relations: XingChongRelation[] = [];
  const positions = ['年', '月', '日', '时'];
  const zhiList = pillars.map((p) => p.zhi);

  // 检测地支六合
  for (let i = 0; i < zhiList.length; i++) {
    for (let j = i + 1; j < zhiList.length; j++) {
      const zhi1 = zhiList[i];
      const zhi2 = zhiList[j];

      const heRelation = DIZHI_LIUHE.find(
        (h) => (h.zhi1 === zhi1 && h.zhi2 === zhi2) || (h.zhi1 === zhi2 && h.zhi2 === zhi1)
      );
      if (heRelation) {
        relations.push({
          type: '地支六合',
          positions: [positions[i], positions[j]],
          elements: [zhi1, zhi2],
          result: heRelation.result,
          description: `${positions[i]}支${zhi1}与${positions[j]}支${zhi2}六合化${heRelation.result}`,
        });
      }

      // 检测地支六冲
      const chongRelation = DIZHI_LIUCHONG.find(
        (c) => (c.zhi1 === zhi1 && c.zhi2 === zhi2) || (c.zhi1 === zhi2 && c.zhi2 === zhi1)
      );
      if (chongRelation) {
        relations.push({
          type: '地支六冲',
          positions: [positions[i], positions[j]],
          elements: [zhi1, zhi2],
          description: `${positions[i]}支${zhi1}与${positions[j]}支${zhi2}相冲`,
        });
      }

      // 检测地支六害
      const haiRelation = DIZHI_LIUHAI.find(
        (h) => (h.zhi1 === zhi1 && h.zhi2 === zhi2) || (h.zhi1 === zhi2 && h.zhi2 === zhi1)
      );
      if (haiRelation) {
        relations.push({
          type: '地支六害',
          positions: [positions[i], positions[j]],
          elements: [zhi1, zhi2],
          description: `${positions[i]}支${zhi1}与${positions[j]}支${zhi2}相害`,
        });
      }
    }
  }

  // 检测地支三合
  DIZHI_SANHE.forEach((sanhe) => {
    const foundPositions: number[] = [];
    sanhe.zhi.forEach((z) => {
      const index = zhiList.indexOf(z);
      if (index !== -1) foundPositions.push(index);
    });

    if (foundPositions.length === 3) {
      relations.push({
        type: '地支三合',
        positions: foundPositions.map((i) => positions[i]),
        elements: foundPositions.map((i) => zhiList[i]),
        result: sanhe.result,
        description: `${foundPositions.map((i) => positions[i] + '支' + zhiList[i]).join('、')}三合${sanhe.result}局`,
      });
    }
  });

  // 检测地支三刑
  DIZHI_SANXING.forEach((xing) => {
    if (xing.type === '自刑') {
      // 自刑：同一地支出现两次
      xing.zhi.forEach((z) => {
        const indices = zhiList.map((zhi, idx) => (zhi === z ? idx : -1)).filter((idx) => idx !== -1);
        if (indices.length >= 2) {
          relations.push({
            type: '地支刑',
            positions: indices.slice(0, 2).map((i) => positions[i]),
            elements: [z, z],
            description: `${positions[indices[0]]}支${z}与${positions[indices[1]]}支${z}自刑`,
          });
        }
      });
    } else {
      // 三刑：需要三个地支都出现
      const foundPositions: number[] = [];
      xing.zhi.forEach((z) => {
        const index = zhiList.indexOf(z);
        if (index !== -1) foundPositions.push(index);
      });

      if (foundPositions.length === 3) {
        relations.push({
          type: '地支刑',
          positions: foundPositions.map((i) => positions[i]),
          elements: foundPositions.map((i) => zhiList[i]),
          description: `${foundPositions.map((i) => positions[i] + '支' + zhiList[i]).join('、')}${xing.type}`,
        });
      }
    }
  });

  return relations;
}

/**
 * 检测神煞
 */
function detectShensha(dayGan: string, yearGan: string, dayGanZhi: string, pillars: { zhi: string }[]): Shensha[] {
  const shensha: Shensha[] = [];
  const positions = ['年支', '月支', '日支', '时支'];
  const zhiList = pillars.map((p) => p.zhi);

  // 天乙贵人（按日干查）
  const tianyiZhi = TIANYI_GUIREN[dayGan] || [];
  zhiList.forEach((zhi, index) => {
    if (tianyiZhi.includes(zhi)) {
      shensha.push({
        name: '天乙贵人',
        position: positions[index],
        element: zhi,
        description: '逢凶化吉，遇难呈祥，贵人相助',
      });
    }
  });

  // 文昌贵人（按日干查）
  const wenchangZhi = WENCHANG_GUIREN[dayGan];
  zhiList.forEach((zhi, index) => {
    if (zhi === wenchangZhi) {
      shensha.push({
        name: '文昌贵人',
        position: positions[index],
        element: zhi,
        description: '聪明好学，文思敏捷，利于学业功名',
      });
    }
  });

  // 禄神（按日干查）
  const lushenZhi = LUSHEN[dayGan];
  zhiList.forEach((zhi, index) => {
    if (zhi === lushenZhi) {
      shensha.push({
        name: '禄神',
        position: positions[index],
        element: zhi,
        description: '衣食无忧，财禄丰厚，事业顺遂',
      });
    }
  });

  // 羊刃（按日干查）
  const yangrenZhi = YANGREN[dayGan];
  zhiList.forEach((zhi, index) => {
    if (zhi === yangrenZhi) {
      shensha.push({
        name: '羊刃',
        position: positions[index],
        element: zhi,
        description: '性格刚烈，易有血光之灾，需注意安全',
      });
    }
  });

  // 空亡（按日柱干支查）
  const kongwangZhi = KONGWANG_TABLE[dayGanZhi] || [];
  zhiList.forEach((zhi, index) => {
    if (kongwangZhi.includes(zhi)) {
      shensha.push({
        name: '空亡',
        position: positions[index],
        element: zhi,
        description: '虚空不实，事多阻碍，需脚踏实地',
      });
    }
  });

  // 桃花（按日支或年支查）
  const taohuaMap: Record<string, string> = {
    '子': '酉', '午': '卯', '卯': '子', '酉': '午',
    '寅': '午', '申': '子', '巳': '酉', '亥': '卯',
    '辰': '酉', '戌': '卯', '丑': '午', '未': '子',
  };
  const dayZhi = zhiList[2]; // 日支
  const taohuaZhi = taohuaMap[dayZhi];
  if (taohuaZhi) {
    zhiList.forEach((zhi, index) => {
      if (zhi === taohuaZhi) {
        shensha.push({
          name: '桃花',
          position: positions[index],
          element: zhi,
          description: '异性缘佳，魅力出众，利于社交',
        });
      }
    });
  }

  // 驿马（按日支查）
  const yimaMap: Record<string, string> = {
    '寅': '申', '午': '寅', '戌': '申',
    '申': '寅', '子': '寅', '辰': '申',
    '巳': '亥', '酉': '巳', '丑': '亥',
    '亥': '巳', '卯': '巳', '未': '亥',
  };
  const yimaZhi = yimaMap[dayZhi];
  if (yimaZhi) {
    zhiList.forEach((zhi, index) => {
      if (zhi === yimaZhi) {
        shensha.push({
          name: '驿马',
          position: positions[index],
          element: zhi,
          description: '奔波走动，变动频繁，利于外出发展',
        });
      }
    });
  }

  return shensha;
}

/**
 * 计算大运（精确算法）
 */
function calculateDayun(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: '男' | '女',
  yearGan: string,
  monthGan: string,
  monthZhi: string,
  dayGan: string
): { dayun: Dayun[]; qiyunAge: number; shunni: '顺行' | '逆行' } {
  // 判断顺逆：阳男阴女顺行，阴男阳女逆行
  const yangGan = ['甲', '丙', '戊', '庚', '壬'];
  const isYangYear = yangGan.includes(yearGan);
  const shunni: '顺行' | '逆行' = (isYangYear && gender === '男') || (!isYangYear && gender === '女') ? '顺行' : '逆行';

  // 计算起运年龄（简化：根据月份估算）
  // 实际应该计算到下一个节气的天数，这里简化为 1-8 岁
  const qiyunAge = Math.max(1, Math.floor((birthMonth % 4) + 1));

  // 生成8组大运
  const dayun: Dayun[] = [];
  const monthGanIndex = TIANGAN.indexOf(monthGan);
  const monthZhiIndex = DIZHI.indexOf(monthZhi);

  for (let i = 0; i < 8; i++) {
    const offset = shunni === '顺行' ? i + 1 : -i - 1;
    const ganIndex = (monthGanIndex + offset + 10) % 10;
    const zhiIndex = (monthZhiIndex + offset + 12) % 12;

    const dayunGan = TIANGAN[ganIndex];
    const dayunZhi = DIZHI[zhiIndex];

    // 计算纳音
    const nayin = calculateNayin(dayunGan, dayunZhi);

    dayun.push({
      startAge: qiyunAge + i * 10,
      endAge: qiyunAge + (i + 1) * 10 - 1,
      gan: dayunGan,
      zhi: dayunZhi,
      ganShishen: SHISHEN_MAP[dayGan]?.[dayunGan] || '',
      zhiShishen: '', // 地支十神取本气
      nayin,
    });
  }

  // 填充地支十神（取本气）
  dayun.forEach(dy => {
    const benqi = DIZHI_CANGGAN[dy.zhi]?.[0]?.gan;
    if (benqi) {
      dy.zhiShishen = SHISHEN_MAP[dayGan]?.[benqi] || '';
    }
  });

  return { dayun, qiyunAge, shunni };
}

/**
 * 计算纳音五行
 */
function calculateNayin(gan: string, zhi: string): string {
  const nayinTable: Record<string, string> = {
    '甲子': '海中金', '乙丑': '海中金',
    '丙寅': '炉中火', '丁卯': '炉中火',
    '戊辰': '大林木', '己巳': '大林木',
    '庚午': '路旁土', '辛未': '路旁土',
    '壬申': '剑锋金', '癸酉': '剑锋金',
    '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水',
    '戊寅': '城头土', '己卯': '城头土',
    '庚辰': '白蜡金', '辛巳': '白蜡金',
    '壬午': '杨柳木', '癸未': '杨柳木',
    '甲申': '泉中水', '乙酉': '泉中水',
    '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹雳火', '己丑': '霹雳火',
    '庚寅': '松柏木', '辛卯': '松柏木',
    '壬辰': '长流水', '癸巳': '长流水',
    '甲午': '砂中金', '乙未': '砂中金',
    '丙申': '山下火', '丁酉': '山下火',
    '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土',
    '壬寅': '金箔金', '癸卯': '金箔金',
    '甲辰': '覆灯火', '乙巳': '覆灯火',
    '丙午': '天河水', '丁未': '天河水',
    '戊申': '大驿土', '己酉': '大驿土',
    '庚戌': '钗钏金', '辛亥': '钗钏金',
    '壬子': '桑柘木', '癸丑': '桑柘木',
    '甲寅': '大溪水', '乙卯': '大溪水',
    '丙辰': '沙中土', '丁巳': '沙中土',
    '戊午': '天上火', '己未': '天上火',
    '庚申': '石榴木', '辛酉': '石榴木',
    '壬戌': '大海水', '癸亥': '大海水',
  };

  return nayinTable[gan + zhi] || '未知';
}

/**
 * 计算五行分值（0-100标准化）
 */
function calculateWuxingScore(pillars: BaziPillar[]): { score: WuxingScore; percentage: WuxingScore } {
  const rawScore: WuxingScore = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };

  pillars.forEach((pillar, index) => {
    // 天干权重
    const ganWeight = index === 1 ? 4 : 3; // 月干权重更高
    rawScore[pillar.ganWuxing as keyof WuxingScore] += ganWeight;

    // 地支权重
    const zhiWeight = index === 1 ? 3 : 2; // 月支权重更高
    rawScore[pillar.zhiWuxing as keyof WuxingScore] += zhiWeight;

    // 藏干权重
    pillar.zhiCanggan.forEach((cg) => {
      const wuxing = WUXING_MAP[cg.gan];
      if (wuxing) {
        rawScore[wuxing as keyof WuxingScore] += cg.weight * (index === 1 ? 1.5 : 1.0);
      }
    });
  });

  // 计算总分
  const total = Object.values(rawScore).reduce((sum, val) => sum + val, 0);

  // 标准化到0-100
  const maxScore = Math.max(...Object.values(rawScore));
  const normalizedScore: WuxingScore = {
    金: (rawScore.金 / maxScore) * 100,
    木: (rawScore.木 / maxScore) * 100,
    水: (rawScore.水 / maxScore) * 100,
    火: (rawScore.火 / maxScore) * 100,
    土: (rawScore.土 / maxScore) * 100,
  };

  // 计算百分比
  const percentage: WuxingScore = {
    金: (rawScore.金 / total) * 100,
    木: (rawScore.木 / total) * 100,
    水: (rawScore.水 / total) * 100,
    火: (rawScore.火 / total) * 100,
    土: (rawScore.土 / total) * 100,
  };

  return { score: normalizedScore, percentage };
}

/**
 * 主函数：八字排盘引擎
 */
export function calculateBaziEngine(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
  gender: '男' | '女' = '男',
  longitude?: number
): BaziEngineResult {
  // 真太阳时校对
  let adjustedHour = hour;
  let adjustedMinute = minute;

  if (longitude !== undefined) {
    const offsetMinutes = (longitude - 120) * 4;
    const totalMinutes = hour * 60 + minute + offsetMinutes;

    if (totalMinutes < 0) {
      const solar = Solar.fromYmdHms(year, month, day, 0, 0, 0);
      const prevSolar = solar.next(-1);
      year = prevSolar.getYear();
      month = prevSolar.getMonth();
      day = prevSolar.getDay();
      adjustedHour = Math.floor((1440 + totalMinutes) / 60);
      adjustedMinute = (1440 + totalMinutes) % 60;
    } else if (totalMinutes >= 1440) {
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

  // 创建公历日期
  const solar = Solar.fromYmdHms(year, month, day, adjustedHour, adjustedMinute, 0);
  const lunar = solar.getLunar();
  const baZi = lunar.getEightChar();

  // 获取四柱干支（使用正确的方法）
  const yearGanZhi = baZi.getYearGan() + baZi.getYearZhi();
  const monthGanZhi = baZi.getMonthGan() + baZi.getMonthZhi();
  const dayGanZhi = baZi.getDayGan() + baZi.getDayZhi();
  const hourGanZhi = baZi.getTimeGan() + baZi.getTimeZhi();

  const yearGan = baZi.getYearGan();
  const yearZhi = baZi.getYearZhi();
  const monthGan = baZi.getMonthGan();
  const monthZhi = baZi.getMonthZhi();
  const dayGan = baZi.getDayGan();
  const dayZhi = baZi.getDayZhi();
  const hourGan = baZi.getTimeGan();
  const hourZhi = baZi.getTimeZhi();

  // 构建四柱
  const createPillar = (gan: string, zhi: string, nayin: string): BaziPillar => {
    const cangganList = DIZHI_CANGGAN[zhi] || [];
    return {
      gan,
      zhi,
      ganWuxing: WUXING_MAP[gan] || '未知',
      zhiWuxing: DIZHI_WUXING[zhi] || '未知',
      nayin,
      ganShishen: SHISHEN_MAP[dayGan]?.[gan] || '',
      zhiCanggan: cangganList.map((cg) => ({
        gan: cg.gan,
        shishen: SHISHEN_MAP[dayGan]?.[cg.gan] || '',
        weight: cg.weight,
      })),
    };
  };

  const yearPillar = createPillar(yearGan, yearZhi, baZi.getYearNaYin());
  const monthPillar = createPillar(monthGan, monthZhi, baZi.getMonthNaYin());
  const dayPillar = createPillar(dayGan, dayZhi, baZi.getDayNaYin());
  const hourPillar = createPillar(hourGan, hourZhi, baZi.getTimeNaYin());

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];

  // 检测刑冲破害
  const tianganRelations = detectTianganRelations(pillars);
  const dizhiRelations = detectDizhiRelations(pillars);
  const xingchong = [...tianganRelations, ...dizhiRelations];

  // 检测神煞（传入日柱干支）
  const shensha = detectShensha(dayGan, yearGan, dayGanZhi, pillars);

  // 计算大运（传入日干）
  const { dayun, qiyunAge, shunni } = calculateDayun(year, month, day, gender, yearGan, monthGan, monthZhi, dayGan);

  // 计算五行分值
  const { score: wuxingScore, percentage: wuxingPercentage } = calculateWuxingScore(pillars);

  // 统计十神
  const shishenStats: Record<string, number> = {};
  pillars.forEach((p) => {
    if (p.ganShishen) {
      shishenStats[p.ganShishen] = (shishenStats[p.ganShishen] || 0) + 1;
    }
    p.zhiCanggan.forEach((cg) => {
      if (cg.shishen) {
        shishenStats[cg.shishen] = (shishenStats[cg.shishen] || 0) + cg.weight;
      }
    });
  });

  // 简化的日主强弱判断（从 bazi.ts 导入更详细的逻辑）
  const dayGanWuxing = WUXING_MAP[dayGan];
  const totalScore = wuxingScore[dayGanWuxing as keyof WuxingScore];
  const strength = {
    level: (totalScore >= 60 ? '身强' : totalScore <= 40 ? '身弱' : '中和') as '身强' | '身弱' | '中和',
    score: totalScore,
    xiYongShen: [] as string[],
    jiShen: [] as string[],
  };

  return {
    solar: { year, month, day, hour: adjustedHour, minute: adjustedMinute },
    lunar: {
      year: lunar.getYear(),
      month: lunar.getMonth(),
      day: lunar.getDay(),
      yearInChinese: lunar.getYearInChinese(),
      monthInChinese: lunar.getMonthInChinese(),
      dayInChinese: lunar.getDayInChinese(),
    },
    fourPillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
    dayGan,
    dayGanWuxing,
    xingchong,
    shensha,
    dayun,
    qiyunAge,
    shunni,
    wuxingScore,
    wuxingPercentage,
    shishenStats,
    strength,
  };
}