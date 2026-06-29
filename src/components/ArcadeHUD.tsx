import { Difficulty, ArcadeProgress } from '../types'
import { difficulties } from '../utils'

interface ArcadeHUDProps {
  difficulty: Difficulty
  arcade: ArcadeProgress
  onChangeDifficulty: (difficulty: Difficulty) => void
}

export function ArcadeHUD({ difficulty, arcade, onChangeDifficulty }: ArcadeHUDProps) {
  return (
    <>
      <nav className="difficulty-switch" aria-label="Arcade difficulty">
        {difficulties.map(item => (
          <button
            key={item}
            className={`${item} ${difficulty === item ? 'active' : ''}`}
            onClick={() => onChangeDifficulty(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </nav>
      <section className="arcade-hud" aria-label="Arcade progress">
        <div>
          <small>LEVEL</small>
          <strong>{arcade.level}</strong>
        </div>
        <div className="arcade-progress">
          <span>
            <i style={{ width: `${arcade.progress * 20}%` }} />
          </span>
          <small>{arcade.progress}/5 TO NEXT LEVEL</small>
        </div>
        <div className="arcade-score">
          <small>SCORE</small>
          <strong>{arcade.score.toLocaleString()}</strong>
        </div>
        <div className="arcade-lives" aria-label={`${arcade.lives} lives`}>
          <i className="fas fa-heart" />
          <strong>{arcade.lives}</strong>
          <small>+1 AT LVL {Math.ceil((arcade.level + 1) / 5) * 5}</small>
        </div>
      </section>
    </>
  )
}
