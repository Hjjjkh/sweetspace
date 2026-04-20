// Cycle Calculator Utilities
// 生理周期计算工具函数

/**
 * 计算给定日期处于周期的第几天
 * @param {string} cycleStartDate - 周期开始日期 YYYY-MM-DD
 * @param {string} targetDate - 目标日期 YYYY-MM-DD
 * @returns {number} 周期天数（从 1 开始）
 */
export function calculateCycleDay(cycleStartDate, targetDate) {
  const start = new Date(cycleStartDate);
  const target = new Date(targetDate);
  
  // 计算天数差（+1 因为周期从第 1 天开始）
  const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays > 0 ? diffDays : 1;
}

/**
 * 根据周期天数计算当前阶段
 * @param {number} cycleDay - 周期天数
 * @param {number} periodLength - 经期长度（天）
 * @param {number} cycleLength - 周期总长度（天）
 * @returns {'period'|'follicular'|'ovulation'|'luteal'} 周期阶段
 */
export function calculatePeriodPhase(cycleDay, periodLength = 5, cycleLength = 28) {
  // 经期：第 1 天到 periodLength 天
  if (cycleDay <= periodLength) {
    return 'period';
  }
  
  // 卵泡期：经期结束到排卵前（约第 6-13 天）
  const ovulationDay = cycleLength - 14; // 排卵通常在下次月经前 14 天
  if (cycleDay < ovulationDay - 1) {
    return 'follicular';
  }
  
  // 排卵期：排卵日前后 2-3 天（约第 14-16 天）
  if (cycleDay <= ovulationDay + 2) {
    return 'ovulation';
  }
  
  // 黄体期：排卵后到下次月经前（约第 17-28 天）
  return 'luteal';
}

/**
 * 预测下次月经开始日期
 * @param {string} cycleStartDate - 本次月经开始日期 YYYY-MM-DD
 * @param {number} cycleLength - 周期长度（天）
 * @returns {string} 预测日期 YYYY-MM-DD
 */
export function predictNextPeriod(cycleStartDate, cycleLength = 28) {
  const start = new Date(cycleStartDate);
  start.setDate(start.getDate() + cycleLength);
  return start.toISOString().split('T')[0];
}

/**
 * 预测排卵日
 * @param {string} cycleStartDate - 本次月经开始日期 YYYY-MM-DD
 * @param {number} cycleLength - 周期长度（天）
 * @returns {string} 预测排卵日 YYYY-MM-DD
 */
export function predictOvulation(cycleStartDate, cycleLength = 28) {
  const start = new Date(cycleStartDate);
  // 排卵通常在下次月经前 14 天
  start.setDate(start.getDate() + cycleLength - 14);
  return start.toISOString().split('T')[0];
}

/**
 * 获取周期阶段的颜色代码
 * @param {string} phase - 周期阶段
 * @returns {string} 颜色值（Tailwind class 或 hex）
 */
export function getPhaseColor(phase) {
  const colors = {
    period: 'bg-red-100 border-red-300 text-red-700',
    follicular: 'bg-green-100 border-green-300 text-green-700',
    ovulation: 'bg-purple-100 border-purple-300 text-purple-700',
    luteal: 'bg-orange-100 border-orange-300 text-orange-700'
  };
  
  return colors[phase] || colors.follicular;
}

/**
 * 获取周期阶段的显示名称
 * @param {string} phase - 周期阶段
 * @returns {string} 中文名称
 */
export function getPhaseLabel(phase) {
  const labels = {
    period: '经期',
    follicular: '卵泡期',
    ovulation: '排卵期',
    luteal: '黄体期'
  };
  
  return labels[phase] || '未知';
}

/**
 * 计算两个日期之间的天数
 * @param {string} date1 - 日期 1 YYYY-MM-DD
 * @param {string} date2 - 日期 2 YYYY-MM-DD
 * @returns {number} 天数差
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * 判断给定日期是否在经期内
 * @param {string} cycleStartDate - 周期开始日期 YYYY-MM-DD
 * @param {string} targetDate - 目标日期 YYYY-MM-DD
 * @param {number} periodLength - 经期长度（天）
 * @returns {boolean} 是否在经期
 */
export function isPeriodDay(cycleStartDate, targetDate, periodLength = 5) {
  const cycleDay = calculateCycleDay(cycleStartDate, targetDate);
  return cycleDay <= periodLength;
}

/**
 * 获取周期阶段的 fertility（受孕可能性）
 * @param {string} phase - 周期阶段
 * @returns {'low'|'medium'|'high'} 受孕可能性
 */
export function getFertilityLevel(phase) {
  switch (phase) {
    case 'period':
      return 'low';
    case 'follicular':
      return 'medium';
    case 'ovulation':
      return 'high';
    case 'luteal':
      return 'low';
    default:
      return 'low';
  }
}

export default {
  calculateCycleDay,
  calculatePeriodPhase,
  predictNextPeriod,
  predictOvulation,
  getPhaseColor,
  getPhaseLabel,
  daysBetween,
  isPeriodDay,
  getFertilityLevel
};
