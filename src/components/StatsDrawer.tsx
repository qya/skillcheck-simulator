import { useState } from 'react'
import { GameMode, Stats, Result, SessionRecord, ArcadeProgress } from '../types'
import { achievements, formatDuration } from '../utils'
import { ShareDialog } from './ShareDialog'

interface StatsDrawerProps {
  open: boolean
  mode: GameMode
  stats: Stats
  history: Result[]
  sessions: SessionRecord[]
  arcade: ArcadeProgress
  theme: 'default' | 'dbd' | 'vd'
  onClose: () => void
}

export function StatsDrawer({
  open,
  mode,
  stats,
  history,
  sessions,
  arcade,
  theme,
  onClose,
}: StatsDrawerProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const hits = stats.success + stats.great
  const accuracy = stats.total ? Math.round((hits / stats.total) * 100) : 0
  const greatRate = stats.total ? Math.round((stats.great / stats.total) * 100) : 0
  const unlocked = achievements.filter(item => item.value(stats) >= item.target).length
  const recent = history.slice(-24)
  const checksPerMinute = stats.timePlayed ? stats.total / (stats.timePlayed / 60) : 0

  return (
    <aside
      id="stats-drawer"
      className={`stats-panel ${open ? 'open' : ''}`}
      aria-hidden={!open}
      aria-label="Performance statistics"
    >
      <div className="stats-title">
        <button onClick={onClose} aria-label="Close statistics">
          <i className="fas fa-times" />
        </button>
        <div>
          YOUR <span>PERFORMANCE</span>
        </div>
      </div>
      <div className="stats-content">
        <div className="stats-toolbar">
          <div className={`stats-mode-label ${mode}`}>
            <i className={`fas ${mode === 'arcade' ? 'fa-gamepad' : 'fa-crosshairs'}`} />{' '}
            {mode.toUpperCase()} RECORD
          </div>
          <button className="share-stats-btn" onClick={() => setShareOpen(true)}>
            <i className="fas fa-share-nodes" /> SHARE
          </button>
        </div>
        {mode === 'arcade' && (
          <section className="arcade-record">
            <div>
              <small>HIGH SCORE</small>
              <strong>{arcade.highScore.toLocaleString()}</strong>
            </div>
            <div>
              <small>HIGHEST LEVEL</small>
              <strong>{arcade.highestLevel}</strong>
            </div>
          </section>
        )}
        <section className="performance-hero">
          <div
            className="accuracy-ring"
            style={{ '--accuracy': `${accuracy * 3.6}deg` } as React.CSSProperties}
          >
            <div>
              <strong>{accuracy}%</strong>
              <span>ACCURACY</span>
            </div>
          </div>
          <div className="performance-copy">
            <span>ALL-TIME RECORD</span>
            <strong>{stats.total}</strong>
            <small>checks attempted</small>
          </div>
        </section>
        <section className="metric-grid">
          <div>
            <span>GOOD</span>
            <strong className="success-color">{stats.success}</strong>
          </div>
          <div>
            <span>GREAT</span>
            <strong className="great-color">{stats.great}</strong>
          </div>
          <div>
            <span>MISSED</span>
            <strong className="miss-color">{stats.miss}</strong>
          </div>
          <div>
            <span>BEST STREAK</span>
            <strong>{stats.best}</strong>
          </div>
          <div>
            <span>TIME PLAYED</span>
            <strong className="time-value">{formatDuration(stats.timePlayed)}</strong>
          </div>
          <div>
            <span>CHECKS / MIN</span>
            <strong>{checksPerMinute.toFixed(1)}</strong>
          </div>
        </section>
        <section className="stats-section">
          <div className="section-heading">
            <span>RECENT FORM</span>
            <small>LAST {recent.length || 0} CHECKS</small>
          </div>
          {recent.length ? (
            <>
              <div className="history-graph" aria-label="Recent result history">
                {recent.map((item, index) => (
                  <span
                    key={`${index}-${item}`}
                    className={item}
                    style={{
                      height: item === 'great' ? '100%' : item === 'success' ? '68%' : '30%',
                    }}
                    title={item}
                  />
                ))}
              </div>
              <div className="graph-legend">
                <span>
                  <i className="great" /> Great
                </span>
                <span>
                  <i className="success" /> Good
                </span>
                <span>
                  <i className="miss" /> Miss
                </span>
              </div>
            </>
          ) : (
            <div className="empty-chart">Complete a skill check to start tracking form.</div>
          )}
        </section>
        <section className="stats-section rate-section">
          <div className="section-heading">
            <span>PRECISION</span>
            <small>{greatRate}% GREAT RATE</small>
          </div>
          <div className="rate-track">
            <span className="great-rate" style={{ width: `${greatRate}%` }} />
            <span
              className="good-rate"
              style={{ width: `${Math.max(0, accuracy - greatRate)}%` }}
            />
          </div>
        </section>
        <section className="stats-section session-history-section">
          <div className="section-heading">
            <span>GAMEPLAY HISTORY</span>
            <small>{sessions.length} RUNS</small>
          </div>
          <div className="session-list">
            {sessions.length ? (
              sessions
                .slice(-8)
                .reverse()
                .map((session, index) => {
                  const accuracy = session.total
                    ? Math.round(((session.success + session.great) / session.total) * 100)
                    : 0
                  return (
                    <article key={session.id}>
                      <div className="session-index">#{sessions.length - index}</div>
                      <div>
                        <strong>{formatDuration(Math.round(session.duration / 1000))}</strong>
                        <span>
                          {session.total} checks · {accuracy}% accuracy
                        </span>
                      </div>
                      <div className="session-result">
                        <strong>{session.great}</strong>
                        <span>GREAT</span>
                      </div>
                      {session.mode === 'arcade' && <small>LVL {session.level}</small>}
                    </article>
                  )
                })
            ) : (
              <div className="empty-chart">
                Complete a run with a Miss or Game Over to save its history.
              </div>
            )}
          </div>
        </section>
        <section className="stats-section achievements-section">
          <div className="section-heading">
            <span>ACHIEVEMENTS</span>
            <small>
              {unlocked}/{achievements.length} UNLOCKED
            </small>
          </div>
          <div className="achievement-list">
            {achievements.map(item => {
              const value = item.value(stats)
              const complete = value >= item.target
              const progress = Math.min(100, (value / item.target) * 100)
              return (
                <article className={`achievement ${complete ? 'unlocked' : ''}`} key={item.id}>
                  <div className="achievement-icon">
                    <i className={`fas ${item.icon}`} />
                  </div>
                  <div className="achievement-info">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                    <div className="achievement-track">
                      <i style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <small>
                    {complete ? (
                      <i className="fas fa-check" />
                    ) : (
                      `${Math.min(value, item.target)}/${item.target}`
                    )}
                  </small>
                </article>
              )
            })}
          </div>
        </section>
        <p className="storage-note">
          <i className="fas fa-database" /> Progress is saved on this device
        </p>
      </div>
      {shareOpen && (
        <ShareDialog
          mode={mode}
          stats={stats}
          history={history}
          arcade={arcade}
          theme={theme}
          onClose={() => setShareOpen(false)}
        />
      )}
    </aside>
  )
}
