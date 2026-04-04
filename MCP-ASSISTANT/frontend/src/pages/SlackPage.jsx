import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, RefreshCw, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import GlowCard from '../components/GlowCard'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

const inputStyle = {
  width: '100%',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle = {
  fontSize: 11,
  color: 'var(--text2)',
  fontWeight: 500,
  marginBottom: 6,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function SlackPage({ googleToken, userEmail }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [notConnected, setNotConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [channel, setChannel] = useState('')
  const [manualChannel, setManualChannel] = useState('')
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [channels, setChannels] = useState([])

  useEffect(() => {
    if (!userEmail) return
    fetchSlack()
    fetchChannels()
  }, [userEmail])

  async function fetchSlack() {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${BASE}/slack/messages`, {
        params: { user_email: userEmail }
      })
      const data = res.data
      if (!data || data.not_connected === true) {
        setNotConnected(true)
        setMessages([])
      } else {
        setNotConnected(false)
        const msgs = Array.isArray(data.recent_messages) ? data.recent_messages : []
        setMessages(msgs)
      }
    } catch (err) {
      setError('Failed to load Slack messages. Please try again.')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchChannels() {
    try {
      const res = await axios.get(`${BASE}/slack/channels`, {
        params: { user_email: userEmail }
      })
      console.log('[SlackPage] /slack/channels response:', res.data)
      const data = res.data

      let list = []
      if (Array.isArray(data)) {
        list = data
      } else if (data && Array.isArray(data.channels)) {
        list = data.channels
      } else if (data && data.data && Array.isArray(data.data.channels)) {
        list = data.data.channels
      }

      setChannels(list)
      if (list.length > 0) setChannel(list[0].id)
    } catch (err) {
      console.error('[SlackPage] fetchChannels error:', err)
    }
  }

  async function sendMessage() {
    const targetChannel = manualChannel.trim() || channel
    if (!targetChannel || !msgText.trim()) return
    setSending(true)
    try {
      await axios.post(`${BASE}/slack/send`, {
        channel_id: targetChannel,
        message: msgText,
        user_email: userEmail
      })
      setMsgText('')
      fetchSlack()
    } catch (err) {
      setError('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  // ── NOT CONNECTED ──────────────────────────────────────────────────────────
  if (notConnected) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <GlowCard>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <WifiOff size={48} style={{ color: 'var(--cyan)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Slack Not Connected
            </h2>
            <p style={{ color: 'var(--text2)', marginBottom: 24, fontSize: 14 }}>
              Connect your Slack workspace to see messages here.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/connections')}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0,212,255,0.15)'
              }}
            >
              Go to Connections
            </motion.button>
          </div>
        </GlowCard>
      </div>
    )
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <RefreshCw size={32} style={{ color: 'var(--cyan)' }} />
        </motion.div>
      </div>
    )
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <GlowCard>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 14, color: '#f87171', marginBottom: 20 }}>{error}</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={fetchSlack}
              style={{
                padding: '10px 24px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent', color: 'var(--text)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Retry
            </motion.button>
          </div>
        </GlowCard>
      </div>
    )
  }

  // ── MAIN VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>

      {/* Page title */}
      <motion.div
        custom={0} initial="hidden" animate="visible" variants={stagger}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}
      >
        <MessageSquare size={20} style={{ color: 'var(--cyan)' }} />
        <h2 className="glow-text-title" style={{ fontSize: 24, fontWeight: 700 }}>Slack</h2>
      </motion.div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* LEFT — Recent Messages */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} style={{ color: 'var(--cyan)' }} /> Recent Messages
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            Latest messages from your Slack workspace
          </p>
          <GlowCard>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13 }}>No Slack messages available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0,
                maxHeight: 420, overflowY: 'auto' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>
                        {msg.username || msg.user_name || msg.real_name ||
                          (msg.user ? msg.user.substring(0, 8) + '...' : 'Unknown')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>
                        {msg.channel_name ? `#${msg.channel_name}` : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
                      {msg.text || msg.content || ''}
                    </p>
                    {msg.ts && (
                      <span style={{ fontSize: 11, color: 'var(--text2)', opacity: 0.6 }}>
                        {new Date(parseFloat(msg.ts) * 1000).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlowCard>
        </motion.div>

        {/* RIGHT — New Message */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={stagger}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={16} style={{ color: 'var(--purple)' }} /> New Message
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            Send a message to your Slack workspace
          </p>
          <GlowCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Channel select */}
              <div>
                <label style={labelStyle}>Channel</label>
                <select value={channel} onChange={e => setChannel(e.target.value)}
                  className="liquid-glass" style={inputStyle}>
                  <option value="">Select a channel...</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Manual channel ID fallback */}
              <div>
                <label style={labelStyle}>Or enter channel ID manually</label>
                <input type="text" value={manualChannel}
                  onChange={e => setManualChannel(e.target.value)}
                  placeholder="e.g. C08ABCDEF12"
                  className="liquid-glass" style={inputStyle} />
              </div>

              {/* Message input */}
              <div>
                <label style={labelStyle}>Message</label>
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  rows={4} className="liquid-glass"
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
              </div>

              {/* Send button */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={sendMessage}
                disabled={sending || (!channel && !manualChannel) || !msgText.trim()}
                style={{
                  width: '100%', padding: 12, borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  opacity: sending || (!channel && !manualChannel) || !msgText.trim() ? 0.5 : 1,
                  boxShadow: '0 0 20px rgba(0,212,255,0.15)', transition: 'opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                <Send size={14} />
                {sending ? 'Sending...' : 'Send Message'}
              </motion.button>

            </div>
          </GlowCard>
        </motion.div>

      </div>
    </div>
  )
}
