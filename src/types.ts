export type Phase = 'idle' | 'active' | 'frozen'
export type Result = 'success' | 'great' | 'miss'
export type GameMode = 'play' | 'arcade'
export type Difficulty = 'easy' | 'hard' | 'pro' | 'extreme'
export type ShareFormat = 'portrait' | 'landscape' | 'card' | 'story'

export type Settings = {
  speed: number
  zone: number
  zoneTotal: number
  overcharge: boolean
  continuation: boolean
  randomStart: boolean
  autoSpawn: boolean
  stopwatch: boolean
  theme: 'default' | 'dbd' | 'vd'
  generatorMusic: boolean
  failThreshold: boolean
}

export type Zone = {
  start: number
  size: number
  greatStart: number
  greatSize: number
}

export type Stats = {
  total: number
  success: number
  great: number
  miss: number
  streak: number
  best: number
  timePlayed: number
}

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  decay: number
  size: number
  color: string
}

export type HitRing = {
  x: number
  y: number
  r: number
  maxR: number
  life: number
  color: string
}

export type Achievement = {
  id: string
  icon: string
  title: string
  description: string
  target: number
  value: (stats: Stats) => number
}

export type ArcadeProgress = {
  level: number
  score: number
  lives: number
  progress: number
  highScore: number
  highestLevel: number
}

export type TimerStatus = 'waiting' | 'running' | 'paused' | 'stopped'

export type SessionRecord = {
  id: string
  endedAt: string
  mode: GameMode
  duration: number
  total: number
  success: number
  great: number
  miss: number
  bestStreak: number
  score?: number
  level?: number
  difficulty?: Difficulty
}

export type ActiveSession = Omit<SessionRecord, 'id' | 'endedAt' | 'duration'> & { streak: number }

export type SavedSession = {
  mode: GameMode
  difficulty?: Difficulty
  session: ActiveSession
  arcade?: ArcadeProgress
  timer: {
    accumulated: number
  }
}
