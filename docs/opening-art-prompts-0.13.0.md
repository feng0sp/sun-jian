# 开场素材提示词 · 内置图像生成

生成方式：内置 `image_gen`，未使用 CLI 或外部模型下载服务。原始 PNG 保留于本地 `artifacts/opening-0130/`，网页资源位于 `dist/assets/campaign-2d/`。仅做网页所需的尺寸和格式转换，背包保留原生透明度。

## mountain-rain.webp

参考：`dist/assets/campaign-2d/village-night.webp`。

Use case: illustration-story. Create ONE original 1920x1080 landscape 16:9 game background for a quiet modern Chinese mountain village adventure. Input reference is STYLE AND WORLD CONTINUITY reference, not a composition to copy. Same hard-edged anime background painting, crisp ink-like contours, natural scale, cool indigo evening rain with tiny warm village lamps; not photoreal, not cute or toy-like. First-person view while walking down ordinary wet stone steps from a wooded mountain path, stairs begin lower centre and wind towards a small inhabited village in the middle distance, tiled houses with utility poles and electrical wires, the same humble plaster-and-wood home and rain shelter can be glimpsed down below. Plants and dark wet rocks frame the sides. Comfortable readable path, no ravine, no danger spectacle. Dusk just after a shower intensifies, visible fine rainfall but leave space for animated rain. No humans, no hands, no captions, no interface, no arrows, no signs with text. Full bleed high-quality painted game scenery; the visual destination is a warm light at approximately 62% width, 53% height. Reserve gentle detail in upper left for UI. This must match the supplied village art in palette and linework.

## zhou-door-night.webp

参考：上述村口及 `dist/assets/campaign-2d/room-table-night-0.webp`。

Use case: illustration-story. Create one new 1920x1080 16:9 full-bleed game background, a close first-person view from under the eaves just outside the SAME illuminated home on the LEFT of the attached village reference. Reference 1 defines the exterior layout and hard-edged anime painting style; reference 2 defines the room glimpsed inside. Preserve weathered pale plaster, dark brown wood doorframe, small dark ceramic roof eaves, amber hanging electric exterior bulb, window to the LEFT of the doorway, wet stone threshold and flowerpots. The door is already partly open, empty welcome mat just inside; no backpack anywhere. Camera faces the doorway at three-quarter angle from the stone steps; doorway occupies middle-right from x 48% to 72%; enough dark foreground left for an unobtrusive dialogue overlay. Through the opening glimpse the existing wooden workbench and tool board in warm light, but no person visible (the host speaks from out of view). Show a narrow slice of rainy blue village at far RIGHT beyond the eaves. Natural architecture scale. Calm intimate sheltered atmosphere. Clear outlines, painted texture, muted cool blues with warm amber light, exactly same game world as references. No text, labels, interface, hands, new characters, fantasy ornaments or extra doors. Do not put a backpack in the scene.

## village-night-unpacked.webp

编辑目标：原村口图 `village-night.webp`。

Use case: precise-object-edit. Edit this exact village-night game painting. Remove ONLY the olive hiking backpack that is sitting immediately left of the open doorway, and reconstruct the small patch of empty dry stone porch and wall behind it. Keep the camera, every building, roof, plant, power cable, rain shelter, lighting, palette and all pixel-aligned composition unchanged. The protagonist is still carrying their pack at this point, so no backpack should be visible anywhere. No other changes. Maintain the original 16:9 aspect ratio, 1920x1080 target size, same crisp anime painted linework. No text or UI.

## arrival-backpack.webp

参考：原村口背包与小屋光色。生成时指定透明背景。

Use case: compositing. Create a single isolated 2D painted game prop with a genuinely transparent background: the modern olive-green and charcoal hiking backpack seen next to the doorway in reference 1, in the SAME hard-edged anime painting style. Reference 2 is the indoor environment and lighting target. The pack is standing on its flat base, slightly leaning, viewed from slightly above at three-quarter front angle, matching the floor perspective of the lower LEFT foreground of the room. Warm amber lamp highlight from upper right, cool blue rim from upper left; soft dark contact shadow immediately underneath, rendered with translucent alpha, no floor patch or rectangle. Natural stitched fabric, a few damp spots, simple modern webbing, no logos. Backpack only, no wall, no furniture, no person, no hands, no scenery. Leave transparent margin around the complete backpack and its compact contact shadow. It will be a small painted prop near the doorway, not a 3D model. Preserve the backpack's recognizable olive front panel and black sides.
