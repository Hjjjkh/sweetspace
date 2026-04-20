# 🩸 生理周期 + 健康记录系统部署指南

## 功能概述

新增一个完整的女性生理周期追踪系统，包含：

- ✅ 周期预测（经期、卵泡期、排卵期、黄体期）
- ✅ 一周日历视图（颜色编码）
- ✅ 每日快速记录（情绪、习惯、症状）
- ✅ 可视化周期阶段
- ✅ 预测下次月经和排卵日

---

## 快速部署（3 步完成）

### 步骤 1：数据库迁移

```bash
cd worker
npx wrangler d1 execute love-space-db --remote --file=./migrations/cycle-health.sql
```

本地测试：
```bash
npx wrangler d1 execute love-space-db --local --file=./migrations/cycle-health.sql
```

### 步骤 2：部署 Worker

```bash
cd worker
npm install
npm run deploy
```

### 步骤 3：部署 Frontend

```bash
cd frontend
npm install
npm run build
```

前端会自动通过 GitHub Actions 部署到 Cloudflare Pages。

---

## 新增文件清单

### 后端（Worker）

| 文件 | 说明 |
|------|------|
| `worker/migrations/cycle-health.sql` | 数据库迁移脚本 |
| `worker/src/handlers/cycle.js` | 周期 API 处理器 |
| `worker/src/utils/cycleCalculator.js` | 周期计算工具 |
| `worker/scripts/migrate-cycle.sh` | 迁移脚本 |

### 前端（Pages）

| 文件 | 说明 |
|------|------|
| `frontend/src/pages/HealthPage.jsx` | 健康记录页面 |
| `frontend/src/components/cycle/WeekCalendar.jsx` | 周日历组件 |
| `frontend/src/components/cycle/DayCell.jsx` | 单日格子组件 |
| `frontend/src/components/cycle/CycleOverview.jsx` | 周期概览组件 |
| `frontend/src/components/cycle/CycleSetupModal.jsx` | 周期设置弹窗 |
| `frontend/src/components/cycle/DayEditModal.jsx` | 每日编辑弹窗 |
| `frontend/src/utils/cycleUtils.js` | 前端工具函数 |

---

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/cycle/start` | POST | 设置周期开始日期 |
| `/api/cycle/week` | GET | 获取一周健康数据 |
| `/api/cycle/daily` | POST | 更新每日记录 |
| `/api/cycle/overview` | GET | 获取周期概览 |

### API 使用示例

**设置周期开始：**
```bash
curl -X POST https://sweetspace.248851185.workers.dev/api/cycle/start \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Jwt-Assertion: $JWT" \
  -d '{
    "cycle_start_date": "2026-04-01",
    "cycle_length": 28,
    "period_length": 5
  }'
```

**获取一周数据：**
```bash
curl https://sweetspace.248851185.workers.dev/api/cycle/week \
  -H "Cf-Access-Jwt-Assertion: $JWT"
```

**更新每日记录：**
```bash
curl -X POST https://sweetspace.248851185.workers.dev/api/cycle/daily \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Jwt-Assertion: $JWT" \
  -d '{
    "date": "2026-04-20",
    "mood_type": "happy",
    "mood_score": 8,
    "flow_level": "light",
    "habits": {
      "water": 1,
      "fruit": 1,
      "breakfast": 1,
      "exercise": 0,
      "bowel": 1
    }
  }'
```

---

## 数据库 Schema

### cycle_logs 表

```sql
CREATE TABLE cycle_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    cycle_start_date TEXT NOT NULL,
    cycle_length INTEGER DEFAULT 28,
    period_length INTEGER DEFAULT 5,
    predicted_next_start TEXT,
    predicted_ovulation TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER,
    updated_at INTEGER
);
```

### daily_health 表

```sql
CREATE TABLE daily_health (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood_type TEXT,
    mood_score INTEGER,
    flow_level TEXT,
    symptoms TEXT,  -- JSON array
    habit_water INTEGER,
    habit_fruit INTEGER,
    habit_breakfast INTEGER,
    habit_exercise INTEGER,
    habit_bowel INTEGER,
    cycle_day INTEGER,
    period_phase TEXT,
    note TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    UNIQUE(user_id, date)
);
```

---

## 周期计算逻辑

### 阶段划分

| 阶段 | 天数范围 | 说明 |
|------|----------|------|
| 经期（Period） | 第 1-5 天 | 月经期 |
| 卵泡期（Follicular） | 第 6-13 天 | 卵泡发育 |
| 排卵期（Ovulation） | 第 14-16 天 | 受孕高峰期 |
| 黄体期（Luteal） | 第 17-28 天 | 黄体形成 |

### 计算公式

```javascript
// 周期第几天
cycleDay = (targetDate - cycleStartDate) + 1

// 阶段判断
if (cycleDay <= periodLength) return 'period'
if (cycleDay < cycleLength - 14) return 'follicular'
if (cycleDay <= cycleLength - 12) return 'ovulation'
return 'luteal'

// 预测下次月经
nextPeriod = cycleStartDate + cycleLength

// 预测排卵日
ovulation = cycleStartDate + (cycleLength - 14)
```

---

## UI 设计说明

### 颜色规范

| 阶段 | 颜色 | Tailwind Class |
|------|------|----------------|
| 经期 | 🔴 红色 | `bg-red-100 border-red-300` |
| 卵泡期 | 🟢 绿色 | `bg-green-100 border-green-300` |
| 排卵期 | 🟣 紫色 | `bg-purple-100 border-purple-300` |
| 黄体期 | 🟠 橙色 | `bg-orange-100 border-orange-300` |

### 一周视图

- 默认展示当前周（7 天）
- 每一天显示：
  - 周期阶段背景色
  - 情绪表情（🙂😐😢😍）
  - 经期标记（💧）
  - 习惯完成点（绿色圆点）
- 点击任意一天 → 弹出编辑面板

### 交互流程

1. **首次使用**：
   - 进入 /health 页面
   - 自动弹出设置弹窗
   - 输入月经开始日期、周期长度、经期长度
   - 保存后显示周视图

2. **日常记录**：
   - 点击某一天
   - 选择情绪
   - 勾选习惯
   - 保存

3. **查看预测**：
   - 顶部概览卡片显示
   - 当前周期天数
   - 当前阶段
   - 距下次月经天数
   - 预测排卵日

---

## 集成方案

### 导航集成

在 Layout 组件的导航栏中添加：

```jsx
{ path: '/health', label: '健康', icon: Activity }
```

### 路由集成

在 App.jsx 中添加：

```jsx
<Route path="health" element={<HealthPage />} />
```

### 数据隔离

- 与现有 `moods` 表独立，不产生冲突
- 每日健康记录包含独立的 `mood_type` 字段
- 两者可以共存，互不影响

---

## 访问路径

部署完成后访问：

```
https://love-space.pages.dev/health
```

---

## 测试清单

- [ ] 数据库迁移成功
- [ ] Worker 部署成功
- [ ] 前端页面可访问
- [ ] 设置周期开始日期
- [ ] 查看一周视图
- [ ] 点击日期弹出编辑面板
- [ ] 保存每日记录
- [ ] 周期阶段颜色正确
- [ ] 预测数据准确
- [ ] 导航栏显示"健康"入口

---

## 技术栈

- **前端**：React 18 + Vite + TailwindCSS
- **后端**：Cloudflare Workers
- **数据库**：Cloudflare D1
- **认证**：Cloudflare Access
- **部署**：GitHub Actions + Cloudflare Pages

---

## 注意事项

1. **隐私保护**：
   - 所有数据仅用户本人可见
   - 通过 Cloudflare Access 限制访问
   - 不上传敏感症状详情

2. **数据准确性**：
   - 周期预测基于平均值，实际可能有所不同
   - 建议连续记录 3 个月以提高准确性

3. **移动端优化**：
   - 一周视图针对移动端优化
   - 编辑弹窗自适应屏幕

4. **性能优化**：
   - 每次只加载一周数据
   - 使用 D1 索引加速查询
   - 前端组件懒加载

---

## 故障排除

### 问题：周期计算不准确

**解决**：
- 检查输入的周期长度和经期长度
- 连续记录 3 个月以上数据
- 在设置中手动调整预测

### 问题：一周视图不显示颜色

**解决**：
- 检查是否设置了周期开始日期
- 查看浏览器控制台错误
- 确认 API 返回数据格式正确

### 问题：保存失败

**解决**：
- 检查网络连接
- 确认 Cloudflare Access 认证有效
- 查看 Worker 日志

---

## 下一步优化建议

1. **数据可视化**：
   - 添加周期趋势图
   - 症状统计图表
   - 习惯完成率统计

2. **提醒功能**：
   - 月经来临提醒
   - 排卵期提醒
   - 每日记录提醒

3. **数据分析**：
   - 周期规律性分析
   - 情绪与周期关联
   - 习惯对症状影响

4. **导出功能**：
   - 导出 PDF 报告
   - 导出数据 CSV
   - 分享给医生

---

## 相关文档

- [AI 功能集成](./AI_INTEGRATION_GUIDE.md)
- [系统架构](./ARCHITECTURE.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)

---

**开始使用**：访问 https://love-space.pages.dev/health 💕
