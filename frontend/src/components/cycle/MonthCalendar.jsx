import { useState } from 'react';
import { format, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Droplet, Sparkles, Heart, Activity } from 'lucide-react';

export default function MonthCalendar({ days = [], onDayClick, onMonthChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: zhCN });
  const calendarEnd = endOfWeek(monthEnd, { locale: zhCN });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function handlePrevMonth() {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
    onMonthChange?.(prev);
  }

  function handleNextMonth() {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    // 不允许切换到未来月份
    if (next > new Date()) return;
    setCurrentMonth(next);
    onMonthChange?.(next);
  }

  function handleToday() {
    const today = new Date();
    setCurrentMonth(today);
    onMonthChange?.(today);
  }

  // 获取某一天的数据
  function getDayData(date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    return days.find(d => d.date === dateStr);
  }

  // 获取周期阶段样式
  function getPhaseStyle(dayData) {
    if (!dayData?.period_phase) return '';
    
    switch (dayData.period_phase) {
      case 'period':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'follicular':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'ovulation':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'luteal':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-white border-gray-100 text-gray-800';
    }
  }

  // 获取周期阶段图标
  function getPhaseIcon(phase) {
    switch (phase) {
      case 'period':
        return <Droplet className="w-3 h-3" fill="currentColor" />;
      case 'ovulation':
        return <Sparkles className="w-3 h-3" />;
      case 'follicular':
        return <Heart className="w-3 h-3" />;
      case 'luteal':
        return <Activity className="w-3 h-3" />;
      default:
        return null;
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* 头部 - 月份导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-800 font-display">
          {format(currentMonth, 'yyyy 年 MM 月', { locale: zhCN })}
        </h3>

        <button
          onClick={handleToday}
          className="px-3 py-1.5 text-sm font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors cursor-pointer"
        >
          今天
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => (
          <div
            key={idx}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {calendarDays.map((day, idx) => {
          const dayData = getDayData(day);
          const isCurrentMonth = day >= monthStart && day <= monthEnd;
          const today = isToday(day);
          const phaseStyle = getPhaseStyle(dayData);

          return (
            <button
              key={idx}
              onClick={() => dayData && onDayClick?.(dayData)}
              className={`
                relative aspect-square p-2 transition-all cursor-pointer
                flex flex-col items-center justify-start gap-1
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${!dayData ? 'cursor-default' : 'hover:bg-pink-50'}
                ${dayData ? phaseStyle : ''}
              `}
            >
              {/* 日期数字 */}
              <div className={`
                text-sm font-medium
                ${today ? 'w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center' : ''}
                ${!today && isCurrentMonth ? 'text-gray-800' : ''}
                ${!isCurrentMonth ? 'text-gray-400' : ''}
              `}>
                {format(day, 'd')}
              </div>

              {/* 周期信息 */}
              {dayData && (
                <>
                  {/* 周期天数 */}
                  {dayData.cycle_day && (
                    <div className="text-[10px] font-medium opacity-70">
                      第{dayData.cycle_day}天
                    </div>
                  )}

                  {/* 阶段图标 */}
                  {dayData.period_phase && (
                    <div className="opacity-80">
                      {getPhaseIcon(dayData.period_phase)}
                    </div>
                  )}

                  {/* 经期标记 */}
                  {dayData.is_period && (
                    <Droplet className="w-3.5 h-3.5 text-red-500" fill="currentColor" />
                  )}

                  {/* 情绪表情 */}
                  {dayData.mood_type && (
                    <div className="text-lg">
                      {getMoodEmoji(dayData.mood_type)}
                    </div>
                  )}

                  {/* 习惯完成指示 */}
                  {dayData.habits && (
                    <div className="flex gap-0.5">
                      {Object.values(dayData.habits).filter(v => v).slice(0, 3).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* 图例说明 */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <LegendItem color="bg-red-50" border="border-red-200" label="经期" />
        <LegendItem color="bg-green-50" border="border-green-200" label="卵泡期" />
        <LegendItem color="bg-purple-50" border="border-purple-200" label="排卵期" />
        <LegendItem color="bg-orange-50" border="border-orange-200" label="黄体期" />
      </div>
    </div>
  );
}

function getMoodEmoji(moodType) {
  const emojis = {
    love: '😍',
    happy: '🙂',
    neutral: '😐',
    sad: '😢'
  };
  return emojis[moodType] || '';
}

function LegendItem({ color, border, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color} ${border} border`} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
