import React from 'react'
import { formatDuration } from '../utils'
import { TimerStatus } from '../types'

interface StopwatchWidgetProps {
  show: boolean
  runStarted: boolean
  timerStatus: TimerStatus
  mode: string
  sessionPace: number
  timerDisplay: number
  stopwatchRunning: boolean
  onToggle: () => void
  onReset: () => void
}

export const StopwatchWidget: React.FC<StopwatchWidgetProps> = ({
  show,
  runStarted,
  timerStatus,
  mode,
  sessionPace,
  timerDisplay,
  stopwatchRunning,
  onToggle,
  onReset,
}) => {
  if (!show || !runStarted) return null

  return (
    <aside className="stopwatch-widget" aria-label={`${mode} stopwatch`}>
      <div className="stopwatch-top">
        <span>
          <i className={`fas fa-circle ${timerStatus === 'running' ? 'running' : ''}`} />{' '}
          {timerStatus === 'stopped'
            ? 'RUN COMPLETE'
            : timerStatus === 'paused'
            ? 'TIMER PAUSED'
            : `${mode.toUpperCase()} RUN`}
        </span>
        <small>{sessionPace.toFixed(1)} CHECKS/MIN</small>
      </div>
      <time>{formatDuration(Math.floor(timerDisplay / 1000))}</time>
      <div className="stopwatch-actions">
        <button
          onClick={onToggle}
          disabled={timerStatus === 'waiting' || timerStatus === 'stopped'}
          aria-label={stopwatchRunning ? 'Pause stopwatch' : 'Resume stopwatch'}
        >
          <i className={`fas ${stopwatchRunning ? 'fa-pause' : 'fa-play'}`} />
        </button>
        <button onClick={onReset} aria-label="Reset stopwatch">
          <i className="fas fa-rotate-left" />
        </button>
      </div>
    </aside>
  )
}
