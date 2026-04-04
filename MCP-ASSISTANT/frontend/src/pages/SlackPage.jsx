import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, RefreshCw, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const glassCard = {
  background: 'rgba(13,13,26,0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '24px',
}

const fieldStyle = {
  background: '#0d0d1a',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#fff',
  padding: '8px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '14px',
}

const labelStyle = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: '8px',
}

function resolveUsername(msg) {
  if (msg.username) return msg.username
  if (msg.user_name) return msg.user_name
  if (msg.real_name) return msg.real_name
  if (msg.user && msg.user.length > 0) {
    return msg.user.substring(0, 8) + (msg.user.length > 8 ? '...' : '')
  }
  return 'Unknown'
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

      // Handle all possible response shapes
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
      // silently fail — user can use manual input
    }
  }

  function getEffectiveChannel() {
    return manualChannel.trim() || channel
  }

  async function sendMessage() {
    const effectiveChannel = getEffectiveChannel()
    if (!effectiveChannel || !msgText.trim()) return
    setSending(true)
    try {
      await axios.post(`${BASE}/slack/send`, {
        channel_id: effectiveChannel,
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}
        >
          <WifiOff size={48} style={{ color: '#00d4ff', margin: '0 auto 16px' }} />
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Slack Not Connected
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
            Connect your Slack workspace to see messages here.
          </p>
          <button
            onClick={() => navigate('/connections')}
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
              border: 'none', borderRadius: '10px', padding: '10px 24px',
              color: '#fff', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Go to Connections
          </button>
        </motion.div>
      </div>
    )
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCw size={32} style={{ color: '#00d4ff' }} />
        </motion.div>
      </div>
    )
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#f87171', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchSlack}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px', padding: '10px 24px', color: '#fff', cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Slack</h1>
        <button
          onClick={fetchSlack}
          style={{
            background: 'rgba(13,13,26,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '8px 12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px'
          }}
        >
          <RefreshCw size={14} style={{ color: '#00d4ff' }} />
          Refresh
        </button>
      </motion.div>

      {/* Two-column body */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>

        {/* LEFT — Messages feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ flex: 1, minWidth: 0, ...glassCard, display: 'flex', flexDirection: 'column' }}
        >
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <MessageSquare size={18} style={{ color: '#00d4ff' }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>Channels</span>
          </div>

          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <MessageSquare size={36} style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>No Slack messages available</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#00d4ff', fontSize: '13px', fontWeight: 600 }}>
                      {resolveUsername(msg)}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                      {msg.channel_name ? `#${msg.channel_name}` : msg.channel ? `#${msg.channel}` : ''}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '0 0 4px' }}>
                    {msg.text || msg.content || ''}
                  </p>
                  {msg.time && (
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>{msg.time}</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* RIGHT — Compose panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          style={{ width: '380px', flexShrink: 0, ...glassCard, display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send size={18} style={{ color: '#00d4ff' }} />
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>New Message</span>
          </div>

          {/* Channel select */}
          <div>
            <label style={labelStyle}>Channel</label>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              <option value="">Select a channel...</option>
              {channels.map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))}
            </select>
          </div>

          {/* Manual channel ID fallback */}
          <div>
            <label style={labelStyle}>Or enter channel ID manually</label>
            <input
              type="text"
              value={manualChannel}
              onChange={e => setManualChannel(e.target.value)}
              placeholder="e.g. C08ABCDEF12"
              style={fieldStyle}
            />
          </div>

          {/* Message textarea */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Message</label>
            <textarea
              rows={4}
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Type your message..."
              style={{ ...fieldStyle, resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={sending}
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
              border: 'none', borderRadius: '10px', padding: '12px',
              color: '#fff', fontWeight: 600, fontSize: '14px',
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%',
            }}
          >
            {sending
              ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
              : <><Send size={15} /> Send Message</>
            }
          </button>
        </motion.div>

      </div>
    </div>
  )
}
