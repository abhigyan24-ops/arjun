export default function StatusBadge({ status }) {
  const getStyle = (s) => {
    if (!s) return { bg: 'rgba(100,100,120,0.1)', color: '#888', border: 'rgba(100,100,120,0.2)' }
    const lower = s.toLowerCase()
    if (lower.includes('todo') || lower === 'to do' || lower === 'closed') {
      return { bg: 'rgba(100,100,120,0.1)', color: '#888', border: 'rgba(100,100,120,0.2)' }
    }
    if (lower.includes('progress') || lower === 'open') {
      return { bg: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', border: 'rgba(0,212,255,0.2)' }
    }
    if (lower.includes('done')) {
      return { bg: 'rgba(0,255,136,0.1)', color: 'var(--success)', border: 'rgba(0,255,136,0.2)' }
    }
    if (lower === 'high') {
      return { bg: 'rgba(255,68,68,0.1)', color: 'var(--danger)', border: 'rgba(255,68,68,0.2)' }
    }
    if (lower === 'medium') {
      return { bg: 'rgba(255,170,0,0.1)', color: 'var(--warning)', border: 'rgba(255,170,0,0.2)' }
    }
    if (lower === 'low') {
      return { bg: 'rgba(100,100,120,0.1)', color: '#888', border: 'rgba(100,100,120,0.2)' }
    }
    return { bg: 'rgba(100,100,120,0.1)', color: '#888', border: 'rgba(100,100,120,0.2)' }
  }

  const style = getStyle(status)

  return (
    <div style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '9999px',
      border: `1px solid ${style.border}`,
      background: style.bg,
      color: style.color,
      fontSize: '10px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </div>
  )
}
