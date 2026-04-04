import { useNavigate } from 'react-router-dom'
import { MessageSquare, Send, Hash, Clock, MessageSquareOff } from 'lucide-react'
import GlowCard from '../components/GlowCard'
import axios from 'axios'

export default function SlackPage({ slack, token, userEmail }) {
  const navigate = useNavigate()
  const [selectedChannel, setSelectedChannel] = useState('')
  const [channels, setChannels] = useState([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentHistory, setSentHistory] = useState([])
  const [localSlack, setLocalSlack] = useState(slack || [])
  const [notConnected, setNotConnected] = useState(false)

  useEffect(() => {
    if (!userEmail) return;
    const fetchSlack = async () => {
      try {
        const [msgRes, channelRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/slack/messages?user_email=${userEmail}`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/slack/channels`)
        ]);
        
        if (msgRes.data?.not_connected) {
          setNotConnected(true);
          return;
        }

        if (msgRes.data?.recent_messages) {
          setLocalSlack(msgRes.data.recent_messages);
        } else if (Array.isArray(msgRes.data)) {
          setLocalSlack(msgRes.data);
        }
        
        if (Array.isArray(channelRes.data)) {
          setChannels(channelRes.data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSlack();
  }, [userEmail]);

  const messages = localSlack || []

  // Group messages by channel
  const channelMap = {}
  messages.forEach((msg) => {
    if (!channelMap[msg.channel]) channelMap[msg.channel] = []
    channelMap[msg.channel].push(msg)
  })
  const channelNames = Object.keys(channelMap)

  const handleSend = async () => {
    if (!selectedChannel.trim() || !message.trim()) return
    setSending(true)
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/slack/send`, { channel_id: selectedChannel, message }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const channelName = channels.find((c) => c.id === selectedChannel)?.name || selectedChannel
      setSentHistory((prev) => [{ channel: channelName, message, time: new Date().toLocaleTimeString() }, ...prev])
      setMessage('')
    } catch (_err) {
      console.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (notConnected) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minHeight: '70vh', padding: 24 
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <GlowCard>
            <div style={{ padding: '40px 60px', textAlign: 'center', maxWidth: 400 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
                color: 'var(--text2)', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <MessageSquareOff size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Slack Not Connected</h2>
              <p style={{ color: 'var(--text2)', marginBottom: 32, lineHeight: 1.6 }}>
                Connect your Slack workspace to read and send messages
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

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <motion.h2 custom={0} initial="hidden" animate="visible" variants={stagger}
        className="glow-text-title"
        style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Slack</motion.h2>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
        {/* LEFT: Channel Feed */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} style={{ color: 'var(--cyan)' }} /> Channels
          </h3>

          {channelNames.length > 0 ? channelNames.map((ch, ci) => (
            <div key={ch} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 600, color: 'var(--cyan)',
                fontFamily: "'JetBrains Mono', monospace", marginBottom: 10,
              }}>
                <Hash size={14} /> {ch}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {channelMap[ch].map((msg, mi) => (
                  <GlowCard key={mi}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{msg.user}</span>
                      <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text2)' }}>
                        <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{msg.time}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{msg.text}</p>
                  </GlowCard>
                ))}
              </div>
            </div>
          )) : (
            <GlowCard>
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <MessageSquare size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>No Slack messages available</p>
              </div>
            </GlowCard>
          )}
        </motion.div>

        {/* RIGHT: Send Message */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={16} style={{ color: 'var(--cyan)' }} /> New Message
          </h3>
          <GlowCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Channel selector */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channel</label>
                <select
                  value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)}
                  className="liquid-glass"
                  style={{
                    width: '100%', color: 'var(--text)',
                    borderRadius: 8, padding: '10px 12px',
                    fontSize: 13, outline: 'none',
                  }}
                >
                  <option value="">Select a channel...</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
              </div>

              {/* Message textarea */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                <textarea
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  rows={4} placeholder="Type your message..."
                  className="liquid-glass"
                  style={{
                    width: '100%', color: 'var(--text)',
                    borderRadius: 8, padding: '10px 12px',
                    fontSize: 13, outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Send button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={sending || !selectedChannel || !message.trim()}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#fff',
                  fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: sending || !selectedChannel || !message.trim() ? 0.5 : 1,
                  boxShadow: '0 0 20px rgba(0,212,255,0.15)', transition: 'opacity 0.2s',
                }}
              >
                <Send size={14} /> {sending ? 'Sending...' : 'Send Message'}
              </motion.button>
            </div>
          </GlowCard>

          {/* Sent history */}
          {sentHistory.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Recently Sent</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sentHistory.slice(0, 5).map((item, i) => (
                  <div key={i} className="liquid-glass" style={{
                    borderRadius: 8, padding: '10px 14px', fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace" }}>#{item.channel}</span>
                      <span style={{ color: 'var(--text2)', fontSize: 10 }}>{item.time}</span>
                    </div>
                    <p style={{ color: 'var(--text)' }}>{item.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
