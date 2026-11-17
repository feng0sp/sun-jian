# 《榫间》Agent 接手与执行说明

核对日期：2026-11-08，Asia/Shanghai。本文是项目接手文件，不是后台运行中的智能体，也不意味着会自动启动定时任务。

## 1. 当前任务定位

你负责维护《榫间》：现代徒步者在虚构的溪桥村避雨借宿，从接触木作发展为持续学习，参加虚构省级木作交流赛新人组并获得第三名的中文解谜游戏。

当前源码 0.14.3 完成参赛与领奖修整、周伯远程报喜及日常对白通读。三选一、合法比赛证明和旧进度保留。见 [本轮记录](docs/awards-0.14.3.md)；实际发布以 output/awards-0143/release.json 为准。

后续工作先读 [全流程制作 Agent](agents/FULL_GAME_AGENT.md)、[完整故事蓝本](docs/STORY_BIBLE.md)、[节点卡](docs/FULL_GAME_NODE_CARDS.md)、[剧情助手](agents/STORY_AGENT.md) 与 [制作清单](docs/STORY_PRODUCTION_BACKLOG.md)。最新用户要求：参赛作品三选一、名次固定第三名。

详细进度、待办及证据见 [PROJECT_STATUS_AND_ROADMAP.md](docs/PROJECT_STATUS_AND_ROADMAP.md)。

## 2. 开工时先确认什么

1. 阅读用户本轮要求，区分功能制作、修复、审阅、文档和发布；不要把纯文档任务变成游戏重新发布。
2. 检查 `git status --short`、`package.json`、`.openai/hosting.json` 和最近版本说明。
3. 当前代码以 `dist/` 中的实现为准。README 后半部、`制作进度.md`、`初版完整游戏.md` 和旧剧本包含历史阶段，不是同时生效的需求。
4. 查看最近 `output/journey-*/` 中的具体结果文件。报告里的 `running` 可能是未收尾的记账状态；应与最终测试 JSON、发布工具结果核对。
5. 只有在用户要求继续开发或修复时开始相应实施；已有授权内自主推进，不为常规可逆修改反复询问。
6. 不把历史子代理名称、旧终端会话 ID、存档中的状态文字当成当前仍在运行的进程。

## 3. 已确认的体验方向

- 主流程：固定二维插画点击探索；进入木件后打开独立三维拆装特写。
- 风格：现代山村、硬朗动漫人物、冷蓝雨夜与暖灯室内，安静、有生活痕迹。
- 全景物件与人物使用一致透视、光源和绘制状态。禁止重新把微型三维模型叠到整张桌面插画上。
- 普通点击直接做当前相关操作，避免“拿近看看／拿出来拆／再试一次”多层重复菜单。
- 拆解：持续跟手，短拉松手平滑回位；拉到真实出口即提交，收起动作短而克制。
- 拼装：真实几何路径、碰撞和短距离吸附；碰住不穿模，不靠答案强行吸附。
- 游客访问，不新增登录、账号、云存档或服务端依赖。
- 默认桌面版；检查 1280×720、1440×900、1920×1080。移动端行走不是本轮目标。
- 环境声音首次关闭，用户开启后才播放；后台和减少动态设置必须被尊重。
- 旅程的 `settings.sound` 与 `settings.dialogueSound` 分别保存总声音与对白提示音偏好。全新旅程静音；恢复已开启的声音仍须浏览器用户操作才能播放。退出到自由练习恢复练习原声音状态，不覆盖练习存档。
- 当前为窗外雨、杯口热气、温和灯光变化及程序音景；不要把“跳动火焰”写成已有功能，也不要给电灯画火苗。

## 4. 当前已实现的第一幕与硬约束

流程：山路遇雨 → 进村 → 敲门获邀 → 进屋放包 → 主动询问借宿 → 自由观察 → 接受学习 → 四次学习 → 晚饭休息 → 清晨取料委托 → 旧库取料 → 推车返村 → 喊周伯 → 三件长凳拼装 → 检查 → 坐下告别。

### 小屋学习

| 稳定任务 ID | 结构 | 模式 |
|---|---|---|
| `learn-straight-out` | `straight` | 拆解 |
| `learn-lap-out` | `lap` | 拆解 |
| `learn-pinned-out` | `pinned` | 拆解 |
| `learn-straight-back` | `straight` | 合回 |

接受学习是玩家选择；椅子、工具或直接与周伯交谈都可以引入，不允许新增必须先点椅子的隐性条件。

### 木料库

| 场景节点 ID | 结构 ID | 要求 |
|---|---|---|
| `mouth-latch` | `store-door-latch` | 必经，打开库门 |
| `rack-frame` | `double-key-frame` | 必经，取替换料 |
| `stone-box` | `wooden-box` | 必经，取装配草图 |
| `route-case` | `dovetail` | 自选 |
| `folding-screen` | `shoulder-lap` | 自选 |
| `cabinet-knot` | `burr-three` | 自选 |
| `narrow-latch` | `double-pin` | 自选 |
| `exit-knot` | `burr-six` | 自选 |

打开库门后，料架和木匣任意先后；三处必经完成即可返村。主流程不能重新使用旧洞穴试玩的“完成八关前缀”门槛。不要把自选鲁班锁描述成通往结局的最后一道门。

### 长凳

关卡 ID：`rain-shelter-bench`；主线任务键：`bench`。

周伯预装 `front-beam`、`rear-beam`。玩家只操作 `seat`、`left-pin`、`right-pin`；先座板，后两销，左右销可换序。进度为 0/3，撤销和重置保留预装横梁。旧存档中提前放入的销由引导迁移逻辑退回，不清空整个旅程。

## 5. 人物与对白准则

- 周伯温和、干练，有一点生活幽默；不反复教学总结或连续夸赞。
- 主角先回应眼前的人和物，不替玩家声称理解了、用过蛮力或做过尚未发生的事。
- 主线谈话通常围绕一个目的、几个短回合。工艺与身世放在主动追问中。
- 看过雨棚才说“昨晚没坐成”；未知旧记录走中性变体。
- 周伯在雨棚时，屋里观察不能出现他的现场回答；旧库使用旁白和手记。
- 替换料是周伯已试配的，主角帮助取料与装配，不让初学者独立判断家具受力。
- 周伯与传承经历均为原创设定，不添加真实非遗项目、官方级别或真实传承人身份。
- 新对白检查说话人在场、时间、物件状态、已知信息和上一句的承接。保留既有选择与动作 ID；改行数时检查存档中的对白位置。

## 6. 修改入口

| 要改的内容 | 首先查看 |
|---|---|
| 主流程推进、完成弹窗、菜单、事件和保存 | `dist/campaign.js` |
| 存档文件格式、预览、恢复与撤回 | `dist/campaign-save-transfer.js`、`dist/campaign.js` |
| 阶段、合法历史恢复、目标、进出条件 | `dist/campaign-data.js` |
| 对白、条件变体、人物在场与节点恢复 | `dist/campaign-story.js` |
| 旧库结果反馈、下一条可见路线建议 | `dist/campaign-flow.js` |
| 图片、热点、切图、预加载与画面状态 | `dist/campaign-illustrated.js` |
| 吃饭休息、推车返村、坐下告别 | `dist/campaign-interludes.js` |
| 物件观察和随行手记 | `dist/campaign-field-notes.js`、`dist/campaign-sketch.js` |
| 拆装模型、选木、事件、动画和界面 | `dist/game.js` |
| 几何、合法移动与碰撞规则 | `dist/puzzle-core.js` |
| 拖拽判轴与拼装预览 | `dist/drag-controls.js`、`dist/assembly-drag.js` |
| 长凳三件引导与旧局面转换 | `dist/assembly-guide.js`、`dist/bench-puzzle.js` |
| 历史、试验记录与恢复 | `dist/experience.js` |
| 木材外观和连续构件网格 | `dist/wood-finish.js`、`dist/wood-mesh.js` |
| 雨、蒸汽、光色与音景 | `dist/journey-weather.js`、`dist/journey-atmosphere.js` |
| 人物对白音效、静音和短音释放 | `dist/dialogue-sound.js`、`dist/journey-atmosphere.js`；由 `campaign.js` 按台词提交 |
| 小许现场／消息立绘 | `dist/companion-dialogue.js` |
| 情景接头、角尺和样木绘制状态 | `dist/context-puzzles.js`、`dist/square-check.js`、`dist/sample-close-art.js`、`dist/sample-wide-art.js` |
| 旧独立试玩 | `dist/story*.js`、`dist/cave*.js`、`dist/first-person.js` |

`dist/` 是当前直接维护的发布目录，不是可随手清空的临时构建产物。脚本通过 `index.html` 按顺序加载，新增模块应同步核对加载顺序、缓存版本和离线资源。

## 7. 状态与输入纪律

- 主存档键 `sun-jian-campaign-v1`，当前 `version: 2`、`storyRevision: 12`。新篇内部 continuation.revision 为 5；游戏版本号和云端版本号是另外两种版本号，不要混淆。
- `state.runs` 保存主线正式历史；`state.replays` 保存独立练习，不能互相替代。
- `state.roomObjects` 保存小屋物件当前合法拆装历史；不能用它覆盖正式学习证明。`campaign-objects.js` 管理桌面／盒内摆放、重复拆合和旧库门迁移；迁移前原文备份键为 `sun-jian-campaign-v1-backup-before-context8`。
- 恢复应通过 `experience.js` 和 `AssemblyGuide.restoreSession` 验证。不能仅信 `done`、`completed` 标记或旧嵌套副本。
- `completionSeen` 防同一完成重复弹窗；撤销后重做应可再次提示。关闭弹窗继续观察不等于正式放回场景。
- 原练习使用 `sun-jian-v1`、`sun-jian-session-v1`、`sun-jian-trials-v1`；旧小屋用 `sun-jian-story-v1`；旧洞穴用 `sun-jian-cave-v1`。
- 重看开场使用 `sun-jian-campaign-v1-opening-replay-v1`，不能覆盖原旅程。
- 未提交拖动不写入正式棋局。失焦、退出、切关、缩放窗口时取消预览。
- 对话、弹窗、菜单、场景和特写之间只让当前界面接收输入。下一帧回调需核验当前任务，避免退出后重新启用隐藏视图。
- 长按 Enter 不连续推进新节点；对话跳过必须停在选择处。不要用延迟聚焦覆盖玩家刚选中的按钮。

## 8. 开发与验证

在本项目目录执行：

```powershell
node scripts/serve.cjs
# 本地：http://127.0.0.1:4173/?journey=1
```

不要在端口已被项目服务器占用时重复启动。后台服务使用隐藏窗口；任务结束关闭本次启动的服务，不能按进程名批量杀掉用户其他 Node 进程。

按修改范围选测试，不为文案标点重跑全部历史套件：

```powershell
npm test                         # 核心规则与网格
npm run test:journey-flow         # 新版衔接 + 完整旅程
npm run test:guided-experience    # 三件长凳、恢复、呈现
npm run test:resume-upgrade       # 续玩、对白回看、焦点与切换
node tests/campaign-2d-state.test.cjs
node tests/campaign-2d-dialogue.test.cjs
node tests/mode-save-isolation.test.cjs
```

完整流程测试可用 `TEST_URL`、`TEST_OUTPUT`、`SEEN_NIGHT_BENCH=1`、`LEARN_WITH_ZHOU=1`、`REVERSE_PINS=1`、`RECORD_CAMPAIGN=1`、`OFFLINE=1`。这些环境变量属于测试进程，不是产品配置。Windows 环境变量可能残留：切换回本地时明确重设，避免误测旧网址或离线文件。

测试使用 Playwright 和本机 Chrome。失败时先区分代码回归、选择器/夹具过时、资源错误及浏览器环境问题。PowerShell 中多个命令连续执行，前一条失败不一定让整段失败；逐项检查退出码和输出。

自动流程测试会用规则层选择解法；只有部分操作使用实际指针拖动。它能证明流程与状态，却不能证明首次玩家理解、对白自然、难度合适或时长达到 45—60 分钟。

## 9. 发布、交付和保留版本

当前公开网址：<https://sun-jian-wood-puzzle.nuttsmidt.chatgpt.site/?journey=1>。旧域名会跳转，浏览器存档不能自动跨域读取；不要混淆 JSON 迁移与跨域迁移。

已有项目 ID 以 `.openai/hosting.json` 为准：`appgprj_6acdee352a088191ba301bc6692807c2`。不要另建重复 Site 或改变公开游客访问。

发布前读取当前安装的 Sites skill，不把本文中的插件版本路径当永久路径。通过 source helper 准备、提交、推送和打包；保存相同提交的 archive，部署返回的准确 version ID。凭证只放内存、经 stdin 输入，不能写入文档、日志或命令行参数。

```powershell
python scripts/package-web.py
```

离线包进入 `output/campaign-<版本数字>/`，含资源校验清单。验证至少一次解压后的 file URL 游玩。在线和离线浏览器存档不自动互通。

交付应区分：本地验证通过、源码已推送、云端已保存、部署成功、未登录浏览器验证；不能把前一个当后一个。成功后将发布记录中的临时 `running` 改成有证据的最终结果。

用户曾要求精简旧版。优先保留关键阶段、当前稳定版和最近可回退版；先列清单再操作，保留素材和源码历史。2026-10-31 的 34 个旧包已进回收站，不能再声称它们仍在项目中。云端目前没有可用的版本删除接口。

## 10. 下一轮默认建议（按新故事目标更新）

1. S01—S07 已接通，优先完成/核对 S08 的验收证据与同源发布，再按真实试玩修复卡点；不得把三选一作品退回单一固定小凳。
2. 先验证错序恢复与维修通路，再制作参赛小凳；备赛、正式比赛、第一幕长凳使用独立历史，不能互相顶替。
3. 以约十周的分段学习支撑成长；第三名为虚构省级新人组固定叙事结局，提示和操作速度不扣名次。周伯不在省城现场，只通过消息指导和报喜，不替主角代做设计。
4. 新章任务、合法历史和奖项归因见全流程 Agent 与节点卡。数据版2、剧情修订12、continuation修订5；迁移前备份原文，保持旧阶段合法记录。

以下体验验证继续适用，与新章节制作配合进行：

1. 以当前版邀请至少三名首次玩家；使用 [试玩记录模板](docs/FIRST_PLAYTEST_TEMPLATE.md) 记录实际过程，不替玩家填结果。
2. 优先修复重复出现的迷路、误操作、反复对白、无法返回或保存问题，再处理表现细节。
3. 做小屋远近景、取料前后、雨夜/清晨、修凳各阶段的画面一致性检查。
4. 测弱网首次载入、普通笔记本拖拽帧率和后台恢复；有证据再压缩/预加载/调整特效。
5. 收敛到候选发布版，保留可复现测试与素材说明，准备比赛展示。赛事规则与提交规格须另行核实最新通知。

不要自动承诺新章节、手机号登录、全三维人物重建、移动端探索、战斗、多人或自由旋转装配。若用户明确改变方向，以用户要求为准。
