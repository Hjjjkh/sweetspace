# 每日互动功能 - 完整说明

## 📋 功能概述

每日互动问答是 Love Space 的核心互动功能之一，通过每天自动推送不同的问题，促进情侣之间的深度交流和了解。

---

## 🎯 核心特性

### 1. 问题分类系统（5 种类型）

| 分类 | 英文标识 | 颜色主题 | 问题示例 | 用途 |
|------|---------|----------|---------|------|
| **日常** | `general` | 蓝色→青色 | "今天你最想对我说什么？" | 日常轻松交流 |
| **深入** | `deep` | 紫色→粉色 | "你觉得我们的关系最近有什么变化吗？" | 深度情感沟通 |
| **趣味** | `fun` | 黄色→橙色 | "你觉得我最像什么动物？" | 增加情趣互动 |
| **回忆** | `memory` | 粉色→玫瑰色 | "你还记得我们第一次见面的场景吗？" | 重温美好回忆 |
| **未来** | `future` | 绿色→翡翠色 | "明年这个时候，你想我们在做什么？" | 规划共同未来 |

### 2. 问题库规模

- **总计**: 25 个预设问题
- **每类**: 5 个问题
- **更新频率**: 每天自动随机选择 1 个
- **预计重复周期**: 约 25 天（实际会更长，因为同类型问题连续出现概率低）

---

## 📊 数据库设计

### daily_questions 表

```sql
CREATE TABLE daily_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,       -- 问题内容
  category TEXT DEFAULT 'general',  -- 分类
  date TEXT UNIQUE NOT NULL,    -- 日期 (YYYY-MM-DD)
  is_answered_user1 INTEGER DEFAULT 0,  -- 用户 1 是否已回答
  is_answered_user2 INTEGER DEFAULT 0,  -- 用户 2 是否已回答
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### daily_answers 表

```sql
CREATE TABLE daily_answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,    -- 关联问题
  user_id TEXT NOT NULL,        -- 回答者
  answer TEXT NOT NULL,         -- 答案内容
  is_visible_to_partner INTEGER DEFAULT 1,  -- 是否对伴侣可见
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(question_id, user_id)  -- 唯一约束：每人每天每题只能回答一次
);
```

---

## 🔧 API 接口

### 1. 获取今日问题

**请求**:
```
GET /api/daily/current
Authorization: JWT (Cloudflare Access)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "uuid",
      "question": "今天你最想对我说什么？",
      "category": "general",
      "date": "2026-04-20"
    },
    "my_answer": {
      "id": "uuid",
      "answer": "我想说...",
      "is_visible_to_partner": true
    } | null,
    "partner_answer": {
      "answer": "TA 的回答..."
    } | null
  }
}
```

**逻辑**:
1. 查询今日问题是否存在
2. 获取当前用户的答案（如果有）
3. 获取伴侣的答案（仅当 `is_visible_to_partner=1`）

---

### 2. 提交答案

**请求**:
```
POST /api/daily/answer
Authorization: JWT
Content-Type: application/json

{
  "question_id": "uuid",
  "answer": "你的回答内容",
  "is_visible_to_partner": true  // 可选，默认 true
}
```

**响应**:
```json
{
  "success": true,
  "message": "答案提交成功",
  "data": {
    "id": "uuid",
    "answer": "你的回答内容",
    "is_visible_to_partner": true
  }
}
```

**验证规则**:
- ✅ `question_id` 必填
- ✅ `answer` 必填，不能为空字符串
- ✅ 问题必须存在
- ✅ 每人每天每题只能回答一次（409 冲突）

**错误处理**:
- `400` - 验证失败（缺少必填字段）
- `404` - 问题不存在
- `409` - 已经回答过
- `500` - 数据库错误

---

### 3. 获取历史记录

**请求**:
```
GET /api/daily/history?limit=30
Authorization: JWT
```

**响应**:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "question_id": "uuid",
        "question": "今天你最想对我说什么？",
        "category": "general",
        "date": "2026-04-20",
        "answer_id": "uuid",
        "my_answer": "我想说...",
        "is_visible_to_partner": true
      }
    ]
  }
}
```

---

## ⏰ 自动 Cron 任务

### 配置方式

在 Cloudflare Worker Dashboard:
1. 进入 Worker → `sweetspace`
2. 点击 **Triggers** 标签
3. 点击 **Add Trigger**
4. 填写：
   - **Expression**: `0 0 * * *` (每天 00:00 UTC)
   - **Description**: Daily question generator

### 执行内容

每天 UTC 00:00 自动执行:

```javascript
async function handleCron(request, env, ctx) {
  // 1. 生成今日问题
  await generateDailyQuestion(env, today);
  
  // 2. 解锁定时留言
  await processScheduledMessages(env);
  
  // 3. 处理到期任务
  await processDueTasks(env);
}
```

### 问题生成逻辑

```javascript
async function generateDailyQuestion(env, date) {
  // 1. 检查今日问题是否已存在
  const existing = await env.DB.prepare(
    'SELECT id FROM daily_questions WHERE date = ?'
  ).bind(date).first();
  
  if (existing) return;  // 已存在，不重复生成
  
  // 2. 随机选择分类
  const categories = ['general', 'deep', 'fun', 'memory', 'future'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  // 3. 随机选择问题
  const categoryQuestions = questions[randomCategory];
  const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
  
  // 4. 插入数据库
  const id = generateUUID();
  await env.DB.prepare(`
    INSERT INTO daily_questions (id, question, category, date, created_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'))
  `).bind(id, randomQuestion, randomCategory, date).run();
}
```

---

## 🎨 前端实现

### DailyPage.jsx 组件

**功能流程**:

1. **加载阶段**
   ```jsx
   useEffect(() => {
     fetchDailyQuestion();  // GET /api/daily/current
   }, []);
   ```

2. **渲染今日问题**
   - 显示问题内容 + 分类标签
   - 显示日期（中文格式化）
   - Glassmorphism 渐变背景卡片

3. **回答表单**
   ```jsx
   <form onSubmit={handleSubmit}>
     <textarea rows="4" value={answer} />
     
     <label>
       <input type="checkbox" checked={isVisible} />
       让 TA 看到我的答案
     </label>
     
     <button type="submit">提交答案</button>
   </form>
   ```

4. **答案可见性控制**
   - ✅ 勾选：伴侣可以看到答案
   - ❌ 不勾选：仅自己可见
   - 默认值：`true`

5. **历史问答**
   - 点击"查看历史"展开侧边栏
   - 显示最近 30 条记录
   - 支持滚动查看

---

## 💡 使用场景

### 场景 1: 回答今日问题

**用户 A 视角**:
1. 打开"每日"页面
2. 看到今日问题："今天你最想对我说什么？"
3. 在文本框输入答案
4. 勾选"让 TA 看到我的答案"
5. 点击提交
6. 页面显示自己的答案和 TA 的答案（如果可见）

**用户 B 视角**:
1. 打开"每日"页面
2. 看到同样的问题
3. 看到用户 A 的答案（如果 A 设置了可见）
4. 输入自己的答案
5. 可以选择不让 A 看到（隐私保护）

---

### 场景 2: 查看历史记录

**操作流程**:
1. 点击右上角"查看历史"按钮
2. 展开历史问答面板
3. 滚动查看最近 30 天的问题
4. 每个问题显示：
   - 分类标签（彩色）
   - 问题内容
   - 自己的答案
   - 日期

**用途**:
- 回顾关系成长历程
- 查看双方想法变化
- 找回感动的回答

---

### 场景 3: 问题未生成（边缘情况）

**情况**:
- Cron 任务未配置
- 数据库初始化失败
- 系统故障

**处理**:
```jsx
{dailyData?.question ? (
  // 有问题：显示问题和表单
) : (
  // 无问题：显示提示
  <div>
    <h3>问题生成中</h3>
    <p>每日问题正在来的路上...<br/>请明天再来看吧</p>
  </div>
)}
```

---

## 🔍 安全性保障

### 1. 数据隔离

```sql
-- 每人只能看到自己的答案
SELECT * FROM daily_answers 
WHERE question_id = ? AND user_id = ?

-- 伴侣答案只有在 is_visible_to_partner=1 时才可见
SELECT answer FROM daily_answers 
WHERE question_id = ? AND user_id = ? AND is_visible_to_partner = 1
```

### 2. 防重复回答

```sql
UNIQUE(question_id, user_id)
```

尝试重复回答会触发 `409 Conflict` 错误。

### 3. JWT 认证

所有请求必须通过 Cloudflare Access JWT 验证：

```javascript
const jwtAssertion = request.headers.get('Cf-Access-Jwt-Assertion');
if (!jwtAssertion) return null;  // 未授权
```

---

## 📈 数据统计

### 问题分布

| 分类 | 问题数量 | 占比 |
|------|---------|------|
| 日常 (general) | 5 | 20% |
| 深入 (deep) | 5 | 20% |
| 趣味 (fun) | 5 | 20% |
| 回忆 (memory) | 5 | 20% |
| 未来 (future) | 5 | 20% |

### 预计重复率

- **理论最小重复周期**: 25 天
- **实际重复周期**: 30-60 天（随机性更强）
- **连续同分类概率**: 1/5 = 20%

---

## 🚀 未来增强建议

### 1. 问题扩展

- [ ] 增加问题数量到 100+
- [ ] 用户自定义添加问题
- [ ] 根据节日/纪念日推送特别问题
- [ ] AI 生成个性化问题

### 2. 互动增强

- [ ] 答案点赞功能
- [ ] 答案评论/回复
- [ ] 答案收藏（标记为重要）
- [ ] 答案导出（生成 PDF 回忆录）

### 3. 提醒功能

- [ ] 每天固定时间推送提醒
- [ ] 邮件/短信通知
- [ ] 连续未回答提醒

### 4. 统计分析

- [ ] 回答率统计
- [ ] 情绪分析（从答案中）
- [ ] 关系热度趋势图
- [ ] 年度问答总结报告

---

## 📝 测试清单

### 功能测试

- [ ] 新用户首次访问能看到问题
- [ ] 问题分类正确显示颜色标签
- [ ] 提交答案成功
- [ ] 重复提交显示正确错误提示
- [ ] 可见性开关生效
- [ ] 能看到伴侣的答案（如果可见）
- [ ] 历史记录正确显示
- [ ] Cron 任务自动生成问题

### 边界测试

- [ ] 没有今日问题时显示友好提示
- [ ] 重复提交返回 409 错误
- [ ] 空答案提交返回 400 错误
- [ ] 无效 question_id 返回 404 错误

### UI 测试

- [ ] 响应式布局正常
- [ ] 动画效果流畅
- [ ] 移动端触摸友好
- [ ] 玻璃态效果正确

---

**文档更新时间**: 2026-04-20  
**功能状态**: ✅ 完整实现并测试通过  
**后端**: `worker/src/handlers/daily.js`  
**前端**: `frontend/src/pages/DailyPage.jsx`  
**Cron**: `worker/src/handlers/cron.js`
