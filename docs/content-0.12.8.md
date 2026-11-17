# 0.12.8 · 物件观察与装配草图

本轮开始于 2026-10-26 13:44:18（北京时间），按用户要求持续制作一小时。实际发布、线上验证及结束时间记录在本机 `output/content-0128/release.json`，不以测试的模拟时间代替工作时间。

## 玩家可见内容

### 屋里看见的小事

从旧椅的“看看接头”进入近景，可以点横枨入腿处、横枨两端、磨圆的座沿。工具挂板增加“走近工具角看看”，进入新绘制的近景，观察木刨、木角尺和试配余料。每处只有一段眼前描述和周伯的一句回应，玩家自行切换或收起，不连续派发新任务。

观察记录进入“随行手记 → 屋里看见的小事”。它们不计入结构完成度，不必找齐；重复观察不会重复记入。人物已到雨棚时，只保留物件描述，不出现周伯在屋里的回应。

横枨接头可对照直榫样件，检查方正可对照半榫，试配余料可引向穿销学习样件。这些是结构学习的联系，不宣称椅子、角尺或刨子本身采用了游戏中的全部具体构造。已学过的样件直接进入独立重练；尚未接受学习时只出现可拒绝的邀请。手记也提供三种样件的拆开与合回入口。重练不修改正式任务历史，返回后保留观察位置；刷新只保存已完成观察，不恢复临时展开的卡片。

### 草图真正用于对照

取得原有木匣草图后，可以点击图中甲乙丙丁戊，或下方五个构件按钮。选中件有浅青色轮廓和一条关于接面的位置说明。图形数据由 `scripts/create-bench-sketch.cjs` 从长凳规则几何生成，与原草图使用同一投影。

正式归位状态根据已校验的提交历史计算。打开草图先取消未提交拖动，再暂停操作；关闭恢复原棋局和焦点。撤销后再次看图，归位标记同步变化。查看和键盘选择不会提交木件、替玩家解谜或修改主线进度。图片失败时仍可阅读构件文字并重试。

### 人物与对白

- 修正无扶手旧椅的“扶手磨亮”为“座沿磨亮”。
- 工具重复观察不再无依据地声称玩家已经拿起并放回工具。
- 若玩家看过旧椅磨损处，雨棚的可选闲聊会接上“没坏的木头就留下”；没看过则沿用长凳供村民歇脚的原话题。重复交谈仍只有一句。
- 未增加强制对白、搜集门槛或真实非遗项目身份。人物、场所和经历为原创游戏设定。

## 美术与源文件

使用内置 imagegen，根据项目中的 `dist/assets/campaign-2d/room-table-night-0.webp` 风格参考生成独立工具近景。三个工具与桌面、接触阴影一起绘制，没有三维缩小模型叠在背景上。游戏使用本地 `dist/assets/campaign-2d/tools-detail.webp`（1672 × 941）。只进行格式转换，不使用脚本重绘图片。

生成原图保存在：

`C:/Users/13412/.codex/generated_images/01a1345e-70b7-7610-8fb8-543dc0b17c85/exec-e1fc207d-ecdc-4321-9e5b-94207607625a.png`

项目内原图副本：`artifacts/content-0128/tools-detail.png`。源图与游戏图均保留在本机；可部署资源随离线包打包。画面中的木刨为游戏美术表现，不作为特定地方或历史工具形制的考据图。

生成提示词原文：

> Generate a NEW original full-screen 16:9 desktop game background close-up, not a UI and not a collage. The attached image is STYLE/LOCATION REFERENCE only: this is a close view of Zhou's ordinary wooden workbench in the same modern Chinese mountain village home. Hard-edged refined anime background painting with convincing hand-drawn outlines and broad light planes, subtle worn wood grain, gentle warm-neutral lamp light, restrained contrast. Preserve the reference's grounded modern domestic woodshop mood. Camera at a comfortably high three-quarter angle looking down at a clear old wooden tabletop; no people, no hands, no visible window, no weather, no text, no symbols, no diagram or graphics. Composition for clickable observation points: on the LEFT THIRD, one intact traditional Chinese wooden hand plane with a dark iron blade held by a wooden wedge, sideways across the table so its wooden handle/body and blade assembly are recognizable; CENTER RIGHT, a simple wooden try square lying flat, right angle unmistakable, no ruler numbers; LOWER RIGHT, a short rectangular wood offcut with one clean freshly worked light edge and rough older grain on its broad face, plus two thin curled shavings near it. Objects separated, physically resting on the SAME desktop with contact shadows. Upper background soft and unobtrusive showing only the edge of the existing rear workbench and a few upright boards, no extra tools competing with the three focal objects. Leave ample lower-left empty tabletop for an in-game observation card. Scene should feel lived-in, quiet, warm, and beautiful as a game illustration, not photographic, not tiny toy furniture, not a 3D render. Output a single wide coherent image.

## 验证与范围

- `npm run test:field-content`：六处观察、旧存档、白名单、重复去重、重练隔离、刷新、无人在场的回应、主动接受/拒绝学习、键盘、三种桌面尺寸、图片失败重试、无 WebGL、可点选草图及撤销状态。
- `tests/campaign-2d.test.cjs`：新游客从借宿走到结局，三处必经操作即可通关；另外验证八处结构、取料/取图不同顺序及刷新。
- `tests/campaign-0124.test.cjs`：原观察与回放弹窗恢复、实际拖动、三尺寸草图、暂停、撤销、无 WebGL 和草图图片重试。
- `tests/campaign-2d-state.test.cjs`、`campaign-keyboard-talk.test.cjs`、`campaign-fallbacks-0125.test.cjs`：合法历史恢复、旧流程、键盘选择、存储不可用、图片重试及只在本机导出。
- 截图保存在 `output/content-0128/`，包含旧椅、工具角、手记及三种尺寸草图。离线包位于 `output/campaign-0128/`。
- 已解压离线包核对 140 个资源的 SHA-256，并在断网的 Chrome 中以 `file://` 打开：工具图片、观察记录续存、样件重练和草图对照均可使用。
- 短演示为 `output/content-0128/demo/objects-and-sketch.webm`；按功能切换测试局面，展示观察、拖动样件、手记和草图，不冒充完整旅程或首次玩家录像。

本轮由开发者通读与浏览器自动验证；没有招募新的首次玩家。自动通关证明流程和状态正确，不能作为对白自然度、乐趣或真实完成时长的评价。
