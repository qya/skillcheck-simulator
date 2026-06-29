import { Stats, Result } from '../types'

interface StatsBarProps {
  stats: Stats
  highlight: Result | null
}

export function StatsBar({ stats, highlight }: StatsBarProps) {
  const statItems: { key: keyof Pick<Stats, 'total' | 'success' | 'great' | 'miss'>; label: string; kind?: Result }[] = [
    { key: 'total', label: 'Total' },
    { key: 'success', label: 'Good', kind: 'success' },
    { key: 'great', label: 'Great', kind: 'great' },
    { key: 'miss', label: 'Miss', kind: 'miss' },
  ]

  return (
    <section className="stats-bar" aria-label="Session statistics">
      {statItems.map(({ key, label, kind }) => (
        <div className={`stat-card ${kind && highlight === kind ? `hl-${kind}` : ''}`} key={key}>
          <div className="sv">{stats[key]}</div>
          <div className="sl">{label}</div>
        </div>
      ))}
    </section>
  )
}
