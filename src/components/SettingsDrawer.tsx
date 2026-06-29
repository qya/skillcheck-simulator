import { Settings, GameMode } from '../types'

interface SettingsDrawerProps {
  open: boolean
  mode: GameMode
  settings: Settings
  onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onClose: () => void
  onResetStats: () => void
}

function Label({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="setting-label">
      {label}
      <small>{hint}</small>
    </div>
  )
}

function SettingSlider({
  label,
  hint,
  value,
  max = 10,
  onChange,
  disabled = false,
}: {
  label: string
  hint: string
  value: number
  max?: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="setting-row" aria-disabled={disabled}>
      <Label label={label} hint={hint} />
      <div className="slider-wrap">
        <input
          aria-label={label}
          type="range"
          min="1"
          max={max}
          value={value}
          disabled={disabled}
          onChange={e => onChange(Number(e.target.value))}
        />
        <span>{value}</span>
      </div>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="setting-row" aria-disabled={disabled}>
      <Label label={label} hint={hint} />
      <label className="toggle">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
          aria-label={label}
        />
        <span className="sl" />
      </label>
    </div>
  )
}

export function SettingsDrawer({
  open,
  mode,
  settings,
  onUpdateSetting,
  onClose,
  onResetStats,
}: SettingsDrawerProps) {
  const isVD = settings.theme === 'vd'

  return (
    <aside
      id="settings-drawer"
      className={`settings-panel ${open ? 'open' : ''}`}
      aria-hidden={!open}
      aria-label="Trainer settings"
    >
      <div className="settings-title">
        <div>
          <span>TRAINER</span> SETTINGS
        </div>
        <button onClick={onClose} aria-label="Close settings">
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="settings-content">
        {mode === 'arcade' && (
          <div className="arcade-settings-note">
            <i className="fas fa-shuffle" />
            <div>
              <strong>ARCADE DIRECTOR ACTIVE</strong>
              <span>Difficulty and modifiers randomize each round and scale with your level.</span>
            </div>
          </div>
        )}
        <div className={mode === 'arcade' ? 'settings-disabled' : ''} aria-disabled={mode === 'arcade'}>
          <SettingSlider
            label="Needle Speed"
            hint="Rotation speed of the needle"
            value={settings.speed}
            onChange={value => onUpdateSetting('speed', value)}
          />
          <SettingSlider
            label="Zone Size"
            hint="Success zone arc width"
            value={settings.zone}
            onChange={value => onUpdateSetting('zone', value)}
          />
          <SettingSlider
            label="Zone Total"
            hint="Number of success zones"
            value={isVD ? 1 : settings.zoneTotal}
            max={5}
            onChange={value => onUpdateSetting('zoneTotal', value)}
            disabled={isVD}
          />
          <Toggle
            label="Overcharge Zone"
            hint="Add a danger zone you must avoid"
            checked={settings.overcharge}
            onChange={value => onUpdateSetting('overcharge', value)}
          />
          <Toggle
            label="Continue on Hit"
            hint="No delay after Great/Good hits"
            checked={settings.continuation}
            onChange={value => onUpdateSetting('continuation', value)}
          />
          <Toggle
            label="Random Start"
            hint="Needle starts at random position"
            checked={isVD ? false : settings.randomStart}
            onChange={value => onUpdateSetting('randomStart', value)}
            disabled={isVD}
          />
          <Toggle
            label="Fail Threshold"
            hint="Automatically miss after one full rotation"
            checked={settings.failThreshold}
            onChange={value => onUpdateSetting('failThreshold', value)}
          />
          <Toggle
            label="Auto Spawns"
            hint="Skill checks appear automatically"
            checked={settings.autoSpawn}
            onChange={value => onUpdateSetting('autoSpawn', value)}
          />
        </div>
        <Toggle
          label="Stopwatch"
          hint="Track and display time for each mode"
          checked={settings.stopwatch}
          onChange={value => onUpdateSetting('stopwatch', value)}
        />
        <div className="setting-row">
          <Label label="Trainer Theme" hint="Visual style and audio profile" />
          <select
            value={settings.theme || 'default'}
            onChange={e => onUpdateSetting('theme', e.target.value as 'default' | 'dbd' | 'vd')}
            style={{
              background: 'var(--border)',
              color: 'var(--fg)',
              border: '1px solid var(--border)',
              padding: '6px 10px',
              borderRadius: '6px',
              fontFamily: 'inherit',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="default">Default (CLOCK WISE)</option>
            <option value="dbd">DBD (Steam)</option>
            <option value="vd">VD (Roblox)</option>
          </select>
        </div>
        <Toggle
          label="Generator Sound"
          hint="Background generator engine repair sound"
          checked={settings.generatorMusic}
          onChange={value => onUpdateSetting('generatorMusic', value)}
        />
        <button className="reset-btn" onClick={onResetStats}>
          <i className="fas fa-redo" /> RESET {mode === 'arcade' ? 'ARCADE' : 'PLAY'} STATS
        </button>
      </div>
    </aside>
  )
}
