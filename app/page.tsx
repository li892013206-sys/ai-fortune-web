'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Clock, Sparkles, Save, Loader2 } from 'lucide-react';
import { calculateBaZi, formatBaZiForPrompt, BaZiResult } from '@/lib/bazi';
import BaziPillars from '@/components/BaziPillars';
import EnergyChart from '@/components/EnergyChart';
import ChatWindow from '@/components/ChatWindow';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Home() {
  // 表单状态
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');

  // 八字结果
  const [baziResult, setBaziResult] = useState<BaZiResult | null>(null);

  // 对话状态
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 保存状态
  const [isSaving, setIsSaving] = useState(false);

  // 处理八字分析
  const handleAnalyze = async () => {
    if (!name || !birthDate || !birthTime) {
      alert('请填写完整信息');
      return;
    }

    const [year, month, day] = birthDate.split('-').map(Number);
    const [hour] = birthTime.split(':').map(Number);

    // 计算八字
    const result = calculateBaZi(year, month, day, hour);
    setBaziResult(result);

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: `请为我分析八字命盘\n\n姓名：${name}\n性别：${gender}\n生日：${year}年${month}月${day}日 ${hour}时`,
      timestamp: new Date(),
    };
    setMessages([userMessage]);

    // 调用 AI 分析
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          year,
          month,
          day,
          hour,
        }),
      });

      if (!response.ok) throw new Error('API 请求失败');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        // 流式输出完成，添加到消息列表
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: fullContent,
            timestamp: new Date(),
          },
        ]);
        setStreamingContent('');
      }
    } catch (error) {
      console.error('分析失败:', error);
      alert('分析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存到 Supabase
  const handleSave = async () => {
    if (!baziResult || messages.length === 0) {
      alert('请先进行八字分析');
      return;
    }

    setIsSaving(true);

    try {
      if (!supabase) {
        alert('Supabase 未配置，无法保存');
        return;
      }

      const { data, error } = await supabase.from('bazi_records').insert([
        {
          name,
          gender,
          birth_date: birthDate,
          birth_time: birthTime,
          bazi_data: baziResult,
          analysis: messages.find(m => m.role === 'assistant')?.content || '',
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

      <div className="container mx-auto px-4 py-8">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-2">
            AI 命理大师
          </h1>
          <p className="text-gray-400">传统八字 × 人工智能 · 洞察命运玄机</p>
        </motion.div>

        {/* 输入表单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 mb-8 border border-amber-500/20 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="请输入姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                性别
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setGender('男')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    gender === '男'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  男
                </button>
                <button
                  onClick={() => setGender('女')}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    gender === '女'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  女
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                出生日期
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                出生时辰
              </label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始分析
              </>
            )}
          </button>
        </motion.div>

        {/* 主内容区 */}
        <AnimatePresence>
          {baziResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* 左侧：专业数据 */}
              <div className="space-y-8">
                <BaziPillars baziResult={baziResult} />
                <EnergyChart baziResult={baziResult} chartType="radar" />
              </div>

              {/* 右侧：AI 对话 */}
              <div className="space-y-4">
                <div className="h-[800px]">
                  <ChatWindow
                    messages={messages}
                    isLoading={isLoading}
                    streamingContent={streamingContent}
                  />
                </div>

                {/* 保存按钮 */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || messages.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      保存到档案
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 空状态提示 */}
        {!baziResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Sparkles className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">填写信息，开启命理之旅</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
