# 🚀 Love Space 部署指南

## 🎯 完整部署流程（只需 2 步）

### 第 1 步：部署前端和后端 ✅

你已经完成了！
- ✅ Worker 部署在：https://sweetspace.248851185.workers.dev
- ✅ Pages 部署在：https://sweetspace.248851185.pages.dev

### 第 2 步：初始化数据库（自动）

**方式 A：使用 GitHub Actions（全自动）**

1. 访问：https://github.com/Hjjjkh/sweetspace/actions
2. 点击 **Initialize Database** 工作流
3. 点击 **Run workflow**
4. 等待 30 秒完成

**方式 B：本地脚本（一键执行）**

```bash
bash scripts/init-db.sh
```

**方式 C：命令行（手动）**

```bash
npm install -g wrangler
wrangler login
cd worker
npx wrangler d1 execute love-space-db --file=./schema.sql --remote
```

---

## ✅ 部署完成后

1. 访问：https://sweetspace.248851185.pages.dev
2. 配置 Cloudflare Access 权限（添加 2 个邮箱）
3. 开始使用！

---

## 方式 1：Cloudflare 直接部署（最简单 ⭐）

### 步骤 1：访问 Cloudflare Dashboard

👉 https://dash.cloudflare.com/

### 步骤 2：创建 Pages 应用

1. **Workers & Pages** > **Create application**
2. 选择 **Connect to Git**
3. 连接 GitHub 账号
4. 选择仓库：**Hjjjkh/sweetspace**
5. 点击 **Begin setup**

### 步骤 3：配置构建设置

```yaml
Project name: love-space
Production branch: main

Build settings:
  Framework preset: Vite
  Build command: npm run build
  Build output directory: dist
  Root directory: frontend
```

### 步骤 4：设置环境变量

在 **Environment variables** 中添加：

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://love-space-worker.workers.dev` |

### 步骤 5：保存并部署

点击 **Save and Deploy**

✅ **完成！** Cloudflare 会自动：
- 从 GitHub 拉取代码
- 自动构建
- 部署到全球 CDN
- 每次 push 自动更新

---

## 方式 2：GitHub Actions 自动部署

### 配置 Secrets

1. 获取 [Cloudflare API Token](https://dash.cloudflare.com/profile/api-tokens)
2. 在 GitHub 仓库设置中添加 secrets：
   - 访问：https://github.com/Hjjjkh/sweetspace/settings/secrets/actions
   - 添加 `CLOUDFLARE_API_TOKEN`

### 自动部署

配置完成后，每次 push 到 main 分支都会自动部署！

```
Git Push → GitHub Actions → Cloudflare Deploy → ✅
```

---

## 方式 3：手动一键部署

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Hjjjkh/sweetspace/main/scripts/one-click-deploy.sh)"
```

---

## 📋 部署检查清单

- [ ] Cloudflare Pages 已连接 GitHub
- [ ] Worker 已部署
- [ ] D1 数据库已创建并初始化
- [ ] R2 存储桶已创建
- [ ] Cron 定时任务已配置
- [ ] Cloudflare Access 已配置（2 个邮箱）

---

## 🔗 相关链接

- **Dashboard**: https://dash.cloudflare.com/
- **Pages**: https://dash.cloudflare.com/?to=/:account/workers-and-pages/pages
- **Workers**: https://dash.cloudflare.com/?to=/:account/workers
- **D1**: https://dash.cloudflare.com/?to=/:account/d1
- **R2**: https://dash.cloudflare.com/?to=/:account/r2
- **Access**: https://one.dash.cloudflare.com/

---

## 📊 部署架构

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │ Push
       ▼
┌─────────────────────┐
│  Cloudflare Pages   │
│   (前端自动部署)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Cloudflare Worker  │
│   (后端 API)         │
└──────────┬──────────┘
           │
      ┌────┴────┐
      ▼         ▼
┌──────────┐  ┌──────┐
│   D1     │  │  R2  │
│ (数据库) │  │(存储)│
└──────────┘  └──────┘
```

---

## 🎯 最简流程

**只需 3 步：**

1. Cloudflare Pages 连接 GitHub 仓库
2. 部署 Worker 和数据库
3. 配置 Access 权限

**后续：Push 到 GitHub 自动部署！**

---

## 💡 提示

- 前端部署到 Pages：**自动 CDN 分发**
- 后端部署到 Workers：**边缘计算**
- 数据库使用 D1：**全球同步**
- 存储使用 R2：**零出口费**

全部使用 Cloudflare 免费套餐！**$0/月** 🎉
