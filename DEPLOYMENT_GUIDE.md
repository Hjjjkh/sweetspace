# Love Space 部署配置指南

## 📋 目录

1. [前置准备](#前置准备)
2. [GitHub 仓库设置](#github-仓库设置)
3. [Cloudflare 配置](#cloudflare-配置)
4. [GitHub Actions 配置](#github-actions-配置)
5. [首次部署](#首次部署)
6. [自动部署流程](#自动部署流程)
7. [环境变量管理](#环境变量管理)
8. [故障排查](#故障排查)

---

## 前置准备

### 必需账号

- **GitHub** 账号
- **Cloudflare** 账号（免费版即可）

### 安装工具（本地开发）

```bash
# Node.js >= 18.0.0
node -v

# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

---

## GitHub 仓库设置

### 1. 创建 GitHub 仓库

```bash
# 在项目根目录执行
cd /workspace/love-space

# 初始化 git（如果还没有）
git init

# 添加所有文件
git add .

# 创建初始提交
git commit -m "chore: initial commit - Love Space v2.0"
```

### 2. 创建新分支（推荐）

```bash
# 从 master/main 创建新分支
git checkout -b 260420-deploy-update

# 提交改动
git add .
git commit -m "chore: update deployment configuration"
```

### 3. 推送到 GitHub

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/love-space.git

# 推送分支
git push -u origin 260420-deploy-update

# 或者推送到主分支
# git push -u origin main
```

### 4. 创建 Pull Request

1. 访问 GitHub 仓库页面
2. 点击 "Pull requests" → "New pull request"
3. 选择你的分支 → 合并到 `main`
4. 填写描述并创建 PR

### 5. 合并代码

- 等待 GitHub Actions 自动部署完成
- 检查部署日志无错误
- 合并 PR 到 main 分支

---

## Cloudflare 配置

### 1. 获取 API Token

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 → "My Profile"
3. 选择 "API Tokens" 标签
4. 点击 "Create Token"

**推荐 Token 权限：**

```
Account:
  - Cloudflare Pages: Edit
  - Workers Scripts: Edit
  - D1: Edit
  - R2: Edit (如果使用相册功能)
```

5. 复制生成的 API Token（只会出现一次）

### 2. 获取 Account ID

1. 访问 Cloudflare Dashboard
2. 右侧边栏找到你的 Account ID
3. 复制并保存

### 3. 创建 Cloudflare Pages 项目

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 点击 "Create a project"
3. 选择 "Connect to Git"
4. 选择你的 `love-space` 仓库
5. 配置构建设置：
   - Production branch: `main`
   - Build command: `npm run build:frontend`
   - Build output directory: `frontend/dist`
6. 点击 "Save and Deploy"

### 4. 创建 Cloudflare Worker

1. 访问 [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers)
2. 点击 "Create application"
3. 选择 "Deploy from existing code"
4. Worker 名称：`sweetspace`
5. 点击 "Deploy"

### 5. 创建 D1 数据库

1. 访问 [D1 Dashboard](https://dash.cloudflare.com/?to=/:account/d1)
2. 点击 "Create a database"
3. 数据库名称：`love-space-db`
4. 复制生成的 `database_id`

### 6. 更新 wrangler.toml

编辑 `worker/wrangler.toml`，替换数据库 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "love-space-db"
database_id = "复制的 database_id"
```

---

## GitHub Actions 配置

### 1. 添加 Secrets

1. 访问 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 添加以下 secrets：

```
Name: CLOUDFLARE_API_TOKEN
Value: 你的 Cloudflare API Token

Name: CLOUDFLARE_ACCOUNT_ID
Value: 你的 Cloudflare Account ID
```

### 2. 配置部署流程

GitHub Actions 会自动触发以下流程：

**推送代码时：**
- 拉取代码
- 安装依赖
- 构建前端
- 部署前端到 Pages
- 部署 Worker
- 初始化数据库（如果需要）

**手动触发：**
- 访问 Actions 标签
- 选择 "Deploy to Cloudflare"
- 点击 "Run workflow"

---

## 首次部署

### Step 1: 初始化数据库

```bash
# 方法 1: 本地执行
cd worker
wrangler d1 execute love-space-db --file=./schema.sql --remote

# 方法 2: GitHub Actions
# 访问 Actions → Initialize Database → Run workflow
```

### Step 2: 部署 Worker

```bash
# 方法 1: 本地执行
cd worker
wrangler deploy

# 方法 2: 推送代码自动触发
git add .
git commit -m "deploy: initial deployment"
git push origin main
```

### Step 3: 部署前端

```bash
# 方法 1: 本地执行
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=love-space

# 方法 2: 推送代码自动触发（推荐）
```

### Step 4: 配置前端代理

编辑 `frontend/vite.config.js`，确保 API 代理正确：

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // Worker 本地端口
        changeOrigin: true
      }
    }
  }
})
```

### Step 5: 验证部署

1. **检查 Worker 是否运行：**
   ```bash
   curl https://sweetspace.<your-subdomain>.workers.dev/api/health
   ```

2. **检查 Pages 是否部署：**
   - 访问：https://love-space.pages.dev
   - 应该看到初始化页面

3. **检查数据库：**
   ```bash
   wrangler d1 execute love-space-db --remote --query "SELECT * FROM users LIMIT 5"
   ```

---

## 自动部署流程

### 代码推送自动部署

```bash
# 日常开发流程
git checkout -b 260420-feat-new-feature
# ... 开发代码 ...
git add .
git commit -m "feat: add new feature"
git push origin 260420-feat-new-feature

# 创建 PR 到 main 分支
# 合并后自动触发部署
```

### 部署流程图

```
┌──────────────┐
│ Git Push     │
│ to main      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ GitHub       │
│ Actions      │
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐ ┌──────────────┐
│ Build        │ │ Install      │
│ Frontend     │ │ Dependencies │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                │
┌──────────────┐        │
│ Deploy to    │        │
│ Pages        │        │
└──────────────┘        │
                        ▼
                ┌──────────────┐
                │ Deploy       │
                │ Worker       │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Init DB      │
                │ (if needed)  │
                └──────────────┘
```

---

## 环境变量管理

### 开发环境

创建 `worker/.dev.vars` 文件：

```bash
# .dev.vars (不会提交到 git)
API_KEY=your_api_key
SECRET=your_secret
```

### 生产环境

在 Cloudflare Dashboard 设置：

1. **Worker 环境变量：**
   - 访问 Workers → `sweetspace` → Settings → Variables
   - 添加环境变量

2. **Pages 环境变量：**
   - 访问 Pages → `love-space` → Settings → Environment variables
   - 添加环境变量

### 环境变量示例

```bash
# Worker 生产环境变量
DATABASE_URL=sqlite:/var/data/app.db
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# Pages 生产环境变量
VITE_API_URL=https://sweetspace.<subdomain>.workers.dev
VITE_APP_NAME=Love Space
```

---

## 故障排查

### 常见问题

#### 1. GitHub Actions 部署失败

**错误：** `Error: Cloudflare API token is invalid`

**解决方案：**
```bash
# 重新生成 API Token
1. Cloudflare Dashboard → My Profile → API Tokens
2. 删除旧 Token
3. 创建新 Token
4. 更新 GitHub Secrets
```

#### 2. Worker 部署失败

**错误：** `Error: Database binding not found`

**解决方案：**
```bash
# 检查 wrangler.toml
cat worker/wrangler.toml

# 确认 database_id 正确
# 重新部署
wrangler deploy
```

#### 3. 前端无法访问 API

**错误：** `Network Error` / `404 Not Found`

**解决方案：**
```javascript
// 检查 vite.config.js 代理配置
// 确保 /api 路由正确转发到 Worker

// 生产环境检查 _redirects 文件
cat frontend/public/_redirects
```

#### 4. 数据库初始化失败

**错误：** `Error: Database already exists`

**解决方案：**
```bash
# 检查数据库是否已初始化
wrangler d1 execute love-space-db --remote --query "SELECT name FROM sqlite_master"

# 如果需要重置
wrangler d1 execute love-space-db --remote --query "DROP TABLE IF EXISTS users"
wrangler d1 execute love-space-db --remote --file=./schema.sql
```

### 查看部署日志

```bash
# Worker 实时日志
wrangler tail

# Pages 部署日志
# Cloudflare Dashboard → Pages → 选择项目 → Deployments → 点击部署 → View logs

# GitHub Actions 日志
# GitHub → 仓库 → Actions → 选择工作流 → 查看详细日志
```

### 性能优化

#### 前端构建优化

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts']
        }
      }
    }
  }
})
```

#### Worker 优化

```javascript
// worker/src/index.js
// 使用缓存
export default {
  async fetch(request, env) {
    const cache = caches.default;
    
    // 尝试从缓存读取
    let response = await cache.match(request);
    if (response) return response;
    
    // 从数据库获取
    response = await handleRequest(request, env);
    
    // 写入缓存
    if (response.status === 200) {
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'max-age=3600');
      cache.put(request, response.clone());
    }
    
    return response;
  }
}
```

---

## 快速命令参考

```bash
# 本地开发
npm run dev                    # 同时启动前端和 Worker
npm run dev:frontend           # 只启动前端
npm run dev:worker             # 只启动 Worker

# 构建和部署
npm run build                  # 构建前端
npm run deploy                 # 部署所有
npm run deploy:frontend        # 只部署前端
npm run deploy:worker          # 只部署 Worker

# 数据库
npm run init-db                # 初始化数据库

# 查看日志
cd worker && wrangler tail     # Worker 实时日志
```

---

## 总结

✅ **自动部署流程已配置完成**

- 推送代码到 GitHub → 自动部署到 Cloudflare
- GitHub Actions 处理所有构建和部署步骤
- 前端和 Worker 独立部署，互不干扰
- 数据库初始化脚本可手动或自动执行

🔗 **重要链接：**

- GitHub Actions: `https://github.com/YOUR_USERNAME/love-space/actions`
- Cloudflare Pages: `https://dash.cloudflare.com/?to=/:account/pages`
- Cloudflare Workers: `https://dash.cloudflare.com/?to=/:account/workers`

📱 **部署后的 URLs：**

- 前端预览：`https://love-space.pages.dev`
- Worker API: `https://sweetspace.<subdomain>.workers.dev`
- API 端点：`https://sweetspace.<subdomain>.workers.dev/api/*`

---

**更新日期：** 2026-04-20  
**版本：** v2.0.0
