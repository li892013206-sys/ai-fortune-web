# 视觉重构指南

## 快速替换命令

### 1. 背景色替换
```bash
# 将所有 bg-[#050505] 替换为 bg-[#0a0f1a]
sed -i 's/bg-\[#050505\]/bg-[#0a0f1a]/g' app/chat/page.tsx

# 将所有 bg-black 替换为 glass-card
sed -i 's/bg-black\/40/glass-card/g' app/chat/page.tsx
sed -i 's/bg-black\/50/glass-card/g' app/chat/page.tsx
```

### 2. 金色替换为银白色
```bash
# 替换文本颜色
sed -i 's/text-\[#B67D43\]/text-slate-200/g' app/chat/page.tsx

# 替换边框颜色
sed -i 's/border-\[#B67D43\]/border-white\/10/g' app/chat/page.tsx

# 替换背景颜色
sed -i 's/bg-\[#B67D43\]/bg-slate-400\/20/g' app/chat/page.tsx
```

### 3. 输入框样式
```bash
# 替换输入框类名
sed -i 's/bg-black\/50 border border-gray-700/input-glass/g' app/chat/page.tsx
```

### 4. 按钮样式
```bash
# 替换按钮类名
sed -i 's/bg-gradient-to-r from-\[#B67D43\] to-\[#8B5E34\]/btn-primary/g' app/chat/page.tsx
```

## 手动修改清单

### app/chat/page.tsx

1. **第441行** - 主容器背景
   - 从: `bg-[#050505]`
   - 到: `bg-[#0a0f1a]`

2. **第443行** - 顶部装饰线
   - 从: `via-[#B67D43]`
   - 到: `via-slate-400/30`

3. **第471行** - 标题
   - 添加: `font-serif` 类
   - 从: `text-[#B67D43]`
   - 到: `text-slate-100`

4. **第508行** - 输入卡片
   - 从: `bg-black/40 backdrop-blur-xl ... border-[#B67D43]/20`
   - 到: `glass-card`

5. **所有输入框** - 统一样式
   - 从: `bg-black/50 border border-gray-700 ... focus:border-[#B67D43]`
   - 到: `input-glass`

6. **所有按钮** - 统一样式
   - 从: 各种金色渐变
   - 到: `btn-primary`

