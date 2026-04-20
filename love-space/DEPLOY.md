# 🚀 一键部署

## 方式 1：最简单（推荐）

```bash
# 复制粘贴这条命令，按回车即可
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Hjjjkh/sweetspace/main/scripts/one-click-deploy.sh)"
```

**流程：**
1. 自动打开浏览器登录 Cloudflare
2. 自动创建数据库和存储
3. 自动部署后端和前端
4. 完成！

---

## 方式 2：克隆后部署

```bash
git clone https://github.com/Hjjjkh/sweetspace.git
cd sweetspace
bash scripts/one-click-deploy.sh
```

---

## ⏱️ 部署时间

约 2-3 分钟

---

## ✅ 部署完成后

1. 访问：https://love-space.pages.dev
2. 配置 Cloudflare Access 权限（添加 2 个邮箱）
3. 开始使用！

---

## 📚 详细文档

- 完整文档：[README.md](README.md)
- 快速指南：[QUICK_START.md](QUICK_START.md)
- Access 配置：[ACCESS_SETUP.md](ACCESS_SETUP.md)
