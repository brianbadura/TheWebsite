import './Toggle.css'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  label?: string
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="toggle-wrapper">
      <span className="toggle-label">{label}</span>
      <div className="toggle-track" role="switch" aria-checked={checked} tabIndex={0} onClick={onChange} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(); } }}>
        <div className={`toggle-thumb ${checked ? 'on' : ''}`} />
      </div>
    </label>
  )
}