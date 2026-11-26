/* Real Web Audio transport and capture regression. No fixtures or production instrumentation. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const {armAudioCapture, startAudioCapture, stopAudioCapture} = require('./helpers/capture-audio.cjs');

const out = process.env.TEST_OUTPUT || 'output/performance-0138/audio';
async function measure(page, duration) {
  return page.evaluate(async ms => {
    const until = performance.now() + ms;
    let sum = 0, peak = 0, count = 0, lowFrames = 0;
    while (performance.now() < until) {
      await new Promise(resolve => setTimeout(resolve, 55));
      const m = __journeyAudioCapture.meter();
      sum += m.rms * m.rms;
      peak = Math.max(m.peak, peak);
      if (m.rms < .00035) lowFrames++;
      count++;
    }
    return {rms:Math.sqrt(sum / count), peak, lowFrames, count};
  }, duration);
}

(async () => {
  const browser = await chromium.launch({channel:'chrome'});
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await fs.mkdir(out, {recursive:true});
    await armAudioCapture(page);
    await page.setContent('<button>开关声音</button>');
    await page.addScriptTag({path:path.resolve('dist/journey-atmosphere.js')});
    await page.evaluate(() => {
      document.querySelector('button').onclick = () => JourneyAtmosphere.sound(!JourneyAtmosphere.snapshot().enabled);
      JourneyAtmosphere.configure({active:true, night:true, profile:'journey', volume:.65});
    });
    const snapshot = () => page.evaluate(() => JourneyAtmosphere.snapshot());
    const config = value => page.evaluate(v => JourneyAtmosphere.configure(v), value);
    const wait = (check, arg) => page.waitForFunction(check, arg);
    assert.equal((await snapshot()).running, false);
    await page.locator('button').dispatchEvent('click');
    assert.equal((await snapshot()).unlocked, false);
    assert.equal((await snapshot()).running, false, 'synthetic click never unlocks the score');
    await page.locator('button').dispatchEvent('click');
    await startAudioCapture(page);
    await page.locator('button').click();
    await wait(() => JourneyAtmosphere.snapshot().running && __journeyAudioCapture.meter().rms > .0003);
    const entry = await snapshot();
    const rain = await measure(page, 3650);
    assert(rain.rms > .001, 'rain road produced audible samples');

    // Switch during a sounding note so this check actually exercises its fade-out.
    await wait(() => {
      if (!JourneyAtmosphere.snapshot().voices) return false;
      JourneyAtmosphere.configure({interior:true, home:true});
      return true;
    });
    const homeEntry = await snapshot();
    assert.equal(homeEntry.profile, 'home', 'legacy home flag still selects indoor score');
    assert(homeEntry.rainTarget < entry.rainTarget);
    assert(homeEntry.phraseGeneration > entry.phraseGeneration);
    assert(homeEntry.retiringVoices > 0, 'previous long note has a brief tail');
    await wait(() => JourneyAtmosphere.snapshot().retiringVoices === 0);
    const atHome = await measure(page, 4400);
    assert(atHome.rms > .001, 'indoor phrase was played under distant rain');

    // Line advancement and volume changes do not restart the phrase.
    await config({quiet:true});
    for (let i = 0; i < 4; i++) await config({profile:'home', quiet:true, volume:.65});
    const lowered = await snapshot();
    assert.equal(lowered.phraseGeneration, homeEntry.phraseGeneration);
    assert(lowered.musicTarget < homeEntry.musicTarget * .5);
    await config({profile:'workshop', quiet:false, night:false});
    await wait(() => JourneyAtmosphere.snapshot().retiringVoices === 0);
    assert.equal((await snapshot()).rainTarget, 0);
    const workshop = await measure(page, 7200);
    assert(workshop.rms > .001 && workshop.lowFrames > workshop.count * .12,
      'workshop melody is audible with a measurable gap between phrases');

    // Bounced navigation retires even the notes scheduled just ahead of the audio clock.
    for (const profile of ['journey','workshop','home','workshop']) await config({profile});
    await page.waitForTimeout(760);
    assert.equal((await snapshot()).retiringVoices, 0);
    const beforeHidden = await snapshot();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {value:true, configurable:true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await wait(() => !JourneyAtmosphere.snapshot().running);
    const hidden = await snapshot();
    assert.equal(hidden.voices, 0);
    assert.equal(hidden.scheduled, false);
    await config({profile:'home', night:true});
    await page.waitForTimeout(250);
    const hiddenSignal = await measure(page, 220);
    assert(hiddenSignal.peak < .0001, 'background buffer produces silence');
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await wait(() => JourneyAtmosphere.snapshot().running && JourneyAtmosphere.snapshot().voices > 0);
    const resumed = await snapshot();
    assert.equal(resumed.profile, 'home');
    assert.equal(resumed.phraseGeneration, beforeHidden.phraseGeneration + 1);
    assert.equal(resumed.retiringVoices, 0);
    await page.locator('button').click();
    await wait(() => !JourneyAtmosphere.snapshot().running);
    assert.equal((await snapshot()).scheduled, false);
    await page.waitForTimeout(300);
    const muted = await measure(page, 180);
    assert(muted.peak < .0001);

    // Verify the actual context race when a pause and immediate resume occur in the same task.
    await page.locator('button').click();
    await wait(() => JourneyAtmosphere.snapshot().running && JourneyAtmosphere.snapshot().voices > 0);
    await page.evaluate(() => {
      JourneyAtmosphere.configure({active:false});
      JourneyAtmosphere.configure({active:true});
    });
    await page.waitForTimeout(800);
    assert((await snapshot()).scheduled && (await snapshot()).running);
    // A resumed phrase may start in a rest; measure a full home phrase.
    const restoredSignal = await measure(page, 8200);
    assert(restoredSignal.rms > .0005);

    const recording = await stopAudioCapture(page, path.join(out, 'three-rooms-live.webm'));
    assert.equal(recording.gameContexts, 1);
    assert(recording.bytes > 10000);
    assert.deepEqual(recording.errors, []);
    assert.deepEqual(errors, []);
    const result = {silentDefault:true,trustedUnlock:true,distinctProfiles:['journey','home','workshop'],
      samePhraseAcrossDialogue:true,duckRatio:lowered.musicTarget / homeEntry.musicTarget,
      rainInsideRatio:homeEntry.rainTarget / entry.rainTarget,tailCleared:true,hidden,muted,
      signal:{rain,atHome,workshop,hidden:hiddenSignal,muted,restored:restoredSignal},recording,errors};
    await fs.writeFile(path.join(out,'verification.json'), JSON.stringify(result,null,2));
    console.log('PASS real browser audio: mute, rain, room, workshop rests, tails, hidden silence, resume and capture');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
