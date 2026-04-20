import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Droplet, Calendar, TrendingUp } from 'lucide-react';

/**
 * 周期概览卡片组件
 */
export default function CycleOverview({ overview }) {
  const {
    last_period_start,
    cycle_length,
    period_length,
    predicted_next_start,
    predicted_ovulation,
    current_phase,
    current_cycle_day,
    days_until_next
  } = overview;

  const phaseLabels = {
    period: '经期',
    follicular: '卵泡期',
    ovulation: '排卵期',
    luteal: '黄体期'
  };

  const phaseColors = {
    period: 'from-red-500 to-red-600',
    follicular: 'from-green-500 to-green-600',
    ovulation: 'from-purple-500 to-purple-600',
    luteal: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-floating">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 当前周期天数 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-90">当前周期</span>
          </div>
          <div className="text-3xl font-bold">
            第{current_cycle_day}天
          </div>
        </div>

        {/* 当前阶段 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-90">当前阶段</span>
          </div>
          <div className="text-xl font-bold">
            {phaseLabels[current_phase]}
          </div>
        </div>

        {/* 距下次月经 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Droplet className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-90">下次月经</span>
          </div>
          <div className="text-2xl font-bold">
            {days_until_next > 0 ? `${days_until_next}天后` : '今天'}
          </div>
        </div>

        {/* 预测排卵日 */}
        <div className="text-center">
          <div className="text-sm font-medium opacity-90 mb-2">
            预测排卵日
          </div>
          <div className="text-lg font-bold">
            {format(new Date(predicted_ovulation), 'MM/dd')}
          </div>
        </div>
      </div>

      {/* 上次月经开始日期 */}
      <div className="mt-4 pt-4 border-t border-white/20 text-center text-sm opacity-90">
        上次月经：{format(new Date(last_period_start), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
        {' · '}周期{cycle_length}天{' · '}经期{period_length}天
      </div>
    </div>
  );
}
