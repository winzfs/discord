let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let shotNoiseBuffer: AudioBuffer | null = null;

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
  masterGain.gain.setValueAtTime(0.88, context.currentTime);
  compressor.threshold.setValueAtTime(-18, context.currentTime);
  compressor.knee.setValueAtTime(18, context.currentTime);
  compressor.ratio.setValueAtTime(5, context.currentTime);
  compressor.attack.setValueAtTime(0.002, context.currentTime);
  compressor.release.setValueAtTime(0.09, context.currentTime);
  masterGain.connect(compressor);
  compressor.connect(context.destination);
  return masterGain;
}

function createNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < channel.length; index += 1) {
    const progress = index / channel.length;
    const white = Math.random() * 2 - 1;
    previous = previous * 0.32 + white * 0.68;
    channel[index] = previous * Math.pow(1 - progress, 1.8);
  }
  return buffer;
}

function getShotNoiseBuffer(context: AudioContext): AudioBuffer {
  if (shotNoiseBuffer === null) shotNoiseBuffer = createNoiseBuffer(context, 0.095);
  return shotNoiseBuffer;
}

export function prepareTrainingAudio(): void {
  const context = getContext();
  if (context === null) return;
  getOutput(context);
  getShotNoiseBuffer(context);
}

function playTone(
  context: AudioContext,
  options: {
    frequency: number;
    endFrequency?: number;
    duration: number;
    volume: number;
    type?: OscillatorType;
    delay?: number;
  },
): void {
  const startsAt = context.currentTime + (options.delay ?? 0);
  const endsAt = startsAt + options.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.frequency, startsAt);
  if (options.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), endsAt);
  }

  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(options.volume, startsAt + Math.min(0.008, options.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);

  oscillator.connect(gain);
  gain.connect(getOutput(context));
  oscillator.start(startsAt);
  oscillator.stop(endsAt + 0.02);
}

export function playTrainingShot(): void {
  const context = getContext();
  if (context === null) return;

  const startsAt = context.currentTime;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = getShotNoiseBuffer(context);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1_450, startsAt);
  filter.frequency.exponentialRampToValueAtTime(720, startsAt + 0.075);
  filter.Q.setValueAtTime(0.72, startsAt);
  gain.gain.setValueAtTime(0.15, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.085);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getOutput(context));
  source.start(startsAt, Math.random() * 0.008);
  source.stop(startsAt + 0.09);

  playTone(context, {
    frequency: 145,
    endFrequency: 54,
    duration: 0.09,
    volume: 0.095,
    type: "sawtooth",
  });
  playTone(context, {
    frequency: 1_820,
    endFrequency: 880,
    duration: 0.028,
    volume: 0.028,
    type: "triangle",
  });
}

export function playTrainingHit(headshot = false): void {
  const context = getContext();
  if (context === null) return;

  if (headshot) {
    playTone(context, { frequency: 1_280, endFrequency: 1_760, duration: 0.095, volume: 0.075 });
    playTone(context, { frequency: 2_180, duration: 0.055, volume: 0.04, delay: 0.025 });
    return;
  }

  playTone(context, {
    frequency: 540,
    endFrequency: 390,
    duration: 0.07,
    volume: 0.055,
    type: "triangle",
  });
}

export function playTrainingMiss(): void {
  const context = getContext();
  if (context === null) return;
  playTone(context, {
    frequency: 160,
    endFrequency: 105,
    duration: 0.11,
    volume: 0.035,
    type: "square",
  });
}