import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  let borderColor = 'var(--cyan)'
  if (type === 'error') borderColor = 'var(--danger)'
  if (type === 'warning') borderColor = 'var(--warning)'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="liquid-glass"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 9999,
          cursor: 'pointer',
        }}
        onClick={onClose}
      >
        <div style={{ width: 8, height: 8, background: borderColor, borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{message}</span>
      </motion.div>
    </AnimatePresence>
  )
}
