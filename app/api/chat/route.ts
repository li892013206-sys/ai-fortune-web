import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateBaziEngine, BaziEngineResult } from '@/lib/baziEngine';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export const runtime = 'edge';

type AnalysisDimension = 'personality' | 'career' | 'relationship';

interface BaziRequest {
  name: string;
  gender: '男' | '女';
  baziData: BaziEngineResult;
  dimension: AnalysisDimension;
}

/**
 * 专家系统指令 - 强制数据引用
 */
const EXPERT_SYSTEM_PROMPT = `
你是一位资深的八字命理专家，拥有30年的实战经验。你的分析必须严格遵循以下原则：

## 核心原则
1. **强制数据引用**：每一个结论都必须引用具体的八字数据作为依据
   - 例如："由于你时柱癸水伤官透出，且地支丑未相冲，代表你在35岁后的事业将面临大的转型..."
   - 禁止使用模糊表述，如"你的八字显示..."、"从命盘来看..."

2. **精确定位**：明确指出数据来源
   - 年柱/月柱/日柱/时柱
   - 天干/地支/藏干
   - 具体的干支名称和五行属性

3. **逻辑链条**：数据 → 推理 → 结论
   - 先陈述事实（八字数据）
   - 再解释原理（命理法则）
   - 最后给出结论（实际影响）

4. **结构化输出**：使用清晰的 Markdown 格式
   - 使用 ## 二级标题分段
   - 使用 **粗体** 强调关键术语
   - 使用列表组织要点

## 禁止行为
- 禁止泛泛而谈，不引用具体数据
- 禁止使用"可能"、"也许"等模糊词汇（除非确实存在多种可能）
- 禁止重复用户已知的基础信息
- 禁止使用迷信或宿命论的表述

## 语言风格
- 专业但易懂，避免过度使用术语
- 客观理性，基于数据分析
- 积极正面，给出建设性建议
`.trim();

/**
 * 构建性格分析 Prompt
 */
function buildPersonalityPrompt(name: string, gender: string, bazi: BaziEngineResult): string {
  const { fourPillars, dayGan, dayGanWuxing, wuxingPercentage, strength, shishenStats } = bazi;

  return `
请为 ${name}（${gender}）进行**性格特质分析**。

## 八字数据
- 四柱：${fourPillars.year.gan}${fourPillars.year.zhi}（年）、${fourPillars.month.gan}${fourPillars.month.zhi}（月）、${fourPillars.day.gan}${fourPillars.day.zhi}（日）、${fourPillars.hour.gan}${fourPillars.hour.zhi}（时）
- 日主：${dayGan}（${dayGanWuxing}）
- 日主强弱：${strength.level}（得分：${strength.score.toFixed(1)}）
- 月令：${fourPillars.month.zhi}（${fourPillars.month.zhiWuxing}）

## 五行分布（百分比）
- 金：${wuxingPercentage.金.toFixed(1)}%
- 木：${wuxingPercentage.木.toFixed(1)}%
- 水：${wuxingPercentage.水.toFixed(1)}%
- 火：${wuxingPercentage.火.toFixed(1)}%
- 土：${wuxingPercentage.土.toFixed(1)}%

## 十神分布
${Object.entries(shishenStats).map(([name, count]) => `- ${name}：${count.toFixed(1)}`).join('\n')}

## 分析要求
请从以下维度展开，**每个结论都必须引用具体的干支位置和五行数据**：

### 1. 核心性格特质
- 基于日主${dayGan}（${dayGanWuxing}）的本质特征
- 结合月令${fourPillars.month.zhi}的影响
- 分析五行偏重对性格的塑造（如木${wuxingPercentage.木.toFixed(1)}%代表什么）

### 2. 优势与天赋
- 从十神配置中找出优势（如食神多代表创造力强）
- 从五行平衡中找出天赋领域
- 具体说明哪些干支组合带来了这些优势

### 3. 性格挑战
- 指出五行失衡带来的性格缺陷
- 分析十神冲突导致的内在矛盾
- 给出具体的改善建议

### 4. 人际关系风格
- 基于比劫、食伤的配置分析社交模式
- 结合日支${fourPillars.day.zhi}分析亲密关系处理方式

**输出格式**：使用 ## 二级标题，每段必须引用具体数据。
`.trim();
}

/**
 * 构建事业分析 Prompt
 */
function buildCareerPrompt(name: string, gender: string, bazi: BaziEngineResult): string {
  const { fourPillars, dayGan, dayGanWuxing, strength, shishenStats, dayun } = bazi;

  // 找出财星和官星
  const caixing = Object.entries(shishenStats).filter(([name]) => name.includes('财')).map(([name, count]) => `${name}(${count.toFixed(1)})`).join('、') || '无';
  const guanxing = Object.entries(shishenStats).filter(([name]) => name.includes('官') || name.includes('杀')).map(([name, count]) => `${name}(${count.toFixed(1)})`).join('、') || '无';

  return `
请为 ${name}（${gender}）进行**事业财运分析**。

## 八字数据
- 四柱：${fourPillars.year.gan}${fourPillars.year.zhi}（年）、${fourPillars.month.gan}${fourPillars.month.zhi}（月）、${fourPillars.day.gan}${fourPillars.day.zhi}（日）、${fourPillars.hour.gan}${fourPillars.hour.zhi}（时）
- 日主：${dayGan}（${dayGanWuxing}）- ${strength.level}
- 喜用神：${strength.xiYongShen.join('、')}
- 忌神：${strength.jiShen.join('、')}

## 事业相关十神
- 财星：${caixing}
- 官星：${guanxing}
- 食伤：${Object.entries(shishenStats).filter(([name]) => name.includes('食') || name.includes('伤')).map(([name, count]) => `${name}(${count.toFixed(1)})`).join('、') || '无'}

## 大运信息（前3步）
${dayun.slice(0, 3).map(dy => `- ${dy.startAge}-${dy.endAge}岁：${dy.gan}${dy.zhi}（${dy.ganShishen}）`).join('\n')}

## 分析要求
请从以下维度展开，**必须引用具体的干支和大运数据**：

### 1. 职业方向推荐
- 基于喜用神${strength.xiYongShen.join('、')}推荐适合的五行行业
- 结合十神配置分析职业类型（如食神多适合创意、技术类）
- 明确指出哪些干支组合支持这些职业

### 2. 财运分析
- 分析财星的位置和强弱（如"正财藏月支${fourPillars.month.zhi}，代表..."）
- 评估求财方式（正财/偏财的区别）
- 给出理财建议

### 3. 事业发展阶段
- 结合大运分析不同年龄段的事业运势
- 指出关键转折点（如"${dayun[1].startAge}岁进入${dayun[1].gan}${dayun[1].zhi}大运，${dayun[1].ganShishen}当令..."）
- 给出每个阶段的具体建议

### 4. 职场人际与领导力
- 基于官星和比劫分析职场定位
- 评估管理能力和团队协作能力

**输出格式**：使用 ## 二级标题，每段必须引用具体数据和大运信息。
`.trim();
}

/**
 * 构建感情分析 Prompt
 */
function buildRelationshipPrompt(name: string, gender: string, bazi: BaziEngineResult): string {
  const { fourPillars, dayGan, dayGanWuxing, shishenStats, xingchong } = bazi;

  // 找出配偶星
  const spouseStar = gender === '男' ? '财星' : '官星';
  const spouseStarData = gender === '男'
    ? Object.entries(shishenStats).filter(([name]) => name.includes('财')).map(([name, count]) => `${name}(${count.toFixed(1)})`).join('、') || '无'
    : Object.entries(shishenStats).filter(([name]) => name.includes('官') || name.includes('杀')).map(([name, count]) => `${name}(${count.toFixed(1)})`).join('、') || '无';

  // 日支（婚姻宫）
  const marriagePalace = fourPillars.day.zhi;
  const marriagePalaceCanggan = fourPillars.day.zhiCanggan.map(cg => `${cg.gan}(${cg.shishen})`).join('、');

  // 婚姻宫刑冲
  const marriageConflicts = xingchong.filter(rel => rel.positions.includes('日')).map(rel => rel.description).join('；') || '无明显刑冲';

  return `
请为 ${name}（${gender}）进行**婚姻感情分析**。

## 八字数据
- 四柱：${fourPillars.year.gan}${fourPillars.year.zhi}（年）、${fourPillars.month.gan}${fourPillars.month.zhi}（月）、${fourPillars.day.gan}${fourPillars.day.zhi}（日）、${fourPillars.hour.gan}${fourPillars.hour.zhi}（时）
- 日主：${dayGan}（${dayGanWuxing}）
- 日支（婚姻宫）：${marriagePalace}，藏干：${marriagePalaceCanggan}

## 配偶星信息
- ${spouseStar}：${spouseStarData}
- 配偶星位置：${findSpouseStarPosition(bazi, gender)}

## 婚姻宫状态
- 刑冲情况：${marriageConflicts}

## 分析要求
请从以下维度展开，**必须引用具体的配偶星位置和婚姻宫数据**：

### 1. 配偶特质画像
- 基于日支${marriagePalace}和藏干分析配偶性格
- 结合配偶星的五行属性描述配偶特征
- 明确指出"如日支${marriagePalace}藏${fourPillars.day.zhiCanggan[0].gan}..."

### 2. 婚姻运势
- 分析婚姻宫的稳定性（有无刑冲）
- 评估感情发展的顺利程度
- 指出可能的婚姻挑战

### 3. 恋爱模式
- 基于日主和配偶星的关系分析恋爱风格
- 评估对感情的态度（主动/被动、理性/感性）
- 给出恋爱建议

### 4. 择偶建议
- 基于喜用神推荐适合的配偶五行属性
- 给出具体的择偶标准（性格、职业等）
- 提供感情经营的实用建议

**输出格式**：使用 ## 二级标题，每段必须引用具体的配偶星位置和婚姻宫数据。
`.trim();
}

/**
 * 辅助函数：找出配偶星位置
 */
function findSpouseStarPosition(bazi: BaziEngineResult, gender: string): string {
  const targetStars = gender === '男' ? ['正财', '偏财'] : ['正官', '七杀'];
  const positions: string[] = [];

  const pillars = [
    { name: '年干', gan: bazi.fourPillars.year.gan, shishen: bazi.fourPillars.year.ganShishen },
    { name: '月干', gan: bazi.fourPillars.month.gan, shishen: bazi.fourPillars.month.ganShishen },
    { name: '日干', gan: bazi.fourPillars.day.gan, shishen: bazi.fourPillars.day.ganShishen },
    { name: '时干', gan: bazi.fourPillars.hour.gan, shishen: bazi.fourPillars.hour.ganShishen },
  ];

  pillars.forEach(p => {
    if (targetStars.includes(p.shishen)) {
      positions.push(`${p.name}${p.gan}(${p.shishen})`);
    }
  });

  // 检查地支藏干
  const zhiPillars = [
    { name: '年支', zhi: bazi.fourPillars.year.zhi, canggan: bazi.fourPillars.year.zhiCanggan },
    { name: '月支', zhi: bazi.fourPillars.month.zhi, canggan: bazi.fourPillars.month.zhiCanggan },
    { name: '日支', zhi: bazi.fourPillars.day.zhi, canggan: bazi.fourPillars.day.zhiCanggan },
    { name: '时支', zhi: bazi.fourPillars.hour.zhi, canggan: bazi.fourPillars.hour.zhiCanggan },
  ];

  zhiPillars.forEach(p => {
    p.canggan.forEach(cg => {
      if (targetStars.includes(cg.shishen)) {
        positions.push(`${p.name}${p.zhi}藏${cg.gan}(${cg.shishen})`);
      }
    });
  });

  return positions.length > 0 ? positions.join('、') : '配偶星不显';
}

/**
 * 根据维度选择 Prompt
 */
function buildPromptByDimension(name: string, gender: string, bazi: BaziEngineResult, dimension: AnalysisDimension): string {
  switch (dimension) {
    case 'personality':
      return buildPersonalityPrompt(name, gender, bazi);
    case 'career':
      return buildCareerPrompt(name, gender, bazi);
    case 'relationship':
      return buildRelationshipPrompt(name, gender, bazi);
    default:
      throw new Error(`Unknown dimension: ${dimension}`);
  }
}

export async function POST(req: Request) {
  console.log('=== API /api/chat 收到请求 ===');

  try {
    const body: BaziRequest = await req.json();
    console.log('请求体:', JSON.stringify(body, null, 2));

    // 验证必填字段
    if (!body.name || !body.gender || !body.baziData || !body.dimension) {
      console.error('缺少必填字段');
      return new Response(
        JSON.stringify({ error: '缺少必填字段：姓名、性别、八字数据、分析维度' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 检查 API Key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('Gemini API Key 存在:', !!apiKey);
    console.log('API Key 前10位:', apiKey?.substring(0, 10));

    if (!apiKey) {
      console.error('Gemini API Key 未配置');
      return new Response(
        JSON.stringify({ error: 'Gemini API Key 未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 构建专家 Prompt
    console.log('构建 Prompt...');
    const prompt = buildPromptByDimension(body.name, body.gender, body.baziData, body.dimension);
    console.log('Prompt 长度:', prompt.length);

    // 初始化 Gemini 模型
    console.log('初始化 Gemini 模型...');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: EXPERT_SYSTEM_PROMPT,
    });

    // 生成配置
    const generationConfig = {
      temperature: 0.7, // 降低温度，提高准确性
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 3000,
    };

    // 开始对话
    console.log('开始对话...');
    const chat = model.startChat({
      generationConfig,
      history: [],
    });

    // 发送用户 prompt
    console.log('发送消息流...');
    const result = await chat.sendMessageStream(prompt);
    console.log('消息流已启动');

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('开始流式传输...');
          let chunkCount = 0;
          for await (const chunk of result.stream) {
            const text = chunk.text();
            chunkCount++;
            if (chunkCount <= 3) {
              console.log(`Chunk ${chunkCount}:`, text.substring(0, 50));
            }
            controller.enqueue(encoder.encode(text));
          }
          console.log(`流式传输完成，共 ${chunkCount} 个块`);
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    console.log('返回流式响应');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: '服务器错误',
        details: error instanceof Error ? error.message : '未知错误'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
