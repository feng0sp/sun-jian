const assert = require('node:assert/strict');
const { D, learned } = require('./helpers/campaign-fixtures.cjs');
const { base, path: workRun } = require('./finale-state.test.cjs');
const F = require('../dist/campaign-finale.js');
const Field = require('../dist/campaign-field-notes.js');

assert.equal(Field.heritage(D.fresh()).filter(card => card.memory).length, 0);
const old = learned();
old.fieldNotes = ['chair-shoulder'];
assert.equal(Field.heritage(old).filter(card => card.memory).length, 1);

if (!process.env.SUNJIAN_PACKAGED_EXE) throw new Error('Set SUNJIAN_PACKAGED_EXE to the extracted Windows build');

async function main() {
 const browser = await require('./helpers/desktop-browser.cjs')();
 const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
 page.setDefaultTimeout(8000);
 const errors = [];
 page.on('pageerror', error => errors.push(error.message));
 const url = 'sun-jian://app/index.html';
 const state = () => page.evaluate(() => CampaignJourney.snapshot().state);
 async function seed(save) {
  await page.goto(url + '?practice=1');
  await page.evaluate(value => localStorage.setItem('sun-jian-campaign-v1', JSON.stringify(value)), save);
  await page.goto(url + '?journey=1');
  await page.waitForFunction(() => CampaignJourney.snapshot().scene.available);
 }
 const facts = save => JSON.stringify({
  phase: save.phase, frame: save.frame, runs: save.runs, done: save.done,
  fieldNotes: save.fieldNotes, continuation: save.continuation, talk: save.talk
 });

 try {
  old.frame = 'room';
  old.talk = { id: 'heritage', line: 2 };
  const originalProof = old.runs['learn-pinned-out'].history;
  await seed(old);
  assert.equal((await state()).talk.line, 2);
  assert.deepEqual((await state()).runs['learn-pinned-out'].history, originalProof);
  assert.match(await page.locator('#campaign-line').innerText(), /剩下的让他们自己试/);
  for (let i = 0; i < 2; i++) await page.locator('#campaign-next').click();
  await page.locator('#campaign-choices').getByRole('button', { name: '我先看看。' }).click();

  const beforeNotes = facts(await state());
  await page.locator('#campaign-notes').click();
  const journal = page.locator('.campaign-heritage');
  await journal.waitFor({ state: 'visible' });
  const summary = journal.locator(':scope > summary');
  const focusTrail = [];
  for (let i = 0; i < 20 && !await summary.evaluate(el => el === document.activeElement); i++) {
   await page.keyboard.press('Tab');
   focusTrail.push(await page.evaluate(() => [document.activeElement.tagName, document.activeElement.textContent.trim().slice(0, 24)]));
  }
  assert(await summary.evaluate(el => el === document.activeElement), JSON.stringify(focusTrail));
  await page.keyboard.press('Enter');
  assert.equal(await journal.locator('.heritage-memory').count(), 1);
  await page.keyboard.press('Tab');
  assert(await journal.locator('.heritage-sources > summary').evaluate(el => el === document.activeElement));
  await page.keyboard.press('Enter');
  assert(await journal.getByText('武汉市文化和旅游局报道').isVisible());
  assert(await journal.getByText('中山市文化广电旅游局').isVisible());
  assert.equal(await page.locator('#campaign-panel .campaign-card').evaluate(el => el.scrollWidth <= el.clientWidth), true);
  if (process.env.TEST_OUTPUT) await page.screenshot({ path: process.env.TEST_OUTPUT + '/heritage-notes.png' });
  await page.getByRole('button', { name: '收好手记', exact: true }).click();
  assert.equal(facts(await state()), beforeNotes);

  const finished = base();
  const c = finished.continuation;
  Object.assign(c, {
   productionStarted: true, workChoice: 'shelf', inspected: ['panel','moving','service'],
   recordsReady: true, packed: true, arrivalSeen: true, contestRegistered: true,
   entryRun: workRun('entry-desk-shelf', 'assemble'), contestRun: workRun('entry-desk-shelf', 'assemble'),
   serviceDemoRun: workRun('entry-desk-shelf', 'dismantle'), serviceReturnRun: workRun('entry-desk-shelf', 'assemble'),
   presented: true, judged: true, resultSeen: true, awardStep: 4, rewardRecorded: true
  });
  finished.talk = { id: 'continuationFinalZhou', line: 4 };
  await seed(finished);
  assert.match(await page.locator('#campaign-line').innerText(), /周六能请来学的人照着试一次/);
  await page.locator('#campaign-next').click();
  assert.match(await page.locator('#campaign-line').innerText(), /先让他们试/);
  await page.locator('#campaign-next').click();
  assert.equal((await state()).continuation.stage, 'ending');
  assert.deepEqual((await state()).continuation.serviceDemoRun.history, c.serviceDemoRun.history);
  assert.match(await page.locator('#campaign-panel-content').innerText(), /传习屋的桌上/);
  assert.equal(Field.heritage(await state(), F.choice(c))[1].memory, '已演示桌上书架的局部拆修和复装。');
  assert.deepEqual(errors, []);
  console.log('PASS packaged heritage notes, keyboard and offline sources, old dialogue resume, and ending with original teardown proof');
 } finally {
  await browser.close();
 }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
