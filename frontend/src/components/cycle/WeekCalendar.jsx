import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import DayCell from './DayCell';

/**
 * 周期日历组件 - 支持周视图和月视图
 */
export default function CycleCalendar({ days = [], onDayClick }) {
  const [view, setView] = useState('week'); // 'week' | 'month'
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));

  const weekDays = days;
  
  // 生成月视图的日期
  const monthStart = startOfWeek(currentWeek);
  const monthEnd = endOfWeek(addWeeks(currentWeek, 3)); // 4 周视图
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  function handlePrev() {
    if (view === 'week') {
      setCurrentWeek(startOfWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000)));
    } else {
      setCurrentWeek(startOfWeek(new Date(currentWeek.getTime() - 28 * 24 * 60 * 60 * 1000)));
    }
  }

  function handleNext() {
    const nextDate = view === 'week' 
      ? new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(currentWeek.getTime() + 28 * 24 * 60 * 60 * 1000);
    
    // 不允许切换到未来
    if (nextDate > new Date()) return;
    setCurrentWeek(startOfWeek(nextDate));
  }

  return (
    <div className="space-y-4">
      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        {/* 视图切换 */}
        <div className="flex bg-white/50 rounded-lg p-1">
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              view === 'week' 
                ? 'bg-white text-pink-600 shadow-sm' 
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              view === 'month' 
                ? 'bg-white text-pink-600 shadow-sm' 
                : 'text-gray-600 hover:bg-white/50'
            }`}
          >
            月视图
          </button>
        </div>

        {/* 日期导航 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-32 text-center">
            {format(currentWeek, 'yyyy 年 MM 月', { locale: zhCN })}
          </span>
          <button
            onClick={handleNext}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors cursor-pointer disabled:opacity-30"
            disabled={
              view === 'week' 
                ? addWeeks(currentWeek, 1) > new Date()
                : addWeeks(currentWeek, 4) > new Date()
            }
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2">
        {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => (
          <div
            key={idx}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      {view === 'week' ? (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              onClick={() => onDayClick(day)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const dayData = days.find(d => d.date === format(day, 'yyyy-MM-dd'));
            return (
              <DayCell
                key={day.toISOString()}
                day={dayData || { date: format(day, 'yyyy-MM-dd'), has_record: false }}
                onClick={() => dayData && onDayClick(dayData)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// 添加需要的 date-fns 函数
import { addWeeks } from 'date-fns';
