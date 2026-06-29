import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GameMode, Stats, Result, ArcadeProgress, ShareFormat } from '../types'
import { shareFormats, drawShareCard } from '../utils'

interface ShareDialogProps {
  mode: GameMode
  stats: Stats
  history: Result[]
  arcade: ArcadeProgress
  theme: 'default' | 'dbd' | 'vd'
  onClose: () => void
}

export function ShareDialog({ mode, stats, history, arcade, theme, onClose }: ShareDialogProps) {
  const [format, setFormat] = useState<ShareFormat>('portrait')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selected = shareFormats.find(item => item.id === format)!

  useEffect(() => {
    const draw = () => {
      if (canvasRef.current) {
        drawShareCard(canvasRef.current, selected, mode, stats, history, arcade, theme)
      }
    }
    draw()
    document.fonts?.ready.then(draw)
  }, [selected, mode, stats, history, arcade, theme])

  const imageBlob = () =>
    new Promise<Blob>((resolve, reject) =>
      canvasRef.current?.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Image export failed'))),
        'image/png'
      )
    )

  const download = async () => {
    const blob = await imageBlob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `skill-check-${mode}-${format}.png`
    link.click()
    URL.revokeObjectURL(url)
  }

  const share = async () => {
    const blob = await imageBlob()
    const file = new File([blob], `skill-check-${mode}-${format}.png`, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'My Skill Check Performance', files: [file] })
    } else {
      await download()
    }
  }

  return createPortal(
    <div
      className="share-dialog-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <header>
          <div>
            <span>EXPORT PERFORMANCE</span>
            <h2 id="share-title">Choose your format</h2>
          </div>
          <button onClick={onClose} aria-label="Close share dialog">
            <i className="fas fa-times" />
          </button>
        </header>
        <div className="share-formats">
          {shareFormats.map(item => (
            <button
              key={item.id}
              className={format === item.id ? 'active' : ''}
              onClick={() => setFormat(item.id)}
            >
              <i className={`format-shape ${item.id}`} />
              <span>
                {item.label}
                <small>{item.size}</small>
              </span>
            </button>
          ))}
        </div>
        <div className={`share-preview ${format}`}>
          <canvas ref={canvasRef} aria-label={`${selected.label} performance image preview`} />
        </div>
        <footer>
          <button className="export-btn" onClick={download}>
            <i className="fas fa-download" /> EXPORT PNG
          </button>
          <button className="native-share-btn" onClick={share}>
            <i className="fas fa-share-nodes" /> SHARE IMAGE
          </button>
        </footer>
      </section>
    </div>,
    document.body
  )
}
