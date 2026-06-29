import React from 'react'

interface RestoreSessionDialogProps {
  restoreSessionData: {
    mode: string
    difficulty?: string
  } | null
  onClose: () => void
  onStartNew: () => void
  onContinue: () => void
}

export const RestoreSessionDialog: React.FC<RestoreSessionDialogProps> = ({
  restoreSessionData,
  onClose,
  onStartNew,
  onContinue,
}) => {
  if (!restoreSessionData) return null

  return (
    <div className="share-dialog-backdrop" style={{ zIndex: 101 }}>
      <div className="share-dialog" style={{ width: 'min(420px, 90%)' }}>
        <header>
          <h2>CONTINUE GAME PLAY?</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              color: 'var(--muted)',
            }}
          >
            <i className="fas fa-times" />
          </button>
        </header>
        <div style={{ padding: '24px 22px', fontSize: '0.95rem', color: '#a0a0b2', lineHeight: '1.5' }}>
          <p style={{ marginBottom: '14px', textAlign: 'center' }}>
            An active gameplay session was detected from before. Would you like to continue playing?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
            <div
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Mode
              </div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '1.2rem',
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: 'var(--accent)',
                  marginTop: '4px',
                  letterSpacing: '1px',
                }}
              >
                {restoreSessionData.mode.toUpperCase()}
              </strong>
            </div>
            <div
              style={{
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Difficulty
              </div>
              <strong
                style={{
                  display: 'block',
                  fontSize: '1.2rem',
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: '#ffffff',
                  marginTop: '4px',
                  letterSpacing: '1px',
                }}
              >
                {(restoreSessionData.difficulty ?? 'N/A').toUpperCase()}
              </strong>
            </div>
          </div>
        </div>
        <footer>
          <button className="export-btn" style={{ flex: 1 }} onClick={onStartNew}>
            START NEW
          </button>
          <button className="native-share-btn" style={{ flex: 1 }} onClick={onContinue}>
            CONTINUE
          </button>
        </footer>
      </div>
    </div>
  )
}
