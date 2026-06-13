# EspPocker (Espresso Grooming Poker)

EspPocker 是一款现代化、支持实时协作的敏捷开发估算工具（Planning Poker）。致力于为团队在 Grooming 和 Sprint Planning 期间提供流畅、直观且充满乐趣的估算体验。

## ✨ 特性 (Features)

- **实时协作**：基于 Supabase 实现的极低延迟的实时投票与状态同步。
- **自定义牌组 (Point Deck)**：内置经典的斐波那契数列，同时支持自定义范围和步长的分数牌组。
- **角色区分**：支持作为核心估算者（Estimator）加入出牌，或作为旁观者（Observer）隐身参与。
- **动态共识效果**：当所有参与者达成完全一致的估算（Consensus）时，界面将触发专属的撒花动效 🎉。
- **极简且统一的领域模型**：经过严谨梳理的业务语言和术语边界。

## 🛠 技术栈 (Tech Stack)

- **前端框架**：[React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **样式方案**：[Tailwind CSS](https://tailwindcss.com/)
- **实时后端**：[Supabase](https://supabase.com/) (Realtime Database)
- **图标与动效**：Lucide React, canvas-confetti

## 📚 架构与文档 (Documentation)

本项目极度重视代码可读性与领域模型的清晰度。如果你是开发者，请务必在阅读代码前查阅以下文档：

- **领域术语表**：[CONTEXT.md](./CONTEXT.md) - 定义了诸如 `Grooming`, `Vote`, `Participant` 等核心业务实体的确切含义与上下文。
- **UI 组件图谱**：[UI_COMPONENT_MAP.md](./UI_COMPONENT_MAP.md) - 梳理了核心页面 `GroomingGate` 和深层组件 `ActiveGrooming` 的状态流转及职责边界。

## 🚀 本地运行 (Getting Started)

1. 克隆本仓库到本地。
2. 安装依赖：
   ```bash
   npm install
   ```
3. 配置环境变量：在根目录创建 `.env.local` 文件，并填入你的 Supabase 项目凭证（`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）。
4. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 📦 构建与发布 (Build & Lint)

- 检查代码规范：`npm run lint`
- 构建生产版本：`npm run build`
- 预览生产版本：`npm run preview`
