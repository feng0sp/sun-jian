# 全流程节点卡 · 0.14.0

### 0.15.0 博物馆

| 节点 | 在场与行动 | 结果与恢复 |
|---|---|---|
| `continuationMuseumIntro` | 第四周末，工坊复盘后。林岚和主角在市里的榫卯文化博物馆看一张维修记录，聊起给下一个修理者留图。 | 略过或读完三句均进入馆厅。刷新按行恢复。 |
| `museum` | 第一视角看完整展厅。点展品或展台上的名字进入近看。可以直接离馆去选作品。 | 保存近看展品和画面。手记及章节可回访，离馆回到来处。 |
| `museum-replica` | 展品近景进入教学桌。夹头榫案角、燕尾滑盖和六件鲁班锁可拆合。 | 复原件独立保存提交步，刷新回近景可续玩。主线和比赛记录仍由各自任务提交。 |

日期：2026-11-07。制作入口：agents/FULL_GAME_AGENT.md。后半段以当前工坊设计完成为依赖；男主为男性大学生，陈屿独自旅行。三选一修改优先于旧蓝本中固定换鞋凳的示例。

## 前半段接续

| 节点组 | 时间/在场 | 玩家行动与原因 | 结果与恢复 |
|---|---|---|---|
| opening—stay | 旅行第一晚；陈屿、门内周伯 | 遇雨下山、敲门获邀、放包、主动借宿 | prologue 与 talk 持续保存；两条雨棚路线均接自由观察 |
| learn-straight-out/lap-out/pinned-out/straight-back | 当晚小屋；我、周伯 | 主动提出学习，拆三种接头，再合回直榫 | 四条原任务身份不变；重复拆合使用物件历史，不改正式证明 |
| mouth-latch/rack-frame/stone-box | 次晨旧库；我 | 帮取周伯已试配的替换料和草图 | 三必经，料架与草图换序；五自选不挡主线 |
| bench—farewell | 村口雨棚；我、周伯 | 合座板与两销，周伯检查后坐下 | 原 bench 历史保留；第一幕完成不等于全游戏完成 |
| continuationMeetup/Departure/Goodbye | 离村前；陈屿、周伯 | 从雨棚柱旁拿折页，问继续学习的方法，当面道谢 | 返校书桌，再到开放工坊；不直接报名或跳回雨棚 |
| practice-release-order—continuationEntry | 返校前三周；陈屿、工坊人员 | 合回、主动记路径、自己决定报名 | 合法 run、reviewed、entryAccepted；旧错序销可取回 |
| purpose—service-review | 第四周；陈屿、林岚 | 从使用需求到维修通路，拆检/侧置/合回/拆回 | 独立三条样机历史；purpose任意入口均可到design-ready |

## 后半段节点

全体节点遵循：退出保留当前阶段，刷新恢复已提交历史；未提交预览回滚。场景底图按所选作品与正式拆装结果切换。休息返回当前工坊或展位，不跳回第一幕。对白可回看、跳到段尾但不跳过选择。

| 稳定阶段/节点 | 场景/时间/在场 | 原因与行动 | 单次提交/下一节点 |
|---|---|---|---|
| design-ready → work-choice | 第五周工坊；我、林岚 | 完成维修样机后，选择真正想做的一件：换鞋凳/小几/书架 | productionStarted、workChoice；进入entry-build |
| entry-stool-assemble | 第七周工坊；我，工坊协助 | 从预装框架开始，合宽主板，再装两侧木销 | entryRun合法完成；entry-review，不能套用旧bench历史 |
| entry-review | 第八周工坊；我 | 三个明确按钮查看主板、搬动握持处、取销通路；说明加工协助 | inspected三项、recordsReady；packing |
| packing | 第九周；我，消息向周伯发成品照片 | 包好主板、两销与框架，保留接面，带记录赴赛 | packed；contest-arrival。改选只允许在这之前，需确认清除本作品记录 |
| continuationFinalArrival | 第十周省城；我、林岚 | 同行见面，确认折叠件已改、互相看作品 | arrivalSeen；contest-register |
| contest-register | 展位；我、工作人员 | 核对所选作品、过程和加工协助 | contestRegistered；contest-build，无额外资格或表单任务 |
| contest-assemble | 展位特写；我 | 运输散件重新合回，先宽主板、再两销 | contestRun合法完成；contest-service-out |
| continuationFinalJudge | 展位；我、评审 | 先确认本机姓名，聊所选作品用途，再问维修；首次交流必须经过，之后可继续演示 | 不提交解谜证明；进入同阶段的实际操作 |
| contest-service-out | 展位特写；我 | 取任一侧销、另一侧销、退出宽主板，框架不动 | serviceDemoRun合法完成；contest-service-back |
| contest-service-back | 同展位特写；我 | 沿原路径复装主板与两销 | serviceReturnRun合法完成；contest-records |
| continuationFinalRecords | 展位；我、评审 | 解释实际改动、图中取销出口、说明谁协助什么 | presented；contest-review。只在三项现场证明完整后可进入 |
| contest-review | 交流厅；我、林岚、工作人员 | 使用检查与看其他作品，以具体做法代替等待 | judged；results。可直接继续，无现实计时 |
| results / continuationFinalResult | 交流厅；陈屿、林岚、工作人员 | 名单与证书、愣一下、林岚向台上示意、收下肯定与评语 | awardStep 0→1上台→2证书及3000元→3合影→4返回，最后才resultSeen；after-award。支持跳过至奖励摘要 |
| continuationFinalAfter | 展位；陈屿、林岚 | 林岚按作品试坐、摆杯与本子或把书立放，再邀请陈屿看看她的折叠件 | 接 continuationFinalZhou，陈屿用手机报喜 |
| continuationFinalZhou | 展位；我；远程消息周伯 | 发证书和合影报喜，先庆祝，再由主角提出下次请教 | endingSeen；ending，表情随当前句恢复 |
| ending | 同展位/最后手记 | 查看作品、完整记录、章节回顾、独立重练或菜单 | 保持当前结局；重练不改正式证明与奖项 |
| continuationFinalMemory | 已通关当前展位 | 主动回看领奖、三选一试用、周伯告别，支持回看与略过 | 返回ending，不动正式历史或重复颁奖 |

## 三分支和演出审校

- 原本的换鞋凳需求仍是最初想法；作品选择明确允许改用同一可拆修关系做小几或书架。第五周正式选择后，各处名称、主板称呼、用途、模型与画面一致。
- 周伯在山村，离村时交换联系，备赛发照片，赛后发消息；所有展厅底图移除周伯。
- 陈屿的参赛动机来自修好的长凳和他自己看到的折页。男主台词与发送者始终用男性立绘。
- 三种作品都固定第三名；提示、撤销、速度与接缝不足的作者设定没有扣分关系。三名排序不由计时器计算。
- 试用前由剧情工作人员检查；游戏几何验证仅证明拆装规则，不替代实体家具工程或安全检查。
- 对白与旁白按眼前动作连接，不复述同一行为；修改记录和详细工艺信息进入手记。

## 验收记录方式

功能流程、对白通读、图片检查、音乐信号/实录演示、真人首次试玩分别记录。自动操作通过不证明对白自然或实际玩家体验时长。最终公开/离线状态以 output/awards-0143/release.json 为准。
