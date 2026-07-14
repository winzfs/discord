let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

type TrainingSound = "shot" | "headshot" | "body" | "miss";
const soundBuffers: Partial<Record<TrainingSound, AudioBuffer>> = {};

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (audioContext === null) audioContext = new window.AudioContext({ latencyHint: "interactive" });
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function getOutput(context: AudioContext): AudioNode {
  if (masterGain !== null && compressor !== null) return masterGain;

  masterGain = context.createGain();
  compressor = context.createDynamicsCompressor();
  masterGain.gain.setValueAtTime(0.86, context.currentTime);
  compressor.threshold.setValueAtTime(-18, context.currentTime);
  compressor.knee.setValueAtTime(16, context.currentTime);
  compressor.ratio.setValueAtTime(4, context.currentTime);
  compressor.attack.setValueAtTime(0.002, context.currentTime);
  compressor.release.setValueAtTime(0.08, context.currentTime);
  masterGain.connect(compressor);
  compressor.connect(context.destination);
  return masterGain;
}

function renderBuffer(
  context: AudioContext,
  durationSeconds: number,
  render: (time: number, progress: number, index: number) => number,
): AudioBuffer {
  const length = Math.max(1, Math.ceil(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    const time = index / context.sampleRate;
    const progress = index / Math.max(1, length - 1);
    channel[index] = Math.max(-1, Math.min(1, render(time, progress, index)));
  }
  return buffer;
}

function buildSoundBuffers(context: AudioContext): void {
  if (!soundBuffers.shot) {
    let filteredNoise = 0;
    soundBuffers.shot = renderBuffer(context, 0.095, (time, progress) => {
      const envelope = Math.pow(1 - progress, 2.3);
      const white = Math.random() * 2 - 1;
      filteredNoise = filteredNoise * 0.38 + white * 0.62;
      const low = Math.sin(2 * Math.PI * (145 - 88 * progress) * time) * 0.48;
      const click = Math.sin(2 * Math.PI * (1_850 - 900 * progress) * time)
        * Math.pow(1 - progress, 8) * 0.18;
      return (filteredNoise * 0.9 + low + click) * envelope * 0.42;
    });
  }

  if (!soundBuffers.headshot) {
    soundBuffers.headshot = renderBuffer(context, 0.105, (time, progress) => {
      const envelope = Math.pow(1 - progress, 2.1);
      const primary = Math.sin(2 * Math.PI * (1_280 + 520 * progress) * time) * 0.32;
      const ping = progress > 0.2
        ? Math.sin(2 * Math.PI * 2_180 * time) * Math.pow(1 - progress, 3) * 0.16
        : 0;
      return (primary + ping) * envelope;
    });
  }

  if (!soundBuffers.body) {
    soundBuffers.body = renderBuffer(context, 0.075, (time, progress) => (
      Math.sin(2 * Math.PI * (540 - 150 * progress) * time)
      * Math.pow(1 - progress, 2.2) * 0.22
    ));
  }

  if (!soundBuffers.miss) {
    soundBuffers.miss = renderBuffer(context, 0.11, (time, progress) => {
      const frequency = 160 - 55 * progress;
      const square = Math.sin(2 * Math.PI * frequency * time) >= 0 ? 1 : -1;
      return square * Math.pow(1 - progress, 2.4) * 0.1;
    });
  }
}

function playBuffer(kind: TrainingSound, volume = 1): void {
  const context = getContext();
  if (context === null) return;
  buildSoundBuffers(context);

  const buffer = soundBuffers[kind];
  if (!buffer) return;

  const source = context.createBufferSource();
  const gain = context.createGain();
  gain.gain.setValueAtTime(volume, context.currentTime);
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(getOutput(context));
  source.start();
}

export function prepareTrainingAudio(): void {
  const context = getContext();
  if (context === null) return;
  getOutput(context);
  buildSoundBuffers(context);
}

export function playTrainingShot(): void {
  playBuffer("shot");
}

export function playTrainingHit(headshot = false): void {
  playBuffer(headshot ? "headshot" : "body");
}

export function playTrainingMiss(): void {
  playBuffer("miss");
}
