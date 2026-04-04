import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function SlackPage({ googleToken, userEmail }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [notConnected, setNotConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [channel, setChannel] = useState('')
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
      // Defensive: handle any shape
      if (!data || data.not_connected === true) {
        setNotConnected(true)
        setMessages([])
      } else {
        setNotConnected(false)
        // data.recent_messages may be array or undefined
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
      const data = res.data
      if (data && Array.isArray(data.channels)) {
        setChannels(data.channels)
        if (data.channels.length > 0) setChannel(data.channels[0].id)
      }
    } catch (err) {
      // silently fail for channels
    }
  }

  async function sendMessage() {
    if (!channel || !msgText.trim()) return
    setSending(true)
    try {
      await axios.post(`${BASE}/slack/send`, {
        channel_id: channel,
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

  // NOT CONNECTED STATE
  if (notConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-10 rounded-2xl border border-white/10"
          style={{ background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(2px)' }}
        >
          <WifiOff size={48} className="mx-auto mb-4" style={{ color: '#00d4ff' }} />
          <h2 className="text-2xl font-bold text-white mb-2">Slack Not Connected</h2>
          <p className="text-white/50 mb-6">Connect your Slack workspace to see messages here.</p>
          <button
            onClick={() => navigate('/connections')}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7928ca)' }}
          >
            Go to Connections
          </button>
        </motion.div>
      </div>
    )
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCw size={32} style={{ color: '#00d4ff' }} />
        </motion.div>
      </div>
    )
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 rounded-2xl border border-red-500/30"
          style={{ background: 'rgba(13,13,26,0.8)' }}>
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchSlack}
            className="px-6 py-3 rounded-xl text-white border border-white/20 hover:border-cyan-400/50 transition-all">
            Retry
          </button>
        </div>
      </div>
    )
  }

  // MAIN VIEW
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={28} style={{ color: '#00d4ff' }} />
          <h1 className="text-3xl font-bold text-white">Slack</h1>
        </div>
        <button onClick={fetchSlack}
          className="p-2 rounded-xl border border-white/10 hover:border-cyan-400/50 transition-all"
          style={{ background: 'rgba(13,13,26,0.6)' }}>
          <RefreshCw size={18} style={{ color: '#00d4ff' }} />
        </button>
      </motion.div>

      {/* Send Message */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl border border-white/10 space-y-3"
        style={{ background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(2px)' }}>
        <h2 className="text-white font-semibold">Send a Message</h2>
        <div className="flex gap-3">
          <select value={channel} onChange={e => setChannel(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-white text-sm border border-white/10 outline-none"
            style={{ background: '#0d0d1a' }}>
            {channels.length === 0 && <option value="">No channels found</option>}
            {channels.map(c => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-xl text-white text-sm border border-white/10 outline-none placeholder-white/30"
            style={{ background: '#0d0d1a' }}
          />
          <button onClick={sendMessage} disabled={sending}
            className="px-4 py-2 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #7928ca)' }}>
            {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="p-5 rounded-2xl border border-white/10 space-y-4"
        style={{ background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(2px)' }}>
        <h2 className="text-white font-semibold">Recent Messages</h2>
        {messages.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No messages found in your workspace.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-xl border border-white/5"
                style={{ background: 'rgba(0,212,255,0.04)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-cyan-400 text-sm font-semibold">
                    {msg.user || msg.username || 'Unknown'}
                  </span>
                  <span className="text-white/30 text-xs">
                    {msg.channel_name ? `#${msg.channel_name}` : ''}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{msg.text || msg.content || ''}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
