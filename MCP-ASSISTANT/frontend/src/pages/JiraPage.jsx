import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Clock, CheckCircle2, AlertTriangle, ExternalLink, Activity, Unplug } from 'lucide-react'
import GlowCard from '../components/GlowCard'
import StatusBadge from '../components/StatusBadge'

export default function JiraPage({ jira, token, userEmail }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [localJira, setLocalJira] = useState(jira)

  useEffect(() => {
    if (!userEmail) return;
    const fetchJira = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/jira?user_email=${userEmail}`);
        if (res.data) setLocalJira(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJira();
  }, [userEmail]);

  const assigned = localJira?.assigned || []
  const sprint = localJira?.sprint || []
  const overdue = localJira?.overdue || []
  
  const sprintDone = (sprint || []).filter((t) => t && t.status?.toLowerCase().includes('done')).length
  const sprintTotal = (sprint || []).length
  const sprintPercent = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16 }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,212,255,0.2)', border: '2px solid var(--cyan)' }}
        />
        <p style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 14, letterSpacing: '0.05em' }}>Loading Jira...</p>
      </div>
    )
  }

  if (!loading && localJira?.not_connected) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minHeight: '70vh', padding: 24 
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlowCard>
            <div style={{ padding: '40px 60px', textAlign: 'center', maxWidth: 400 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,170,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: 'var(--warning)', border: '1px solid rgba(255,170,0,0.2)'
              }}>
                <Unplug size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Jira Not Connected</h2>
              <p style={{ color: 'var(--text2)', marginBottom: 32, lineHeight: 1.6 }}>
                Connect your Jira account to see your tickets and sprints
              </p>
              <button 
                onClick={() => navigate('/connections')}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--cyan)',
                  color: 'var(--cyan)',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 15px rgba(0,212,255,0.1)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.05)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,212,255,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,212,255,0.1)' }}
              >
                Go to Connections
              </button>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    )
  }

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
  }

  const TicketCard = ({ ticket, borderColor }) => (
    <a href={ticket.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        className="liquid-glass"
        style={{
          borderLeft: `3px solid ${borderColor || 'var(--border)'}`,
          borderRadius: 10, padding: 16, marginBottom: 8, transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = borderColor === 'var(--danger)' ? 'var(--danger)' : 'var(--cyan)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = borderColor || 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--cyan)', fontWeight: 600 }}>{ticket.key}</span>
          <ExternalLink size={12} style={{ color: 'var(--text2)' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>{ticket.summary}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={ticket.status} />
          {ticket.priority && <StatusBadge status={ticket.priority} />}
        </div>
      </div>
    </a>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.h2 custom={0} initial="hidden" animate="visible" variants={stagger}
        className="glow-text-title"
        style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Jira</motion.h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {/* Column 1: Assigned */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={stagger}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Assigned to Me</h3>
            <span style={{
              fontSize: 11, background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)',
              padding: '1px 8px', borderRadius: 9999,
            }}>{(assigned || []).length}</span>
          </div>
          {(assigned || []).length > 0 ? (assigned || []).map((ticket, i) => (
            <TicketCard key={i} ticket={ticket} borderColor="var(--border)" />
          )) : (
            <GlowCard>
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <LayoutGrid size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>No tickets assigned</p>
              </div>
            </GlowCard>
          )}
        </motion.div>

        {/* Column 2: Sprint */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Current Sprint</h3>

          {/* Progress bar */}
          {sprintTotal > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{sprintDone} of {sprintTotal} done</span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--cyan)' }}>{sprintPercent}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sprintPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: 3 }}
                />
              </div>
            </div>
          )}

          { (sprint || []).length > 0 ? (sprint || []).map((ticket, i) => (
            <TicketCard key={i} ticket={ticket} borderColor="var(--border)" />
          )) : (
            <GlowCard>
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <Activity size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>No active sprint tickets</p>
              </div>
            </GlowCard>
          )}
        </motion.div>

        {/* Column 3: Overdue */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={stagger}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Needs Attention</h3>
            {(overdue || []).length > 0 && (
              <span style={{
                fontSize: 11, background: 'rgba(255,68,68,0.1)', color: 'var(--danger)',
                padding: '1px 8px', borderRadius: 9999, border: '1px solid rgba(255,68,68,0.2)',
              }}>{(overdue || []).length}</span>
            )}
          </div>
          {(overdue || []).length > 0 ? (overdue || []).map((ticket, i) => (
            <TicketCard key={i} ticket={ticket} borderColor="var(--danger)" />
          )) : (
            <GlowCard>
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <CheckCircle2 size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>No overdue tickets -- all clear</p>
              </div>
            </GlowCard>
          )}
        </motion.div>
      </div>
    </div>
  )
}
