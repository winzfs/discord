let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (audioContext === null) audioContext = new window.AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function makeNoiseBuffer(context: AudioContext, durationSeconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    const fade = 1 - index / channel.length;
    channel[index] = (Math.random() * 2 - 1) * fade;
  }
  return buffer;
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
  gain.gain.exponentialRampToValueAtTime(options.volume, startsAt + Math.min(0.012, options.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
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

  source.buffer = makeNoiseBuffer(context, 0.07);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1_250, startsAt);
  filter.Q.setValueAtTime(0.8, startsAt);
  gain.gain.setValueAtTime(0.12, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.07);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(startsAt);

  playTone(context, {
    frequency: 132,
    endFrequency: 58,
    duration: 0.085,
    volume: 0.09,
    type: "sawtooth",
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
