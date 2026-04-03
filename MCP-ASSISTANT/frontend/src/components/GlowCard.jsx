import { motion } from 'framer-motion'

export default function GlowCard({ children, className = '', glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`liquid-glass ${className}`}
      style={{
        borderRadius: '12px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        ...(glow ? { 
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.2) inset, 0 8px 32px rgba(0,0,0,0.4)', 
          borderColor: 'rgba(0, 212, 255, 0.5)' 
        } : {})
      }}
    >
      {children}
    </div>
  )
}
