interface WaveDividerProps {
  className?: string
  flip?: boolean
  color?: string
}

export function WaveDivider({ className = '', flip = false, color = 'var(--background)' }: WaveDividerProps) {
  return (
    <div
      className={`wave-divider ${className}`}
      style={{ transform: flip ? 'scaleY(-1)' : undefined }}
      aria-hidden
    >
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="block w-full h-[60px] md:h-[80px]">
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
          fill={color}
        />
      </svg>
    </div>
  )
}
