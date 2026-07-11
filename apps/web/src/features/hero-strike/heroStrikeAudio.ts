export type HeroStrikeSound =
  | "pulse-shot"
  | "scatter-shot"
  | "rail-shot"
  | "hit"
  | "critical"
  | "kill"
  | "elite-kill"
  | "player-hit"
  | "blink"
  | "flow-rush"
  | "boss-break"
  | "level-up";

let context: AudioContext | null = null;
const lastPlayed = new Map<HeroStrikeSound, number>();

const SOUND_GAPS: Partial<Record<HeroStrikeSound, number>> = {
  "pulse-shot": 0.055,
  "scatter-shot": 0.09,
  "hit": 0.035,
  "critical": 0.055,
};

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  context ??= new AudioContextClass();
  return context;
}

export function unlockHeroStrikeAudio() {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
}

function canPlay(audio: AudioContext, sound: HeroStrikeSound) {
  const now = audio.currentTime;
  const gap = SOUND_GAPS[sound] ?? 0;
  const previous = lastPlayed.get(sound) ?? -Infinity;
  if (now - previous < gap) return false;
  lastPlayed.set(sound, now);
  return true;
}

function tone(
  audio: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  endFrequency = frequency,
  wave: OscillatorType = "sine",
  delay = 0,
) {
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(Math.max(40, frequency), start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + duration);
  gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

function noise(audio: AudioContext, duration: number, volume: number, delay = 0) {
  const frameCount = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, frameCount, audio.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
  }
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(gain);
  gain.connect(audio.destination);
  source.start(start);
}

export function playHeroStrikeSound(sound: HeroStrikeSound, intensity = 1) {
  const audio = getContext();
  if (!audio || audio.state !== "running" || !canPlay(audio, sound)) return;
  const strength = Math.max(0.35, Math.min(1.4, intensity));

  if (sound === "pulse-shot") {
    tone(audio, 420, 0.045, 0.018 * strength, 230, "square");
  } else if (sound === "scatter-shot") {
    noise(audio, 0.075, 0.032 * strength);
    tone(audio, 180, 0.08, 0.018 * strength, 90, "sawtooth");
  } else if (sound === "rail-shot") {
    tone(audio, 1120, 0.14, 0.035 * strength, 150, "sawtooth");
    tone(audio, 220, 0.18, 0.026 * strength, 70, "square");
  } else if (sound === "hit") {
    tone(audio, 250, 0.032, 0.012 * strength, 145, "square");
  } else if (sound === "critical") {
    tone(audio, 760, 0.075, 0.022 * strength, 390, "triangle");
  } else if (sound === "kill") {
    noise(audio, 0.07, 0.018 * strength);
    tone(audio, 170, 0.09, 0.022 * strength, 65, "sawtooth");
  } else if (sound === "elite-kill") {
    noise(audio, 0.16, 0.04 * strength);
    tone(audio, 280, 0.18, 0.035 * strength, 75, "square");
    tone(audio, 560, 0.12, 0.02 * strength, 210, "triangle", 0.04);
  } else if (sound === "player-hit") {
    noise(audio, 0.2, 0.055 * strength);
    tone(audio, 150, 0.22, 0.04 * strength, 48, "sawtooth");
  } else if (sound === "blink") {
    tone(audio, 260, 0.11, 0.03 * strength, 1180, "sine");
    tone(audio, 700, 0.08, 0.02 * strength, 1320, "triangle", 0.04);
  } else if (sound === "flow-rush") {
    tone(audio, 220, 0.28, 0.04 * strength, 880, "sawtooth");
    tone(audio, 440, 0.22, 0.03 * strength, 1320, "square", 0.06);
  } else if (sound === "boss-break") {
    noise(audio, 0.28, 0.065 * strength);
    tone(audio, 95, 0.35, 0.055 * strength, 42, "sawtooth");
    tone(audio, 520, 0.18, 0.03 * strength, 130, "square", 0.05);
  } else if (sound === "level-up") {
    tone(audio, 440, 0.12, 0.026 * strength, 660, "triangle");
    tone(audio, 660, 0.16, 0.026 * strength, 990, "triangle", 0.1);
  }
}
