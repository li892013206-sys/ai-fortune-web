'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Calendar, Clock, Sparkles, Loader2, Sun, Save, LogIn, LogOut, History, X, Check, AlertCircle, MapPin } from 'lucide-react';
import { calculateBaziEngine, BaziEngineResult } from '@/lib/baziEngine';
import { supabase } from '@/lib/supabase';
import { saveBaziRecord, getHistoryRecords, BaziRecord } from '@/lib/supabase-service';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type AnalysisTab = 'personality' | 'career' | 'relationship';

// 标签页状态
interface TabState {
  isLoading: boolean;
  isLoaded: boolean;
  content: string;
  error: string | null;
}

// 五行颜色映射 - 清新淡雅
const WUXING_COLORS: Record<string, string> = {
  '木': 'text-emerald-300',
  '火': 'text-rose-300',
  '土': 'text-amber-200',
  '金': 'text-slate-200',
  '水': 'text-cyan-300',
};

// 五行背景色
const WUXING_BG_COLORS: Record<string, string> = {
  '木': 'bg-emerald-400/20',
  '火': 'bg-rose-400/20',
  '土': 'bg-amber-300/20',
  '金': 'bg-slate-300/20',
  '水': 'bg-cyan-400/20',
};

// 城市经度数据库（主要城市）
const CITY_LONGITUDE: Record<string, number> = {
  '北京': 116.4,
  '上海': 121.5,
  '广州': 113.3,
  '深圳': 114.1,
  '成都': 104.1,
  '杭州': 120.2,
  '重庆': 106.5,
  '西安': 108.9,
  '武汉': 114.3,
  '南京': 118.8,
  '天津': 117.2,
  '苏州': 120.6,
  '郑州': 113.6,
  '长沙': 112.9,
  '沈阳': 123.4,
  '青岛': 120.4,
  '济南': 117.0,
  '哈尔滨': 126.6,
  '福州': 119.3,
  '厦门': 118.1,
  '昆明': 102.7,
  '兰州': 103.8,
  '乌鲁木齐': 87.6,
  '拉萨': 91.1,
  '南宁': 108.3,
  '贵阳': 106.7,
  '太原': 112.5,
  '石家庄': 114.5,
  '南昌': 115.9,
  '合肥': 117.3,
};

export default function ChatPage() {
  // 用户认证状态
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [useSolarTime, setUseSolarTime] = useState(false);
  const [longitude, setLongitude] = useState('120');

  // 八字结果
  const [baziResult, setBaziResult] = useState<BaziEngineResult | null>(null);

  // 标签页状态管理
  const [tabStates, setTabStates] = useState<Record<AnalysisTab, TabState>>({
    personality: { isLoading: false, isLoaded: false, content: '', error: null },
    career: { isLoading: false, isLoaded: false, content: '', error: null },
    relationship: { isLoading: false, isLoaded: false, content: '', error: null },
  });
  const [activeTab, setActiveTab] = useState<AnalysisTab>('personality');

  // 保存状态
  const [isSaving, setIsSaving] = useState(false);

  // 并发控制：记录正在进行的请求
  const [ongoingRequests, setOngoingRequests] = useState<Set<AnalysisTab>>(new Set());

  // 历史记录
  const [historyRecords, setHistoryRecords] = useState<BaziRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 保存状态
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // 检查用户登录状态
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 加载历史记录
  useEffect(() => {
    loadHistoryRecords();
  }, [user]);

  const loadHistoryRecords = async () => {
    setIsLoadingHistory(true);
    const result = await getHistoryRecords();
    if (result.success && result.records) {
      setHistoryRecords(result.records);
    } else {
      console.error('加载历史记录失败:', result.error);
    }
    setIsLoadingHistory(false);
  };

  // 处理八字分析
  const handleAnalyze = async () => {
    console.log('=== 开始分析 ===');
    console.log('姓名:', name);
    console.log('性别:', gender);
    console.log('出生日期:', birthDate);
    console.log('出生时间:', birthTime);
    console.log('使用真太阳时:', useSolarTime);
    console.log('经度:', longitude);

    if (!name || !birthDate || !birthTime) {
      console.error('信息不完整');
      alert('请填写完整信息');
      return;
    }

    try {
      const [year, month, day] = birthDate.split('-').map(Number);
      const [hour, minute] = birthTime.split(':').map(Number);
      console.log('解析后的日期时间:', { year, month, day, hour, minute });

      // 计算八字
      console.log('开始计算八字...');
      const result = calculateBaziEngine(
        year,
        month,
        day,
        hour,
        minute || 0,
        gender,
        useSolarTime ? parseFloat(longitude) : undefined
      );
      console.log('八字计算结果:', result);
      setBaziResult(result);

      // 重置所有标签页状态
      console.log('重置标签页状态...');
      setTabStates({
        personality: { isLoading: false, isLoaded: false, content: '', error: null },
        career: { isLoading: false, isLoaded: false, content: '', error: null },
        relationship: { isLoading: false, isLoaded: false, content: '', error: null },
      });
      setOngoingRequests(new Set());

      // 自动分析第一个标签页（性格）
      console.log('开始分析性格维度...');
      await analyzeDimension('personality', result);
      console.log('=== 分析完成 ===');
    } catch (error) {
      console.error('分析过程出错:', error);
      alert('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 分析指定维度
  const analyzeDimension = async (dimension: AnalysisTab, bazi: BaziEngineResult) => {
    console.log(`\n=== 分析维度: ${dimension} ===`);

    // 并发控制：如果该维度正在请求中，直接返回
    if (ongoingRequests.has(dimension)) {
      console.log(`${dimension} 正在请求中，跳过重复请求`);
      return;
    }

    // 如果已经加载过，直接返回
    if (tabStates[dimension].isLoaded) {
      console.log(`${dimension} 已加载，跳过重复请求`);
      return;
    }

    // 标记为正在请求
    setOngoingRequests(prev => new Set(prev).add(dimension));
    console.log('标记为正在请求');

    // 更新状态：开始加载
    setTabStates(prev => ({
      ...prev,
      [dimension]: { ...prev[dimension], isLoading: true, error: null },
    }));
    console.log('更新状态为加载中');

    try {
      console.log('准备发送 API 请求...');
      console.log('请求数据:', { name, gender, dimension });
      console.log('八字数据:', bazi);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          baziData: bazi,
          dimension,
        }),
      });

      console.log('API 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 错误响应:', errorText);
        throw new Error(`API 请求失败: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      console.log('开始读取流式响应...');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('流式响应读取完成');
            break;
          }

          const chunk = decoder.decode(value);
          fullContent += chunk;

          // 实时更新内容
          setTabStates(prev => ({
            ...prev,
            [dimension]: { ...prev[dimension], content: fullContent },
          }));
        }
      }

      console.log(`${dimension} 分析完成，内容长度:`, fullContent.length);

      // 标记为已加载
      setTabStates(prev => ({
        ...prev,
        [dimension]: { ...prev[dimension], isLoading: false, isLoaded: true },
      }));
    } catch (error) {
      console.error(`${dimension} 分析失败:`, error);
      setTabStates(prev => ({
        ...prev,
        [dimension]: {
          ...prev[dimension],
          isLoading: false,
          error: error instanceof Error ? error.message : '未知错误',
        },
      }));
    } finally {
      // 移除请求标记
      setOngoingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(dimension);
        return newSet;
      });
      console.log(`${dimension} 请求标记已移除`);
    }
  };
          fullContent += chunk;

          // 实时更新内容
          setTabStates(prev => ({
            ...prev,
            [dimension]: { ...prev[dimension], content: fullContent },
          }));
        }

        // 标记为加载完成
        setTabStates(prev => ({
          ...prev,
          [dimension]: { isLoading: false, isLoaded: true, content: fullContent, error: null },
        }));
      }
    } catch (error) {
      console.error(`${dimension} 分析失败:`, error);
      setTabStates(prev => ({
        ...prev,
        [dimension]: {
          isLoading: false,
          isLoaded: false,
          content: '',
          error: error instanceof Error ? error.message : '分析失败，请重试',
        },
      }));
    } finally {
      // 移除请求标记
      setOngoingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(dimension);
        return newSet;
      });
    }
  };

  // 切换标签页时，按需加载
  const handleTabChange = async (tab: AnalysisTab) => {
    setActiveTab(tab);

    // 如果该标签页还没有加载，且有八字数据，则自动加载
    if (!tabStates[tab].isLoaded && !tabStates[tab].isLoading && baziResult) {
      await analyzeDimension(tab, baziResult);
    }
  };

  // 保存到云端
  const handleSaveToCloud = async () => {
    if (!baziResult || !tabStates.personality.isLoaded) {
      setSaveMessage('请先完成八字分析');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    setSaveStatus('saving');

    const result = await saveBaziRecord({
      name,
      gender,
      birthDate,
      birthTime,
      useSolarTime,
      longitude: useSolarTime ? parseFloat(longitude) : undefined,
      baziData: baziResult,
      aiReports: {
        personality: tabStates.personality.content,
        career: tabStates.career.content,
        relationship: tabStates.relationship.content,
      },
    });

    if (result.success) {
      setSaveStatus('success');
      setSaveMessage('保存成功！');
      // 重新加载历史记录
      await loadHistoryRecords();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setSaveMessage(result.error || '保存失败');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // 加载历史档案（秒开）
  const loadHistoryRecord = (record: BaziRecord) => {
    // 填充表单
    setName(record.name);
    setGender(record.gender);
    setBirthDate(record.birth_date);
    setBirthTime(record.birth_time);
    setUseSolarTime(record.use_solar_time);
    if (record.longitude) {
      setLongitude(record.longitude.toString());
    }

    // 填充八字数据
    setBaziResult(record.bazi_data);

    // 填充 AI 报告（秒开，不调用 API）
    setTabStates({
      personality: {
        isLoading: false,
        isLoaded: true,
        content: record.ai_reports.personality,
        error: null,
      },
      career: {
        isLoading: false,
        isLoaded: true,
        content: record.ai_reports.career,
        error: null,
      },
      relationship: {
        isLoading: false,
        isLoaded: true,
        content: record.ai_reports.relationship,
        error: null,
      },
    });

    // 关闭侧边栏
    setShowHistory(false);
  };

  // 登出
  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E2E8F0] relative">
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B67D43] to-transparent" />

      {/* 历史侧边栏 */}
      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        records={historyRecords}
        isLoading={isLoadingHistory}
        onSelectRecord={loadHistoryRecord}
      />

      <div className="container mx-auto px-6 py-6">
        {/* 标题 + 用户状态 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          {/* 历史按钮 */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-gray-400 hover:text-[#B67D43] rounded transition-all border border-gray-800"
          >
            <History className="w-4 h-4" />
            历史档案
          </button>

          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-[#B67D43] mb-1">
              专业命理指挥中心
            </h1>
            <p className="text-gray-500 text-sm">Professional Bazi Analysis System</p>
          </div>

          {/* 用户状态 */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-sm text-gray-400">
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white rounded transition-all border border-gray-800"
                >
                  <LogOut className="w-4 h-4" />
                  登出
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#B67D43]/20 hover:bg-[#B67D43]/30 text-[#B67D43] rounded transition-all border border-[#B67D43]/50"
              >
                <LogIn className="w-4 h-4" />
                登录
              </button>
            )}
          </div>
        </motion.div>

        {/* 顶部输入栏 - 精简一行 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 backdrop-blur-xl rounded-lg p-4 mb-6 border border-[#B67D43]/20"
        >
          <div className="flex items-center gap-4">
            {/* 姓名 */}
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#B67D43] transition-colors"
                placeholder="姓名"
              />
            </div>

            {/* 生日选择器 */}
            <div className="flex-1">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B67D43] transition-colors"
              />
            </div>

            {/* 时辰 */}
            <div className="flex-1">
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B67D43] transition-colors"
              />
            </div>

            {/* 性别 */}
            <div className="flex gap-2">
              <button
                onClick={() => setGender('男')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  gender === '男'
                    ? 'bg-[#B67D43] text-white'
                    : 'bg-black/50 text-gray-400 hover:bg-black/70'
                }`}
              >
                男
              </button>
              <button
                onClick={() => setGender('女')}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  gender === '女'
                    ? 'bg-[#B67D43] text-white'
                    : 'bg-black/50 text-gray-400 hover:bg-black/70'
                }`}
              >
                女
              </button>
            </div>

            {/* 真太阳时开关 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseSolarTime(!useSolarTime)}
                className={`flex items-center gap-1 px-3 py-2 rounded text-sm transition-all ${
                  useSolarTime
                    ? 'bg-[#B67D43]/20 text-[#B67D43] border border-[#B67D43]/50'
                    : 'bg-black/50 text-gray-400 border border-gray-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                真太阳时
              </button>
              {useSolarTime && (
                <input
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-20 bg-black/50 border border-gray-700 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-[#B67D43]"
                  placeholder="经度"
                />
              )}
            </div>

            {/* 分析按钮 */}
            <button
              onClick={handleAnalyze}
              disabled={tabStates.personality.isLoading || tabStates.career.isLoading || tabStates.relationship.isLoading}
              className="px-6 py-2 bg-gradient-to-r from-[#B67D43] to-[#8B5E34] hover:from-[#8B5E34] hover:to-[#B67D43] text-white font-medium rounded transition-all shadow-lg hover:shadow-[#B67D43]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {tabStates.personality.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  开始分析
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* 主内容区 - 分栏布局 */}
        <AnimatePresence>
          {baziResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-6"
            >
              {/* 左侧 40% - 数据展示 */}
              <div className="col-span-5 space-y-6">
                {/* 四柱卡片 */}
                <BaziPillarsCard baziResult={baziResult} />

                {/* 五行雷达图 */}
                <FiveElementsRadarCard baziResult={baziResult} />

                {/* 刑冲合害列表 */}
                <RelationTableCard baziResult={baziResult} />
              </div>

              {/* 右侧 60% - AI 对话窗口 */}
              <div className="col-span-7 space-y-4">
                <ChatWindowCard
                  tabStates={tabStates}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />

                {/* 保存按钮 */}
                <AnimatePresence>
                  {baziResult && tabStates.personality.isLoaded && (
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      onClick={handleSaveToCloud}
                      disabled={saveStatus === 'saving'}
                      className={`w-full font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-[#B67D43]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        saveStatus === 'success'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : saveStatus === 'error'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gradient-to-r from-[#B67D43] to-[#8B5E34] hover:from-[#8B5E34] hover:to-[#B67D43] text-white'
                      }`}
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          保存中...
                        </>
                      ) : saveStatus === 'success' ? (
                        <>
                          <Check className="w-5 h-5" />
                          {saveMessage}
                        </>
                      ) : saveStatus === 'error' ? (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          {saveMessage}
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          点击存档到云端
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 空状态 */}
        {!baziResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32"
          >
            <Sparkles className="w-20 h-20 text-[#B67D43] mx-auto mb-4 opacity-50" />
            <p className="text-gray-600">填写信息，开启专业命理分析</p>
          </motion.div>
        )}
      </div>

      {/* 登录弹窗 */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

// ==================== 子组件 ====================

/** 四柱卡片 */
function BaziPillarsCard({ baziResult }: { baziResult: BaziEngineResult }) {
  const pillars = [
    { name: '年柱', pillar: baziResult.fourPillars.year },
    { name: '月柱', pillar: baziResult.fourPillars.month },
    { name: '日柱', pillar: baziResult.fourPillars.day },
    { name: '时柱', pillar: baziResult.fourPillars.hour },
  ];

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-lg p-6 border border-[#B67D43]/20">
      <h3 className="text-lg font-semibold text-[#B67D43] mb-4">四柱八字</h3>
      <div className="grid grid-cols-4 gap-4">
        {pillars.map(({ name, pillar }) => (
          <div key={name} className="text-center">
            <div className="text-xs text-gray-500 mb-2">{name}</div>
            <div className="bg-black/60 rounded-lg p-3 border border-gray-800">
              <div className={`text-2xl font-bold ${WUXING_COLORS[pillar.ganWuxing]}`}>
                {pillar.gan}
              </div>
              <div className={`text-2xl font-bold ${WUXING_COLORS[pillar.zhiWuxing]} mt-1`}>
                {pillar.zhi}
              </div>
              <div className="text-xs text-gray-600 mt-2">{pillar.nayin}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 五行雷达图卡片 */
function FiveElementsRadarCard({ baziResult }: { baziResult: BaziEngineResult }) {
  const elements = [
    { name: '金', value: baziResult.wuxingPercentage.金, color: '#E5E7EB' },
    { name: '木', value: baziResult.wuxingPercentage.木, color: '#34D399' },
    { name: '水', value: baziResult.wuxingPercentage.水, color: '#60A5FA' },
    { name: '火', value: baziResult.wuxingPercentage.火, color: '#F87171' },
    { name: '土', value: baziResult.wuxingPercentage.土, color: '#FBBF24' },
  ];

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-lg p-6 border border-[#B67D43]/20">
      <h3 className="text-lg font-semibold text-[#B67D43] mb-4">五行分布</h3>
      <div className="space-y-3">
        {elements.map((el) => (
          <div key={el.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{el.name}</span>
              <span className="text-white font-medium">{el.value.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${el.value}%`,
                  backgroundColor: el.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 刑冲合害列表卡片 */
function RelationTableCard({ baziResult }: { baziResult: BaziEngineResult }) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-lg p-6 border border-[#B67D43]/20">
      <h3 className="text-lg font-semibold text-[#B67D43] mb-4">刑冲合害</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {baziResult.xingchong.length === 0 ? (
          <p className="text-gray-600 text-sm">无明显刑冲关系</p>
        ) : (
          baziResult.xingchong.map((rel, index) => (
            <div
              key={index}
              className="bg-black/40 rounded p-3 border border-gray-800 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#B67D43]/20 text-[#B67D43] rounded text-xs">
                  {rel.type}
                </span>
                <span className="text-gray-400">{rel.positions.join(' - ')}</span>
              </div>
              <p className="text-gray-300">{rel.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** AI 对话窗口卡片 */
function ChatWindowCard({
  tabStates,
  activeTab,
  onTabChange,
}: {
  tabStates: Record<AnalysisTab, TabState>;
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
}) {
  const tabs: { key: AnalysisTab; label: string }[] = [
    { key: 'personality', label: '性格' },
    { key: 'career', label: '事业' },
    { key: 'relationship', label: '感情' },
  ];

  const currentTab = tabStates[activeTab];

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-lg border border-[#B67D43]/20 h-[calc(100vh-200px)] flex flex-col">
      {/* 标签页 */}
      <div className="flex border-b border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.key
                ? 'text-[#B67D43]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}

            {/* 加载指示器 */}
            {tabStates[tab.key].isLoading && (
              <span className="absolute top-2 right-2">
                <Loader2 className="w-3 h-3 animate-spin text-[#B67D43]" />
              </span>
            )}

            {/* 已加载指示器 */}
            {tabStates[tab.key].isLoaded && !tabStates[tab.key].isLoading && (
              <span className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </span>
            )}

            {/* 底部高亮线 */}
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B67D43]"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 对话内容 */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {currentTab.isLoading && !currentTab.content ? (
            // 高级 Loading 动画
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <FluidLoadingAnimation />
              <p className="text-gray-500 text-sm mt-6">AI 正在深度分析...</p>
            </motion.div>
          ) : currentTab.error ? (
            // 错误状态
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="text-red-400 text-center">
                <p className="text-lg font-semibold mb-2">分析失败</p>
                <p className="text-sm text-gray-500">{currentTab.error}</p>
              </div>
            </motion.div>
          ) : currentTab.content ? (
            // 内容展示
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="prose prose-invert max-w-none"
            >
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {currentTab.content}
                {currentTab.isLoading && (
                  <span className="inline-block w-2 h-4 bg-[#B67D43] animate-pulse ml-1" />
                )}
              </div>
            </motion.div>
          ) : (
            // 空状态
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-gray-600"
            >
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">点击标签页开始分析</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 流体光晕 Loading 动画 */
function FluidLoadingAnimation() {
  return (
    <div className="relative w-32 h-32">
      {/* 外圈光晕 */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#B67D43]/30 to-[#8B5E34]/30 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 中圈旋转 */}
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-[#B67D43]/50"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* 内圈脉冲 */}
      <motion.div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-[#B67D43] to-[#8B5E34]"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 中心点 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
    </div>
  );
}

// ==================== 认证弹窗 ====================

function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setMessage('Supabase 未配置');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage('注册成功！请检查邮箱验证链接。');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage('登录成功！');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error: any) {
      setMessage(error.message || '操作失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A0A0A] border border-[#B67D43]/30 rounded-xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#B67D43]">
            {isSignUp ? '注册账号' : '登录账号'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#B67D43] transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#B67D43] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-lg ${
                message.includes('成功')
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#B67D43] to-[#8B5E34] hover:from-[#8B5E34] hover:to-[#B67D43] text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </>
            ) : (
              <>{isSignUp ? '注册' : '登录'}</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="text-sm text-gray-400 hover:text-[#B67D43] transition-colors"
          >
            {isSignUp ? '已有账号？立即登录' : '没有账号？立即注册'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== 历史侧边栏 ====================

function HistorySidebar({
  isOpen,
  onClose,
  records,
  isLoading,
  onSelectRecord,
}: {
  isOpen: boolean;
  onClose: () => void;
  records: BaziRecord[];
  isLoading: boolean;
  onSelectRecord: (record: BaziRecord) => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      {/* 侧边栏 */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-[#0A0A0A] border-r border-[#B67D43]/20 z-50 flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#B67D43]" />
            <h2 className="text-lg font-semibold text-[#B67D43]">历史档案</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#B67D43]" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">暂无历史档案</p>
            </div>
          ) : (
            records.map((record) => (
              <motion.button
                key={record.id}
                onClick={() => onSelectRecord(record)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black/40 hover:bg-black/60 border border-gray-800 hover:border-[#B67D43]/50 rounded-lg p-4 text-left transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-medium group-hover:text-[#B67D43] transition-colors">
                      {record.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {record.gender} · {record.birth_date} {record.birth_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {new Date(record.created_at).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[#B67D43] opacity-0 group-hover:opacity-100 transition-opacity">
                    点击查看 →
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">
            点击档案即可秒开历史报告
          </p>
        </div>
      </motion.div>
    </>
  );
}

