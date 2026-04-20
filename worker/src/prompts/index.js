// AI Prompt Templates
// All prompts for different AI features

// Mood Analysis Prompt
export function getMoodAnalysisPrompt(moodData, days = 30) {
  const moodList = moodData.map(m => 
    `- ${m.date}: ${m.type} (${m.score}/10) - ${m.note || '无备注'}`
  ).join('\n');

  return `你是一对情侣关系的情感助手。请分析以下最近${days}天的情绪记录，提供温暖、支持性的情感分析和建议。

情绪记录：
${moodList}

请提供：
1. 情绪趋势分析（积极/消极变化）
2. 可能的原因推测
3. 3 条具体的关系建议
4. 一句温暖的鼓励

用中文回答，语气要温柔、支持性，像一个关心他们的朋友。`;
}

// Photo Description Prompt
export function getPhotoDescriptionPrompt(filename, existingTags = []) {
  return `你是一对情侣的 AI 助手。请为这张照片生成浪漫描述。

文件名：${filename}
现有标签：${existingTags.join(', ') || '无'}

请生成：
1. 描述：100-200 字的浪漫描述，记录这个美好瞬间
2. 标签：3-5 个情感标签（如"甜蜜瞬间"、"旅行回忆"、"日常小确幸"）
3. 短诗：可选，4 行中文小诗

格式：
描述：[你的描述]
标签：[标签 1, 标签 2, 标签 3]
诗意：[你的短诗，如果没有就不写]

用中文回答，充满爱意和温暖。`;
}

// Message Polish Prompt
export function getMessagePolishPrompt(draft, styles = ['温馨', '幽默', '深情']) {
  return `你是一对情侣的 AI 助手。请帮用户润色以下留言，提供多种风格版本。

原始草稿：
"""
${draft}
"""

请为以下每种风格提供一个版本：
${styles.map(s => `- ${s}`).join('\n')}

要求：
1. 保持原意不变
2. 每种风格要有明显的语言特色
3. 温馨版：温暖、关怀、柔软
4. 幽默版：轻松、有趣、调皮
5. 深情版：真挚、深刻、动人

格式：
### 温馨版
[内容]

### 幽默版
[内容]

### 深情版
[内容]

用中文回答。`;
}

// Date Planning Prompt
export function getDatePlanningPrompt(preferences, occasion, budget, duration) {
  return `你是一对情侣的约会策划师。请为他们推荐约会活动。

偏好：${preferences || '室内户外都可以'}
场合：${occasion || '普通周末'}
预算：${budget || '中等'}
时长：${duration || '半天'}

请提供 5 个约会建议，每个包含：
1. 活动名称
2. 推荐理由
3. 预估花费
4. 注意事项

格式：
## [活动名称]
**推荐理由**：[为什么适合]
**预估花费**：[金额]
**注意事项**：[提醒]

用中文回答，建议要具体、可执行、浪漫。`;
}

// Topic Generation Prompt
export function getTopicGenerationPrompt(category, relationshipStage) {
  const categoryDescriptions = {
    general: '日常话题',
    deep: '深度交流',
    fun: '轻松有趣',
    memory: '回忆往事',
    future: '未来规划'
  };

  const stageDescriptions = {
    new: '暧昧期（刚认识不久）',
    dating: '热恋期（正在约会）',
    stable: '稳定期（长期关系）',
    married: '婚姻期（已婚）'
  };

  return `你是一对情侣的对话启动器。请为${stageDescriptions[relationshipStage] || '稳定期'}的情侣生成${categoryDescriptions[category] || '日常话题'}。

请生成 10 个话题问题，要求：
1. 问题要开放，能引发深入交流
2. 避免是非题
3. 贴近${category}分类
4. 适合${relationshipStage}阶段

格式：
每个问题一行，以"• "开头

用中文生成问题。`;
}

// Relationship Insight Prompt
export function getRelationshipInsightPrompt(events, messages, moods, days = 7) {
  const summary = `
过去${days}天：
- 新增事件：${events.length} 个
- 留言：${messages.length} 条
- 情绪记录：${moods.length} 条
`;

  return `你是一对情侣的关系观察助手。请基于以下数据生成每周关系洞察报告。

${summary}

请提供：
1. 关系统计（数据可视化描述）
2. 积极时刻总结
3. 需要关注的地方
4. 下周建议

要求：
1. 用温暖、鼓励的语气
2. 多肯定他们的努力
3. 建议要具体可行
4. 包含一句爱的鼓励

用中文回答，像一个关心他们的朋友。`;
}

export default {
  getMoodAnalysisPrompt,
  getPhotoDescriptionPrompt,
  getMessagePolishPrompt,
  getDatePlanningPrompt,
  getTopicGenerationPrompt,
  getRelationshipInsightPrompt
};
