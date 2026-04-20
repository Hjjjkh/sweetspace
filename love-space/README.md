# 💕 Love Space - 情侣专属私密网站系统

> 一个完全免费、可一键部署、无需服务器运维的情侣数字空间系统

## ✨ 核心特性

### 🧠 三大核心能力

1. **Memory Layer（关系记忆）**
   - 时间线记录恋爱事件
   - 照片/视频归档
   - 重要事件标记

2. **Emotion Layer（情绪状态）**
   - 每日心情记录
   - 情绪趋势可视化 (30 天)
   - 简单关系状态判断

3. **Interaction Engine（互动引擎）**
   - 每日自动问题生成
   - 双人互动任务
   - 定时留言系统

### 🛡️ 技术优势

- ✅ **100% 免费** - 使用 Cloudflare 免费套餐
- ✅ **无需运维** - 全无服务器架构
- ✅ **极致隐私** - Cloudflare Access 权限控制
- ✅ **一键部署** - GitHub + Cloudflare 自动部署
- ✅ **高可用性** - 全球 Edge 网络分发

---

## 🚀 技术架构

### 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + Vite | 轻量快速 |
| UI | TailwindCSS | 响应式设计 |
| 图表 | Recharts | 情绪趋势可视化 |
| 后端 | Cloudflare Workers | 无服务器 API |
| 数据库 | Cloudflare D1 | SQLite 边缘数据库 |
| 存储 | Cloudflare R2 | 媒体文件存储 |
| 权限 | Cloudflare Access | 双人访问控制 |
| 定时任务 | Cron Triggers | 每日自动问题 |

### 系统架构图

```
┌─────────────────────────────────────────┐
│         Cloudflare Edge Network         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Cloudflare Access (权限控制)        │
│      仅允许两个指定邮箱访问              │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐         ┌──────────────┐
│Cloudflare    │◄───────►│Cloudflare    │
│Pages (前端)   │         │Workers (API) │
│- React 应用   │         │- 业务逻辑     │
│- 5 个核心页面  │         │- RESTful API │
└──────────────┘         └──────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
           ┌──────────────┐          ┌──────────────┐
           │Cloudflare D1 │          │Cloudflare R2 │
           │(SQLite 数据库)│          │(对象存储)     │
           │- 用户数据     │          │- 照片/视频    │
           │- 事件/留言    │          │              │
           │- 情绪/问答    │          │              │
           └──────────────┘          └──────────────┘

┌──────────────────────────────────────┐
│    Cron Trigger (每天 00:00 UTC)     │
│    - 生成每日问题                     │
│    - 解锁定时留言                     │
└──────────────────────────────────────┘
```

---

## 📦 部署步骤

### 前置要求

1. 拥有 Cloudflare 账号 (免费)
2. 拥有 GitHub 账号

### 一键部署流程

#### 步骤 1: 克隆项目到 GitHub

```bash
# 创建 GitHub 仓库
git init
git add .
git commit -m "Initial commit: Love Space"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/love-space.git
git push -u origin main
```

#### 步骤 2: 创建 Cloudflare 资源

##### 2.1 创建 D1 数据库

登录 Cloudflare Dashboard:
1. 进入 Workers & Pages > D1
2. 点击 "Create database"
3. 命名为 `love-space-db`
4. 记录下 `database_id`

或使用 CLI:

```bash
npx wrangler d1 create love-space-db
```

##### 2.2 创建 R2 存储桶

1. 进入 Workers & Pages > R2
2. 点击 "Create bucket"
3. 命名为 `love-space-media`

或使用 CLI:

```bash
npx wrangler r2 bucket create love-space-media
```

##### 2.3 创建 Access 应用

1. 进入 Zero Trust > Access > Applications
2. 点击 "Add an application"
3. 选择 "Self-hosted"
4. 配置:
   - Name: `love-space`
   - Domain: 待会填写 Pages 的域名
   - Policy: 添加两条规则
     - Email: 你的邮箱
     - Email: 伴侣的邮箱

#### 步骤 3: 配置环境变量

编辑 `worker/wrangler.toml`:

```toml
# 填入 D1 database_id
[[d1_databases]]
binding = "DB"
database_name = "love-space-db"
database_id = "YOUR_D1_DATABASE_ID"

# 填入 R2 bucket_info (如果需要公开访问)
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "love-space-media"

# 添加 Cron Secret
[vars]
CRON_SECRET = "your-random-secret-here"
```

#### 步骤 4: 部署后端 Worker

```bash
cd worker

# 安装依赖
npm install

# 初始化数据库
npm run init-db:prod

# 部署 Worker
npm run deploy
```

#### 步骤 5: 部署前端 Pages

```bash
cd frontend

# 安装依赖
npm install

# 构建
npm run build
```

**方式 A: 通过 Cloudflare Dashboard 部署**

1. 进入 Workers & Pages > Create application
2. 选择 "Connect to Git"
3. 选择你的 `love-space` 仓库
4. 配置:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - 设置环境变量：无需额外变量
5. 点击 "Deploy"

**方式 B: 通过 CLI 部署**

```bash
npm install -g wrangler
wrangler pages deploy dist --project-name=love-space
```

#### 步骤 6: 配置自定义域名 (可选)

在 Cloudflare Pages 设置中:
1. Custom domains
2. Add custom domain
3. 输入你的域名

#### 步骤 7: 更新 Access 配置

回到步骤 2.3 创建的 Access 应用:
1. 更新 Domain 为 Pages 的实际域名
2. 确认 Policy 中包含两个邮箱

---

## 🎯 使用说明

### 初始化系统

1. 访问部署好的网站
2. 使用 Cloudflare Access 登录 (会收到邮件验证码)
3. 填写初始化表单:
   - 你的邮箱和昵称
   - 伴侣的邮箱和昵称
4. 完成！

### 主要功能

#### 首页
- 查看关系概览
- 在一起天数
- 统计数据
- 快捷操作

#### 时间线
- 记录恋爱事件
- 分类筛选 (纪念日、第一次、旅行等)
- 支持文字 + 图片

#### 留言系统
- 发送留言给 TA
- 支持定时解锁 (未来某个时间才可见)
- 已读/未读状态

#### 心情日记
- 每日心情记录 (7 种情绪)
- 30 天气情绪趋势图
- 分数评估 (1-10)

#### 每日互动
- 每日自动生成一个问题
- 5 种问题类型 (日常、深入、趣味、回忆、未来)
- 可选择是否对伴侣可见

---

## 🗄️ 数据库 Schema

### 核心表

- `users` - 用户表 (仅 2 人)
- `events` - 时间线事件
- `event_media` - 事件媒体文件
- `messages` - 留言 (支持定时解锁)
- `moods` - 情绪记录
- `tasks` - 互动任务
- `daily_questions` - 每日问题
- `daily_answers` - 问题答案
- `settings` - 系统配置

详细 schema 见 `worker/schema.sql`

---

## 📝 API 文档

### 认证
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/init` - 初始化双人关系

### 事件
- `GET /api/events` - 获取事件列表
- `POST /api/events` - 创建事件
- `GET /api/events/:id` - 获取事件详情
- `PUT /api/events/:id` - 更新事件
- `DELETE /api/events/:id` - 删除事件

### 留言
- `GET /api/messages` - 获取留言
- `POST /api/messages` - 发送留言
- `PUT /api/messages/:id/read` - 标记已读

### 情绪
- `GET /api/moods` - 获取情绪记录
- `POST /api/moods` - 记录心情
- `GET /api/moods/trend` - 情绪趋势

### 每日互动
- `GET /api/daily/current` - 今日问题
- `POST /api/daily/answer` - 提交答案
- `GET /api/daily/history` - 历史记录

### 其他
- `POST /api/upload` - 文件上传
- `GET /api/overview` - 关系概览

详细 API 设计见 `worker/API_DESIGN.md`

---

## ⚙️ 配置说明

### Cron 定时任务

每天 00:00 UTC 自动执行:

1. 生成今日问题
2. 检查待解锁留言
3. 处理到期任务

手动触发测试:

```bash
curl -X POST https://your-worker.workers.dev/api/cron/daily \
  -H "X-Cron-Secret: your-secret"
```

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ENVIRONMENT` | 环境标识 | `production` |
| `MAX_FILE_SIZE` | 最大文件大小 (字节) | `10485760` (10MB) |
| `ALLOWED_TYPES` | 允许的文件类型 | 图片 + 视频 |
| `CRON_SECRET` | Cron 验证密钥 | 必填 |

---

## 🎨 自定义

### 修改主题色

编辑 `frontend/tailwind.config.js`:

```javascript
colors: {
  primary: {
    50: '#fdf2f8', // 修改这里
    // ...
  }
}
```

### 添加新的每日问题

编辑 `worker/src/handlers/cron.js` 中的 `questions` 对象。

### 扩展功能

- 相册功能 (使用 R2 存储)
- AI 情绪分析
- 周年纪念提醒
- 更多互动游戏

---

## 🔧 开发

### 本地开发

```bash
# 启动 Worker (端口 8787)
cd worker
npm run dev

# 启动前端 (端口 3000, 代理到 Worker)
cd frontend
npm run dev
```

访问 `http://localhost:3000`

### 数据库操作

```bash
# 本地数据库初始化
npm run init-db

# 生产环境数据库初始化
npm run init-db:prod

# 执行 SQL 查询
npx wrangler d1 execute love-space-db --local --command="SELECT * FROM users"
```

### 查看日志

```bash
npx wrangler tail
```

---

## 📊 性能与成本

### 性能指标

- **首屏加载**: < 2s (全球 Edge 分发)
- **API 响应**: < 100ms (Edge 计算)
- **数据库查询**: < 50ms (D1 SQLite)

### 成本分析 (免费套餐)

| 服务 | 免费额度 | 预计用量 | 成本 |
|------|---------|---------|------|
| Workers | 100k 请求/天 | ~1k/天 | $0 |
| Pages | 无限 | - | $0 |
| D1 | 5GB 存储 | < 100MB | $0 |
| R2 | 10GB 存储 | < 1GB | $0 |
| Access | 50 用户 | 2 用户 | $0 |
| **总计** | - | - | **$0/月** |

---

## 🛡️ 安全性

1. **访问控制**: Cloudflare Access 限制仅 2 人
2. **JWT 验证**: 所有 API 请求需通过 Access 认证
3. **数据隔离**: 所有查询自动过滤用户 ID
4. **文件安全**: R2 私有存储，通过签名 URL 访问
5. **HTTPS**: 全站强制 HTTPS

---

## 🚧 待开发功能

1. **相册管理** - R2 图片/视频上传和管理
2. **AI 情绪分析** - 自动分析留言情绪
3. **周年纪念** - 自动计算和提醒
4. **互动游戏** - 情侣问答挑战
5. **数据导出** - 导出所有回忆数据
6. **主题切换** - 多套 UI 主题

---

## 📄 License

MIT License

---

## 💖 致谢

感谢 Cloudflare 提供的强大免费边缘基础设施:
- Cloudflare Workers
- Cloudflare Pages
- Cloudflare D1
- Cloudflare R2
- Cloudflare Access

---

## 📮 联系方式

如有问题，请提交 Issue 或联系开发者。

**Happy Coding & Happy Loving! 💕**
