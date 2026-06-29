import React from 'react'

interface HeaderProps {
  theme: string
}

export const Header: React.FC<HeaderProps> = ({ theme }) => {
  return (
    <header className="header">
      <h1>
        SKILL <span>CHECK</span>
      </h1>
      <p>{theme === 'dbd' ? 'DEATH BY DAYLIGHT' : theme === 'vd' ? 'VIOLENT DISTRICT' : 'CLOCK WISE'}</p>
    </header>
  )
}
