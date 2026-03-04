'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading?: boolean;
  streamingContent?: string;
}

// 命理术语高亮配置
const TERM_HIGHLIGHTS: Record<string, { bg: string; text: string }> = {
  // 十神
  '比肩': { bg: 'bg-blue-100', text: 'text-blue-800' },
  '劫财': { bg: 'bg-blue-100', text: 'text-blue-800' },
  '食神': { bg: 'bg-green-100', text: 'text-green-800' },
  '伤官': { bg: 'bg-green-100', text: 'text-green-800' },
  '偏财': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  '正财': { bg: 'bg-amber-100', text: 'text-amber-800' },
  '七杀': { bg: 'bg-red-100', text: 'text-red-800' },
  '正官': { bg: 'bg-purple-100', text: 'text-purple-800' },
  '偏印': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  '正印': { bg: 'bg-indigo-100', text: 'text-indigo-800' },

  // 五行
  '金': { bg: 'bg-yellow-50', text: 'text-yellow-900' },
  '木': { bg: 'bg-green-50', text: 'text-green-900' },
  '水': { bg: 'bg-blue-50', text: 'text-blue-900' },
  '火': { bg: 'bg-red-50', text: 'text-red-900' },
  '土': { bg: 'bg-amber-50', text: 'text-amber-900' },

  // 天干
  '甲': { bg: 'bg-emerald-50', text: 'text-emerald-800' },
  '乙': { bg: 'bg-emerald-50', text: 'text-emerald-800' },
  '丙': { bg: 'bg-rose-50', text: 'text-rose-800' },
  '丁': { bg: 'bg-rose-50', text: 'text-rose-800' },
  '戊': { bg: 'bg-yellow-50', text: 'text-yellow-800' },
  '己': { bg: 'bg-yellow-50', text: 'text-yellow-800' },
  '庚': { bg: 'bg-slate-50', text: 'text-slate-800' },
  '辛': { bg: 'bg-slate-50', text: 'text-slate-800' },
  '壬': { bg: 'bg-cyan-50', text: 'text-cyan-800' },
  '癸': { bg: 'bg-cyan-50', text: 'text-cyan-800' },

  // 地支
  '子': { bg: 'bg-blue-50', text: 'text-blue-800' },
  '丑': { bg: 'bg-amber-50', text: 'text-amber-800' },
  '寅': { bg: 'bg-green-50', text: 'text-green-800' },
  '卯': { bg: 'bg-green-50', text: 'text-green-800' },
  '辰': { bg: 'bg-amber-50', text: 'text-amber-800' },
  '巳': { bg: 'bg-red-50', text: 'text-red-800' },
  '午': { bg: 'bg-red-50', text: 'text-red-800' },
  '未': { bg: 'bg-amber-50', text: 'text-amber-800' },
  '申': { bg: 'bg-slate-50', text: 'text-slate-800' },
  '酉': { bg: 'bg-slate-50', text: 'text-slate-800' },
  '戌': { bg: 'bg-amber-50', text: 'text-amber-800' },
  '亥': { bg: 'bg-blue-50', text: 'text-blue-800' },

  // 其他术语
  '日主': { bg: 'bg-purple-100', text: 'text-purple-800' },
  '喜神': { bg: 'bg-green-100', text: 'text-green-800' },
  '忌神': { bg: 'bg-red-100', text: 'text-red-800' },
  '用神': { bg: 'bg-blue-100', text: 'text-blue-800' },
  '身强': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  '身弱': { bg: 'bg-orange-100', text: 'text-orange-800' },
};

/**
 * 高亮命理术语
 */
function highlightTerms(text: string): React.ReactNode {
  let result: React.ReactNode[] = [];
  let lastIndex = 0;

  // 创建正则表达式匹配所有术语
  const terms = Object.keys(TERM_HIGHLIGHTS);
  const regex = new RegExp(`(${terms.join('|')})`, 'g');

  let match;
  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      result.push(text.substring(lastIndex, match.index));
    }

    // 添加高亮的术语
    const term = match[0];
    const style = TERM_HIGHLIGHTS[term];
    result.push(
      <span
        key={`${match.index}-${term}`}
        className={`${style.bg} ${style.text} px-1.5 py-0.5 rounded text-sm font-medium`}
      >
        {term}
      </span>
    );

    lastIndex = match.index + term.length;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result.length > 0 ? result : text;
}

/**
 * 打字机效果组件
 */
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 20); // 打字速度：20ms per character

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed">{highlightTerms(String(children))}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>,
          li: ({ children }) => <li className="text-gray-700">{highlightTerms(String(children))}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-gray-800">{children}</h3>,
          code: ({ children }) => (
            <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-400 pl-4 italic text-gray-700 my-3">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {currentIndex < text.length && (
        <span className="inline-block w-1 h-4 bg-purple-600 animate-pulse ml-0.5" />
      )}
    </div>
  );
}

/**
 * 消息气泡组件
 */
function MessageBubble({ message, isStreaming = false }: { message: Message; isStreaming?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 头像 */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
              : 'bg-slate-700/50 shadow-md border border-slate-600 backdrop-blur-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : isStreaming ? (
            <TypewriterText text={message.content} />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-200">{highlightTerms(String(children))}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-amber-300">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-200">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-200">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-200">{highlightTerms(String(children))}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-amber-400">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-amber-400">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-amber-300">{children}</h3>,
                  code: ({ children }) => (
                    <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-amber-500 pl-4 italic text-gray-300 my-3">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={`text-xs text-gray-500 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 对话窗口主组件
 */
export default function ChatWindow({ messages, isLoading, streamingContent }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-amber-500/20">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isStreaming={false}
            />
          ))}
        </AnimatePresence>

        {/* 流式输出中的消息 */}
        {streamingContent && (
          <MessageBubble
            message={{
              role: 'assistant',
              content: streamingContent,
              timestamp: new Date(),
            }}
            isStreaming={true}
          />
        )}

        {/* 加载指示器 */}
        {isLoading && !streamingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-700/50 shadow-md border border-slate-600 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
