# 0.13.10 · 对白提示音与声音偏好

日期：2026-11-06。本轮采用角色提示音方案：每句开头约 0.14—0.21 秒，只轻响一次。保留现有文字、人物神情、故事和解谜。可玩范围仍到 S04 工坊维修样机，正式作品和比赛待后续制作。

## 演出与控制

| 说话人 | 提示音 |
|---|---|
| 周伯、尚未介绍称呼的老人／屋内回应 | 低暖、短衰减的木质音色 |
| 小许 | 稍高而轻快的两声 |
| 林岚 | 中高音、克制的两声 |
| 主角 | 中性的单声 |
| 远程消息 | 轻的双音，保持消息身份 |
| 旁白、折页、手记及中性记录 | 安静 |

提示音与现有 D 调音景使用相容音高，短音由本地 Web Audio 合成，随包离线可用。`dialogue-sound.js` 只负责音色和音节点；`journey-atmosphere.js` 使用已有音量和主输出；`campaign.js` 按真实台词呈现发起。翻页不会重启音乐乐句，快速翻页会收掉上一声，略过不连播跳过的内容。拆装完成弹窗只在周伯实际回应时配一声，装配记录等中性反馈不冒充人物。

对白框新增声音开关，不用离开交谈即可操作；设置中可单独关闭“对白提示音”。总声音偏好也改为旅程内保存，恢复时仍遵循浏览器用户操作限制。全新旅程默认静音，打开后继续沿用雨声、室内衰减和原配乐。后台、页面离开和关闭总声音会清理未结束的短音，回前台不补播。

## 保存与兼容

存档键仍为 `sun-jian-campaign-v1`，数据版 2、剧情修订 8、新篇修订 2。新增 `settings.sound` 和 `settings.dialogueSound`，不改任务 ID、台词顺序、已提交历史与物件摆放。旧档没有新设置时，总声音默认关闭，对白提示音功能默认可用，须开启总声音才可听到。

`JointGame.setPreferences` 可无提示声地恢复声音状态；进入剧情前保存自由练习的声音状态，离开后恢复。剧情中更改总声音不写入自由练习进度。原静音、音量、雨声试听和无 Web Audio 阅读继续可用。

同时为原木作短音增加自然结束后的断开和静音时清理。页面转到后台时取消尚未结束的木作短音与摩擦声；不会改动木件几何、动画提交或解谜历史。

## 验证与交付

结果位于被 Git 忽略的 `output/dialogue-audio-01310/`，最终发布状态与精确提交 ID 见其中 `release.json`。

| 检查 | 入口／证据 |
|---|---|
| 人物区别、消息、旁白安静、短音边界、旧设置默认 | `tests/dialogue-sound.test.cjs` |
| 实际音频样本、翻页不重复、略过、主静音、后台、音乐乐句、完成反馈 | `tests/dialogue-audio-browser.test.cjs`；根目录 `verification.json` |
| 对白内开关不翻页、键盘、刷新记忆、自由练习隔离、三种桌面尺寸、无 Web Audio | `tests/dialogue-preferences.test.cjs`；`preferences/verification.json` |
| 单独角色音、进村借宿、工坊拆检的原游戏音轨与实际画面 | `scripts/record-dialogue-audio.cjs`；`demos/verification.json` |
| 持续翻页、暂停、后台、调整窗口、声音开关和音节点数量 | `scripts/soak-dialogue-audio.cjs`；`soak-final/verification.json`，仅在最终文件通过后计入 |
| 木作短音自然结束、立即静音、80 次连续开关与实际静音样本 | `wood-audio/verification.json` |
| 小许布局、敲门、实录雨声试听、角尺与存档下载 | `companion/verification.json` |
| 原旅程、旧档、对白回看与独立模式 | `final-flow/`、`save-isolation/`、`dialogue-rewind/` |
| 离线断网的音效和设置 | `offline-audio/verification.json`、`offline-preferences/verification.json` |

录制脚本提供两个带声 MP4 和一段 WAV 音色试听，顺序为周伯、小许、林岚、主角、消息。录音来自实际游戏输出；单独 WAV 用相同合成代码渲染。验证检查音频解码、样本幅度、停止与资源释放，不把程序检查写成真人试听或首次玩家评价。

离线包为 `output/campaign-01310/sun-jian-0.13.10-offline.zip`。公开游客链接保持不变，刷新页面后可使用新版声音开关；浏览器进度无需重新开始。
