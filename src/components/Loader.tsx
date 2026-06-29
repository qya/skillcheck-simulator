import React from 'react'

interface LoaderProps {
  appReady: boolean
}

export const Loader: React.FC<LoaderProps> = ({ appReady }) => {
  if (appReady) return null
  return (
    <div className="initial-loader">
      <div className="loader-content">
        <div className="loader-logo">
          <span>SKILL</span><strong>CHECK</strong>
        </div>
        <div className="loader-ring">
          <div className="loader-ring-inner" />
        </div>
        <div className="loader-text">INITIALIZING SYSTEMS...</div>
      </div>
    </div>
  )
}
