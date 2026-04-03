import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function AlertsPanel({ isOpen, onClose, alerts, unreadCount, onMarkRead, onClear, onRefresh }) {
  const getSourceColor = (source) => {
    switch (source?.toLowerCase()) {
      case 'gmail': return 'var(--cyan)'
      case 'github': return 'var(--purple)'
      case 'jira': return 'var(--warning)'
      default: return 'var(--text2)'
    }
  }

  const getTimeAgo = (isoString) => {
    try {
      if (!isoString) return 'Unknown time'
      const date = new Date(isoString.replace('Z', '+00:00'))
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
      return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) === 1 ? '' : 's'} ago`
    } catch {
      return 'Unknown time'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 9998,
            }}
          />
          <motion.div
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="liquid-glass"
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 380,
              zIndex: 9999, display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 20px 16px', borderBottom: '1px solid var(--border2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Alerts</h2>
                {unreadCount > 0 && (
                  <span style={{
                    background: 'var(--cyan)', color: '#000',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 12,
                  }}>
                    {unreadCount} New
                  </span>
                )}
              </div>
              <button onClick={onClose} style={{
                background: 'transparent', border: 'none', color: 'var(--text2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 4, cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 8, padding: '12px 20px',
              borderBottom: '1px solid var(--border2)'
            }}>
              <button onClick={onMarkRead} style={actionBtnStyle}>Mark All Read</button>
              <button onClick={onRefresh} style={actionBtnStyle}>Refresh</button>
              <button onClick={onClear} style={actionBtnStyle}>Clear All</button>
            </div>

            {/* Alert List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(!alerts || alerts.length === 0) ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14 }}>
                  No alerts
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="liquid-glass" style={{
                    borderRadius: 8,
                    padding: 16,
                    borderLeft: !alert.read ? `3px solid var(--cyan) !important` : undefined,
                    opacity: alert.read ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: getSourceColor(alert.source),
                        background: `${getSourceColor(alert.source)}1a`,
                        padding: '2px 6px', borderRadius: 4,
                      }}>
                        {alert.source}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text2)' }}>
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                      {alert.title}
                    </div>
                    <div style={{ color: '#888', fontSize: 11, lineHeight: 1.5 }}>
                      {alert.detail}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const actionBtnStyle = {
  background: 'transparent',
  border: '1px solid var(--cyan)',
  color: 'var(--cyan)',
  fontSize: 11,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 4,
  cursor: 'pointer',
  transition: 'all 0.2s',
}
