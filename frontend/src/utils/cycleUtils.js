// Cycle utilities for frontend

/**
 * Get phase label in Chinese
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
 * Get phase color classes
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
 * Get mood emoji
 */
export function getMoodEmoji(moodType) {
  const emojis = {
    love: '😍',
    happy: '🙂',
    neutral: '😐',
    sad: '😢'
  };
  return emojis[moodType] || '😐';
}
