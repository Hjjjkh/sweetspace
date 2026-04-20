# Cloudflare Pages 直接从 GitHub 部署指南

## 🚀 最简单的部署方式（推荐）

### 步骤 1：在 Cloudflare Dashboard 操作（2 分钟）

1. 访问 https://dash.cloudflare.com/
2. 点击左侧 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Connect to Git**

### 步骤 2：连接 GitHub 仓库

1. 选择 **GitHub**
2. 授权 Cloudflare 访问你的 GitHub
3. 选择仓库：`Hjjjkh/sweetspace`
4. 点击 **Begin setup**

### 步骤 3：配置构建设置

```
Project name: love-space
Production branch: main

Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: frontend
```

### 步骤 4：添加环境变量

点击 **Environment variables** > **Add variable**:

| Variable name | Value |
|---------------|-------|
| `VITE_API_URL` | `https://love-space-worker.workers.dev` |

### 步骤 5：保存并部署

点击 **Save and Deploy**

Cloudflare 会自动：
- ✅ 克隆你的 GitHub 仓库
- ✅ 安装依赖
- ✅ 构建前端
- ✅ 部署到全球 CDN

---

## ⚡ 后端 Worker 部署

### 方式 1：通过 Dashboard

1. 进入 **Workers & Pages** > **Create Worker**
2. 命名：`love-space-worker`
3. 点击 **Deploy**
4. 进入 Worker 编辑页面
5. 复制 `worker/src/` 下的所有代码
6. 粘贴到 Worker 编辑器
7. 点击 **Deploy**

### 方式 2：通过 CLI（推荐）

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署 Worker
cd worker
npx wrangler deploy
```

---

## 🔧 配置 D1 数据库

### 在 Dashboard 操作：

1. 进入 **Workers & Pages** > **D1**
2. **Create database**
3. 命名：`love-space-db`
4. 进入数据库页面
5. 点击 **Execute a query**
6. 复制粘贴 `worker/schema.sql` 的内容
7. 点击 **Execute**

### 绑定到 Worker:

1. 进入 `love-space-worker`
2. **Settings** > **Bindings** > **Add**
3. 选择 **D1 Database**
4. Variable name: `DB`
5. Database: `love-space-db`
6. **Save**

---

## 📦 配置 R2 存储

1. 进入 **Workers & Pages** > **R2**
2. **Create bucket**
3. 命名：`love-space-media`
4. 进入 Worker > **Settings** > **Bindings**
5. **Add** > **R2 Bucket**
6. Variable name: `BUCKET`
7. Bucket: `love-space-media`

---

## ⏰ 配置 Cron 定时任务

1. 进入 `love-space-worker`
2. **Settings** > **Triggers**
3. **Cron Triggers** > **Add cron trigger**
4. Schedule: `0 0 * * *` (每天 0 点)
5. **Save**

---

## 🔐 配置 Access 权限

1. 访问 https://one.dash.cloudflare.com/
2. **Access** > **Applications** > **Add an application**
3. **Self-hosted**
4. 配置:
   ```
   Name: love-space
   Domain: love-space.pages.dev
   Session Duration: 12h
   ```
5. **Add a policy**:
   ```
   Policy name: Couple Access
   Action: Allow
   Configure rules:
     - Field: Email
     - Operator: Equals
     - Value: your-email@example.com
   ```
6. 再添加一条规则（伴侣的邮箱）
7. **Save**

---

## ✅ 完成

访问：https://love-space.pages.dev

---

## 📊 自动部署流程

配置完成后：

```
GitHub Push
    ↓
Cloudflare 自动检测
    ↓
自动构建前端
    ↓
自动部署到 CDN
    ↓
完成！（约 1-2 分钟）
```

每次 push 到 GitHub 都会自动更新！

---

## 🎯 最简流程总结

1. **前端**: Cloudflare Pages 连接 GitHub → 自动部署
2. **后端**: `wrangler deploy` 一键部署
3. **数据库**: Dashboard 执行 SQL
4. **权限**: Access 配置 2 个邮箱

**后续更新代码只需 push 到 GitHub，Cloudflare 自动部署！**
