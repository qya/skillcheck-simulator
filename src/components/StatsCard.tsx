import React from 'react'
import { Stats, Result } from '../types'
import { StatsBar } from './StatsBar'
import { StreakBar } from './StreakBar'

interface StatsCardProps {
  stats: Stats
  botStats: Stats
  isPreviewBot: boolean
  highlight: Result | null
}

export const StatsCard: React.FC<StatsCardProps> = ({
  stats,
  botStats,
  isPreviewBot,
  highlight,
}) => {
  return (
    <div className={`stats-container-flip ${isPreviewBot ? 'is-flipped' : ''}`}>
      <div className="stats-card-inner">
        <div className="stats-card-front">
          <div className="stats-section-wrapper">
            <div className="stats-section-title">PLAYER STATS</div>
            <StatsBar stats={stats} highlight={isPreviewBot ? null : highlight} />
            <StreakBar stats={stats} />
          </div>
        </div>
        <div className="stats-card-back">
          <div className="stats-section-wrapper bot-stats-wrapper">
            <div className="stats-section-title bot-title">
              <i className="fas fa-robot" /> BOT PREVIEW STATS
            </div>
            <StatsBar stats={botStats} highlight={isPreviewBot ? highlight : null} />
            <StreakBar stats={botStats} />
          </div>
        </div>
      </div>
    </div>
  )
}
