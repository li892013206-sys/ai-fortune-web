'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

// 城市经度数据库
const CITY_LONGITUDE: Record<string, number> = {
  '北京': 116.4, '上海': 121.5, '广州': 113.3, '深圳': 114.1,
  '成都': 104.1, '杭州': 120.2, '重庆': 106.5, '西安': 108.9,
  '武汉': 114.3, '南京': 118.8, '天津': 117.2, '苏州': 120.6,
  '郑州': 113.6, '长沙': 112.9, '沈阳': 123.4, '青岛': 120.4,
  '济南': 117.0, '哈尔滨': 126.6, '福州': 119.3, '厦门': 118.1,
  '昆明': 102.7, '兰州': 103.8, '乌鲁木齐': 87.6, '拉萨': 91.1,
  '南宁': 108.3, '贵阳': 106.7, '太原': 112.5, '石家庄': 114.5,
  '南昌': 115.9, '合肥': 117.3,
};

interface CityInputProps {
  value: string;
  onChange: (city: string, longitude: number) => void;
  disabled?: boolean;
}

export default function CityInput({ value, onChange, disabled }: CityInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = Object.keys(CITY_LONGITUDE).filter(city =>
        city.includes(inputValue)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue]);

  const handleSelect = (city: string) => {
    setInputValue(city);
    setShowSuggestions(false);
    const longitude = CITY_LONGITUDE[city] || 120;
    onChange(city, longitude);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => inputValue && setSuggestions(Object.keys(CITY_LONGITUDE).filter(c => c.includes(inputValue)))}
          disabled={disabled}
          placeholder="输入城市名（可选）"
          className="w-full pl-10 pr-4 py-2 text-sm input-glass rounded-lg text-slate-200 placeholder-slate-500"
        />
      </div>

      {/* 城市建议列表 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 glass-card rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {suggestions.map((city) => (
              <button
                key={city}
                onClick={() => handleSelect(city)}
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>{city}</span>
                <span className="text-xs text-slate-500">东经 {CITY_LONGITUDE[city]}°</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
