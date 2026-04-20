# Love Space - 快速部署检查清单

## ✅ 部署前检查

### 1. GitHub 配置

- [ ] 已创建 GitHub 仓库
- [ ] 代码已推送到 main/master 分支
- [ ] GitHub Actions 已启用
- [ ] 已配置 GitHub Secrets:
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`

### 2. Cloudflare 配置

- [ ] Cloudflare 账号已登录
- [ ] 已创建 API Token (权限：Pages + Workers + D1 + R2)
- [ ] 已获取 Account ID

### 3. Cloudflare 资源

- [ ] **D1 数据库**:
  - 名称：`love-space-db`
  - 记录 `database_id`
  - 更新 `worker/wrangler.toml`

- [ ] **Worker**:
  - 创建 Worker: `sweetspace`
  - 确认 `worker/wrangler.jsonc` 配置正确

- [ ] **Pages**:
  - 创建 Pages 项目：`love-space`
  - 连接到 GitHub 仓库
  - 或手动部署

- [ ] **R2 存储桶** (可选 - 相册功能):
  - 名称：`love-space-photos`

- [ ] **Access 应用** (可选 - 权限控制):
  - 创建 Access Application
  - 添加两个邮箱到 Policy

### 4. 代码配置更新

- [ ] 更新 `worker/wrangler.toml`:
  ```toml
  [[d1_databases]]
  binding = "DB"
  database_name = "love-space-db"
  database_id = "你的 database_id"
  ```

- [ ] 更新 `frontend/public/_redirects`:
  ```
  /api/*  https://sweetspace.<subdomain>.workers.dev/api/:splat  200
  ```

- [ ] 确认 `frontend/vite.config.js`:
  ```javascript
  proxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true
    }
  }
  ```

---

## 🚀 部署流程

### 方法 A: GitHub Actions 自动部署 (推荐)

```bash
# 1. 提交代码
cd /workspace/love-space
git add .
git commit -m "deploy: v2.0 UI update"
git push origin main

# 2. 等待 GitHub Actions 完成
# 访问：https://github.com/Hjjjkh/sweetspace/actions

# 3. 检查部署结果
# - Frontend: https://love-space.pages.dev
# - Worker: https://sweetspace.248851185.workers.dev
```

### 方法 B: 本地手动部署

```bash
# 1. 安装依赖
npm run install:all

# 2. 初始化数据库
cd worker
npx wrangler d1 execute love-space-db --file=./schema.sql --remote

# 3. 部署 Worker
npx wrangler deploy

# 4. 部署前端
cd ../frontend
npm run build
npx wrangler pages deploy dist --project-name=love-space

# 5. 验证部署
# 访问 Pages URL 查看前端
# 访问 Worker URL 测试 API
```

---

## 🔍 验证部署

### 1. 健康检查

```bash
# 测试 Worker API
curl https://sweetspace.248851185.workers.dev/api/health

# 预期返回：
# { "success": true, "status": "ok" }
```

### 2. 前端访问

- 访问：https://love-space.pages.dev
- 应该看到初始化页面
- 检查控制台无错误

### 3. 数据库检查

```bash
# 查看表是否创建成功
npx wrangler d1 execute love-space-db --remote \
  --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### 4. 查看日志

```bash
# Worker 实时日志
npx wrangler tail

# GitHub Actions 日志
# 访问 Actions → 查看最新部署的日志
```

---

## ⚠️ 常见问题排查

### 问题 1: GitHub Actions 失败

**错误**: `Error: Cloudflare API token is invalid`

**解决**:
1. Cloudflare Dashboard → My Profile → API Tokens
2. 重新创建 Token
3. 更新 GitHub Secrets

### 问题 2: Worker 部署失败

**错误**: `Error: Database binding not found`

**解决**:
```bash
# 检查 wrangler.toml 配置
cat worker/wrangler.toml

# 确认 database_id 正确
# 重新部署
cd worker
npx wrangler deploy
```

### 问题 3: 前端无法访问 API

**错误**: `Network Error` 或 `404 Not Found`

**解决**:
1. 检查 `frontend/public/_redirects`
2. 确认 Worker URL 正确
3. 清除浏览器缓存

### 问题 4: 数据库初始化失败

**错误**: `Error: Database already exists`

**解决**:
```bash
# 检查是否已初始化
npx wrangler d1 execute love-space-db --remote \
  --command "SELECT * FROM users LIMIT 1"

# 如果需要重置 (谨慎操作!)
# npx wrangler d1 execute love-space-db --remote \
#   --command "DROP TABLE IF EXISTS users; DELETE FROM sqlite_sequence"
```

---

## 📱 部署后的 URLs

- **Frontend (Pages)**: https://love-space.pages.dev
- **Worker API**: https://sweetspace.248851185.workers.dev
- **API 端点**: https://sweetspace.248851185.workers.dev/api/*

---

## 🎯 下一步

1. **初始化系统**
   - 访问 Frontend URL
   - 填写初始化表单 (你的邮箱、昵称、伴侣的邮箱、昵称)

2. **配置 Access (可选)**
   - 进入 Cloudflare Zero Trust Dashboard
   - Access → Applications
   - 添加 Policy 限制仅两人访问

3. **开始使用**
   - 记录第一条回忆
   - 发送第一条留言
   - 记录第一次心情

---

## 📞 获取帮助

- 查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 完整部署指南
- 查看 [README.md](./README.md) 项目说明
- GitHub Issues: https://github.com/Hjjjkh/sweetspace/issues

---

**更新日期**: 2026-04-20  
**版本**: v2.0.0
