# SPMS-B2B

这是一个已经整理成 GitHub / Vercel 可部署格式的 React + Vite 网页项目。

## 当前状态

- 原始 UI 已迁移到 `src/App.jsx`，页面视觉不做改动。
- 已补齐 `package.json`、Vite、Tailwind、Vercel 配置。
- 已预留 Firebase Firestore 实时同步、Firebase Storage 图片上传、Google Apps Script 备份到 Google Sheets 的代码。
- 如果还没有配置 Firebase，网页会先使用浏览器本地存储，方便本地预览。

## 本地运行

```bash
npm install
npm run dev
```

## 打包检查

```bash
npm run build
```

## 文件说明

- `src/App.jsx`: 原网页 UI 和业务交互。
- `src/lib/portalStorage.js`: Firebase / Apps Script / 本地存储适配层。
- `.env.example`: Vercel 和本地 `.env` 需要填写的环境变量模板。
- `google-apps-script/Code.gs`: 复制到 Google Apps Script 的备份脚本。
- `docs/小白部署和数据同步教程.md`: GitHub、Vercel、Firebase、Apps Script 全流程教程。

## 重要提醒

为了让“所有人都能直接看到并修改同一份数据”，教程里提供的是公开读写规则。这样最简单，但不适合放真实敏感客户资料。正式商用前建议增加 Firebase Authentication 或后端权限校验。
