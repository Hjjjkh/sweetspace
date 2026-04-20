# AI 功能部署指南

## 🎉 AI 功能已完成集成

Love Space 现已支持以下 AI 功能：

| 功能 | 说明 | API 端点 |
|------|------|----------|
| **AI 情感助手** | 情绪分析、关系洞察、矛盾调解 | `/api/ai/analyze-mood` |
| **AI 照片故事** | 照片描述、标签生成、浪漫短诗 | `/api/ai/generate-photo-desc` |
| **AI 留言助手** | 留言润色、多风格建议、节日祝福 | `/api/ai/polish-message` |
| **AI 约会策划** | 约会推荐、纪念日方案 | `/api/ai/plan-date` |
| **AI 对话启动器** | 智能话题生成 | `/api/ai/generate-topic` |
| **关系周报** | 每周关系洞察报告 | `/api/ai/relationship-insight` |

---

## 🚀 部署步骤

### 1. 数据库迁移

首先执行数据库迁移，添加 AI 相关的表：

```bash
cd worker
npx wrangler d1 execute love-space-db --file=./migrations/ai-features.sql
```

生产环境：
```bash
npx wrangler d1 execute love-space-db --remote --file=./migrations/ai-features.sql
```

### 2. 验证环境变量

Wrangler 配置已包含 AI 环境变量（`worker/wrangler.toml`）：

```toml
[vars]
OPENROUTER_API_KEY = "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"
AI_MODEL = "openrouter/elephant-alpha"
AI_RATE_LIMIT = "100"
AI_CACHE_DAYS = "30"
AI_TIMEOUT_MS = "30000"
```

### 3. 部署 Worker

```bash
cd worker
npm install  # 安装新增的 crypto-hash 依赖
npm run deploy
```

### 4. 部署 Frontend

```bash
cd frontend
npm install
npm run build
```

前端会自动通过 GitHub Actions 部署到 Cloudflare Pages。

---

## 📊 访问 AI 设置页面

部署完成后，访问 AI 设置页面查看使用情况：

```
https://love-space.pages.dev/ai-settings
```

功能：
- 查看今日 AI 使用量（100 次/天）
- 查看缓存大小
- 清除所有 AI 缓存

---

## 🧪 测试 AI 功能

### 使用 curl 测试

**情感分析测试：**
```bash
curl -X POST https://sweetspace.248851185.workers.dev/api/ai/analyze-mood \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Jwt-Assertion: $JWT" \
  -d '{"days": 7, "moodData": [{"date": "2026-04-20", "type": "happy", "score": 8}]}'
```

**照片描述测试：**
```bash
curl -X POST https://sweetspace.248851185.workers.dev/api/ai/generate-photo-desc \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Jwt-Assertion: $JWT" \
  -d '{"filename": "photo_123.jpg", "existingTags": []}'
```

**使用量查询：**
```bash
curl https://sweetspace.248851185.workers.dev/api/ai/usage \
  -H "Cf-Access-Jwt-Assertion: $JWT"
```

### 前端测试

1. 访问 **心情日记** 页面
2. 点击 "AI 情感分析" 按钮
3. 等待 AI 生成分析报告

---

## ⚙️ 配置说明

### API 模型

当前使用：**openrouter/elephant-alpha**

如需更换模型，修改 `wrangler.toml`：

```toml
AI_MODEL = "meta-llama/llama-3-8b-instruct:free"
```

支持的免费模型：
- `meta-llama/llama-3-8b-instruct:free`
- `google/gemma-7b-it:free`
- `mistralai/mistral-7b-instruct:free`

### 限流设置

默认：**100 次/用户/天**

调整限流：
```toml
AI_RATE_LIMIT = "50"  # 改为 50 次/天
```

### 缓存设置

默认：**30 天**

调整缓存过期时间：
```toml
AI_CACHE_DAYS = "7"  # 改为 7 天
```

---

## 📈 监控和日志

### 查看 Worker 日志

```bash
npx wrangler tail
```

### 监控指标

访问 Cloudflare Dashboard：
1. 进入 Worker 页面
2. 查看 Analytics
3. 监控 AI 端点的请求量和错误率

---

## 🔧 故障排除

### 问题：AI 功能不工作

**检查清单：**
- [ ] OPENROUTER_API_KEY 是否正确配置
- [ ] 数据库迁移是否执行成功
- [ ] Worker 是否重新部署
- [ ] 查看 Worker 日志中的错误信息

**验证 API Key：**
```bash
curl https://openrouter.ai/api/v1/keys \
  -H "Authorization: Bearer sk-or-v1-xxx"
```

### 问题：缓存命中率低

**可能原因：**
- request_hash 计算不一致
- 缓存已过期
- 不同用户之间的缓存不共享（预期行为）

**调试查询：**
```sql
SELECT 
  request_type, 
  COUNT(*) as count,
  AVG(expires_at - created_at) / 86400 as avg_cache_days
FROM ai_responses
GROUP BY request_type;
```

### 问题：API 超时

**解决方案：**
1. 增加超时时间：
   ```toml
   AI_TIMEOUT_MS = "60000"  # 改为 60 秒
   ```

2. 减少 prompt 长度
3. 降低 max_tokens 设置

---

## 🔒 隐私和安全

- ✅ 所有 AI 调用通过后端代理，不暴露 API Key
- ✅ 留言润色内容不保存到数据库（隐私保护）
- ✅ 用户只能访问自己的 AI 数据
- ✅ 缓存数据 30 天后自动清理
- ✅ 提供"清除 AI 缓存"功能

---

## 📚 相关文档

- [AI 集成指南](./AI_INTEGRATION_GUIDE.md) - 详细的集成说明
- [设计规范](./.monkeycode/specs/ai-features-integration/design.md) - 技术设计文档
- [需求文档](./.monkeycode/specs/ai-features-integration/requirements.md) - 功能需求

---

## 🎯 下一步

1. ✅ 执行数据库迁移
2. ✅ 部署 Worker 和 Frontend
3. ✅ 测试 AI 功能
4. ⏳ 在各页面中集成 AI 按钮（可选）

集成示例请参考 [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md)
