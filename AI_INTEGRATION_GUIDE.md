# AI 功能集成指南

## 概述

Love Space 已集成完整的 AI 功能，包括：
- ✅ AI 情感助手（心情分析、关系洞察）
- ✅ AI 照片故事（描述生成、标签、短诗）
- ✅ AI 留言助手（润色、多风格建议）
- ✅ AI 约会策划（活动推荐、纪念日方案）
- ✅ AI 对话启动器（智能话题生成）

所有 AI 调用使用 **OpenRouter API**（模型：`openrouter/elephant-alpha`），并带有缓存机制避免重复生成。

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ai/analyze-mood` | POST | 情感分析 |
| `/api/ai/generate-photo-desc` | POST | 照片描述生成 |
| `/api/ai/polish-message` | POST | 留言润色 |
| `/api/ai/plan-date` | POST | 约会策划 |
| `/api/ai/generate-topic` | POST | 话题生成 |
| `/api/ai/relationship-insight` | POST | 关系周报 |
| `/api/ai/usage` | GET | 查询使用量 |
| `/api/ai/clear-cache` | DELETE | 清除缓存 |

---

## 前端集成

### 1. 使用 AIButton 组件

```jsx
import AIButton, { AIGeneratedContent } from './components/AIButton';

// 基础用法
<AIButton
  type="analyze"
  onGenerate={(result) => {
    console.log('AI 分析结果:', result.analysis);
  }}
  data={{ days: 30, moodData: moodData }}
/>

// 显示生成内容
<AIGeneratedContent
  content={aiResult}
  fromCache={fromCache}
  onDismiss={() => setAiResult(null)}
/>
```

### 2. 各页面集成示例

#### MoodsPage - 情感分析

在心情日记页面添加 AI 分析按钮：

```jsx
// 在 mood chart 旁边添加
<AIButton
  type="analyze"
  label="AI 情感分析"
  data={{ 
    days: 30, 
    moodData: last30DaysMoods 
  }}
  onGenerate={(result) => {
    setAiAnalysis(result.analysis);
  }}
/>

// 显示分析结果
{aiAnalysis && (
  <AIGeneratedContent
    content={aiAnalysis}
    onDismiss={() => setAiAnalysis(null)}
  />
)}
```

#### GalleryPage - 照片描述

在上传照片后自动生成描述：

```jsx
const handleUploadSuccess = async (photo) => {
  // 调用 AI 生成描述
  const response = await fetch('/api/ai/generate-photo-desc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: photo.file_url,
      existingTags: []
    })
  });
  
  const result = await response.json();
  
  // 更新照片信息
  updatePhoto(photo.id, {
    ai_description: result.description,
    ai_tags: JSON.stringify(result.tags),
    ai_poem: result.poem
  });
};
```

#### MessagesPage - 留言润色

在留言编辑器中添加润色按钮：

```jsx
// 在编辑器工具栏
<div className="editor-toolbar">
  <AIButton
    type="polish"
    label="AI 润色"
    data={{ 
      draft: messageDraft,
      styles: ['温馨', '幽默', '深情']
    }}
    onGenerate={(result) => {
      setPolishedVersions(result.polished);
    }}
  />
</div>

// 显示多个版本供选择
{Object.entries(polishedVersions).map(([style, content]) => (
  <button
    key={style}
    onClick={() => setMessageDraft(content)}
    className="style-option"
  >
    {style} 版本
  </button>
))}
```

#### DailyPage - 话题生成

添加 AI 生成话题开关：

```jsx
const generateAITopics = async () => {
  const response = await fetch('/api/ai/generate-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: selectedCategory, // deep, fun, memory, future
      relationshipStage: 'stable' // new, dating, stable, married
    })
  });
  
  const result = await response.json();
  setTopics(result.topics);
};
```

#### HomePage - 关系周报

添加每周关系洞察：

```jsx
// 在概览卡片中
<Card>
  <CardHeader>
    <h3>本周关系洞察</h3>
    <AIButton
      type="insight"
      data={{
        events: thisWeekEvents,
        messages: thisWeekMessages,
        moods: thisWeekMoods,
        days: 7
      }}
      onGenerate={(result) => {
        setWeeklyInsight(result.insight);
      }}
    />
  </CardHeader>
  
  {weeklyInsight && (
    <CardContent>
      <p className="insight-text">{weeklyInsight}</p>
    </CardContent>
  )}
</Card>
```

---

## 后端扩展

### 添加新的 AI 功能

1. **创建 Prompt 模板** (`worker/src/prompts/index.js`)

```javascript
export function getNewFeaturePrompt(data) {
  return `你是...`;
}
```

2. **添加 API Handler** (`worker/src/handlers/ai.js`)

```javascript
async function handleNewFeature(request, env, user) {
  const aiService = new AIService(env, user);
  const prompt = getNewFeaturePrompt(data);
  const result = await aiService.getResponse('new_feature', prompt);
  
  return new Response(JSON.stringify({
    success: true,
    data: result.content
  }));
}
```

3. **注册路由** (`worker/src/handlers/ai.js` 中的 `handleAIRequest`)

```javascript
case 'new-feature':
  return await handleNewFeature(request, env, user);
```

---

## 数据库 Schema

### ai_responses 表

```sql
CREATE TABLE ai_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    request_type TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    response_content TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER,
    expires_at INTEGER
);
```

### gallery_photos 扩展

```sql
ALTER TABLE gallery_photos ADD COLUMN ai_description TEXT;
ALTER TABLE gallery_photos ADD COLUMN ai_tags TEXT;
ALTER TABLE gallery_photos ADD COLUMN ai_poem TEXT;
```

---

## 配置说明

### Wrangler 环境变量

```toml
[vars]
OPENROUTER_API_KEY = "sk-or-v1-xxx"
AI_MODEL = "openrouter/elephant-alpha"
AI_RATE_LIMIT = "100"
AI_CACHE_DAYS = "30"
AI_TIMEOUT_MS = "30000"
```

### GitHub Secrets

在 GitHub 仓库设置中添加：
- `OPENROUTER_API_KEY`: 你的 OpenRouter API 密钥

---

## 使用限制

| 项目 | 限制 |
|------|------|
| 每日调用次数 | 100 次/用户 |
| 缓存有效期 | 30 天 |
| 请求超时 | 30 秒 |
| 最大 Token | 500 tokens/次 |

---

## 最佳实践

1. **缓存优先**: 相同的请求不会重复调用 API
2. **错误处理**: 总是处理 AI 失败的情况，提供降级方案
3. **用户体验**: 显示加载状态，明确标示 AI 生成的内容
4. **隐私保护**: 留言润色不保存原始内容
5. **限流友好**: 接近限制时提前提示用户

---

## 故障排除

### AI 功能不可用

检查：
1. `OPENROUTER_API_KEY` 是否正确配置
2. Worker 日志中是否有错误信息
3. API 密钥是否有效（访问 https://openrouter.ai/keys）

### 缓存命中率低

优化：
1. 检查 `request_hash` 是否一致
2. 确认缓存没有过期
3. 查看 `ai_usage_log` 分析调用模式

### 响应超时

解决：
1. 增加 `AI_TIMEOUT_MS` 值
2. 减少 prompt 长度
3. 降低 `max_tokens` 设置

---

## 下一步

- [ ] 集成到 MoodsPage（情感分析）
- [ ] 集成到 GalleryPage（照片描述）
- [ ] 集成到 MessagesPage（留言润色）
- [ ] 集成到 DailyPage（话题生成）
- [ ] 集成到 HomePage（关系周报）
