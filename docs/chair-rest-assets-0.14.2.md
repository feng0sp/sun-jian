# Seated rest-view assets 0.14.2

Generated with the built-in `image_gen.imagegen` tool, using the existing seated night painting as an edit reference. These are original project-bound assets; old files were not overwritten. Pillow was used only for 1920×1080 encoding/resizing.

## Purpose

The old seated camera showed a worktable carrying two generic boards, inconsistent with the three persistent sample groups. The new camera faces the window and small tea shelf, keeping the entire task display surface out of view. No part inventory is depicted, so every legal puzzle state can share this rest view.

## Assets and QA

- `dist/assets/campaign-2d/chair-rest-night-0142.webp`: rain-dark mountains, warm lamp, Zhou seated.
- `dist/assets/campaign-2d/chair-rest-day-0142.webp`: same composition, clear morning, lamp off, Zhou seated.
- `dist/assets/campaign-2d/chair-rest-day-empty-0142.webp`: exact morning composition with empty chair after Zhou leaves.

All three were visually inspected. No sample blocks, loose boards, task trays, bags or UI are depicted. Zhou's hands rest naturally on chair arms; both cloth shoes contact the floor. The first generation accidentally used hiking footwear and was rejected; the final night replaces those with dark slip-on cloth shoes before deriving the two day variants. Morning window rain is absent; lamp is off. Empty state has no remaining limbs. Perspective and object locations closely match across variants.

Known limits: image generation does not guarantee identical pixels across weather variants; chair geometry and cup floral markings have small painterly differences. This is a re-framed rest view, not a geometrically exact camera render of the room. Do not apply existing left-side Zhou facial overlays to this new right-side composition without dedicated calibration. Use the original image as fallback if needed.

## Integration suggestions

The only required route should be `起身去工作台` and the normal `起身` room exit; do not leave a target named `看看工作台` over this image because the task table is outside frame. Optional visual targets if desired: cup center (.14,.62), window center (.39,.29), Zhou chest (.77,.45), subject absent in day-empty. No new dialogue should imply that Zhou is present in day-empty. Existing seated action text can continue describing sitting and looking around.

## Prompt set

### chairNightPrompt

Use case: illustration-story / precise-object-edit.
Asset type: 16:9 illustrated game background, seated first person rest view in Zhou's modern Chinese mountain village home. Input image is the EDIT TARGET and exact architecture, older man's identity, clothing, anime linework and light reference.
Primary request: turn the seated camera gently LEFT, toward the rainy window and the side shelf with enamel cup and red thermos, producing an intimate, quiet pause from woodworking. This is the same room and evening. The main workbench and ALL its surface, sample display, trays, loose timber and task parts must be entirely OUTSIDE the new frame. Do not replace sample parts with generic boards. The view must contain NO foreground worktable or sample objects.
Composition: wide 16:9, natural seated eye level, rain streaked brown timber window dominates left and central picture, blue mountains and a few village lights outside. Small ordinary side table with the existing red thermos and enamel cup near window left. Zhou sits naturally on his same chair along the right third, wearing faded dark blue overshirt, light gray shirt and dark trousers, elderly angular kindly anime face, same identity as reference. Hands relaxed and anatomically natural, both feet grounded. Modest wall and electrical switch continue to the right. Green lamp can remain near upper edge with warm diffused interior light.
Style: the reference's clean firm anime outlines, controlled cel shading, richly painted wood and rainy landscape; NOT photographic, NOT round chibi, NOT plastic 3D.
Constraints: preserve room's modern rural character, rain at night, ordinary worn furniture; coherent one-camera perspective and unified shadows. Keep the task workbench outside view, no loose boards, no puzzle blocks, no labels, no UI, no writing, no logos. Full bleed illustration.

### chairNightShoePrompt

Precise local correction to this illustrated game background. Keep the entire composition, man, face, clothing, chair, hands, window, rainy night landscape, cup, red thermos, lighting, perspective and all other pixels unchanged as closely as possible. Change ONLY the elderly seated man's footwear: he is a retired village carpenter indoors, so replace both brown lace-up outdoor hiking boots with plain well-worn black/dark navy cloth slip-on shoes, simple soft white-gray rubber soles, no laces, no boot collars. Preserve both foot positions, dimensions, grounded contact shadows and natural ankle shapes. The task workbench remains out of frame. No writing, no UI.

### chairDayPrompt

Use case: lighting-weather. Edit this exact illustration into the following morning AFTER the rain. Change only weather and illumination. Lock every object's composition and dimensions: same brown wooden three-pane window, same wall, same red floral thermos and white enamel cup on small side shelf at left, same green hanging lamp at upper right, same elderly Zhou sitting at right, exact face and plain dark cloth slip-on shoes, same chair and pose. Do not move the camera or any furniture. The main workbench remains entirely out of frame.
Outside is a clear peaceful spring morning in a Chinese mountain village: soft blue sky, green mountain forest with pale lingering mist, moist leaves, village tiled roofs. Remove rain streaks and lit house-window night glows. Daylight enters softly from the window, gives natural broad light and mild warmth, no harsh gold filter. The hanging bulb is OFF, matte pale bulb beneath green shade. Floor remains slightly damp but without lamp-night reflections. Preserve clean firm anime linework and controlled painterly cel shades, same room materials and perspective. No task blocks, no boards, no trays, no text or UI. Single coherent full-frame 16:9 image.

### chairDayEmptyPrompt

Use case: precise-object-edit. Edit the exact provided game background. Remove ONLY the seated elderly man, because Zhou has stepped out to the rain shelter. Leave his wooden armchair EMPTY in its exact same location. Fill the newly visible portions of chair, wall, floor and window with continuous natural surfaces matching the existing perspective and morning light. No other object moves. Preserve the entire camera, crop, window and forest, morning weather, side table with enamel cup and red thermos, hanging green lamp switched off, outlet and wiring, painted anime linework, colors and shadows. The chair must have naturally reconstructed continuous wooden seat, backrest and legs, no ghost limbs, no clothing remnants. Do not add any characters, bags, task blocks or boards. No text, no UI. Same 16:9 composition.

