import { useState, useEffect } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, Droplet, Apple, Coffee, Dumbbell, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import WeekCalendar from '../components/cycle/WeekCalendar';
import CycleOverview from '../components/cycle/CycleOverview';
import CycleSetupModal from '../components/cycle/CycleSetupModal';
import DayEditModal from '../components/cycle/DayEditModal';

const periodLengthOptions = [
  { value: 'none', label: '无' },
  { value: 'light', label: '少量' },
  { value: 'medium', label: '中等' },
  { value: 'heavy', label: '大量' }
];

const commonSymptoms = [
  { value: 'cramps', label: '痛经' },
  { value: 'headache', label: '头痛' },
  { value: 'bloating', label: '腹胀' },
  { value: 'breast_tenderness', label: '乳房胀痛' },
  { value: 'acne', label: '痘痘' },
  { value: 'fatigue', label: '疲劳' },
  { value: 'backache', label: '腰痛' }
];

const habitIcons = {
  water: Droplet,
  fruit: Apple,
  breakfast: Coffee,
  exercise: Dumbbell,
  bowel: Check
};

const moodEmojis = {
  love: '😍',
  happy: '🙂',
  neutral: '😐',
  sad: '😢'
};

export default function HealthPage() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [weekData, setWeekData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchWeekData();
    fetchOverview();
  }, [currentWeek]);

  async function fetchWeekData() {
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const response = await fetch(`/api/cycle/week?week_start=${weekStart}`);
      const result = await response.json();
      if (result.success) {
        setWeekData(result.data);
        if (!result.data.current_cycle) {
          setShowSetup(true);
        }
      }
    } catch (error) {
      console.error('Fetch week data error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOverview() {
    try {
      const response = await fetch('/api/cycle/overview');
      const result = await response.json();
      if (result.success) {
        setOverview(result.data);
      }
    } catch (error) {
      console.error('Fetch overview error:', error);
    }
  }

  function handlePrevWeek() {
    setCurrentWeek(prev => subWeeks(prev, 1));
  }

  function handleNextWeek() {
    setCurrentWeek(prev => addWeeks(prev, 1));
  }

  function handleDayClick(day) {
    setSelectedDay(day);
  }

  function handleSetupComplete(data) {
    setShowSetup(false);
    fetchWeekData();
    fetchOverview();
  }

  function handleDaySave(data) {
    // 更新本地状态
    if (weekData) {
      setWeekData({
        ...weekData,
        days: weekData.days.map(d => 
          d.date === data.date ? { ...d, ...data, has_record: true } : d
        )
      });
    }
    setSelectedDay(null);
    fetchWeekData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-display flex items-center gap-3">
            <Heart className="w-7 h-7 text-red-500" fill="currentColor" />
            健康记录
          </h2>
          {overview?.has_cycle && (
            <button
              onClick={() => setShowSetup(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              设置周期
            </button>
          )}
        </div>

        {/* 周期概览卡片 */}
        {overview?.has_cycle && (
          <CycleOverview overview={overview} />
        )}

        {/* 周导航 */}
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-4 shadow-glass">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevWeek}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          <h3 className="text-lg font-bold text-gray-800">
            {format(currentWeek, 'yyyy 年 MM 月 dd 日', { locale: zhCN })} - {format(addWeeks(currentWeek, 6), 'MM 月 dd 日')}
          </h3>
            <button
              onClick={handleNextWeek}
              disabled={addWeeks(currentWeek, 1) > new Date()}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 周日历 */}
          {weekData && (
            <WeekCalendar
              days={weekData.days}
              onDayClick={handleDayClick}
            />
          )}
        </div>

        {/* 图例说明 */}
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-4 shadow-glass">
          <h4 className="text-sm font-bold text-gray-700 mb-3">周期阶段说明</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PhaseLegend phase="period" label="经期" color="bg-red-100 border-red-300" />
            <PhaseLegend phase="follicular" label="卵泡期" color="bg-green-100 border-green-300" />
            <PhaseLegend phase="ovulation" label="排卵期" color="bg-purple-100 border-purple-300" />
            <PhaseLegend phase="luteal" label="黄体期" color="bg-orange-100 border-orange-300" />
          </div>
        </div>
      </div>

      {/* 周期设置弹窗 */}
      {showSetup && (
        <CycleSetupModal
          onComplete={handleSetupComplete}
          onClose={() => setShowSetup(false)}
        />
      )}

      {/* 每日编辑弹窗 */}
      {selectedDay && (
        <DayEditModal
          day={selectedDay}
          onClose={() => setSelectedDay(null)}
          onSave={handleDaySave}
        />
      )}
    </div>
  );
}

function PhaseLegend({ phase, label, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${color} border`} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
