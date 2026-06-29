import { Stats } from '../types'

interface StreakBarProps {
  stats: Stats
}

export function StreakBar({ stats }: StreakBarProps) {
  return (
    <div className="streak-bar">
      {stats.streak >= 2 && (
        <span className={`streak-badge ${stats.streak >= 5 ? 'great' : 'good'}`}>
          {stats.streak}x STREAK
        </span>
      )}
      {stats.best >= 3 && <span className="streak-badge great best">BEST {stats.best}</span>}
    </div>
  )
}
