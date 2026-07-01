// Synthesizes a short "crack + pour" sound with the Web Audio API so we don't
// need to ship a binary audio asset.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function playCrackAndPour() {
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;

  // The "crack": a quick high-pitched click.
  const crackOsc = audio.createOscillator();
  const crackGain = audio.createGain();
  crackOsc.type = "square";
  crackOsc.frequency.setValueAtTime(900, now);
  crackOsc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
  crackGain.gain.setValueAtTime(0.25, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  crackOsc.connect(crackGain).connect(audio.destination);
  crackOsc.start(now);
  crackOsc.stop(now + 0.1);

  // The "pour": filtered white noise fading in and out.
  const bufferSize = audio.sampleRate * 0.6;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;

  const pourGain = audio.createGain();
  const pourStart = now + 0.08;
  pourGain.gain.setValueAtTime(0, pourStart);
  pourGain.gain.linearRampToValueAtTime(0.18, pourStart + 0.1);
  pourGain.gain.linearRampToValueAtTime(0, pourStart + 0.55);

  noise.connect(filter).connect(pourGain).connect(audio.destination);
  noise.start(pourStart);
  noise.stop(pourStart + 0.6);
}

export function vibrate(pattern: number | number[] = 40) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
