/* Test-only: mirror the game's real AudioDestination inputs, including wood sounds.
 * Never create/resume the game's contexts. The recorder is armed before navigation
 * but does not open its own silent mixing context until game audio actually exists.
 */
const fs = require('node:fs/promises');
const path = require('node:path');

function installAudioCapture() {
  if (window.__journeyAudioCapture) return;
  const native = AudioNode.prototype.connect;
  const outputs = new Map();
  const epoch = () => performance.timeOrigin + performance.now();
  let mixer, destination, meter, recording, timing, opening;
  let chunks = [], armed = false;
  const errors = [];

  function mirror(node) {
    if (outputs.get(node)) return;
    const bridge = node.context.createMediaStreamDestination();
    const inlet = mixer.createMediaStreamSource(bridge.stream);
    native.call(node, bridge);
    native.call(inlet, destination);
    native.call(inlet, meter);
    outputs.set(node, {bridge, inlet});
  }

  async function begin() {
    if (!armed || !outputs.size || recording || opening) return;
    opening = true;
    try {
      if (!mixer) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        mixer = new Audio();
        destination = mixer.createMediaStreamDestination();
        meter = mixer.createAnalyser();
        meter.fftSize = 2048;
      }
      for (const node of outputs.keys()) mirror(node);
      await mixer.resume();
      if (!armed) return;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(MediaRecorder.isTypeSupported.bind(MediaRecorder));
      recording = new MediaRecorder(destination.stream, mimeType ? {mimeType, audioBitsPerSecond:112000} : {});
      chunks = [];
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recording.start(250);
      timing.recordedAtUtcMs = epoch();
    } catch (error) {
      errors.push(String(error));
    } finally {
      opening = false;
    }
  }

  AudioNode.prototype.connect = function (target, ...ports) {
    const result = native.call(this, target, ...ports);
    // Offline renders are reference samples, not an audible playback destination.
    if (typeof this.context.createMediaStreamDestination === 'function' && target === this.context.destination && this.context !== mixer && !outputs.has(this)) {
      outputs.set(this, null);
      if (mixer) mirror(this);
      if (armed) void begin();
    }
    return result;
  };

  window.__journeyAudioCapture = {
    start() {
      if (armed) throw Error('Already recording');
      timing = {requestedAtUtcMs:epoch()};
      armed = true;
      void begin();
      return {...timing};
    },
    status() {
      return {...timing, state:recording?.state || 'waiting-for-game-sound',
        gameOutputs:outputs.size, errors:errors.slice()};
    },
    meter() {
      if (!meter) return {rms:0, peak:0};
      const data = new Float32Array(meter.fftSize);
      meter.getFloatTimeDomainData(data);
      let sum = 0, peak = 0;
      for (const sample of data) {
        sum += sample * sample;
        peak = Math.max(peak, Math.abs(sample));
      }
      return {rms:Math.sqrt(sum / data.length), peak};
    },
    async stop() {
      if (!recording) throw Error('No game audio has started: ' + errors.join(', '));
      armed = false;
      timing.stoppedAtUtcMs = epoch();
      await new Promise((resolve, reject) => {
        recording.onstop = resolve;
        recording.onerror = event => reject(event.error);
        recording.stop();
      });
      const blob = new Blob(chunks, {type:recording.mimeType});
      recording = null;
      chunks = [];
      await mixer.suspend();
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
      return {data, info:{...timing, leadingSilenceMs:timing.recordedAtUtcMs - timing.requestedAtUtcMs,
        gameOutputs:outputs.size, gameContexts:new Set([...outputs.keys()].map(n => n.context)).size,
        sampleRate:mixer.sampleRate, bytes:blob.size, mimeType:blob.type, errors:errors.slice()}};
    }
  };
}

async function armAudioCapture(page) {
  await page.addInitScript(installAudioCapture);
  await page.evaluate(installAudioCapture);
}

async function startAudioCapture(page) {
  return page.evaluate(() => window.__journeyAudioCapture.start());
}

async function stopAudioCapture(page, audioPath) {
  const {data, info} = await page.evaluate(() => window.__journeyAudioCapture.stop());
  await fs.mkdir(path.dirname(audioPath), {recursive:true});
  await fs.writeFile(audioPath, Buffer.from(data, 'base64'));
  return info;
}

module.exports = {armAudioCapture, startAudioCapture, stopAudioCapture};
