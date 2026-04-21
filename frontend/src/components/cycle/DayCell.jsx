import { isToday, format } from 'date-fns';
import { Droplet, Sparkles, Heart, Coffee, Apple, Activity, CheckCircle } from 'lucide-react';

const habitIcons = {
  water: <Droplet className="w-3 h-3" />,
  fruit: <Apple className="w-3 h-3" />,
  breakfast: <Coffee className="w-3 h-3" />,
  exercise: <Activity className="w-3 h-3" />,
  bowel: <CheckCircle className="w-3 h-3" />
};

/**
 * 单日格子组件 - 增强版
 */
export default function DayCell({ day, onClick }) {
  const {
    date,
    cycle_day,
    period_phase,
    is_period,
    mood_type,
    mood_score,
    flow_level,
    habits,
    has_record,
    symptoms
  } = day || {};

  if (!date) return <div className="aspect-square rounded-xl bg-transparent" />;

  const today = isToday(new Date(date));
  const phaseStyle = getPhaseStyle(period_phase);
  const phaseGradient = getPhaseGradient(period_phase);

  // 计算习惯完成数
  const habitsCompleted = habits ? Object.values(habits).filter(v => v).length : 0;
  const totalHabits = 5;

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-2xl border-2 p-2 
        transition-all duration-300 cursor-pointer
        flex flex-col items-center justify-between
        hover:scale-110 hover:shadow-lg group
        ${phaseStyle}
        ${today ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-white' : ''}
        ${!has_record && !is_period ? 'opacity-60 hover:opacity-100' : ''}
        bg-gradient-to-br ${phaseGradient}
      `}
    >
      {/* 顶部：日期和周期天数 */}
      <div className="w-full flex items-center justify-between">
        <div className={`text-sm font-bold ${today ? 'text-pink-600' : ''}`}>
          {new Date(date).getDate()}
        </div>
        {today && (
          <div className="px-1.5 py-0.5 bg-pink-500 text-white text-[9px] font-bold rounded-full">
            今天
          </div>
        )}
      </div>

      {/* 中间：周期信息 */}
      {cycle_day && (
        <div className="text-[10px] font-medium opacity-70">
          第{cycle_day}天
        </div>
      )}

      {/* 阶段图标 */}
      {period_phase && (
        <div className="text-xs font-bold opacity-80">
          {period_phase === 'period' && <Droplet className="w-4 h-4" fill="currentColor" />}
          {period_phase === 'ovulation' && <Sparkles className="w-4 h-4" />}
          {period_phase === 'follicular' && <Heart className="w-4 h-4" />}
          {period_phase === 'luteal' && <Activity className="w-4 h-4" />}
        </div>
      )}

      {/* 情绪表情 */}
      {mood_type && (
        <div className="text-2xl transform group-hover:scale-125 transition-transform">
          {moodEmojis[mood_type]}
        </div>
      )}

      {/* 流量等级指示 */}
      {is_period && flow_level && flow_level !== 'none' && (
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: flow_level === 'heavy' ? 3 : flow_level === 'medium' ? 2 : 1 }).map((_, i) => (
            <Droplet
              key={i}
              className={`w-3 h-3 ${
                flow_level === 'heavy' ? 'text-red-600' : 'text-red-400'
              }`}
              fill="currentColor"
            />
          ))}
        </div>
      )}

      {/* 习惯完成环 */}
      {habitsCompleted > 0 && (
        <div className="relative w-8 h-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${(habitsCompleted / totalHabits) * 75.4} 75.4`}
              className="text-green-500 transition-all duration-500"
            />
          </svg>
        </div>
      )}

      {/* 症状标记 */}
      {symptoms && symptoms.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-[8px]">⚠</span>
        </div>
      )}

      {/* 未记录提示 */}
      {!has_record && !is_period && (
        <div className="text-[9px] opacity-50 group-hover:opacity-80 transition-opacity">
          点击记录
        </div>
      )}
    </button>
  );
}

function getPhaseStyle(phase) {
  switch (phase) {
    case 'period':
      return 'bg-red-50 border-red-300 text-red-800';
    case 'follicular':
      return 'bg-green-50 border-green-300 text-green-800';
    case 'ovulation':
      return 'bg-purple-50 border-purple-300 text-purple-800';
    case 'luteal':
      return 'bg-orange-50 border-orange-300 text-orange-800';
    default:
      return 'bg-white border-gray-200 text-gray-700';
  }
}

function getPhaseGradient(phase) {
  switch (phase) {
    case 'period':
      return 'from-red-50 via-red-100 to-red-50';
    case 'follicular':
      return 'from-green-50 via-green-100 to-green-50';
    case 'ovulation':
      return 'from-purple-50 via-purple-100 to-purple-50';
    case 'luteal':
      return 'from-orange-50 via-orange-100 to-orange-50';
    default:
      return 'from-white via-gray-50 to-white';
  }
}
