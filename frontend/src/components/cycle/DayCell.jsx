import { isToday } from 'date-fns';
import { Droplet } from 'lucide-react';

const moodEmojis = {
  love: '😍',
  happy: '🙂',
  neutral: '😐',
  sad: '😢'
};

/**
 * 单日格子组件
 */
export default function DayCell({ day, onClick }) {
  const {
    date,
    cycle_day,
    period_phase,
    is_period,
    mood_type,
    flow_level,
    habits,
    has_record
  } = day;

  const today = isToday(new Date(date));
  const phaseStyle = getPhaseStyle(period_phase);

  // 计算习惯完成数
  const habitsCompleted = habits ? Object.values(habits).filter(v => v).length : 0;

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-xl border-2 p-2 
        transition-all duration-200 cursor-pointer
        flex flex-col items-center justify-between
        hover:scale-105 hover:shadow-md
        ${phaseStyle}
        ${today ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
    >
      {/* 日期 */}
      <div className="text-xs font-bold w-full text-center">
        {new Date(date).getDate()}
      </div>

      {/* 周期天数 */}
      {cycle_day && (
        <div className="text-[10px] font-medium opacity-70">
          第{cycle_day}天
        </div>
      )}

      {/* 经期标记 */}
      {is_period && (
        <div className="text-red-500">
          <Droplet className="w-4 h-4" fill="currentColor" />
        </div>
      )}

      {/* 情绪表情 */}
      {mood_type && (
        <div className="text-xl">
          {moodEmojis[mood_type]}
        </div>
      )}

      {/* 习惯完成指示器 */}
      {habitsCompleted > 0 && (
        <div className="flex gap-0.5">
          {Array.from({ length: habitsCompleted }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-green-500"
            />
          ))}
        </div>
      )}

      {/* 未记录提示 */}
      {!has_record && !is_period && (
        <div className="text-[10px] opacity-50">
          未记录
        </div>
      )}
    </button>
  );
}

function getPhaseStyle(phase) {
  switch (phase) {
    case 'period':
      return 'bg-red-100 border-red-300 text-red-700';
    case 'follicular':
      return 'bg-green-100 border-green-300 text-green-700';
    case 'ovulation':
      return 'bg-purple-100 border-purple-300 text-purple-700';
    case 'luteal':
      return 'bg-orange-100 border-orange-300 text-orange-700';
    default:
      return 'bg-white border-gray-200 text-gray-700';
  }
}
