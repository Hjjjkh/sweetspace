import { useState, useEffect } from 'react';
import { format, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, Droplet, Sparkles, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MonthCalendar from '../components/cycle/MonthCalendar';
import CycleOverview from '../components/cycle/CycleOverview';
import CycleSetupModal from '../components/cycle/CycleSetupModal';
import DayEditModal from '../components/cycle/DayEditModal';

export default function HealthPage() {
  const { user } = useAuth();
  const [weekData, setWeekData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchWeekData();
    fetchOverview();
  }, []);

  async function fetchWeekData() {
    try {
      const weekStart = format(new Date(), 'yyyy-MM-dd');
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

  function handleMonthChange(month) {
    // 可以在月份切换时加载更多数据
    console.log('月份切换到:', format(month, 'yyyy-MM'));
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold text-gray-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" fill="currentColor" />
              </div>
              健康记录
            </h2>
            <p className="text-sm text-gray-600 mt-2 ml-15">记录生理周期，关爱每一天</p>
          </div>
          {overview?.has_cycle && (
            <button
              onClick={() => setShowSetup(true)}
              className="px-5 py-2.5 text-sm font-medium text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all cursor-pointer shadow-sm border border-red-100"
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
        <div className="bg-white/90 backdrop-blur-md border border-rose-100 rounded-3xl p-6 shadow-lg">
          {weekData && (
            <MonthCalendar
              days={weekData.days}
              onDayClick={handleDayClick}
              onMonthChange={handleMonthChange}
            />
          )}
        </div>

        {/* 周期阶段说明 */}
        <div className="bg-white/90 backdrop-blur-md border border-rose-100 rounded-3xl p-6 shadow-lg">
          <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            周期阶段说明
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PhaseLegend 
              phase="period" 
              label="经期" 
              description="月经期间，需要更多休息"
              color="bg-red-50 border-red-200" 
              icon={<Droplet className="w-5 h-5 text-red-600" fill="currentColor" />}
            />
            <PhaseLegend 
              phase="follicular" 
              label="卵泡期" 
              description="身体准备排卵，精力充沛"
              color="bg-green-50 border-green-200" 
              icon={<Heart className="w-5 h-5 text-green-600" />}
            />
            <PhaseLegend 
              phase="ovulation" 
              label="排卵期" 
              description="受孕高峰期，情绪较好"
              color="bg-purple-50 border-purple-200" 
              icon={<Sparkles className="w-5 h-5 text-purple-600" />}
            />
            <PhaseLegend 
              phase="luteal" 
              label="黄体期" 
              description="为下次月经准备，可能情绪波动"
              color="bg-orange-50 border-orange-200" 
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

function PhaseLegend({ phase, label, description, color, icon }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${color}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-gray-800">{label}</div>
        <div className="text-xs text-gray-600 mt-1">{description}</div>
      </div>
    </div>
  );
}
