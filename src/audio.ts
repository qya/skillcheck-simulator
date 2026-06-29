let audioCtx: AudioContext | null = null

interface SoundConfig {
  theme: 'default' | 'dbd' | 'vd'
  generatorMusic: boolean
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    // @ts-expect-error - webkitAudioContext not in standard TS types
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Helper to create noise for fallback/engine sounds
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

// Cache decoded audio buffers for static MP3 files to ensure zero latency
const staticBufferCache: Record<string, AudioBuffer | null> = {}

async function getStaticAudioBuffer(ctx: AudioContext, path: string): Promise<AudioBuffer | null> {
  if (staticBufferCache[path]) {
    return staticBufferCache[path]
  }
  try {
    const response = await fetch(path)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    staticBufferCache[path] = buffer
    return buffer
  } catch (err) {
    console.error(`Error loading static sound: ${path}`, err)
    return null
  }
}

async function playStaticSound(ctx: AudioContext, path: string): Promise<boolean> {
  const buffer = await getStaticAudioBuffer(ctx, path)
  if (buffer) {
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    return true
  }
  return false
}

// --- Generator Sound Loop ---
let generatorNodes: {
  osc?: OscillatorNode
  noise?: AudioBufferSourceNode
  lfo?: OscillatorNode
  staticSource?: AudioBufferSourceNode
  mainGain: GainNode
} | null = null

export async function startGeneratorSound(theme: 'default' | 'dbd' | 'vd') {
  const ctx = getAudioContext()
  if (!ctx || generatorNodes) return

  const now = ctx.currentTime

  const mainGain = ctx.createGain()
  mainGain.gain.setValueAtTime(0.0, now)
  mainGain.gain.linearRampToValueAtTime(0.20, now + 0.5) // fade in
  mainGain.connect(ctx.destination)

  if (theme === 'dbd' || theme === 'vd') {
    // Attempt to load static backsound file
    const buffer = await getStaticAudioBuffer(ctx, `/sfx/${theme}/backsound.mp3`)
    if (buffer) {
      const staticSource = ctx.createBufferSource()
      staticSource.buffer = buffer
      staticSource.loop = true
      staticSource.connect(mainGain)
      staticSource.start(now)
      generatorNodes = { staticSource, mainGain }
      return
    }
  }

  // Fallback to real-time synthesis (Default/VD or failed load)
  // 1. Motor hum (low saw wave)
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(50, now)

  // 2. Mechanical hiss (white noise)
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx, 2.0)
  noise.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(140, now)
  filter.Q.setValueAtTime(1.0, now)

  // 3. Modulator (LFO) for the generator chug chug rhythm
  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(5.8, now)

  const lfoGain = ctx.createGain()
  lfoGain.gain.setValueAtTime(0.08, now)

  // 4. Gains
  const oscGain = ctx.createGain()
  oscGain.gain.setValueAtTime(0.06, now)

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.08, now)

  // Connect LFO modulation
  lfo.connect(lfoGain)
  lfoGain.connect(oscGain.gain)
  lfoGain.connect(noiseGain.gain)

  // Signal routing
  osc.connect(oscGain)
  noise.connect(filter)
  filter.connect(noiseGain)

  oscGain.connect(mainGain)
  noiseGain.connect(mainGain)

  // Start sound sources
  osc.start(now)
  noise.start(now)
  lfo.start(now)

  generatorNodes = {
    osc,
    noise,
    lfo,
    mainGain
  }
}

export function stopGeneratorSound() {
  if (!generatorNodes) return
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  const nodes = generatorNodes
  try {
    nodes.mainGain.gain.cancelScheduledValues(now)
    nodes.mainGain.gain.setValueAtTime(nodes.mainGain.gain.value, now)
    nodes.mainGain.gain.linearRampToValueAtTime(0, now + 0.3)
    setTimeout(() => {
      try {
        if (nodes.osc) nodes.osc.stop()
        if (nodes.noise) nodes.noise.stop()
        if (nodes.lfo) nodes.lfo.stop()
        if (nodes.staticSource) nodes.staticSource.stop()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        // nodes may already be stopped
      }
    }, 350)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    // gain may already be cancelled
  }
  generatorNodes = null
}

// Play Session Start SFX (once when starting play session)
export async function playSessionStartSound(theme: 'default' | 'dbd' | 'vd') {
  const ctx = getAudioContext()
  if (!ctx) return

  if (theme === 'dbd' || theme === 'vd') {
    const now = ctx.currentTime
    const firstBuf = await getStaticAudioBuffer(ctx, `/sfx/${theme}/first.mp3`)
    const startBuf = await getStaticAudioBuffer(ctx, `/sfx/${theme}/start.mp3`)

    if (firstBuf) {
      const source1 = ctx.createBufferSource()
      source1.buffer = firstBuf
      source1.connect(ctx.destination)
      source1.start(now)

      if (startBuf) {
        const source2 = ctx.createBufferSource()
        source2.buffer = startBuf
        source2.connect(ctx.destination)
        source2.start(now + firstBuf.duration)
      }
    }
  }
}

// Play Warning SFX
export async function playWarningSound(cfg: SoundConfig) {
  const ctx = getAudioContext()
  if (!ctx) return

  const theme = cfg.theme

  // For DBD and VD, attempt to load static MP3 file first
  if (theme === 'dbd' || theme === 'vd') {
    const success = await playStaticSound(ctx, `/sfx/${theme}/start.mp3`)
    if (success) return
  }

  // Fallback to real-time synthesis
  const now = ctx.currentTime

  if (theme === 'dbd') {
    // DBD Heartbeat / Tension Thump-Thump
    const playThump = (time: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(80, time)
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.12)

      gain.gain.setValueAtTime(0.01, time)
      gain.gain.linearRampToValueAtTime(0.8, time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(time)
      osc.stop(time + 0.12)
    }

    playThump(now)
    playThump(now + 0.15)
  } else if (theme === 'vd') {
    // Roblox high-pitched clean UI beep
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1046.50, now)

    gain.gain.setValueAtTime(0.01, now)
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  } else {
    // Default: Sci-Fi double digital chirp
    const playChirp = (time: number, freq: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.05)

      gain.gain.setValueAtTime(0.01, time)
      gain.gain.linearRampToValueAtTime(0.2, time + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.06)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(time)
      osc.stop(time + 0.06)
    }

    playChirp(now, 800)
    playChirp(now + 0.08, 1000)
  }
}

// Play Hit/Miss SFX
export async function playHitSound(cfg: SoundConfig, result: 'success' | 'great' | 'miss') {
  const ctx = getAudioContext()
  if (!ctx) return

  const theme = cfg.theme

  // For DBD and VD, attempt to load static MP3 file first
  if (theme === 'dbd' || theme === 'vd') {
    const filename = result === 'success' ? 'good' : result
    const success = await playStaticSound(ctx, `/sfx/${theme}/${filename}.mp3`)
    if (success) return
  }

  // Fallback to real-time synthesis
  const now = ctx.currentTime

  if (result === 'great') {
    if (theme === 'dbd') {
      // Metallic High Chime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(1200, now)
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(1800, now)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.6)
      osc2.stop(now + 0.6)
    } else if (theme === 'vd') {
      // Sparkling Roblox Level Up/Success (arpeggio)
      const freqs = [523.25, 659.25, 783.99, 1046.50]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const playTime = now + idx * 0.05

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, playTime)

        gain.gain.setValueAtTime(0.01, playTime)
        gain.gain.linearRampToValueAtTime(0.15, playTime + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.25)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(playTime)
        osc.stop(playTime + 0.25)
      })
    } else {
      // Default: Futuristic sci-fi sparkle (two chime waves)
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, now)
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3)

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(880, now)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.4)
      osc2.stop(now + 0.4)
    }
  } else if (result === 'success') {
    if (theme === 'dbd') {
      // Mechanical dull thud
      const osc = ctx.createOscillator()
      const noiseNode = ctx.createBufferSource()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.linearRampToValueAtTime(60, now + 0.1)

      noiseNode.buffer = createNoiseBuffer(ctx, 0.08)
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(300, now)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

      osc.connect(gain)
      noiseNode.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      noiseNode.start(now)
      osc.stop(now + 0.12)
      noiseNode.stop(now + 0.12)
    } else if (theme === 'vd') {
      // Classic Roblox ding / success click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.04)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else {
      // Default: Warm futuristic synth click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    }
  } else if (result === 'miss') {
    if (theme === 'dbd') {
      // Generator Explosion Sound!
      const noise = ctx.createBufferSource()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()

      const rumble = ctx.createOscillator()
      const rumbleGain = ctx.createGain()

      noise.buffer = createNoiseBuffer(ctx, 0.8)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(800, now)
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.6)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.6, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      rumble.type = 'sawtooth'
      rumble.frequency.setValueAtTime(90, now)
      rumble.frequency.linearRampToValueAtTime(40, now + 0.4)

      rumbleGain.gain.setValueAtTime(0.3, now)
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      rumble.connect(rumbleGain)
      rumbleGain.connect(ctx.destination)

      noise.start(now)
      rumble.start(now)
      noise.stop(now + 0.8)
      rumble.stop(now + 0.8)
    } else if (theme === 'vd') {
      // Roblox synth buzzer
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.linearRampToValueAtTime(80, now + 0.35)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    } else {
      // Default: Tech fail sound (sweep down)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.4)

      gain.gain.setValueAtTime(0.01, now)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.4)
    }
  }
}
