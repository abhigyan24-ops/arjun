import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'

export default function TopBar({ onRefresh, loading }) {
  const location = useLocation()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Overview'
      case '/github': return 'GitHub'
      case '/slack': return 'Slack'
      case '/jira': return 'Jira'
      case '/smart': return 'Smart Actions'
      default: return 'Overview'
    }
  }

  return (
    <div className="liquid-glass" style={{
      height: 56,
      position: 'fixed',
      top: 0,
      left: 240,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 40,
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
    }}>
      <h1 className="glow-text-title" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.02em', margin: 0 }}>{getPageTitle()}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {location.pathname === '/' && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 500,
              padding: '6px 14px', borderRadius: 6,
              background: 'var(--surface2)',
              border: '1px solid rgba(0,212,255,0.3)',
              color: 'var(--cyan)',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(0,212,255,0.1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,212,255,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        )}

        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--text2)',
          borderLeft: '1px solid var(--border2)', paddingLeft: 20,
        }}>
          Updated 2 mins ago
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 500,
          background: 'rgba(10,21,16,0.8)',
          border: '1px solid rgba(0,255,136,0.2)',
          color: 'var(--success)',
          padding: '6px 14px', borderRadius: 9999,
        }}>
          <span className="pulse-dot" style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--success)',
            display: 'inline-block',
          }} />
          <span style={{ textShadow: '0 0 10px rgba(0,255,100,0.6)' }}>All systems live</span>
        </div>
      </div>
    </div>
  )
}
