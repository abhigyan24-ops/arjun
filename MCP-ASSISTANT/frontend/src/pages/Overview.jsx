import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, Calendar, GitPullRequest, LayoutGrid, Bot, ShieldAlert, AlertCircle, ArrowRight, Activity, Clock, MessageSquare, Bell } from 'lucide-react'
import GlowCard from '../components/GlowCard'
import Toast from '../components/Toast'
import AlertsPanel from '../components/AlertsPanel'
import axios from 'axios'

export default function Overview({ user, token, briefing, github, slack, jira }) {
  const [time, setTime] = useState(new Date())
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [toastMessage, setToastMessage] = useState(null)
  
  const [googleToken, setGoogleToken] = useState(token || "")
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    if (token) setGoogleToken(token)
  }, [token])

  useEffect(() => {
    if (briefing?.user_email) setUserEmail(briefing.user_email)
    else if (user?.email) setUserEmail(user.email)
  }, [briefing, user])

  const prevUnreadCountRef = useRef(0)

  const fetchAlerts = async () => {
    if (!userEmail) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/alerts?user_email=${userEmail}`)
      const data = res.data
      setAlerts(data.alerts)
      setUnreadCount(data.unread_count)

      if (data.unread_count > prevUnreadCountRef.current) {
        const diff = data.unread_count - prevUnreadCountRef.current
        setToastMessage(`${diff} new alert(s) — click the bell to view`)
      }
      prevUnreadCountRef.current = data.unread_count
    } catch (e) {
      console.error('Failed to fetch alerts:', e)
    }
  }



  useEffect(() => {
    fetchAlerts()
    const timer = setInterval(fetchAlerts, 30000)
    return () => clearInterval(timer)
  }, [userEmail])

  const handleMarkRead = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/alerts/read`, { user_email: userEmail })
      fetchAlerts()
    } catch (e) { console.error(e) }
  }

  const handleClearAlerts = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/alerts/clear`, { user_email: userEmail })
      fetchAlerts()
    } catch (e) { console.error(e) }
  }

  const handleRefreshAlerts = async () => {
    console.log("Refresh clicked, token:", googleToken);
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/alerts/check`, {
        google_token: googleToken,
        user_email: userEmail
      })
      fetchAlerts()
    } catch (err) {
      console.error("Refresh alerts failed:", err)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatLoading])

  const sendChatMessage = async (overrideText) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : chatInput
    if (!textToSend.trim()) return
    const userMsg = { role: 'user', text: textToSend }
    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)
    if (typeof overrideText !== 'string') setChatInput('')
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        message: textToSend,
        google_token: token,
        context: {
          emails: briefing?.urgent_emails || [],
          events: briefing?.meetings || [],
          prs: github?.prs || [],
          issues: github?.issues || [],
          slack_messages: slack || [],
        },
        user_email: userEmail,
      })
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.data.response }])
    } catch (_err) {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Error connecting to AI. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' } }),
  }

  const prCount = github?.prs?.length || 0
  const overdueCount = jira?.total_overdue || 0
  const emailCount = briefing?.email_count || 0
  const meetingCount = briefing?.meeting_count || 0
  const assignedTickets = jira?.total_assigned || 0
  const recentSlack = (slack || []).slice(0, 3)

  const getGreeting = () => {
    const h = time.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* SECTION 1: Greeting Banner */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={stagger}
        className="liquid-glass"
        style={{
          width: '100%',
          borderRadius: 16, padding: '32px 32px 36px',
          position: 'relative', overflow: 'hidden', marginBottom: 24,
        }}
      >
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 400, height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.05))',
          filter: 'blur(60px)', borderRadius: '50%', transform: 'translateX(50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
              {getGreeting()}, {user?.given_name || user?.name || 'User'}
              <button onClick={() => setAlertsOpen(true)} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', marginTop: 4 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.color = 'var(--cyan)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}>
                <Bell size={16} />
                {unreadCount > 0 && <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--surface2)' }} />}
              </button>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, marginBottom: 16 }}>
              <Clock size={14} />
              {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} — {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p style={{ color: 'var(--text2)', lineHeight: 1.6, maxWidth: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {briefing?.summary || 'Analyzing your day...'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 300 }}>
            {[
              { icon: Mail, label: 'Emails', val: emailCount, accent: 'var(--cyan)' },
              { icon: Calendar, label: 'Meetings', val: meetingCount, accent: 'var(--purple)' },
              { icon: GitPullRequest, label: 'PRs', val: prCount, accent: 'var(--cyan)' },
              { icon: LayoutGrid, label: 'Tickets', val: assignedTickets, accent: 'var(--text)' },
            ].map((s, i) => (
              <div key={i} className="liquid-glass" style={{
                borderRadius: 8, padding: '8px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                  <s.icon size={12} /> {s.label}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: s.accent, fontWeight: 700 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'URGENT EMAILS', val: briefing?.urgent_emails?.length || 0, icon: ShieldAlert, color: 'var(--danger)' },
          { label: "TODAY'S MEETINGS", val: meetingCount, icon: Calendar, color: 'var(--purple)' },
          { label: 'OPEN PRS', val: prCount, icon: GitPullRequest, color: 'var(--cyan)' },
          { label: 'JIRA OVERDUE', val: overdueCount, icon: AlertCircle, color: 'var(--warning)' },
        ].map((stat, i) => (
          <motion.div key={i} custom={i + 1} initial="hidden" animate="visible" variants={stagger}>
            <GlowCard glow={stat.val > 0 && stat.color === 'var(--danger)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
                <stat.icon size={14} style={{ color: stat.color, opacity: 0.5 }} />
              </div>
              <div style={{
                fontSize: 32, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                color: stat.val > 0 ? stat.color : 'var(--text2)',
                textShadow: stat.val > 0 ? `0 0 20px ${stat.color === 'var(--cyan)' ? 'rgba(0,212,255,0.8)' : stat.color === 'var(--danger)' ? 'rgba(255,68,68,0.8)' : stat.color === 'var(--purple)' ? 'rgba(121,40,202,0.8)' : stat.color}` : 'none',
              }}>
                {stat.val}
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>

      {/* SECTION 3: Three Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24, minHeight: 420 }}>
        {/* Priority Feed */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <Activity size={16} style={{ color: 'var(--cyan)' }} /> Priority Feed
            </h3>
            <p style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>What needs attention now</p>
          </div>
          <GlowCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(briefing?.urgent_emails || []).slice(0, 2).map((email, i) => (
                <Link to="/smart" key={`email-${i}`} className="liquid-glass" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8,
                  transition: 'all 0.2s', marginBottom: 4,
                }}>
                  <div style={{ marginTop: 2, background: 'rgba(255,68,68,0.1)', color: 'var(--danger)', padding: 6, borderRadius: 6 }}><Mail size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.sender}</p>
                    <p style={{ color: 'var(--text2)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email.subject}</p>
                  </div>
                </Link>
              ))}
              {(jira?.overdue || []).slice(0, 2).map((ticket, i) => (
                <a href={ticket.url} target="_blank" rel="noreferrer" key={`jira-${i}`} className="liquid-glass" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, transition: 'all 0.2s', marginBottom: 4,
                }}>
                  <div style={{ marginTop: 2, background: 'rgba(255,170,0,0.1)', color: 'var(--warning)', padding: 6, borderRadius: 6 }}><LayoutGrid size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.key}</p>
                    <p style={{ color: 'var(--text2)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.summary}</p>
                  </div>
                </a>
              ))}
              {(github?.prs || []).slice(0, 2).map((pr, i) => (
                <a href={pr.url || pr.html_url} target="_blank" rel="noreferrer" key={`pr-${i}`} className="liquid-glass" style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, transition: 'all 0.2s', marginBottom: 4,
                }}>
                  <div style={{ marginTop: 2, background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', padding: 6, borderRadius: 6 }}><GitPullRequest size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.title}</p>
                    <p style={{ color: 'var(--text2)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.repo || 'Repository'}</p>
                  </div>
                </a>
              ))}
              {(!briefing?.urgent_emails?.length && !jira?.overdue?.length && !github?.prs?.length) && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text2)', fontSize: 12 }}>All clear -- nothing needs attention right now.</div>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div custom={6} initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <Calendar size={16} style={{ color: 'var(--purple)' }} /> Today
            </h3>
            <p style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Your upcoming meetings</p>
          </div>
          <GlowCard>
            {briefing?.meetings?.length > 0 ? (
              <div>
                {briefing.meetings.map((meeting, i) => (
                  <div key={i} className="liquid-glass" style={{
                    padding: '14px 12px',
                    borderRadius: 8,
                    marginBottom: i < briefing.meetings.length - 1 ? 8 : 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12, flex: 1 }}>{meeting.title}</p>
                      <span style={{
                        color: 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                        background: 'rgba(0,212,255,0.1)', padding: '2px 8px', borderRadius: 4,
                        border: '1px solid rgba(0,212,255,0.2)', whiteSpace: 'nowrap',
                      }}>{meeting.start_time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, color: 'var(--text2)', fontSize: 11 }}>
                      {meeting.end_time && <span>Until {meeting.end_time}</span>}
                      {meeting.attendees?.length > 0 && <span>{meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 12 }}>
                <Calendar size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                No meetings scheduled for today.
              </div>
            )}
          </GlowCard>
        </motion.div>

        {/* Ask WorkMind Chat */}
        <motion.div custom={7} initial="hidden" animate="visible" variants={stagger} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <Bot size={16} style={{ color: 'var(--cyan)' }} /> Ask WorkMind
            </h3>
            <p style={{ fontSize: 10, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Intelligence Assistant</p>
          </div>
          <div className="liquid-glass" style={{
            borderRadius: 12, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
          }}>
            {/* Chat messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 250 }}>
              {chatMessages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 1, gap: 8, paddingBottom: 8 }}>
                  {['What should I focus on today?', 'Any urgent emails?', "What's my team working on?"].map((q, i) => (
                    <button key={i} onClick={() => sendChatMessage(q)} className="liquid-glass" style={{
                      borderRadius: 8, padding: '8px 12px', fontSize: 12, textAlign: 'left',
                      color: 'var(--text)', width: 'fit-content', transition: 'all 0.2s',
                    }}
                    >{q}</button>
                  ))}
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ width: '100%', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div className="liquid-glass" style={{
                        maxWidth: '85%', padding: '8px 12px', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                        borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      }}>{msg.text}</div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div className="liquid-glass" style={{ borderRadius: '12px 12px 12px 4px', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <motion.div style={{ width: 6, height: 6, background: 'var(--cyan)', borderRadius: '50%' }} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                        <motion.div style={{ width: 6, height: 6, background: 'var(--cyan)', borderRadius: '50%' }} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                        <motion.div style={{ width: 6, height: 6, background: 'var(--cyan)', borderRadius: '50%' }} animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {/* Chat input */}
            <div className="liquid-glass" style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, borderRadius: 0, borderBottom: 'none', borderLeft: 'none', borderRight: 'none' }}>
              <input
                type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage() }}
                placeholder="Type a command..."
                className="liquid-glass"
                style={{
                  flex: 1, color: 'var(--text)',
                  borderRadius: 8, padding: '8px 12px',
                  outline: 'none', fontSize: 12,
                }}
              />
              <button
                onClick={() => sendChatMessage()} disabled={chatLoading || !chatInput.trim()}
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #7928ca)', color: '#fff',
                  borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700,
                  border: 'none', opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                  boxShadow: '0 0 15px rgba(121,40,202,0.3)', transition: 'opacity 0.2s',
                }}
              >Send</button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 4: Slack Summary */}
      {recentSlack.length > 0 && (
        <motion.div custom={8} initial="hidden" animate="visible" variants={stagger} style={{ paddingBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <MessageSquare size={16} /> Latest from Slack
            </h3>
            <Link to="/slack" style={{ fontSize: 10, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all in Slack <ArrowRight size={12} />
            </Link>
          </div>
          <GlowCard>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${recentSlack.length}, 1fr)`, gap: 8 }}>
              {recentSlack.map((msg, i) => (
                <div key={i} className="liquid-glass" style={{
                  padding: 16,
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--cyan)', fontWeight: 600 }}>#{msg.channel}</span>
                    <span style={{ fontSize: 10, color: 'var(--text2)' }}>{msg.time}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    <span style={{ fontWeight: 700, color: '#fff', marginRight: 8 }}>{msg.user}</span>
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      )}
      {toastMessage && (
        <Toast message={toastMessage} type="info" onClose={() => setToastMessage(null)} />
      )}
      <AlertsPanel
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={alerts}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onClear={handleClearAlerts}
        onRefresh={handleRefreshAlerts}
      />
    </div>
  )
}
