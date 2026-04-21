import { useState, useEffect } from 'react';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CycleCalendar from '../components/cycle/CycleCalendar';
import CycleOverview from '../components/cycle/CycleOverview';
import CycleSetupModal from '../components/cycle/CycleSetupModal';
import DayEditModal from '../components/cycle/DayEditModal';

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 font-display flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" fill="currentColor" />
              健康记录
            </h2>
            <p className="text-sm text-gray-500 mt-1">记录生理周期，关爱每一天</p>
          </div>
          {overview?.has_cycle && (
            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-white/50 hover:bg-white rounded-lg transition-all cursor-pointer"
            >
              设置周期
            </button>
          )}
        </div>

        {/* 周期概览卡片 */}
        {overview?.has_cycle && (
          <CycleOverview overview={overview} />
        )}

        {/* 日历卡片 */}
        <div className="bg-white/80 backdrop-blur-glass border border-rose-border rounded-3xl p-6 shadow-glass">
          {weekData && (
            <CycleCalendar
              days={weekData.days}
              onDayClick={handleDayClick}
            />
          )}
        </div>

        {/* 图例说明 */}
        <div className="bg-white/80 backdrop-blur-glass border border-rose-border rounded-2xl p-5 shadow-glass">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            周期阶段说明
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PhaseLegend 
              phase="period" 
              label="经期" 
              description="月经期间"
              color="bg-red-100 border-red-300" 
              icon={<Droplet className="w-5 h-5 text-red-600" />}
            />
            <PhaseLegend 
              phase="follicular" 
              label="卵泡期" 
              description="身体准备排卵"
              color="bg-green-100 border-green-300" 
              icon={<Heart className="w-5 h-5 text-green-600" />}
            />
            <PhaseLegend 
              phase="ovulation" 
              label="排卵期" 
              description="受孕高峰期"
              color="bg-purple-100 border-purple-300" 
              icon={<Sparkles className="w-5 h-5 text-purple-600" />}
            />
            <PhaseLegend 
              phase="luteal" 
              label="黄体期" 
              description="为下次月经准备"
              color="bg-orange-100 border-orange-300" 
              icon={<Activity className="w-5 h-5 text-orange-600" />}
            />
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

import { Droplet, Sparkles, Heart, Activity } from 'lucide-react';

function PhaseLegend({ phase, label, description, color, icon }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${color} border`}>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-gray-800">{label}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
    </div>
  );
}
