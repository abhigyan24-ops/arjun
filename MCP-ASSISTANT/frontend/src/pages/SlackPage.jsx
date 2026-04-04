import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, RefreshCw, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const cardStyle = {
  background: 'rgba(13,13,26,0.85)',
  backdropFilter: 'blur(2px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
}

const inputStyle = {
  background: '#0d0d1a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '8px 14px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
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
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MessageSquare size={28} style={{ color: '#00d4ff' }} />
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: 0 }}>Slack</h1>
        </div>
        <button
          onClick={fetchSlack}
          style={{
            background: 'rgba(13,13,26,0.6)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center'
          }}
        >
          <RefreshCw size={18} style={{ color: '#00d4ff' }} />
        </button>
      </motion.div>

      {/* Send Message Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={cardStyle}
      >
        <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: '14px', fontSize: '15px' }}>
          Send a Message
        </h2>

        {/* Channel dropdown */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Channel
          </label>
          <select
            value={channel}
            onChange={e => setChannel(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {channels.length === 0
              ? <option value="">No channels loaded</option>
              : channels.map(c => (
                  <option key={c.id} value={c.id}>#{c.name}</option>
                ))
            }
          </select>
        </div>

        {/* Manual channel ID fallback */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
            Or enter channel ID manually
          </label>
          <input
            type="text"
            value={manualChannel}
            onChange={e => setManualChannel(e.target.value)}
            placeholder="e.g. C08ABCDEF12"
            style={inputStyle}
          />
        </div>

        {/* Message input + send */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={sendMessage}
            disabled={sending}
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #7928ca)',
              border: 'none', borderRadius: '10px', padding: '8px 16px',
              color: '#fff', cursor: sending ? 'not-allowed' : 'pointer',
              opacity: sending ? 0.5 : 1, display: 'flex', alignItems: 'center'
            }}
          >
            {sending ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
      </motion.div>

      {/* Messages Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={cardStyle}
      >
        <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: '14px', fontSize: '15px' }}>
          Recent Messages
        </h2>

        {messages.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            No messages found in your workspace.
          </p>
        ) : (
          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#00d4ff', fontSize: '13px', fontWeight: 600 }}>
                    {resolveUsername(msg)}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                    {msg.channel_name ? `#${msg.channel_name}` : msg.channel ? `#${msg.channel}` : ''}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: 0 }}>
                  {msg.text || msg.content || ''}
                </p>
                {msg.time && (
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', margin: '6px 0 0' }}>
                    {msg.time}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
