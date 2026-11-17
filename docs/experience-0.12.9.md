# 0.12.9 · 三件长凳与完成反馈

## 游玩变化

- 长凳保留原外形、几何碰撞及 `rain-shelter-bench` ID。主线和普通练习使用三件操作：横梁由周伯预装，玩家先装座板，再以任意顺序装两枚木销。
- 列表只列三件，显示当前步骤及 0／3 进度。接近方向自动摆好，选中后显示拖入箭头；方向按钮收在精确操作里，错误方向和提前装销同时受到输入规则限制。
- 选中长座板时调整取景以展示散件和目标位置，保持玩家的观察朝向。短拉回位，完整路径合法且接近归位时吸附；撤销和重置均保留预装横梁。
- 修复雨棚察看区域和场景箭头继承普通按钮悬停底色的问题。大点击区保持透明，只用细边、标记和紧凑名称提示。
- 小屋直榫、半榫、穿销拆合完成后，周伯用一两句短话肯定玩家；“放回桌上，继续”直接返回并突出下一任务。“继续观察”和 Esc 保留局面，撤销再完成可以重新获得反馈。
- 不在场的周伯不会隔空回应。长凳完成后也提供返回雨棚按钮。完成反馈替代原来返回后的重复解释，仍支持原有剧情推进。
- 修正返村时的对白：先带回材料，再由周伯搭好横梁。草图注明甲乙为预装横梁，玩家本次操作丙丁戊。

## 数据与兼容

`openStoryPuzzle` 增加可选 `assemblyGuide` 和 `openingText`，只由剧情层启用；原自由练习的规则不变。引导配置描述预装构件、可操作步骤和接近方向。正式历史仍逐步通过原碰撞规则校验，拖动预览不进入存档。

保持 `sun-jian-campaign-v1` 键和版本 2。旧长凳存档迁移为两根横梁预装，保留已装入的座板和木销；座板前提前放入的木销退回托盘并提示。旧原文在首次写入前备份到 `sun-jian-campaign-v1-backup-before-bench-guide`，不覆盖其他模式。无效历史不能证明通关，已通关记录继续保留。新增完成反馈确认状态，避免刷新或关闭观察时重复弹出。

## 美术素材

长凳操作背景原先误用旧库石台。使用内置 imagegen 生成同风格雨棚空操作区，模型、地面阴影和所有互动由原三维层呈现。图片仅做 WebP 格式转换，不使用脚本重绘。

- 游戏资源：`dist/assets/campaign-2d/puzzle-bench.webp`
- 项目原图：`artifacts/experience-0129/puzzle-bench.png`
- 生成原图：`C:/Users/13412/.codex/generated_images/01a1345e-70b7-7610-8fb8-543dc0b17c85/exec-c924e0bd-68c7-4493-928b-b7d8cafb77fa.png`
- 风格参考：`dist/assets/campaign-2d/shelter-wide-day-empty.webp`

生成提示词：

> Create a NEW original 16:9 anime game background for a close-up mortise-and-tenon BENCH ASSEMBLY screen. The supplied image is STYLE AND LOCATION REFERENCE ONLY. Same modern Chinese mountain-village rain shelter after rain, refined hard-edged anime background painting, warm weathered timber, pale plaster, low saturation green and blue scenery. Camera from moderately high three-quarter angle looks into an EMPTY broad level stone-paved working area beneath the shelter. Lower 70 percent must be continuous uncluttered paving, subtle texture with gentle warm-neutral illumination, no bright reflections and no busy hard cast shadows. The entire central horizontal working area must be EMPTY, reserved for a real-time 3D long bench. NO benches, NO bench frames, NO furniture in foreground, NO table, NO wood pieces, NO tools, NO people, NO text, NO UI. Top 25 percent suggests shelter roof timbers and pale plaster wall toward the right, a partial wooden pillar far left, and a small soft view of blue-green village foliage and hills to the upper left. Keep the background lower contrast than the interactive model will be, calming and natural, not sepia, not cartoon toy architecture, not photographic, no depth-of-field blur. Single coherent wide composition. The environment should be recognizably the same rain shelter as the reference, but a closer, quieter empty working corner.

## 验证与交付

- `npm run test:guided-experience`：三件引导、两种木销顺序、所有操作入口的步骤限制、真实鼠标短拉/完整拖入、撤销/重置、半成品刷新、提前装销迁移与备份、完成反馈/Esc/重复点击/旧存档、人物在场及无 WebGL。
- `tests/presentation-0129.test.cjs` 覆盖 1280×720、1440×900、1920×1080 的透明热点、箭头、长凳取景、完成弹窗和键盘焦点。
- 完整旅程回归覆盖四次小屋学习、三处必经取料操作、三件长凳实际拖入、告别，以及全部八种旧库结构和不同取料顺序。
- 原几何、木件连续表面、合回碰撞、键盘剧情和模式存档隔离通过独立检查。自动测试证明状态与流程，不代替首次玩家对手感、难度和对白的评价。
- 截图和短功能演示位于本机 `output/experience-0129/`；演示按测试局面切换展示功能，不冒充首次玩家录像。
- 离线包解压后核对全部 142 个资源的 SHA-256，并在断网 Chrome 中以本地文件方式完成三件拼装、完成反馈、刷新续玩和旧存档恢复。短演示为 `output/experience-0129/demo/guided-bench-and-feedback.webm`。
- 发布结果与线上验证记录保存到 `output/experience-0129/release.json`。离线包位于 `output/campaign-0129/`。
