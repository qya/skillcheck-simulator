import { Settings, Stats, ArcadeProgress, Difficulty, ShareFormat, Achievement, Result, SessionRecord, GameMode } from './types'

export const TAU = Math.PI * 2
export const STORAGE_KEY = 'dbd-skill-check-trainer'

export const initialSettings: Settings = {
  speed: 5,
  zone: 5,
  zoneTotal: 1,
  overcharge: false,
  continuation: false,
  randomStart: false,
  autoSpawn: true,
  stopwatch: false,
  theme: 'vd',
  generatorMusic: false,
  failThreshold: true,
}

export const initialStats: Stats = {
  total: 0,
  success: 0,
  great: 0,
  miss: 0,
  streak: 0,
  best: 0,
  timePlayed: 0,
}

export const initialArcade: ArcadeProgress = {
  level: 1,
  score: 0,
  lives: 3,
  progress: 0,
  highScore: 0,
  highestLevel: 1,
}

export const difficulties: Difficulty[] = ['easy', 'hard', 'pro', 'extreme']

export const shareFormats: { id: ShareFormat; label: string; size: string; width: number; height: number }[] = [
  { id: 'portrait', label: 'Portrait', size: '1080 × 1350', width: 1080, height: 1350 },
  { id: 'landscape', label: 'Landscape', size: '1200 × 630', width: 1200, height: 630 },
  { id: 'card', label: 'Square Card', size: '1080 × 1080', width: 1080, height: 1080 },
  { id: 'story', label: 'Story', size: '1080 × 1920', width: 1080, height: 1920 },
]

export const achievements: Achievement[] = [
  { id: 'first-blood', icon: 'fa-droplet', title: 'First Blood', description: 'Complete your first skill check', target: 1, value: stats => stats.total },
  { id: 'steady-hands', icon: 'fa-hand', title: 'Steady Hands', description: 'Reach a 5 hit streak', target: 5, value: stats => stats.best },
  { id: 'great-timing', icon: 'fa-bolt', title: 'Great Timing', description: 'Land 10 Great checks', target: 10, value: stats => stats.great },
  { id: 'survivor', icon: 'fa-fire', title: 'Survivor', description: 'Complete 50 skill checks', target: 50, value: stats => stats.total },
  { id: 'untouchable', icon: 'fa-crown', title: 'Untouchable', description: 'Reach a 20 hit streak', target: 20, value: stats => stats.best },
  { id: 'veteran', icon: 'fa-skull', title: 'Veteran', description: 'Complete 250 skill checks', target: 250, value: stats => stats.total },
]

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      mode: (saved.mode === 'arcade' ? 'arcade' : 'play') as 'play' | 'arcade',
      difficulty: (difficulties.includes(saved.difficulty) ? saved.difficulty : 'hard') as Difficulty,
      playStats: { ...initialStats, ...(saved.playStats ?? saved.stats) } as Stats,
      arcadeStats: { ...initialStats, ...saved.arcadeStats } as Stats,
      arcade: { ...initialArcade, ...saved.arcade } as ArcadeProgress,
      settings: { ...initialSettings, ...saved.settings } as Settings,
      playHistory: (Array.isArray(saved.playHistory ?? saved.history) ? saved.playHistory ?? saved.history : []).filter((item: string) => ['success', 'great', 'miss'].includes(item)).slice(-50) as Result[],
      arcadeHistory: (Array.isArray(saved.arcadeHistory) ? saved.arcadeHistory : []).filter((item: string) => ['success', 'great', 'miss'].includes(item)).slice(-50) as Result[],
      playSessions: (Array.isArray(saved.playSessions) ? saved.playSessions : []).slice(-30) as SessionRecord[],
      arcadeSessions: (Array.isArray(saved.arcadeSessions) ? saved.arcadeSessions : []).slice(-30) as SessionRecord[],
    }
  } catch {
    return {
      mode: 'play' as 'play' | 'arcade',
      difficulty: 'hard' as Difficulty,
      playStats: initialStats,
      arcadeStats: initialStats,
      arcade: initialArcade,
      settings: initialSettings,
      playHistory: [] as Result[],
      arcadeHistory: [] as Result[],
      playSessions: [] as SessionRecord[],
      arcadeSessions: [] as SessionRecord[],
    }
  }
}

export function arcadeSettings(level: number, difficulty: Difficulty): Settings {
  const tuning = {
    easy: { speed: -2, zone: 2, overcharge: .5, randomStart: .5 },
    hard: { speed: 0, zone: 0, overcharge: 1, randomStart: 1 },
    pro: { speed: 2, zone: -2, overcharge: 1.3, randomStart: 1.25 },
    extreme: { speed: 4, zone: -3, overcharge: 1.7, randomStart: 1.6 },
  }[difficulty]
  const speed = Math.max(1, 3 + Math.min(level - 1, 15) + tuning.speed)
  const zone = Math.max(1, 10 - level + tuning.zone)
  const overchargeChance = Math.min(.95, (.18 + level * .07) * tuning.overcharge)
  const randomStartChance = Math.min(1, (.3 + level * .08) * tuning.randomStart)
  return {
    speed,
    zone,
    zoneTotal: 1,
    overcharge: (difficulty === 'extreme' || level >= 3) && Math.random() < overchargeChance,
    continuation: false,
    randomStart: false,
    autoSpawn: true,
    stopwatch: false,
    theme: 'vd',
    generatorMusic: false,
    failThreshold: true,
  } as Settings
}

export const norm = (angle: number) => ((angle % TAU) + TAU) % TAU

export const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map(value => String(value).padStart(2, '0')).join(':')
}

export const inRange = (angle: number, start: number, size: number) => {
  const a = norm(angle)
  const s = norm(start)
  const end = s + size
  return end <= TAU ? a >= s && a <= end : a >= s || a <= end - TAU
}

export const overlaps = (s1: number, z1: number, s2: number, z2: number) => {
  for (let t = 0; t <= 1; t += .08) {
    if (inRange(s1 + z1 * t, s2, z2) || inRange(s2 + z2 * t, s1, z1)) return true
  }
  return false
}

export function drawShareCard(
  canvas: HTMLCanvasElement,
  format: (typeof shareFormats)[number],
  mode: GameMode,
  stats: Stats,
  history: Result[],
  arcade: ArcadeProgress,
  theme?: 'default' | 'dbd' | 'vd'
) {
  const { width, height } = format
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const landscape = width / height > 1.4
  const pad = Math.round(Math.min(width, height) * .075)
  const hits = stats.success + stats.great
  const accuracy = stats.total ? Math.round((hits / stats.total) * 100) : 0
  const unlocked = achievements.filter(item => item.value(stats) >= item.target).length
  const background = ctx.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#171721')
  background.addColorStop(.55, '#0a0a0f')
  background.addColorStop(1, '#210d13')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = 'rgba(196,30,30,.16)'
  ctx.lineWidth = 2
  for (let x = -height; x < width + height; x += 90) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + height, height)
    ctx.stroke()
  }
  ctx.fillStyle = '#c41e1e'
  ctx.fillRect(0, 0, 14, height)
  ctx.font = `500 ${Math.round(width * .021)}px Barlow`
  ctx.letterSpacing = '5px'
  ctx.fillStyle = '#737386'
  const title = theme === 'dbd' ? 'DEATH BY DAYLIGHT' : theme === 'vd' ? 'VIOLENT DISTRICT' : 'CLOCK WISE'
  ctx.fillText(title, pad, pad)

  ctx.textAlign = 'right'
  ctx.font = `${Math.round(width * .013)}px Barlow`
  ctx.letterSpacing = '1px'
  ctx.fillStyle = '#737386'
  ctx.fillText('Check your too on https://skillcheck.ga.ci', width - pad, pad)
  ctx.textAlign = 'left'
  ctx.font = `${Math.round(width * .068)}px "Bebas Neue"`
  ctx.letterSpacing = '3px'
  ctx.fillStyle = '#e8e8ec'
  ctx.fillText('SKILL ', pad, pad + width * .075)
  const skillWidth = ctx.measureText('SKILL ').width
  ctx.fillStyle = '#c41e1e'
  ctx.fillText('CHECK', pad + skillWidth, pad + width * .075)
  ctx.font = `${Math.round(width * .018)}px Barlow`
  ctx.letterSpacing = '3px'
  ctx.fillStyle = '#8b8b9e'
  ctx.fillText(`${mode.toUpperCase()} PERFORMANCE`, pad, pad + width * .115)

  const contentTop = pad + width * .16
  const ringX = landscape ? width * .29 : width / 2
  const ringY = contentTop + (landscape ? 105 : 165)
  const radius = landscape ? 92 : 135
  ctx.lineWidth = radius * .14
  ctx.strokeStyle = '#242430'
  ctx.beginPath()
  ctx.arc(ringX, ringY, radius, 0, TAU)
  ctx.stroke()
  ctx.strokeStyle = '#3ddc84'
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(ringX, ringY, radius, -Math.PI / 2, -Math.PI / 2 + (TAU * accuracy) / 100)
  ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#e8e8ec'
  ctx.font = `${Math.round(radius * .62)}px "Bebas Neue"`
  ctx.fillText(`${accuracy}%`, ringX, ringY + 18)
  ctx.fillStyle = '#737386'
  ctx.font = `${Math.round(radius * .15)}px Barlow`
  ctx.letterSpacing = '3px'
  ctx.fillText('ACCURACY', ringX, ringY + 52)
  ctx.textAlign = 'left'

  const metricsY = landscape ? contentTop + 25 : ringY + radius + 90
  const metricX = landscape ? width * .5 : pad
  const metricWidth = landscape ? width * .41 : width - pad * 2
  const metrics = [
    ['TOTAL', stats.total, '#e8e8ec'],
    ['GOOD', stats.success, '#3ddc84'],
    ['GREAT', stats.great, '#f0c040'],
    ['MISSED', stats.miss, '#d43a3a'],
  ]
  metrics.forEach(([label, value, color], index) => {
    const cell = metricWidth / 4
    const x = metricX + index * cell
    ctx.fillStyle = '#737386'
    ctx.font = `${Math.round(width * .014)}px Barlow`
    ctx.letterSpacing = '2px'
    ctx.fillText(String(label), x, metricsY)
    ctx.fillStyle = String(color)
    ctx.font = `${Math.round(width * .047)}px "Bebas Neue"`
    ctx.fillText(String(value), x, metricsY + width * .052)
  })

  const graphY = landscape ? height - pad - 115 : metricsY + width * .16
  const graphH = landscape ? 95 : Math.min(180, height * .11)
  const recent = history.slice(-24)
  ctx.fillStyle = '#737386'
  ctx.font = `${Math.round(width * .014)}px Barlow`
  ctx.letterSpacing = '2px'
  ctx.fillText('RECENT FORM', pad, graphY - 25)
  const barGap = 8
  const barWidth = (width - pad * 2 - barGap * 23) / 24
  recent.forEach((item, index) => {
    const h = item === 'great' ? graphH : item === 'success' ? graphH * .65 : graphH * .28
    ctx.fillStyle =
      item === 'great' ? '#f0c040' : item === 'success' ? '#3ddc84' : '#c41e1e'
    ctx.fillRect(
      pad + index * (barWidth + barGap),
      graphY + graphH - h,
      Math.max(5, barWidth),
      h
    )
  })

  const footerY = height - pad
  const pace = stats.timePlayed ? (stats.total / (stats.timePlayed / 60)).toFixed(1) : '0.0'
  ctx.fillStyle = '#565669'
  ctx.font = `${Math.round(width * .014)}px Barlow`
  ctx.letterSpacing = '1px'
  ctx.fillText(
    `TIME  ${formatDuration(stats.timePlayed)}     PACE  ${pace}/MIN     STREAK  ${stats.best}${mode === 'arcade'
      ? `     HIGH SCORE  ${arcade.highScore.toLocaleString()}     LEVEL  ${arcade.highestLevel}`
      : `     ACHIEVEMENTS  ${unlocked}/${achievements.length}`
    }`,
    pad,
    footerY
  )
  ctx.textAlign = 'right'
  ctx.fillStyle = '#c41e1e'
  ctx.font = `${Math.round(width * .018)}px "Bebas Neue"`
  ctx.fillText('KEEP SURVIVING', width - pad, footerY)
  ctx.textAlign = 'left'
}
