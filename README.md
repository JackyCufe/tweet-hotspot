# 推文热点素材库

输入你的内容方向，自动抓取微博/抖音/Reddit热点，AI帮你找出适合结合的推文切入角度。

## 本地运行

```bash
cd ~/tweet-hotspot
node server.js
```

打开 http://localhost:8877

## 部署到 Cloudflare Pages

这个项目是纯静态前端+Node后端，需要改造成 Cloudflare Workers 才能部署。

运行以下命令查看部署指南：
```
cat DEPLOY.md
```
