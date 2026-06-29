import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Phase,
  Result,
  GameMode,
  Difficulty,
  Settings,
  Zone,
  Stats,
  Particle,
  HitRing,
  ArcadeProgress,
  TimerStatus,
  SessionRecord,
  ActiveSession,
  SavedSession,
} from './types'
import {
  TAU,
  initialSettings,
  initialStats,
  initialArcade,
  STORAGE_KEY,
  loadProgress,
  arcadeSettings,
  norm,
  inRange,
  overlaps,
} from './utils'
import { ArcadeHUD } from './components/ArcadeHUD'
import { SettingsDrawer } from './components/SettingsDrawer'
import { StatsDrawer } from './components/StatsDrawer'
import { Loader } from './components/Loader'
import { StopwatchWidget } from './components/StopwatchWidget'
import { Header } from './components/Header'
import { StatsCard } from './components/StatsCard'
import { ModePicker } from './components/ModePicker'
import { RestoreSessionDialog } from './components/RestoreSessionDialog'
import { playWarningSound, playHitSound, startGeneratorSound, stopGeneratorSound, playSessionStartSound } from './audio'

function App() {
  const [saved] = useState(loadProgress)
  const skillCanvas = useRef<HTMLCanvasElement>(null)
  const particleCanvas = useRef<HTMLCanvasElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const settingsRef = useRef(saved.settings)
  const gameConfigRef = useRef(saved.settings)
  const modeRef = useRef<GameMode>(saved.mode)
  const difficultyRef = useRef<Difficulty>(saved.difficulty)
  const arcadeRef = useRef(saved.arcade)
  const [settings, setSettings] = useState(saved.settings)
  const [mode, setMode] = useState<GameMode>(saved.mode)
  const [difficulty, setDifficulty] = useState<Difficulty>(saved.difficulty)
  const [playStats, setPlayStats] = useState(saved.playStats)
  const [arcadeStats, setArcadeStats] = useState(saved.arcadeStats)
  const [playHistory, setPlayHistory] = useState<Result[]>(saved.playHistory)
  const [arcadeHistory, setArcadeHistory] = useState<Result[]>(saved.arcadeHistory)
  const [playSessions, setPlaySessions] = useState<SessionRecord[]>(saved.playSessions)
  const [arcadeSessions, setArcadeSessions] = useState<SessionRecord[]>(saved.arcadeSessions)
  const [arcade, setArcade] = useState<ArcadeProgress>(saved.arcade)
  const [result, setResult] = useState<{ label: string; kind: Result } | null>(null)
  const [highlight, setHighlight] = useState<Result | null>(null)
  const [flash, setFlash] = useState<Result | null>(null)
  const [waiting, setWaiting] = useState('WAITING FOR SKILL CHECK...')
  const [isWaiting, setIsWaiting] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [stopwatchRunning, setStopwatchRunning] = useState(true)
  const [, setActivityActive] = useState(false)
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('waiting')
  const [timerDisplay, setTimerDisplay] = useState(0)
  const [sessionChecks, setSessionChecks] = useState(0)
  const [modeChosen, setModeChosen] = useState(false)
  const [runStarted, setRunStarted] = useState(false)
  const [isPreviewBot, setIsPreviewBot] = useState(false)
  const [isBotJoining, setIsBotJoining] = useState(false)
  const [botStats, setBotStats] = useState<Stats>({
    total: 0,
    success: 0,
    great: 0,
    miss: 0,
    streak: 0,
    best: 0,
    timePlayed: 0,
  })
  const [restoreSessionData, setRestoreSessionData] = useState<SavedSession | null>(null)
  const [appReady, setAppReady] = useState(false)
  const modeChosenRef = useRef(false)
  const timerRef = useRef({ status: 'waiting' as TimerStatus, startedAt: 0, accumulated: 0 })
  const sessionRef = useRef<ActiveSession | null>(null)
  const engine = useRef({
    phase: 'idle' as Phase,
    needle: 0,
    speed: 0,
    direction: 1 as 1 | -1,
    zones: [] as Zone[],
    overStart: 0,
    overSize: 0,
    hasOvercharge: false,
    cw: 0,
    ch: 0,
    cx: 0,
    cy: 0,
    radius: 0,
    ringW: 0,
    trail: [] as { x: number; y: number }[],
    particles: [] as Particle[],
    rings: [] as HitRing[],
    spawnTimer: 0,
    resultTimer: 0,
    demoTimer: 0,
    demo: false,
    demoWillHit: true,
    demoTravel: 0,
    demoTargetAngle: null as number | null,
    travel: 0,
  })

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    let nextSettings = { ...settingsRef.current, [key]: value }
    if (nextSettings.theme === 'vd') {
      nextSettings.zoneTotal = 1
      nextSettings.randomStart = false
      nextSettings.overcharge = false
    }
    settingsRef.current = nextSettings
    if (modeRef.current === 'play') gameConfigRef.current = settingsRef.current
    setSettings(settingsRef.current)
  }

  const generateZones = useCallback(() => {
    const e = engine.current,
      cfg = gameConfigRef.current
    const slotSize = TAU / cfg.zoneTotal
    const requestedSize = Math.max(0.2, 0.2 + cfg.zone * 0.1)
    const zoneSize = Math.min(requestedSize, slotSize * 0.72)
    let rotation = Math.random() * TAU
    for (let attempt = 0; attempt < 50; attempt++) {
      rotation = Math.random() * TAU
      const diff = Math.abs(norm(rotation - e.needle))
      const distance = Math.min(diff, TAU - diff)
      if (distance > 1.4) break
    }

    e.zones = Array.from({ length: cfg.zoneTotal }, (_, index) => {
      const variance =
        modeRef.current === 'arcade' ? 0 : (Math.random() - 0.5) * Math.min(0.1, slotSize * 0.08)
      const size = Math.max(0.2, zoneSize + variance)
      const greatSize = size * 0.3
      const center = rotation + index * slotSize + (Math.random() - 0.5) * slotSize * 0.12
      const start = norm(center - size / 2)
      return {
        start,
        size,
        greatStart: norm(start + (size - greatSize) * (0.3 + Math.random() * 0.4)),
        greatSize,
      }
    })
    e.hasOvercharge = cfg.overcharge
    if (cfg.overcharge) {
      e.overSize = 0.35 + Math.random() * 0.15
      let candidate = Math.random() * TAU
      for (let attempt = 0; attempt < 50; attempt++) {
        candidate = Math.random() * TAU
        const diff = Math.abs(norm(candidate - e.needle))
        const distance = Math.min(diff, TAU - diff)
        if (distance > 1.2 && !e.zones.some(zone => overlaps(candidate, e.overSize, zone.start, zone.size))) break
      }
      e.overStart = candidate
    }
  }, [])

  const spawn = useCallback(() => {
    const e = engine.current
    if (e.phase !== 'idle' || !modeChosenRef.current) return
    const cfg =
      modeRef.current === 'arcade'
        ? arcadeSettings(arcadeRef.current.level, difficultyRef.current)
        : settingsRef.current
    gameConfigRef.current = cfg
    const speedVariance = modeRef.current === 'arcade' ? 0 : (Math.random() - 0.5) * 0.008
    e.speed = Math.max(0.015, 0.015 + cfg.speed * 0.005 + speedVariance)
    e.needle = cfg.randomStart ? Math.random() * TAU : -Math.PI / 2
    e.direction = cfg.randomStart && Math.random() < 0.5 ? -1 : 1
    e.travel = 0
    generateZones()
    e.trail.length = 0
    e.phase = 'active'
    setActivityActive(true)
    setIsWaiting(false)
    setResult(null)
    playWarningSound(cfg)
  }, [generateZones])

  const spawnDemo = useCallback(() => {
    if (modeChosenRef.current) return
    const e = engine.current
    const demoTheme = settingsRef.current.theme || initialSettings.theme
    const isVD = demoTheme === 'vd'
    gameConfigRef.current = {
      ...initialSettings,
      theme: demoTheme,
      speed: 3 + Math.floor(Math.random() * 6),
      zone: 3 + Math.floor(Math.random() * 6),
      zoneTotal: isVD ? 1 : 1 + Math.floor(Math.random() * 2),
      overcharge: isVD ? false : Math.random() < 0.3,
      randomStart: isVD ? false : true,
    }
    generateZones()
    e.speed = 0.025 + Math.random() * 0.025
    e.needle = Math.random() * TAU
    e.direction = Math.random() < 0.5 ? -1 : 1
    e.trail.length = 0
    e.demo = true
    e.demoTravel = 0
    e.phase = 'active'

    // Decide if bot will hit (92% accuracy)
    e.demoWillHit = Math.random() < 0.92

    if (e.demoWillHit && e.zones.length > 0) {
      const zone = e.zones[Math.floor(Math.random() * e.zones.length)]
      if (Math.random() < 0.6) {
        e.demoTargetAngle = zone.greatStart + Math.random() * zone.greatSize
      } else {
        e.demoTargetAngle = zone.start + Math.random() * zone.size
      }
    } else {
      if (Math.random() < 0.5 && e.zones.length > 0) {
        const zone = e.zones[Math.floor(Math.random() * e.zones.length)]
        if (Math.random() < 0.5) {
          e.demoTargetAngle = norm(zone.start - 0.15 - Math.random() * 0.1)
        } else {
          e.demoTargetAngle = norm(zone.start + zone.size + 0.05 + Math.random() * 0.1)
        }
      } else {
        e.demoTargetAngle = null
      }
    }
  }, [generateZones])

  // Apply theme class to document body
  useEffect(() => {
    const theme = settings.theme || 'default'
    document.body.classList.remove('theme-default', 'theme-dbd', 'theme-vd')
    document.body.classList.add(`theme-${theme}`)
  }, [settings.theme])

  // Handle background generator repair audio hum
  useEffect(() => {
    if (runStarted && timerStatus === 'running' && settings.generatorMusic) {
      startGeneratorSound(settings.theme || 'default')
    } else {
      stopGeneratorSound()
    }
    return () => {
      stopGeneratorSound()
    }
  }, [runStarted, timerStatus, settings.generatorMusic, settings.theme])

  useEffect(() => {
    if (modeChosen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPreviewBot(false)
      setIsBotJoining(false)
      return
    }

    let inactivityTimeout: number
    let joiningTimeout: number

    const resetInactivityTimer = () => {
      setIsPreviewBot(false)
      setIsBotJoining(false)
      setBotStats({
        total: 0,
        success: 0,
        great: 0,
        miss: 0,
        streak: 0,
        best: 0,
        timePlayed: 0,
      })

      const e = engine.current
      if (e.demo) {
        e.demo = false
        e.phase = 'idle'
        window.clearTimeout(e.demoTimer)
        generateZones()
      }

      window.clearTimeout(inactivityTimeout)
      window.clearTimeout(joiningTimeout)

      inactivityTimeout = window.setTimeout(() => {
        setIsBotJoining(true)
        joiningTimeout = window.setTimeout(() => {
          setIsBotJoining(false)
          setIsPreviewBot(true)
          spawnDemo()
        }, 2000)
      }, 20000)
    }

    resetInactivityTimer()

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'click']
    events.forEach(event => window.addEventListener(event, resetInactivityTimer))

    return () => {
      window.clearTimeout(inactivityTimeout)
      window.clearTimeout(joiningTimeout)
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer))
    }
  }, [modeChosen, spawnDemo, generateZones])

  const beginRun = useCallback(() => {
    playSessionStartSound(settingsRef.current.theme || 'default')
    sessionRef.current = {
      mode: modeRef.current,
      total: 0,
      success: 0,
      great: 0,
      miss: 0,
      bestStreak: 0,
      streak: 0,
    }
    timerRef.current = { status: 'running', startedAt: Date.now(), accumulated: 0 }
    setRunStarted(true)
    setTimerStatus('running')
    setStopwatchRunning(true)
    setTimerDisplay(0)
    setSessionChecks(0)
    setIsWaiting(false)
    spawn()
  }, [spawn])

  const particlesAt = (angle: number, color: string, count: number) => {
    const e = engine.current,
      canvas = skillCanvas.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect(),
      tip = e.radius + e.ringW / 2 + 6
    const x = rect.left + e.cx + Math.cos(angle) * tip,
      y = rect.top + e.cy + Math.sin(angle) * tip
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU,
        speed = 1 + Math.random() * 4
      e.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color,
      })
    }
  }

  const finishSession = useCallback(
    (returnToModeSelect = false) => {
      const active = sessionRef.current,
        timer = timerRef.current
      if (!active) return
      const duration = timer.accumulated + (timer.status === 'running' ? Date.now() - timer.startedAt : 0)
      const record: SessionRecord = {
        ...active,
        id: crypto.randomUUID(),
        endedAt: new Date().toISOString(),
        duration,
        score: active.mode === 'arcade' ? arcadeRef.current.score : undefined,
        level: active.mode === 'arcade' ? arcadeRef.current.level : undefined,
        difficulty: active.mode === 'arcade' ? difficultyRef.current : undefined,
      }
      delete (record as Partial<ActiveSession>).streak
      if (active.mode === 'arcade') {
        setArcadeSessions(previous => [...previous, record].slice(-30))
        setArcadeStats(previous => ({
          ...previous,
          timePlayed: previous.timePlayed + Math.round(duration / 1000),
        }))
      } else {
        setPlaySessions(previous => [...previous, record].slice(-30))
        setPlayStats(previous => ({
          ...previous,
          timePlayed: previous.timePlayed + Math.round(duration / 1000),
        }))
      }
      sessionRef.current = null
      timerRef.current = { status: 'stopped', startedAt: 0, accumulated: duration }
      setTimerStatus('stopped')
      setTimerDisplay(duration)
      if (returnToModeSelect) {
        modeChosenRef.current = false
        window.setTimeout(() => {
          setRunStarted(false)
          setModeChosen(false)
          engine.current.phase = 'idle'
          generateZones()
        }, 700)
      }
    },
    [generateZones]
  )

  const trackSessionHit = useCallback(
    (kind: Result) => {
      let active = sessionRef.current
      if (!active) {
        active = { mode: modeRef.current, total: 0, success: 0, great: 0, miss: 0, bestStreak: 0, streak: 0 }
        sessionRef.current = active
        timerRef.current = { status: 'waiting', startedAt: 0, accumulated: 0 }
        setTimerDisplay(0)
      }
      const streak = kind === 'miss' ? 0 : active.streak + 1
      active = {
        ...active,
        total: active.total + 1,
        [kind]: active[kind] + 1,
        streak,
        bestStreak: Math.max(active.bestStreak, streak),
      }
      sessionRef.current = active
      setSessionChecks(active.total)
      if (kind !== 'miss' && timerRef.current.status === 'waiting') {
        timerRef.current = { status: 'running', startedAt: Date.now(), accumulated: 0 }
        setTimerStatus('running')
        setStopwatchRunning(true)
      }
      if (kind === 'miss') {
        const isArcade = modeRef.current === 'arcade'
        const isGameOver = isArcade && arcadeRef.current.lives <= 1
        if (!isArcade || isGameOver) {
          finishSession(false)
        }
      }
    },
    [finishSession]
  )

  const hit = useCallback((forcedResult?: Result) => {
    if (!modeChosenRef.current) return
    const e = engine.current,
      cfg = gameConfigRef.current,
      activeMode = modeRef.current
    if (e.phase !== 'active') {
      if (e.phase === 'idle' && modeChosenRef.current && !sessionRef.current) {
        beginRun()
      } else if (e.phase === 'idle') {
        if (timerRef.current.status === 'paused' || timerRef.current.status === 'waiting') {
          timerRef.current = { status: 'running', startedAt: Date.now(), accumulated: timerRef.current.accumulated }
          setTimerStatus('running')
          setStopwatchRunning(true)
        }
        spawn()
      }
      return
    }
    const angle = e.needle
    let kind: Result = 'miss',
      label = 'MISS'
    if (forcedResult) {
      kind = forcedResult
      label = forcedResult === 'great' ? 'GREAT' : forcedResult === 'success' ? 'GOOD' : 'MISS'
    } else {
      if (e.hasOvercharge && inRange(angle, e.overStart, e.overSize)) label = 'OVERCHARGE'
      else if (e.zones.some(zone => inRange(angle, zone.greatStart, zone.greatSize))) {
        kind = 'great'
        label = 'GREAT'
      } else if (e.zones.some(zone => inRange(angle, zone.start, zone.size))) {
        kind = 'success'
        label = 'GOOD'
      }
    }
    trackSessionHit(kind)
    playHitSound(settingsRef.current, kind)
    if (kind === 'miss') setActivityActive(false)
    const updateStats = (previous: Stats) => {
      const streak = kind === 'miss' ? 0 : previous.streak + 1
      return {
        ...previous,
        total: previous.total + 1,
        [kind]: previous[kind] + 1,
        streak,
        best: Math.max(previous.best, streak),
      }
    }
    if (activeMode === 'arcade') {
      setArcadeStats(updateStats)
      setArcadeHistory(previous => [...previous, kind].slice(-50))
    } else {
      setPlayStats(updateStats)
      setPlayHistory(previous => [...previous, kind].slice(-50))
    }
    const gameOver = activeMode === 'arcade' && kind === 'miss' && arcadeRef.current.lives <= 1
    if (activeMode === 'arcade') {
      setArcade(previous => {
        const multiplier = { easy: 1, hard: 1.25, pro: 1.5, extreme: 2 }[difficultyRef.current]
        const gained = Math.round((kind === 'great' ? 250 : kind === 'success' ? 100 : 0) * multiplier)
        const progress = kind === 'miss' ? previous.progress : previous.progress + 1
        const leveledUp = progress >= 5
        const level = leveledUp ? previous.level + 1 : previous.level
        const earnedHeart = leveledUp && level % 5 === 0
        const next = {
          ...previous,
          level,
          score: previous.score + gained,
          lives:
            kind === 'miss'
              ? Math.max(0, previous.lives - 1)
              : previous.lives + (earnedHeart ? 1 : 0),
          progress: leveledUp ? 0 : progress,
          highScore: Math.max(previous.highScore, previous.score + gained),
          highestLevel: Math.max(previous.highestLevel, level),
        }
        arcadeRef.current = next
        return next
      })
    }
    const color = kind === 'great' ? '#f0c040' : kind === 'success' ? '#3ddc84' : '#c41e1e'
    const tip = e.radius + e.ringW / 2 + 6
    e.rings.push({
      x: e.cx + Math.cos(angle) * tip,
      y: e.cy + Math.sin(angle) * tip,
      r: 4,
      maxR: kind === 'great' ? 50 : kind === 'success' ? 38 : 45,
      life: 1,
      color,
    })
    if (kind === 'great') {
      e.rings.push({
        x: e.cx + Math.cos(angle) * tip,
        y: e.cy + Math.sin(angle) * tip,
        r: 4,
        maxR: 30,
        life: 1,
        color: '#fff',
      })
    }
    particlesAt(angle, color, kind === 'great' ? 30 : kind === 'success' ? 20 : 35)
    if (kind === 'great') particlesAt(angle, '#fff', 10)
    if (kind === 'miss') {
      particlesAt(angle, '#ff6644', 15)
      container.current?.classList.add('shake')
      window.setTimeout(() => container.current?.classList.remove('shake'), 400)
    }
    setResult({ label: gameOver ? 'GAME OVER' : label, kind })
    setHighlight(kind)
    setFlash(kind)
    window.setTimeout(() => setHighlight(null), 600)
    window.setTimeout(() => setFlash(null), 600)
    button.current?.classList.add('pressed')
    window.setTimeout(() => button.current?.classList.remove('pressed'), 120)
    if (activeMode === 'play' && cfg.continuation && kind !== 'miss') {
      if (cfg.randomStart) {
        e.direction = Math.random() < 0.5 ? -1 : 1
        e.trail.length = 0
      }
      e.travel = 0
      generateZones()
      window.clearTimeout(e.resultTimer)
      e.resultTimer = window.setTimeout(() => setResult(null), 350)
    } else {
      e.phase = 'frozen'
      window.clearTimeout(e.spawnTimer)
      e.spawnTimer = window.setTimeout(
        () => {
          if (!modeChosenRef.current) return
          e.phase = 'idle'
          setActivityActive(false)
          if (gameOver) {
            const restarted = { ...arcadeRef.current, level: 1, score: 0, lives: 3, progress: 0 }
            arcadeRef.current = restarted
            setArcade(restarted)
            setWaiting('PRESS SPACE OR TAP TO PLAY AGAIN')
            setIsWaiting(true)
            setRunStarted(false)
          } else if (gameConfigRef.current.autoSpawn && (modeRef.current !== 'play' || kind !== 'miss')) spawn()
          else {
            setWaiting('TAP TO START SKILL CHECK')
            setIsWaiting(true)
          }
        },
        gameOver ? 1800 : kind === 'miss' ? 1100 : 650
      )
    }
  }, [beginRun, generateZones, spawn, trackSessionHit])

  const hitRef = useRef(hit)
  useEffect(() => {
    hitRef.current = hit
  })

  const ripple = (event?: React.PointerEvent<HTMLButtonElement>) => {
    const el = button.current
    if (!el) return
    const rect = el.getBoundingClientRect(),
      node = document.createElement('span')
    node.className = 'ripple'
    node.style.left = `${event ? event.clientX - rect.left : rect.width / 2 - 5}px`
    node.style.top = `${event ? event.clientY - rect.top : rect.height / 2 - 5}px`
    el.appendChild(node)
    window.setTimeout(() => node.remove(), 500)
  }

  useEffect(() => {
    const canvas = skillCanvas.current,
      pCanvas = particleCanvas.current,
      wrap = wrapper.current
    if (!canvas || !pCanvas || !wrap) return
    const ctx = canvas.getContext('2d'),
      pctx = pCanvas.getContext('2d')
    if (!ctx || !pctx) return
    const e = engine.current,
      dpr = Math.max(1, window.devicePixelRatio || 1)
    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      e.cw = rect.width
      e.ch = rect.height
      e.cx = rect.width / 2
      e.cy = rect.height / 2
      e.radius = Math.min(e.cw, e.ch) * 0.38
      e.ringW = e.radius * 0.14
      canvas.width = e.cw * dpr
      canvas.height = e.ch * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pCanvas.width = innerWidth * dpr
      pCanvas.height = innerHeight * dpr
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const zone = (start: number, size: number, color: string, glow: string) => {
      ctx.save()
      ctx.shadowColor = glow
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(e.cx, e.cy, e.radius, start, start + size)
      ctx.strokeStyle = color
      ctx.lineWidth = e.ringW - 4
      ctx.stroke()
      ctx.restore()
    }
    const draw = () => {
      ctx.clearRect(0, 0, e.cw, e.ch)
      const { cx, cy, radius: r, ringW } = e
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, TAU)
      ctx.strokeStyle = '#1a1a28'
      ctx.lineWidth = ringW
      ctx.stroke()
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU,
          inside = r - ringW / 2 - 2,
          outside = r + ringW / 2 + 2,
          main = i % 5 === 0
        ctx.beginPath()
        ctx.moveTo(
          cx + Math.cos(a) * (main ? inside - 4 : inside),
          cy + Math.sin(a) * (main ? inside - 4 : inside)
        )
        ctx.lineTo(
          cx + Math.cos(a) * (main ? outside + 4 : outside + 1),
          cy + Math.sin(a) * (main ? outside + 4 : outside + 1)
        )
        ctx.strokeStyle = main ? '#2a2a3a' : '#1e1e2a'
        ctx.lineWidth = main ? 1.5 : 0.8
        ctx.stroke()
      }
      if (e.zones.length > 0 && (!modeChosenRef.current || e.phase !== 'idle')) {
        if (e.hasOvercharge) zone(e.overStart, e.overSize, 'rgba(196,30,30,.55)', 'rgba(196,30,30,.2)')
        e.zones.forEach(item => {
          zone(item.start, item.size, 'rgba(220,220,230,.85)', 'rgba(220,220,230,.15)')
          zone(item.greatStart, item.greatSize, 'rgba(240,192,64,.9)', 'rgba(240,192,64,.2)')
        })
      }
      if (e.phase === 'active') {
        e.trail.forEach((point, i) => {
          const t = i / e.trail.length
          ctx.beginPath()
          ctx.arc(point.x, point.y, 1 + t * 2, 0, TAU)
          ctx.fillStyle = `rgba(232,232,236,${t * 0.35})`
          ctx.fill()
        })
      }
      const len = r + ringW / 2 + 6,
        nx = cx + Math.cos(e.needle) * len,
        ny = cy + Math.sin(e.needle) * len,
        perp = e.needle + Math.PI / 2
      ctx.save()
      ctx.shadowColor = 'rgba(220,220,236,.5)'
      ctx.shadowBlur = e.phase === 'frozen' ? 16 : 8
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(e.needle) * r * 0.2, cy + Math.sin(e.needle) * r * 0.2)
      ctx.lineTo(nx, ny)
      ctx.strokeStyle = '#e8e8ec'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.restore()
      ctx.beginPath()
      ctx.arc(nx, ny, 4, 0, TAU)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(
        cx + Math.cos(e.needle) * r * 0.15 + Math.cos(perp) * 6,
        cy + Math.sin(e.needle) * r * 0.15 + Math.sin(perp) * 6
      )
      ctx.lineTo(cx + Math.cos(e.needle) * r * 0.35, cy + Math.sin(e.needle) * r * 0.35)
      ctx.lineTo(
        cx + Math.cos(e.needle) * r * 0.15 - Math.cos(perp) * 6,
        cy + Math.sin(e.needle) * r * 0.15 - Math.sin(perp) * 6
      )
      ctx.fillStyle = '#e8e8ec'
      ctx.fill()
      const inner = r * 0.55,
        grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, inner)
      grad.addColorStop(0, '#16161f')
      grad.addColorStop(1, '#0e0e16')
      ctx.beginPath()
      ctx.arc(cx, cy, inner, 0, TAU)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = '#223'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, TAU)
      ctx.fillStyle = '#334'
      ctx.fill()
      for (let i = e.rings.length - 1; i >= 0; i--) {
        const h = e.rings[i]
        h.life -= 0.028
        h.r += (h.maxR - h.r) * 0.12
        if (h.life <= 0) {
          e.rings.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = h.life * 0.7
        ctx.strokeStyle = h.color
        ctx.lineWidth = 2.5 * h.life
        ctx.beginPath()
        ctx.arc(h.x, h.y, h.r, 0, TAU)
        ctx.stroke()
        ctx.globalAlpha = h.life * 0.15
        ctx.fillStyle = h.color
        ctx.fill()
        ctx.restore()
      }
    }
    let frame = 0
    const loop = () => {
      if (e.phase === 'active') {
        e.needle = norm(e.needle + e.speed * e.direction)
        e.travel += e.speed
        const tip = e.radius + e.ringW / 2 + 6
        e.trail.push({ x: e.cx + Math.cos(e.needle) * tip, y: e.cy + Math.sin(e.needle) * tip })
        if (e.trail.length > 15) e.trail.shift()
        if (e.demo) {
          e.demoTravel += e.speed
          const reached = e.demoTargetAngle !== null
            ? (() => { const diff = Math.abs(norm(e.needle - e.demoTargetAngle!)); return diff < e.speed || (TAU - diff) < e.speed })()
            : e.demoTravel >= TAU * 0.95

          if (reached) {
            e.phase = 'frozen'
            const landed = e.demoWillHit && e.zones.some(item => inRange(e.needle, item.start, item.size))
            const color = landed ? '#3ddc84' : '#c41e1e'
            e.rings.push({
              x: e.cx + Math.cos(e.needle) * tip,
              y: e.cy + Math.sin(e.needle) * tip,
              r: 4,
              maxR: landed ? 38 : 45,
              life: 1,
              color,
            })
            let kind: Result = 'miss'
            if (landed) {
              kind = e.zones.some(item => inRange(e.needle, item.greatStart, item.greatSize))
                ? 'great'
                : 'success'
            }
            if (kind === 'great') {
              e.rings.push({
                x: e.cx + Math.cos(e.needle) * tip,
                y: e.cy + Math.sin(e.needle) * tip,
                r: 4,
                maxR: 30,
                life: 1,
                color: '#fff',
              })
            }
            particlesAt(e.needle, color, kind === 'great' ? 30 : kind === 'success' ? 20 : 35)
            if (kind === 'great') particlesAt(e.needle, '#fff', 10)
            if (kind === 'miss') {
              particlesAt(e.needle, '#ff6644', 15)
              container.current?.classList.add('shake')
              window.setTimeout(() => container.current?.classList.remove('shake'), 400)
            }
            setBotStats(prev => {
              const streak = kind === 'miss' ? 0 : prev.streak + 1
              return {
                ...prev,
                total: prev.total + 1,
                [kind]: prev[kind] + 1,
                streak,
                best: Math.max(prev.best, streak),
              }
            })
            setHighlight(kind)
            setFlash(kind)
            window.setTimeout(() => setHighlight(null), 600)
            window.setTimeout(() => setFlash(null), 600)
            window.clearTimeout(e.demoTimer)
            e.demoTimer = window.setTimeout(spawnDemo, landed ? 500 : 750)
          }
        } else if (gameConfigRef.current.failThreshold && e.travel >= TAU) {
          hitRef.current('miss')
        }
      } else if (e.phase === 'idle') {
        const delta = 0.02
        e.needle = norm(e.needle + delta)
      }
      draw()
      pctx.clearRect(0, 0, innerWidth, innerHeight)
      for (let i = e.particles.length - 1; i >= 0; i--) {
        const p = e.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.life -= p.decay
        if (p.life <= 0) {
          e.particles.splice(i, 1)
          continue
        }
        pctx.globalAlpha = p.life
        pctx.fillStyle = p.color
        pctx.beginPath()
        pctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, TAU)
        pctx.fill()
      }
      pctx.globalAlpha = 1
      frame = requestAnimationFrame(loop)
    }
    generateZones()
    resize()
    window.addEventListener('resize', resize)
    loop()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frame)
      window.clearTimeout(e.spawnTimer)
      window.clearTimeout(e.resultTimer)
      window.clearTimeout(e.demoTimer)
    }
  }, [spawnDemo, generateZones])

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        setSettingsOpen(false)
        setStatsOpen(false)
      }
      const target = event.target as HTMLElement
      if (
        event.code === 'Space' &&
        !settingsOpen &&
        !statsOpen &&
        !target.closest('button,input')
      ) {
        event.preventDefault()
        hit()
        ripple()
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [hit, settingsOpen, statsOpen])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dbd_skill_check_active_session')
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRestoreSessionData(JSON.parse(saved) as SavedSession)
      }
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    const start = Date.now()
    const handleLoad = () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 1000 - elapsed)
      window.setTimeout(() => {
        setAppReady(true)
      }, remaining)
    }

    if (document.readyState === 'complete') {
      if (document.fonts) {
        document.fonts.ready.then(handleLoad).catch(() => handleLoad())
      } else {
        handleLoad()
      }
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (runStarted && sessionRef.current) {
        localStorage.setItem(
          'dbd_skill_check_active_session',
          JSON.stringify({
            session: sessionRef.current,
            timer: {
              status: timerRef.current.status,
              accumulated: timerRef.current.accumulated + (timerRef.current.status === 'running' ? Date.now() - timerRef.current.startedAt : 0),
            },
            arcade: arcadeRef.current,
            difficulty: difficultyRef.current,
            mode: modeRef.current,
          })
        )
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [runStarted])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode,
        difficulty,
        playStats,
        arcadeStats,
        arcade,
        settings,
        playHistory,
        arcadeHistory,
        playSessions,
        arcadeSessions,
      })
    )
  }, [
    mode,
    difficulty,
    playStats,
    arcadeStats,
    arcade,
    settings,
    playHistory,
    arcadeHistory,
    playSessions,
    arcadeSessions,
  ])

  useEffect(() => {
    if (timerStatus !== 'running') return
    const timer = window.setInterval(
      () => setTimerDisplay(timerRef.current.accumulated + Date.now() - timerRef.current.startedAt),
      100
    )
    return () => window.clearInterval(timer)
  }, [timerStatus])

  const switchMode = (nextMode: GameMode) => {
    if (nextMode === modeRef.current) return
    finishSession()
    const e = engine.current
    clearTimeout(e.spawnTimer)
    clearTimeout(e.resultTimer)
    e.phase = 'idle'
    e.trail.length = 0
    setActivityActive(false)
    modeRef.current = nextMode
    setMode(nextMode)
    setResult(null)
    setIsWaiting(false)
    timerRef.current = { status: 'waiting', startedAt: 0, accumulated: 0 }
    setTimerStatus('waiting')
    setTimerDisplay(0)
    if (nextMode === 'play') gameConfigRef.current = settingsRef.current
    else if (arcadeRef.current.lives === 0) {
      const restarted = { ...arcadeRef.current, level: 1, score: 0, lives: 3, progress: 0 }
      arcadeRef.current = restarted
      setArcade(restarted)
    }
  }

  const restoreSession = (savedSession: SavedSession) => {
    modeRef.current = savedSession.mode
    setMode(savedSession.mode)
    if (savedSession.difficulty) {
      difficultyRef.current = savedSession.difficulty
      setDifficulty(savedSession.difficulty)
    }

    if (savedSession.mode === 'arcade') {
      arcadeRef.current = savedSession.arcade ?? arcadeRef.current
      setArcade(savedSession.arcade ?? arcadeRef.current)
    }

    sessionRef.current = savedSession.session
    setSessionChecks(savedSession.session.total)
    timerRef.current = {
      status: 'paused',
      startedAt: 0,
      accumulated: savedSession.timer.accumulated,
    }
    setTimerStatus('paused')
    setTimerDisplay(savedSession.timer.accumulated)

    setModeChosen(true)
    modeChosenRef.current = true
    setRunStarted(true)
    setIsWaiting(true)
    setWaiting('TAP TO RESUME GAME')

    localStorage.removeItem('dbd_skill_check_active_session')
    setRestoreSessionData(null)
  }

  const chooseMode = (nextMode: GameMode) => {
    modeChosenRef.current = true
    setModeChosen(true)
    setRunStarted(false)
    setSessionChecks(0)
    window.clearTimeout(engine.current.demoTimer)
    engine.current.demo = false
    if (nextMode !== modeRef.current) switchMode(nextMode)
    engine.current.phase = 'idle'
    sessionRef.current = null
    timerRef.current = { status: 'waiting', startedAt: 0, accumulated: 0 }
    setTimerStatus('waiting')
    setTimerDisplay(0)
    setWaiting('PRESS SPACE OR TAP TO START')
    setIsWaiting(true)
  }

  const changeDifficulty = (nextDifficulty: Difficulty) => {
    if (nextDifficulty === difficultyRef.current) return
    finishSession()
    const e = engine.current
    clearTimeout(e.spawnTimer)
    clearTimeout(e.resultTimer)
    e.phase = 'idle'
    e.trail.length = 0
    setActivityActive(false)
    difficultyRef.current = nextDifficulty
    setDifficulty(nextDifficulty)
    const restarted = { ...arcadeRef.current, level: 1, score: 0, lives: 3, progress: 0 }
    arcadeRef.current = restarted
    setArcade(restarted)
    setResult(null)
    setRunStarted(false)
    sessionRef.current = null
    timerRef.current = { status: 'waiting', startedAt: 0, accumulated: 0 }
    setTimerStatus('waiting')
    setTimerDisplay(0)
    setWaiting('PRESS SPACE OR TAP TO START')
    setIsWaiting(true)
  }

  const reset = () => {
    const e = engine.current
    sessionRef.current = null
    timerRef.current = { status: 'waiting', startedAt: 0, accumulated: 0 }
    setTimerStatus('waiting')
    setTimerDisplay(0)
    if (mode === 'arcade') {
      setArcadeStats(initialStats)
      setArcadeHistory([])
      setArcadeSessions([])
      arcadeRef.current = initialArcade
      setArcade(initialArcade)
    } else {
      setPlayStats(initialStats)
      setPlayHistory([])
      setPlaySessions([])
    }
    setResult(null)
    e.phase = 'idle'
    setActivityActive(false)
    clearTimeout(e.spawnTimer)
    clearTimeout(e.resultTimer)
    if (mode === 'arcade' || settingsRef.current.autoSpawn) {
      setIsWaiting(false)
      window.setTimeout(spawn, 500)
    } else {
      setWaiting('TAP TO START SKILL CHECK')
      setIsWaiting(true)
    }
  }

  const stats = mode === 'arcade' ? arcadeStats : playStats
  const history = mode === 'arcade' ? arcadeHistory : playHistory
  const sessions = mode === 'arcade' ? arcadeSessions : playSessions
  const sessionPace = timerDisplay ? sessionChecks / (timerDisplay / 60000) : 0

  const resetStopwatch = () => {
    setTimerDisplay(0)
    setSessionChecks(0)
    if (modeChosen && sessionRef.current) {
      sessionRef.current = { mode, total: 0, success: 0, great: 0, miss: 0, bestStreak: 0, streak: 0 }
      timerRef.current = { status: 'running', startedAt: Date.now(), accumulated: 0 }
      setTimerStatus('running')
      setStopwatchRunning(true)
    } else {
      timerRef.current = { status: 'waiting', startedAt: 0, accumulated: 0 }
      sessionRef.current = null
      setTimerStatus('waiting')
    }
  }

  const toggleStopwatch = () => {
    const timer = timerRef.current
    if (timer.status === 'running') {
      timer.accumulated += Date.now() - timer.startedAt
      timer.status = 'paused'
      setTimerStatus('paused')
      setStopwatchRunning(false)
    } else if (timer.status === 'paused') {
      timer.startedAt = Date.now()
      timer.status = 'running'
      setTimerStatus('running')
      setStopwatchRunning(true)
    }
  }

  return (
    <>
      <Loader appReady={appReady} />
      <canvas ref={particleCanvas} className="particle-canvas" />
      <button
        className={`drawer-trigger stats-trigger ${statsOpen ? 'active' : ''}`}
        onClick={() => {
          setSettingsOpen(false)
          setStatsOpen(true)
        }}
        aria-label="Open statistics"
        aria-expanded={statsOpen}
        aria-controls="stats-drawer"
      >
        <i className="fas fa-chart-line" />
        <span>STATS</span>
      </button>
      <button
        className={`drawer-trigger settings-trigger ${settingsOpen ? 'active' : ''}`}
        onClick={() => {
          setStatsOpen(false)
          setSettingsOpen(true)
        }}
        aria-label="Open settings"
        aria-expanded={settingsOpen}
        aria-controls="settings-drawer"
      >
        <i className="fas fa-sliders-h" />
        <span>SETTINGS</span>
      </button>
      <StopwatchWidget
        show={settings.stopwatch}
        runStarted={runStarted}
        timerStatus={timerStatus}
        mode={mode}
        sessionPace={sessionPace}
        timerDisplay={timerDisplay}
        stopwatchRunning={stopwatchRunning}
        onToggle={toggleStopwatch}
        onReset={resetStopwatch}
      />
      <main ref={container} className="container">
        <Header theme={settings.theme} />

        {modeChosen && mode === 'arcade' && (
          <ArcadeHUD
            difficulty={difficulty}
            arcade={arcade}
            onChangeDifficulty={changeDifficulty}
          />
        )}

        <StatsCard
          stats={stats}
          botStats={botStats}
          isPreviewBot={isPreviewBot}
          highlight={highlight}
        />

        <div ref={wrapper} className="skill-check-wrapper">
          <canvas ref={skillCanvas} />
          <div className={`flash-overlay ${flash ?? ''}`} />
          {isBotJoining && (
            <div className="bot-joining-overlay">
              <div className="bot-joining-content">
                <i className="fas fa-robot animate-bounce" style={{ fontSize: '2.5rem', color: 'var(--accent)' }} />
                <span>BOT JOINING...</span>
              </div>
            </div>
          )}
          {isPreviewBot && (
            <div className="bot-active-indicator">
              <span className="bot-pulse-dot" />
              <span>BOT PLAYING</span>
            </div>
          )}
        </div>

        {runStarted && isWaiting && <div className="waiting-hint">{waiting}</div>}
        <div className={`result-text ${result ? `${result.kind} show` : ''}`} aria-live="polite">
          {result?.label}
        </div>

        <ModePicker
          runStarted={runStarted}
          modeChosen={modeChosen}
          mode={mode}
          onChooseMode={chooseMode}
        />

        <div className="action-area">
          <button
            ref={button}
            disabled={!modeChosen}
            className={`space-btn ${modeChosen && !runStarted ? 'ready-to-start' : ''}`}
            aria-label={runStarted ? 'Hit skill check' : 'Start selected mode'}
            onPointerDown={event => {
              event.preventDefault()
              hit()
              ripple(event)
            }}
          >
            {runStarted ? (
              <>
                <span className="key-icon">SPACE</span>
                <span className="tap-icon">
                  <i className="fas fa-hand-pointer" /> TAP
                </span>
              </>
            ) : modeChosen ? (
              <>
                <div className="start-desktop">
                  <span className="start-keycap">SPACE</span>
                  <span>TO START</span>
                </div>
                <div className="start-mobile">
                  <i className="fas fa-hand-pointer" />
                  <span>TAP TO START</span>
                </div>
              </>
            ) : (
              <span className="select-mode-copy">SELECT MODE TO START</span>
            )}
          </button>
        </div>
      </main>
      <div
        className={`drawer-backdrop ${settingsOpen || statsOpen ? 'show' : ''}`}
        onClick={() => {
          setSettingsOpen(false)
          setStatsOpen(false)
        }}
        aria-hidden="true"
      />
      <StatsDrawer
        key={statsOpen ? 'open' : 'closed'}
        open={statsOpen}
        mode={mode}
        stats={stats}
        history={history}
        sessions={sessions}
        arcade={arcade}
        theme={settings.theme}
        onClose={() => setStatsOpen(false)}
      />
      <SettingsDrawer
        open={settingsOpen}
        mode={mode}
        settings={settings}
        onUpdateSetting={updateSetting}
        onClose={() => setSettingsOpen(false)}
        onResetStats={reset}
      />
      <RestoreSessionDialog
        restoreSessionData={restoreSessionData}
        onClose={() => {
          localStorage.removeItem('dbd_skill_check_active_session')
          setRestoreSessionData(null)
        }}
        onStartNew={() => {
          localStorage.removeItem('dbd_skill_check_active_session')
          const restarted = { ...arcadeRef.current, level: 1, score: 0, lives: 3, progress: 0 }
          arcadeRef.current = restarted
          setArcade(restarted)
          setRestoreSessionData(null)
        }}
        onContinue={() => {
          if (restoreSessionData) restoreSession(restoreSessionData)
        }}
      />
    </>
  )
}

export default App
