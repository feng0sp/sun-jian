# 展示版本验证

本记录对应 2026年11月17日整理的 GitHub 初始展示版本。源码快照及本次修正见 [来源说明](../CONTRIBUTIONS.md)。

## 已执行

以下 Node.js 检查均已通过：

- `tests/puzzle.test.cjs`：合法移动、提取方向、锁定顺序、装配恢复与碰撞相关规则。
- `tests/wood-mesh.test.cjs`：木件网格与榫卯开口相关检查。
- `tests/experience.test.cjs`：迁移、动作记录和恢复相关检查。
- `tests/campaign-2d-state.test.cjs`：故事状态、必经与自选结构、合法历史恢复。
- `tests/continuation-state.test.cjs`：续篇迁移、正式证明和分支前提；先修正了陈旧的固定版本号断言。

浏览器验证：

- 用新的 Chrome 上下文加载本地完整旅程入口，页面没有未捕获的 JavaScript 异常。
- `tests/mode-save-isolation.test.cjs` 通过，验证关闭旧页面不会覆盖较新的其他模式或旅程存档，当前旅程仍保存场景位置。
- `screenshots/overview.png` 为此次实际打开的游戏画面。
- 在另一端口运行本地预览服务，验证新增加的 `PORT` 配置可用。

## 验证边界

此次没有重跑所有历史测试，也没有重新发布 Sites、完成全部剧情人工试玩或邀请新玩家。规则和浏览器检查不能代替难度、对白、手感及首次玩家体验评价。

测试使用 Node.js 24 和本机 Chrome；GitHub Actions 使用 Node.js 22 执行核心与状态测试，结果以工作流实际运行记录为准。
