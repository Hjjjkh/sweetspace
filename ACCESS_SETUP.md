# Cloudflare Access 配置指南

## 概述

Cloudflare Access 用于限制网站仅允许两个指定用户访问，确保私密性。

---

## 配置步骤

### 1. 创建 Cloudflare Zero Trust 账号

1. 访问 https://one.dash.cloudflare.com/
2. 使用邮箱注册 (免费套餐支持最多 50 用户)
3. 验证邮箱

### 2. 添加自定义域名 (可选但推荐)

如果使用自定义域名:

1. 在 Cloudflare DNS 添加记录:
   ```
   Type: CNAME
   Name: love
   Target: your-project.pages.dev
   Proxy: Enabled
   ```

如果使用 Pages 默认域名，跳过此步。

### 3. 创建 Access Application

#### 方式 A: 通过 Dashboard

1. 进入 **Zero Trust Dashboard** > **Access** > **Applications**
2. 点击 **Add an application**
3. 选择 **Self-hosted**
4. 配置基本信息:
   ```
   Name: love-space
   Type: Self-hosted
   Domain: your-project.pages.dev (或自定义域名)
   Session Duration: 12h (或根据需要)
   ```
5. 点击 **Next**

#### 配置访问策略 (Policy)

1. 点击 **Configure rules**
2. 添加第一条规则:
   ```
   Policy name: Owner Access
   Action: Allow
   Configure rules:
     - Field: Email
     - Operator: Equals
     - Value: your-email@example.com
   ```
3. 添加第二条规则:
   ```
   Policy name: Partner Access
   Action: Allow
   Configure rules:
     - Field: Email
     - Operator: Equals
     - Value: partner-email@example.com
   ```
4. 点击 **Add policy**

#### 方式 B: 通过 wrangler CLI

```bash
# 登录
npx wrangler login

# 创建 Access 应用 (需要 Advanced API Token)
curl -X POST "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/access/apps" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "love-space",
    "domain": "your-project.pages.dev",
    "type": "self_hosted",
    "policies": [
      {
        "name": "Owner Access",
        "decision": "allow",
        "include": [{ "email": { "email": "your-email@example.com" } }]
      },
      {
        "name": "Partner Access",
        "decision": "allow",
        "include": [{ "email": { "email": "partner-email@example.com" } }]
      }
    ]
  }'
```

### 4. 测试访问控制

1. 打开隐私窗口
2. 访问 `https://your-project.pages.dev`
3. 应该看到 Cloudflare Access 登录页面
4. 输入已授权的邮箱
5. 收到验证码邮件
6. 输入验证码
7. 成功访问网站

### 5. 管理访问权限

#### 添加新设备

用户在新设备上访问时，需要重新验证邮箱。

#### 撤销访问权限

1. 进入 Access > Applications
2. 选择 `love-space`
3. 编辑 Policy
4. 删除或修改对应的邮箱规则

#### 查看访问日志

1. 进入 **Access** > **Logs**
2. 过滤应用：`love-space`
3. 查看谁在何时访问了网站

---

## 高级配置

### 多因素认证 (MFA)

强制要求 MFA:

1. Access > Applications > your-app
2. Settings > MFA
3. 设置为 **Required**

### 会话管理

调整会话时长:

```yaml
Session Duration: 12h (默认)
# 可选值：1h, 6h, 12h, 24h, 168h (7 天)
```

### 自动重定向

配置 Access 失败后重定向:

```yaml
Auto redirect to identity provider: true
```

---

## 常见问题

### Q: 用户收不到验证码怎么办？

A: 检查:
1. 垃圾邮件文件夹
2. 邮箱地址是否正确
3. Cloudflare 邮件发送状态 (Logs > Email)

### Q: 如何添加第三个用户？

A: 添加新的 Policy 规则:
1. Access > Applications > love-space > Settings > Policy
2. Add another rule
3. 添加新的邮箱

### Q: 自定义域名如何配置？

A: 
1. 在 Cloudflare DNS 添加 CNAME 记录
2. 在 Pages 设置中绑定域名
3. 更新 Access Application 的 Domain 设置

### Q: Access 会收费吗？

A: 免费套餐:
- 最多 50 用户
- 包含所有核心功能
- 对于情侣 2 人使用完全免费

---

## 安全最佳实践

1. **定期审查访问日志** - 每月检查一次
2. **启用 MFA** - 增加安全性
3. **使用私密邮箱** - 不要用公开邮箱
4. **定期更换密钥** - 如有泄露风险
5. **监控异常登录** - 启用邮件通知

---

## 故障排除

### 问题：访问时显示 403 Forbidden

**原因**: 邮箱未在 Policy 中授权

**解决**:
1. 检查 Access Application 配置
2. 确认邮箱地址完全匹配
3. 保存后等待 1-2 分钟生效

### 问题：一直要求验证，无法登录

**原因**: Cookie 被阻止或 Session 配置问题

**解决**:
1. 清除浏览器缓存
2. 检查Cookie 设置
3. 增加 Session Duration

### 问题：移动端无法正常访问

**解决**:
1. 使用系统浏览器 (Safari/Chrome)
2. 不要使用 APP 内浏览器
3. 尝试"在浏览器中打开"

---

## 资源链接

- [Cloudflare Access 文档](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Zero Trust 定价](https://www.cloudflare.com/plans/zero-trust/)
- [Access API 参考](https://developers.cloudflare.com/api/operations/cloudflare-zero-trust-access-service-create-service-token)

---

**配置完成后，你的私密空间就完全安全了！🔒💕**
