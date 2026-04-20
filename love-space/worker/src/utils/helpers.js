/**
 * UUID 生成工具
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 日期格式化工具
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * 时间戳转换
 */
export function toTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

/**
 * 验证日期格式 YYYY-MM-DD
 */
export function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}
