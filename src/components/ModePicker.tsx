import React from 'react'
import { GameMode } from '../types'

interface ModePickerProps {
  runStarted: boolean
  modeChosen: boolean
  mode: GameMode
  onChooseMode: (mode: GameMode) => void
}

export const ModePicker: React.FC<ModePickerProps> = ({
  runStarted,
  modeChosen,
  mode,
  onChooseMode,
}) => {
  if (runStarted || modeChosen) return null

  return (
    <section className="inline-mode-picker" aria-label="Choose game mode">
      <span>SELECT MODE</span>
      <div>
        <button
          className={modeChosen && mode === 'play' ? 'active' : ''}
          onClick={() => onChooseMode('play')}
        >
          <i className="fas fa-crosshairs" /> PLAY
        </button>
        <button
          className={modeChosen && mode === 'arcade' ? 'active' : ''}
          onClick={() => onChooseMode('arcade')}
        >
          <i className="fas fa-gamepad" /> ARCADE
        </button>
      </div>
    </section>
  )
}
