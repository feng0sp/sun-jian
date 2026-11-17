# 0.13.1 原创画面制作记录

模式：内置 image_gen，基于项目已有画面做编辑，未使用外部模型服务。生成 PNG 保留在本地 artifacts/journey-0131/；网页只做尺寸与 WebP 转换。背包保留生成的透明通道和接触阴影。

## room-after-dinner.webp

最终路径：dist/assets/campaign-2d/room-after-dinner.webp

参考图：dist/assets/campaign-2d/room-table-night-4.webp

最终提示词：

Use case: precise-object-edit. Edit target: supplied modern Chinese mountain village woodworker room image, fixed 1920x1080 composition. Create the AFTER DINNER variant for the same illustrated game, preserving the identical camera, old man Zhou's identity and seated position, walls, tools, window, furniture, three study samples and trays exactly in place. Only add a small tidy tray with TWO washed plain ceramic rice bowls stacked and two pairs of chopsticks, at the rear LEFT part of the main table near the existing shallow tray, and a folded clean drying cloth beside it. The woodworking samples remain in their same original locations; do not turn them into food or remove them. Late evening after a simple meal eaten elsewhere, nothing dirty, no food still on the table. Warm lamp a little softer, blue rain outside; retain crisp angular anime contours, natural proportions, detailed painted wood and subdued color. No new person, no protagonist body, no backpack, no text, no UI. Invariants: exact framing and window and face and furniture, realistic small bowls scale, no floating props, clean light/shadow contact.

## shelter-seated-zhou.webp

最终路径：dist/assets/campaign-2d/shelter-seated-zhou.webp

参考图：dist/assets/campaign-2d/shelter-wide-complete-cart.webp + room-table-night-4.webp

最终提示词：

Use case: precise-object-edit. Edit target: supplied wide completed bench and standing elderly man scene. Supporting reference: indoor elderly Zhou face/identity/clothes. Make an original same-camera 1920x1080 game AFTER SITTING variant. Keep entire shelter composition, wide completed wooden bench, seat width, two legs/rails, empty wooden cart on left, wall leaning board, stool, roof, stone lane, houses, daylight, tree shadows precisely unchanged. Remove the standing Zhou behind the bench and instead paint the SAME elderly Zhou seated naturally on the RIGHT END of the finished long bench, feet grounded on stone paving on the camera-facing side, hands relaxed naturally on lap, leaving the left and middle seats visibly empty for first-person player. Preserve aged angular cheekbones, grey short hair, modest dark grey-blue work jacket, light undershirt, dark trousers and cloth shoes, kindly reserved smile; crisp hard-edged anime ink contours and clear shadow planes, NOT round soft cartoon, NOT photoreal. Correct seated anatomy and scale; thighs contact the seat and do not pass through it. No second Zhou anywhere. Do not add a backpack because it will be a separate painted prop layer. No text, no UI, no protagonist body. Keep morning-after-rain atmosphere.

## bench-backpack.webp

最终路径：dist/assets/campaign-2d/bench-backpack.webp

参考图：dist/assets/campaign-2d/arrival-backpack.webp + shelter-wide-complete-cart.webp

最终提示词：

Use case: lighting-weather. Edit target: isolated olive and black modern hiking backpack with transparent background. Keep the exact same backpack identity, shape, seams, multiple pockets, straps, upright 3/4 pose, camera and hard-edged anime linework. Replace amber indoor lamplight with soft neutral warm daylight from upper left, with cool ambient shadows to match the supplied rain-shelter background (supporting light/style reference only). Deliver ONLY the backpack cutout, fully visible with thin semitransparent ground contact shadow, genuine transparent background, no bench or scenery, no person, no white matte, no checkerboard, no text. This will be placed on stone paving beside the long bench.

