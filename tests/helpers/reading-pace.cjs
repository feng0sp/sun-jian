/* Optional automated reading cadence; never presented as a human playtest. */
module.exports=async function readingPause(page,selector){
 if(process.env.READING_PACE!=='1')return;
 const box=page.locator(selector);if(!await box.isVisible())return;
 const text=(await box.innerText()).trim(),milliseconds=Math.max(900,Math.min(9500,text.length/9*1000));
 await page.waitForTimeout(milliseconds);
};
