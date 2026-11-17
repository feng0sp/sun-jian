# Loaded timber at the rain shelter

Built-in image_gen, 2026-10-24. Local object edits of existing painted scenes. Pillow used only for RGB conversion, 1920×1080 resize and WebP quality 92 encoding.

## Without Zhou

Edit target: `shelter-wide-day-empty.webp`. Cart/material reference: `cave-sky-loaded.webp`.

Original generated output: `C:/Users/13412/.codex/generated_images/01a16a06-db08-72a0-881b-b05c20936c25/exec-5cd86513-38e4-4278-9a9b-a242e30fad6a.png`

Project: `shelter-wide-day-loaded.webp`.

Prompt:

Use case: precise-object-edit / compositing.
Asset type: 1920x1080 fixed-camera anime adventure game background.
Input 1 is the edit target: empty daytime rain shelter with two low bench end frames. Input 2 is reference ONLY for the small wooden handcart loaded with bench replacement timber.
Make exactly one minimal edit to INPUT 1: park the loaded small wooden handcart in the LOWER LEFT foreground, around normalized x=0.20,y=0.85, within approximately x=0.03..0.43 and y=0.75..0.99. Keep both bench end frames completely visible and their immediate joining space clear. The cart should be a believable same small wooden two-wheeled cart as reference, carrying two narrow rails and a broad seatboard bound with a pale cloth strip, plus two small wooden pins in its bed. Scale and rotate it naturally to fit the ground perspective, wheels touching paving, warm daylight and soft contact shadow matching Input1. It can be slightly clipped at the lower left frame edge if needed, but no floating.
Preserve the entire shelter composition, camera, long wall planks, empty stool, box, both existing bench end frames at their exact positions, roof posts, mountain village, weather, colors and hard-edged anime painted style. Do not add people. Do not install the bench pieces yet. Do not move the end frames or fixtures to make space. No text, no UI, no watermark. Output the shelter only, NOT the cave.

## With Zhou

Edit target: `shelter-wide-day.webp` (this is the existing with-Zhou filename). Cart registration reference: the generated without-Zhou state above.

Original generated output: `C:/Users/13412/.codex/generated_images/01a16a06-db08-72a0-881b-b05c20936c25/exec-901c0ece-c0e2-4c68-8e5c-477026249088.png`

Project: `shelter-wide-day-loaded-zhou.webp`.

Prompt:

Use case: precise-object-edit / compositing.
Image1 is the EDIT TARGET: daytime shelter with elderly Zhou standing next to the dismantled bench. Image2 is a supporting reference for the exact loaded cart and its position in this same shelter.
Make exactly one local edit to Image1: copy the small loaded handcart from Image2 into the SAME LOWER LEFT foreground position, approximately x=.04..35, y=.60..95, with the same perspective, wheels, two wooden rails, wide seat board bound with pale cloth, and two small pins. Preserve the bench end frames and keep their connecting area accessible.
Keep ALL of Image1 unchanged apart from the cart and appropriate contact shadows: preserve Zhou's identity, age, face, clothing, hands, pose, height and exact location; both low bench end frames, stools, walls, leaning boards, columns, mountains, daylight and the fixed wide camera. Do not add any other character. Do not move or redesign Zhou. No assembling the bench yet, no text, no UI, no watermark. Match the original detailed crisp anime-painted game style. 1920x1080 framing.

## Inspection and placement

Both images inspected. Loaded cart rests on the paving in the lower-left foreground; bound bench rails/seatboard and two pins visible. Original low end frames, central assembly area, Zhou location (with-Zhou only), wall/stool and shelter background retained. The cart occupies approximately x=.04–.36, y=.59–.95, center (.20,.78); a tight selectable payload area is x=.10–.34,y=.64–.85. The original left end frame is behind the cart with its top and joints readable; the connecting area between end frames stays clear. No text or extra people added.


## Completed bench, empty cart

Edit target: `shelter-wide-complete.webp`. Cart placement reference: `shelter-wide-day-loaded-zhou.webp`.

Original generated output: `C:/Users/13412/.codex/generated_images/01a16a06-db08-72a0-881b-b05c20936c25/exec-a0baf557-b570-4149-85b2-5087ab4aac07.png`

Project: `shelter-wide-complete-cart.webp`, 1920×1080, WebP quality 92. Same built-in image_gen and resize/format-only conversion.

Prompt:

Use case: precise-object-edit / compositing. Asset: fixed-camera 1920x1080 painted anime adventure game scene.
Image1 is EDIT TARGET: completed long bench at daytime village shelter, elderly Zhou standing with a hand on his hip. Image2 is reference ONLY for the exact handcart in the lower-left foreground.
Add that SAME wooden handcart at the SAME lower-left position as Image2, but now EMPTY because all bench replacement timber and both small pins have been installed. The cart bed has no wood or pins, only a small neatly folded pale cloth strap can remain on its floor. Match cart scale, perspective, wheels, handles, location (x~.04-.36/y~.59-.95) and wood material from Image2. Natural wheel contact and shadow on the paving.
Preserve all of IMAGE1 unchanged outside this local added cart: the COMPLETE broad long bench and its wooden seat, both end frames and rails, Zhou's same hand-on-hip pose/face/clothes/location, wall boards, stool, shelter posts, roof, village and daylight. Do not take the unfinished bench or different pose from Image2. No added people, no text, no UI, no watermark. This is exactly the completed bench scene, plus the now empty cart in its established lower-left parking position.

Inspection: the same cart remains at lower left with empty bed and folded cloth only; timber and pins absent. Completed bench, Zhou's hand-on-hip pose, registered background and light retained. No extra people or text.


