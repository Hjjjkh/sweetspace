import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import DayCell from './DayCell';
import { getPhaseColor } from '../../utils/cycleUtils';

/**
 * 周日历组件
 * 展示一周 7 天的周期状态和健康记录
 */
export default function WeekCalendar({ days = [], onDayClick }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {/* 星期标题 */}
      {['一', '二', '三', '四', '五', '六', '日'].map((day, idx) => (
        <div
          key={idx}
          className="text-center text-xs font-medium text-gray-500 py-2"
        >
          {day}
        </div>
      ))}

      {/* 日期格子 */}
      {days.map((day, idx) => (
        <DayCell
          key={day.date}
          day={day}
          onClick={() => onDayClick(day)}
        />
      ))}
    </div>
  );
}

/**
 * 获取周期阶段颜色
 */
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
      return 'bg-gray-100 border-gray-300 text-gray-700';
  }
}
