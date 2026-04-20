# 🚀 10 分钟快速部署指南

## 开始之前

确保你已准备好:
- ✅ Cloudflare 账号 (免费)
- ✅ 基本的命令行知识
- ✅ Node.js 16+ 环境

---

## 快速部署 (5 步走)

### Step 1: Fork 项目并克隆

```bash
# 在 GitHub 上 Fork 此项目
# 然后克隆到本地
git clone https://github.com/YOUR_USERNAME/love-space.git
cd love-space
```

### Step 2: 安装依赖

```bash
# 安装全局工具
npm install -g wrangler

# 安装项目依赖
npm install
cd worker && npm install
cd ../frontend && npm install
cd ..
```

### Step 3: 登录 Cloudflare

```bash
wrangler login
# 会自动打开浏览器，按提示授权
```

### Step 4: 运行一键部署脚本

```bash
# 执行部署脚本
bash scripts/deploy.sh
```

脚本会自动完成:
- ✅ 创建 D1 数据库
- ✅ 创建 R2 存储桶
- ✅ 初始化数据库表结构
- ✅ 部署后端 Worker
- ✅ 部署前端 Pages

### Step 5: 配置 Access 权限

1. 访问 https://one.dash.cloudflare.com/
2. 进入 **Access** > **Applications**
3. 找到 `love-space` 应用
4. 点击 **Configure rules**
5. 添加两条规则:
   - Rule 1: Email = 你的邮箱
   - Rule 2: Email = 伴侣的邮箱
6. 保存

---

## 验证部署

### 访问网站

1. 找到部署 URL:
   ```bash
   # 查看 Pages 部署的 URL
   wrangler pages project list
   # 或访问 https://love-space.<your-subdomain>.pages.dev
   ```

2. 第一次访问会跳转到 Cloudflare Access 登录页

3. 输入你的邮箱，获取验证码

4. 验证通过后进入初始化页面

5. 填写你和伴侣的信息

6. 完成！开始使用你们的私密空间 💕

---

## 邀请你的伴侣

1. 将 Access 中配置的伴侣邮箱告诉 TA
2. 发送网站 URL 给 TA
3. TA 首次访问时使用该邮箱验证
4. 即可访问你们的私密空间

---

## 常见问题

### Q: 部署脚本执行失败？

**A:** 检查以下几点:
```bash
# 1. 确认已安装 Node.js 16+
node --version

# 2. 确认已登录 Cloudflare
wrangler whoami

# 3. 手动执行部署
cd worker && npm run deploy
cd ../frontend && npm run build
wrangler pages deploy dist
```

### Q: 数据库初始化失败？

**A:** 手动初始化:
```bash
cd worker
npx wrangler d1 execute love-space-db --file=schema.sql
```

### Q: 前端页面无法访问 API？

**A:** 检查 Vite 代理配置:
```javascript
// frontend/vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true
    }
  }
}
```

### Q: 本地开发如何测试？

**A:** 启动开发服务器:
```bash
# 终端1: Worker (端口 8787)
cd worker
npm run dev

# 终端 2: 前端 (端口 3000)
cd frontend
npm run dev
```

访问 `http://localhost:3000`

---

## 部署检查清单

- [ ] Cloudflare 账号已注册
- [ ] 已登录 wrangler
- [ ] D1 数据库已创建
- [ ] R2 存储桶已创建
- [ ] Worker 已部署成功
- [ ] Pages 已部署成功
- [ ] Access 应用已配置
- [ ] 访问策略已添加两个邮箱
- [ ] 网站可以正常访问
- [ ] 初始化表单已填写

---

## 成本说明

全部使用 Cloudflare 免费套餐:
- **Workers**: 100k 请求/天 ✅
- **Pages**: 无限访问 ✅
- **D1**: 5GB 存储 ✅
- **R2**: 10GB 存储 ✅
- **Access**: 50 用户 ✅

**总计成本: $0/月** 🎉

---

## 下一步

### 必做事项

1. **设置自定义域名 (可选)**
   ```
   Cloudflare DNS > Add record
   Type: CNAME
   Name: love (或@)
   Target: love-space.<subdomain>.pages.dev
   ```

2. **启用 Access MFA (推荐)**
   ```
   Access > Applications > love-space
   Settings > MFA > Required
   ```

3. **添加备用邮箱 (推荐)**
   在 Access Policy 中添加备用联

系方式

### 可选优化

1. 定制主题色彩
2. 添加更多每日问题
3. 上传头像图片
4. 配置邮件通知

---

## 获取帮助

1. 查看完整文档: `README.md`
2. Access 配置: `ACCESS_SETUP.md`
3. API 文档: `worker/API_DESIGN.md`
4. 提交 Issue

---

**部署成功，祝你们的爱情甜蜜美满！💕**
