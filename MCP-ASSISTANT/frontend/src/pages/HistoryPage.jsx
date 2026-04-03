import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function HistoryPage({ userEmail }) {
  const [activeTab, setActiveTab] = useState('Briefings')
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState([])

  const tabs = [
    { id: 'Briefings', endpoint: '/briefing/history' },
    { id: 'GitHub', endpoint: '/history/github' },
    { id: 'Slack', endpoint: '/history/slack' },
    { id: 'Jira', endpoint: '/history/jira' },
    { id: 'Draft Emails', endpoint: '/history/drafts' },
    { id: 'Meeting Prep', endpoint: '/history/meetings' },
  ]

  useEffect(() => {
    if (!userEmail) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const tabEndpoint = tabs.find(t => t.id === activeTab)?.endpoint
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${tabEndpoint}?user_email=${userEmail}`)
        setHistoryData(res.data.history || [])
      } catch (err) {
        console.error('Failed to fetch history:', err)
        setHistoryData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab, userEmail])

  const stagger = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } })
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString)
    return d.toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const renderCard = (item, index, content) => (
    <motion.div
      key={item.id || index}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="liquid-glass"
      style={{
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
      }}
    >
      <div style={{ color: '#00d4ff', fontSize: 14, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
        {formatDate(item.created_at)}
      </div>
      {content}
    </motion.div>
  )

  const sectionLabelStyle = { color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, marginTop: 16, fontWeight: 600, letterSpacing: '0.05em' }
  const pillStyle = { display: 'inline-block', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 14, borderRadius: 9999, padding: '4px 12px', marginRight: 8, marginBottom: 8 }
  const boxStyle = { borderLeft: '2px solid #00d4ff', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, borderRadius: 8, padding: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }

  const renderContent = () => {
    if (loading) {
      return <div style={{ color: '#555', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Loading...</div>
    }

    if (!historyData || historyData.length === 0) {
      return <div style={{ color: '#555', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>No history yet</div>
    }

    if (activeTab === 'Briefings') {
      return historyData.map((item, i) => renderCard(item, i, (
        <>
          <p style={{ color: '#fff', fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.summary}</p>
          {(item.urgent_emails && item.urgent_emails.length > 0) && (
            <>
              <div style={sectionLabelStyle}>Urgent Emails</div>
              <div>{item.urgent_emails.map((e, idx) => <span key={idx} style={pillStyle}>{e.subject || 'Email'}</span>)}</div>
            </>
          )}
          {(item.meetings && item.meetings.length > 0) && (
            <>
              <div style={sectionLabelStyle}>Meetings</div>
              <div>{item.meetings.map((m, idx) => <span key={idx} style={pillStyle}>{m.title || 'Meeting'}</span>)}</div>
            </>
          )}
          {(item.priorities && item.priorities.length > 0) && (
            <>
              <div style={sectionLabelStyle}>Priorities</div>
              <div>{item.priorities.map((p, idx) => <span key={idx} style={pillStyle}>{p}</span>)}</div>
            </>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            {item.github_data && <span style={{ color: '#888', fontSize: 13 }}>GitHub: {item.github_data.prs || 0} PRs, {item.github_data.issues || 0} Issues</span>}
            {item.slack_data && <span style={{ color: '#888', fontSize: 13 }}>Slack: {item.slack_data.messages || 0} Messages</span>}
            {item.jira_data && <span style={{ color: '#888', fontSize: 13 }}>Jira: {item.jira_data.tickets || 0} Tickets</span>}
          </div>
        </>
      )))
    }

    if (activeTab === 'GitHub') {
      return historyData.map((item, i) => renderCard(item, i, (
        <>
          <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Open Pull Requests</div>
          {(!item.open_prs || item.open_prs.length === 0) ? (
            <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No open PRs</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {item.open_prs.map((pr, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#00d4ff', fontSize: 14 }}>#{pr.number}</span>
                  <span style={{ color: '#fff', fontSize: 14 }}>{pr.title}</span>
                  {pr.state && (
                    <span style={{ 
                      background: pr.state === 'open' ? '#00d4ff20' : '#ff444420', 
                      color: pr.state === 'open' ? '#00d4ff' : '#ff4444', 
                      padding: '2px 8px', borderRadius: 9999, fontSize: 12, marginLeft: 'auto' 
                    }}>
                      {pr.state}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Assigned Issues</div>
          {(!item.assigned_issues || item.assigned_issues.length === 0) ? (
            <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No assigned issues</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {item.assigned_issues.map((iss, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#00d4ff', fontSize: 14 }}>#{iss.number}</span>
                  <span style={{ color: '#fff', fontSize: 14 }}>{iss.title}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Recent Commits</div>
          {(!item.recent_commits || item.recent_commits.length === 0) ? (
            <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No recent commits</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {item.recent_commits.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#7928ca', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{c.sha ? c.sha.substring(0, 7) : ''}</span>
                  <span style={{ color: '#fff', fontSize: 14 }}>{c.message ? (c.message.length > 80 ? c.message.substring(0, 80) + '...' : c.message) : ''}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>AI Standup</div>
          {(item.standup_message || item.standup || item.ai_standup) ? (
            <div className="liquid-glass" style={boxStyle}>{item.standup_message || item.standup || item.ai_standup}</div>
          ) : (
            <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No standup generated</div>
          )}
        </>
      )))
    }

    if (activeTab === 'Slack') {
      return historyData.map((item, i) => renderCard(item, i, (
        <>
          <div style={{ color: '#00d4ff', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>#{item.channel_name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(item.messages || []).map((msg, idx) => (
              <div key={idx} className="liquid-glass" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 8 }}>
                <span style={{ color: '#00d4ff', fontSize: 13, fontWeight: 600 }}>{msg.sender || msg.user}</span>
                <span style={{ color: '#fff', fontSize: 14, lineHeight: 1.5 }}>{msg.text || msg.message}</span>
              </div>
            ))}
          </div>
        </>
      )))
    }

    if (activeTab === 'Jira') {
      return historyData.map((item, i) => {
        const assigned = item.assigned_tickets || item.assigned || item.issues || [];
        const overdue = item.overdue_tickets || item.overdue || [];
        const sprint = item.sprint_tickets || item.sprint || [];
        return renderCard(item, i, (
          <>
            <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Assigned Tickets</div>
            {(!assigned || assigned.length === 0) ? (
              <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No assigned tickets</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {assigned.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#00d4ff', fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>{t.key}</span>
                    <span style={{ color: '#fff', fontSize: 14 }}>{t.summary}</span>
                    {t.status && (
                      <span style={{ background: '#1a1a2e', color: '#888', borderRadius: 9999, padding: '2px 8px', fontSize: 12, marginLeft: 'auto' }}>
                        {t.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Overdue Tickets</div>
            {(!overdue || overdue.length === 0) ? (
              <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No overdue tickets</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {overdue.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '2px solid #ff4444', paddingLeft: 8 }}>
                    <span style={{ color: '#ff4444', fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>{t.key}</span>
                    <span style={{ color: '#fff', fontSize: 14 }}>{t.summary}</span>
                    {t.duedate && (
                      <span style={{ color: '#ff4444', fontSize: 12, marginLeft: 'auto' }}>
                        Due: {t.duedate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>Sprint Tickets</div>
            {(!sprint || sprint.length === 0) ? (
              <div style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>No sprint tickets</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {sprint.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#7928ca', fontSize: 14, fontFamily: "'JetBrains Mono', monospace" }}>{t.key}</span>
                    <span style={{ color: '#fff', fontSize: 14 }}>{t.summary}</span>
                    {t.status && (
                      <span style={{ background: '#1a1a2e', color: '#888', borderRadius: 9999, padding: '2px 8px', fontSize: 12, marginLeft: 'auto' }}>
                        {t.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ))
      })
    }

    if (activeTab === 'Draft Emails') {
      return historyData.map((item, i) => {
        const original = item.original_email || {}
        return renderCard(item, i, (
          <>
            <div className="liquid-glass" style={{ borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#888', fontSize: 12, marginRight: 8 }}>SUBJECT</span>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{original.subject || 'No Subject'}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#888', fontSize: 12, marginRight: 8 }}>FROM</span>
                <span style={{ color: '#00d4ff', fontSize: 14 }}>{original.from || 'Unknown'}</span>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: 12, marginRight: 8 }}>PREVIEW</span>
                <span style={{ color: '#aaa', fontSize: 14 }}>
                  {original.snippet ? original.snippet.substring(0, 150) : (original.body ? original.body.substring(0, 150) : '')}
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>YOUR INSTRUCTION</div>
              <div style={{ color: '#fff', fontSize: 14, fontStyle: 'italic' }}>{item.instruction || 'None'}</div>
            </div>
            
            <div style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>AI DRAFTED REPLY</div>
            {item.drafted_reply ? (
              <div className="liquid-glass" style={{ borderLeft: '2px solid #00d4ff', borderRadius: 8, padding: 16, color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {item.drafted_reply}
              </div>
            ) : (
              <div style={{ color: '#555', fontSize: 14 }}>No reply generated</div>
            )}
           </>
        ))
      })
    }

    if (activeTab === 'Meeting Prep') {
      return historyData.map((item, i) => renderCard(item, i, (
        <>
          <div className="liquid-glass" style={{ borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 600, marginBottom: 4 }}>{item.meeting_title || 'Untitled Meeting'}</div>
            <div style={{ fontSize: 13, color: '#00d4ff', fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>{item.meeting_time}</div>
            {(item.meeting_attendees && item.meeting_attendees.length > 0) && (
              <div style={{ fontSize: 13, color: '#aaa' }}>Attendees: {item.meeting_attendees.join(', ')}</div>
            )}
          </div>
          
          <div style={sectionLabelStyle}>AI Prep Notes</div>
          <div className="liquid-glass" style={{...boxStyle}}>{item.prep_content}</div>
        </>
      )))
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto', minHeight: '100vh' }}>
      <h2 className="glow-text-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: '#fff' }}>History</h2>
      
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a2e', marginBottom: 24, gap: 24, overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0 0 12px 0',
                color: isActive ? '#fff' : '#555',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                position: 'relative',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s'
              }}
            >
              {tab.id}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: '#00d4ff'
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 64 }}>
        {renderContent()}
      </div>
    </div>
  )
}
