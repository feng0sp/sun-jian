# 低长凳比例重绘

工具：内置 image_gen（非 CLI）。类型：precise-object-edit / identity-preserve / lighting-weather。

统一规格：1920×1080 WebP，质量92。保留原PNG于 C:/Users/13412/.codex/generated_images/01a1686d-14b4-7162-8c28-fc063ed1ee49/；Pillow 仅作尺寸与格式转换，不修改内容。

目标：三人无靠背长凳约1.8m长、43cm座高和座深。可见比例为美术表达，规则几何未改。已目视检查：凳高相对周伯下降至膝附近，座面宽度可坐，木纹/光影沿用原动漫画风；原图均未覆盖。

## shelter-wide-night.webp

输入：shelter-night.webp

原始输出：exec-484e7a61-2365-46f3-9135-cbdeeaefe35e.png

提示词：

```
Use case: precise-object-edit. Edit target: supplied rainy shelter background. Preserve the entire modern Chinese mountain village shelter composition, all buildings, wet ground, warm lamp and blue rain, woodgrain and hand-painted hard-edged anime style. No text/UI.
Change ONLY the central wooden bench: it currently reads as a tall fence/table. Rebuild it as a comfortable, clearly long LOW BACKLESS village bench for three seated adults, total length 180cm, seat depth 43cm, eventual seat height 43cm, slim 7cm-square legs. In this BEFORE-REPAIR night state, show two LOW H-shaped end leg frames (knee height) and two long lower horizontal stretcher rails linking them, with empty seat supports, NO seat plank. Spread the end frames apart into a long wide silhouette across the existing central floor area, keeping main interactive geometry around x48%, y70%. Unlike the reference tall end frames, lower them dramatically to knee height compared with the nearby stool. It must look like a long bench awaiting its seat, not a railing, not a worktable. Beautiful readable wooden mortise joints. Match exact perspective and grounded contact shadows. All surroundings unchanged, no people. Wide 16:9 image.
```

## bench-wide-detail.webp

输入：bench-detail.webp

原始输出：exec-fa93410b-ef18-43bf-bf86-200ed7261daf.png

提示词：

```
Use case: precise-object-edit. Edit target: the supplied bench detail image, maintain same framing, cart at right, mountain scenery, ground and posts, daytime light, modern Chinese village hard-edged hand-painted anime style. No text/UI. Change ONLY the two tall bench end frames: reduce them to realistic LOW KNEE-HEIGHT slim H-shaped bench leg frames, 43cm tall and 43cm front-to-back depth, positioned 180cm apart. Intended assembled bench is long, comfortable and backless for three adults, length-to-height ratio over 4:1. Each leg is only ~7cm square, avoid enormous logs. Keep the far frame around x60%, y55% and near frame around x18%, y70%, perspective with broad depth. In this PRE-ASSEMBLY state there are ONLY these TWO low fixed end frames on ground; NO connecting long rails or seat installed yet. Visible open notches on end-frame tops and pin sockets. On the right cart preserve and cleanly distinguish exactly FIVE correctly scaled replacement pieces: two long narrow stretcher rails, one long broad comfortable seat plank (180x43cm), and two short wooden locking pins, plus unfolded paper assembly drawing. Avoid any extra dowels or duplicate wood. Keep natural woodgrain and readable joinery. Wide16:9.
```

## shelter-wide-day-empty.webp

输入：shelter-wide-night.webp + shelter-day-empty.webp

原始输出：exec-c7a47139-8744-4cbc-b412-0d01445d5b66.png

提示词：

```
Use case: lighting-weather and precise-object-edit. Image1 is EDIT TARGET: the newly LOW LONG bench under the shelter at night. Image2 is DAYLIGHT REFERENCE only. Produce the identical fixed composition as image1 in the soft bright morning weather/light of image2, keeping all roof posts, village, wall, crate, stool locations unchanged. Keep EXACTLY the low slim knee-height long bench proportions of image1, but remove its two long connecting rails leaving ONLY the TWO LOW H-shaped end frames, 180cm apart and 43cm high, ready for replacement beams. No seat plank installed. No person. Wide 16:9 detailed hand-painted hard-edged anime village style, no UI or lettering. Do not make tall fence-like end frames; these are short stool-height bench legs.
```

## bench-wide-complete.webp

输入：bench-wide-detail.webp + bench-complete.webp

原始输出：exec-33335988-9846-4034-8fb3-d144ee6a4f32.png

提示词：

```
Use case: precise-object-edit. Image1 is EDIT TARGET: low separated bench end frames and five pieces on cart. Image2 supports ONLY Zhou's identity and assembly idea, DO NOT copy its tall table-like proportions. Change image1 to finished bench by installing the two long slim rails, one broad flat seat plank and two small pins taken FROM the cart, leaving cart empty except paper and folded cloth. This is a LOW, LONG comfortable BACKLESS 3-person bench about180cm long, seat depth43cm, seat top43cm off ground, with slim7cm legs. It must be knee-height on a standing adult. Preserve the low end frame heights and all perspective/position of image1; connect these existing low frames, DO NOT raise legs or seat. The seat looks broad enough to sit on comfortably, NOT a narrow fence beam, NOT tall table. Add the same kindly older Chinese man Zhou fromimage2 behind bench around x69%, plain gray-blue work jacket, gray shirt dark trousers cloth shoes. He stands upright relaxed, hand naturally touching hip, other arm resting loosely downward. His KNEES align bench seat height; his waist must be much higher than the bench. Retain modern daytime village and SAME roof/posts/wall/cart composition and detailed hard-edged anime style. No text/UI. Wide16:9.
```


## shelter-wide-day.webp

输入：shelter-wide-day-empty.webp + shelter-day.webp

原始输出：exec-6d53fce4-974a-43e9-84c9-b8d0b5494a19.png

提示词：\n
```
Use case: identity-preserve compositing. Image1 EDIT TARGET: morning shelter with TWO SHORT LOW H-shaped bench endframes. Image2 ONLY Zhou identity/reference. Preserve image1 exactly including ALL ground, plants, buildings and especially low bench endframes (43cm knee-height intendedseat) and distant separation (180cm). Add the same elderly Chinese carpenter Zhou fromimage2 at the same general standing spot x62%, y40%, behind/between the endframes. Same graybluejacket, grayshirt,darkpants,blackclothshoes, natural bodily proportions and angularanimeface. Standing relaxed, both hands resting naturally at waist or lowered, NOT leaning on shortbench. Knees approximate endframe tops. No seat or longrails yet. Do not modify low frames to make them touch his hand. Maintain hard-edged detailed anime style, same morninglight/shadows. No text/UI. Wide16:9.
```

## shelter-wide-complete.webp

输入：shelter-wide-day-empty.webp + shelter-complete.webp

原始输出：exec-cd2dcbaa-78e9-4420-a3f6-8db9b0a8a7ff.png

提示词：\n
```
Use case: precise-object-edit. Image1 EDIT TARGET: morning shelter with two LOW SHORT wooden bench endframes. Image2 ONLY identityreference for Zhou, DO NOT copybench proportions. Keep image1 camera, background, light, roof, posts, wall, crate and stool EXACTLY. Assemble a LOW LONG BACKLESS three-person bench by connecting the EXISTING low endframes with two slim long lower rails, adding ONE broad flat wooden seat plank and TWO small endlockingpins. Seat 180cm long, 43cm deep, 43cm high, length-to-height ratio4:1. Preserve exactly the short frame heights; never create tallerlegs/table/fence. Seat is 5cm thick and broad enough to sit. Wood refined and lightly weathered warmbrown; show clear beautiful mortisejoints. Add same older Chinese carpenter Zhou fromimage2 standing behind bench atx62% y40%, plainbluegrayclothes, upright relaxedsmile, hands onhiporlowered. Bench seat should be around his KNEES, much lower than hiswaist. All texturesandshadows grounded in same detailed hard-edged anime style. No UI, no text. Wide16:9.
```
